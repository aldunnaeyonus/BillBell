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

  // --- HELPER: Smart Date Addition ---
  // Prevents the "February Bug" (Jan 31 + 1 mo != Mar 3)
  private static function addRecurrenceInterval(\DateTime $date, string $recurrence) {
    $day = (int)$date->format('j');
    $originalDay = $day;

    switch ($recurrence) {
        case 'weekly':
            $date->modify('+1 week');
            break;
        case 'bi-weekly':
            $date->modify('+2 weeks');
            break;
        case 'semi-monthly':
            // Logic: If before the 15th, move to 15th. If 15th or later, move to 1st of next month.
            if ($day < 15) {
                $date->setDate((int)$date->format('Y'), (int)$date->format('n'), 15);
            } else {
                $date->modify('first day of next month');
            }
            break;
        case 'monthly':
            $date->modify('+1 month');
            // Clamp to end of month if we overshot (e.g. Jan 31 -> Feb 28)
            if ((int)$date->format('j') < $originalDay) {
                $date->modify('last day of previous month');
            }
            break;
        case 'quarterly':
            $date->modify('+3 months');
             if ((int)$date->format('j') < $originalDay) {
                $date->modify('last day of previous month');
            }
            break;
        case 'semi-annually':
            $date->modify('+6 months');
             if ((int)$date->format('j') < $originalDay) {
                $date->modify('last day of previous month');
            }
            break;
        case 'annually':
            $date->modify('+1 year');
            // Handle Leap Year: Feb 29 + 1 year -> Feb 28
             if ((int)$date->format('j') < $originalDay) {
                $date->modify('last day of previous month');
            }
            break;
    }
    return $date;
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
    
    // FIX: Added missing recurrence types to validation
    $allowedRecurrence = ["none","monthly","weekly","bi-weekly","quarterly","semi-monthly","semi-annually","annually"];
    if (!in_array($recurrence, $allowedRecurrence, true)) {
        Utils::json(["error" => "Invalid recurrence"], 422);
    }

    $amountEncrypted = $data["amount_encrypted"] ?? null;

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
      $data["creditor"],
      (int)$data["amount_cents"],
      $amountEncrypted,
      $data["due_date"],
      "active",
      null,
      $recurrence,
      $reminderOffset,
      $reminderTime,
      $data["notes"] ?? null,
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

    // --- FIX: Use robust date calculation logic (fixes Feb bug & crash) ---
    if ($bill["recurrence"] !== "none") {
      $dt = new \DateTime($bill["due_date"]);
      
      // Call the helper function
      $dt = self::addRecurrenceInterval($dt, $bill["recurrence"]);
      
      $nextDue = $dt->format("Y-m-d");

      // Check for duplicates to prevent double-creation
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