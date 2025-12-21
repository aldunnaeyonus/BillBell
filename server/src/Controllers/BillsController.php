<?php
namespace App\Controllers;

use App\DB;
use App\Utils;
use App\Auth;

class BillsController {
  private static function requireFamilyId(int $userId): int {
    $pdo = DB::pdo();
    $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id=? LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) Utils::json(["error" => "User not in family"], 409);
    return (int)$row["family_id"];
  }

  private static function getFamilyKeyVersion(int $familyId): int {
    $pdo = DB::pdo();
    $stmt = $pdo->prepare("SELECT key_version FROM families WHERE id=? LIMIT 1");
    $stmt->execute([$familyId]);
    $row = $stmt->fetch();
    return (int)($row["key_version"] ?? 1);
  }

  public static function list() {
    $userId = Auth::requireUserId();
    $familyId = self::requireFamilyId($userId);
    $pdo = DB::pdo();

    $stmt = $pdo->prepare("SELECT * FROM bills WHERE family_id=? ORDER BY due_date ASC, id ASC");
    $stmt->execute([$familyId]);
    Utils::json(["bills" => $stmt->fetchAll()]);
  }

  public static function create() {
    $userId = Auth::requireUserId();
    $familyId = self::requireFamilyId($userId);
    $data = Utils::bodyJson();
    Utils::requireFields($data, ["creditor","amount_cents","due_date"]);

    $pdo = DB::pdo();

    $st = $pdo->prepare("SELECT default_reminder_offset_days, default_reminder_time_local FROM family_settings WHERE family_id=? LIMIT 1");
    $st->execute([$familyId]);
    $settings = $st->fetch() ?: ["default_reminder_offset_days" => 1, "default_reminder_time_local" => "09:00:00"];

    $reminderOffset = isset($data["reminder_offset_days"]) ? (int)$data["reminder_offset_days"] : (int)$settings["default_reminder_offset_days"];
    if ($reminderOffset < 0 || $reminderOffset > 3) Utils::json(["error" => "Invalid reminder_offset_days"], 422);

    $reminderTime = $data["reminder_time_local"] ?? $settings["default_reminder_time_local"];
    if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $reminderTime)) Utils::json(["error" => "Invalid reminder_time_local"], 422);
    if (strlen($reminderTime) === 5) $reminderTime .= ":00";

    $recurrence = $data["recurrence"] ?? "none";
    if (!in_array($recurrence, ["none","monthly","weekly","bi-weekly","annually"], true)) Utils::json(["error" => "Invalid recurrence"], 422);

    $amountEncrypted = $data["amount_encrypted"] ?? null;

    // NEW: store which family key_version this ciphertext corresponds to
    $cipherVersion = self::getFamilyKeyVersion($familyId);
    $paymentMethod = $data["payment_method"] ?? "manual";
     
     if (!in_array($paymentMethod, ["manual", "auto"])) $paymentMethod = "manual";
     
    $stmt = $pdo->prepare("
      INSERT INTO bills
      (family_id, created_by_user_id, updated_by_user_id, creditor, amount_cents, amount_encrypted, due_date, status, snoozed_until, recurrence, reminder_offset_days, reminder_time_local, notes, cipher_version, payment_method)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ");

    $stmt->execute([
      $familyId,
      $userId,
      $userId,
      $data["creditor"],             // Encrypted String (via Client)
      (int)$data["amount_cents"],    // Integer (via Client)
      $amountEncrypted,              // Encrypted String (via Client)
      $data["due_date"],
      "active",
      null,
      $recurrence,
      $reminderOffset,
      $reminderTime,
      $data["notes"] ?? null,        // Encrypted String (via Client)
      $cipherVersion,
      $paymentMethod ?? "manual"
    ]);

    Utils::json(["id" => (int)$pdo->lastInsertId(), "cipher_version" => $cipherVersion], 201);
  }

  public static function update(int $id) {
    $userId = Auth::requireUserId();
    $familyId = self::requireFamilyId($userId);
    $data = Utils::bodyJson();

    $pdo = DB::pdo();
    $stmt = $pdo->prepare("SELECT id FROM bills WHERE id=? AND family_id=? LIMIT 1");
    $stmt->execute([$id, $familyId]);
    if (!$stmt->fetch()) Utils::json(["error" => "Not found"], 404);

    $fields = ["creditor","amount_cents","amount_encrypted","due_date","recurrence","reminder_offset_days","reminder_time_local","status","notes","cipher_version", "payment_method"];
    $sets = [];
    $vals = [];

    foreach ($fields as $f) {
      if (array_key_exists($f, $data)) {
        // validate cipher_version if provided
        if ($f === "cipher_version") {
          $cv = (int)$data[$f];
          if ($cv < 1) Utils::json(["error" => "Invalid cipher_version"], 422);
          $sets[] = "$f=?";
          $vals[] = $cv;
        } else {
          $sets[] = "$f=?";
          $vals[] = $data[$f];
        }
      }
    }

    if (!$sets) Utils::json(["ok" => true]);

    // NEW: If ciphertext fields are being updated and caller didn't set cipher_version,
    // auto-bump to current family key_version.
    $touchingCiphertext =
      array_key_exists("creditor", $data) ||
      array_key_exists("amount_encrypted", $data) ||
      array_key_exists("notes", $data);

    $hasCipherVersion = array_key_exists("cipher_version", $data);

    if ($touchingCiphertext && !$hasCipherVersion) {
      $current = self::getFamilyKeyVersion($familyId);
      $sets[] = "cipher_version=?";
      $vals[] = $current;
    }

    $sets[] = "updated_by_user_id=?";
    $vals[] = $userId;
    $vals[] = $id;
    $vals[] = $familyId;

    $sql = "UPDATE bills SET " . implode(",", $sets) . " WHERE id=? AND family_id=?";
    $upd = $pdo->prepare($sql);
    $upd->execute($vals);

    Utils::json(["ok" => true]);
  }

  public static function delete(int $id) {
    $userId = Auth::requireUserId();
    $familyId = self::requireFamilyId($userId);
    $pdo = DB::pdo();

    $stmt = $pdo->prepare("DELETE FROM bills WHERE id=? AND family_id=?");
    $stmt->execute([$id, $familyId]);
    Utils::json(["ok" => true]);
  }

  public static function markPaid(int $id) {
    $userId = Auth::requireUserId();
    $familyId = self::requireFamilyId($userId);
    $pdo = DB::pdo();

    $pdo->beginTransaction();

    $stmt = $pdo->prepare("SELECT * FROM bills WHERE id=? AND family_id=? LIMIT 1");
    $stmt->execute([$id, $familyId]);
    $bill = $stmt->fetch();
    if (!$bill) { $pdo->rollBack(); Utils::json(["error" => "Not found"], 404); }

    $upd = $pdo->prepare("UPDATE bills SET status='paid', snoozed_until=NULL, updated_by_user_id=? WHERE id=? AND family_id=?");
    $upd->execute([$userId, $id, $familyId]);

    $dateModifier = null;
if ($bill["recurrence"] === "weekly") $dateModifier = "+1 week";
elseif ($bill["recurrence"] === "bi-weekly") $dateModifier = "+2 weeks";
elseif ($bill["recurrence"] === "monthly") $dateModifier = "+1 month";
elseif ($bill["recurrence"] === "quarterly") $dateModifier = "+3 months";
elseif ($bill["recurrence"] === "semi-annually") $dateModifier = "+6 months"; // Added for insurance/tax
elseif ($bill["recurrence"] === "annually") $dateModifier = "+1 year";
elseif ($bill["recurrence"] === "semi-monthly") {
    // Get the day of the month (1-31) from the current bill date
    // Note: Ensure $currentDate is the date you are modifying
    $currentDay = date('j', strtotime($currentDate)); 

    if ($currentDay < 15) {
        // If it's the 1st, move to the 15th
        $dateModifier = "+14 days";
    } else {
        // If it's the 15th, move to the 1st of the NEXT month
        $dateModifier = "first day of next month";
    }
}

    if ($dateModifier) {
      $dt = new \DateTime($bill["due_date"]);
      $dt->modify($dateModifier);
      $nextDue = $dt->format("Y-m-d");

      $chk = $pdo->prepare("SELECT id FROM bills WHERE family_id=? AND creditor=? AND amount_cents=? AND due_date=? LIMIT 1");
      $chk->execute([(int)$bill["family_id"], $bill["creditor"], (int)$bill["amount_cents"], $nextDue]);

      if (!$chk->fetch()) {
        $ins = $pdo->prepare("
          INSERT INTO bills
          (family_id, created_by_user_id, updated_by_user_id, creditor, amount_cents, amount_encrypted, due_date, status, snoozed_until, recurrence, reminder_offset_days, reminder_time_local, notes, cipher_version, payment_method)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        ");
        $ins->execute([
          (int)$bill["family_id"],
          (int)$bill["created_by_user_id"],
          $userId,
          $bill["creditor"],
          (int)$bill["amount_cents"],
          $bill["amount_encrypted"],
          $nextDue,
          "active",
          null,
          $bill["recurrence"],
          (int)$bill["reminder_offset_days"],
          $bill["reminder_time_local"],
          $bill["notes"],
          (int)($bill["cipher_version"] ?? 1),
          $bill["payment_method"]
        ]);
      }
    }

    $pdo->commit();
    Utils::json(["ok" => true]);
  }

  public static function snooze(int $id) {
    $userId = Auth::requireUserId();
    $familyId = self::requireFamilyId($userId);
    $data = Utils::bodyJson();
    Utils::requireFields($data, ["snoozed_until"]);

    $pdo = DB::pdo();
    $stmt = $pdo->prepare("UPDATE bills SET snoozed_until=?, updated_by_user_id=? WHERE id=? AND family_id=?");
    $stmt->execute([$data["snoozed_until"], $userId, $id, $familyId]);

    Utils::json(["ok" => true]);
  }
}
