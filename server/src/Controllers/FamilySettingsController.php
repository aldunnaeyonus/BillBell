<?php
namespace App\Controllers;

use App\DB;
use App\Utils;
use App\Auth;

class FamilySettingsController {
  private static function requireFamilyContext(int $userId): array {
    $pdo = DB::pdo();
    $stmt = $pdo->prepare("SELECT fm.family_id, fm.role FROM family_members fm WHERE fm.user_id=? LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) Utils::json(["error" => "User not in family"], 409);
    return ["family_id" => (int)$row["family_id"], "role" => $row["role"]];
  }

  public static function get() {
    $userId = Auth::requireUserId();
    $ctx = self::requireFamilyContext($userId);

    $pdo = DB::pdo();
    $stmt = $pdo->prepare("SELECT default_reminder_offset_days, default_reminder_time_local FROM family_settings WHERE family_id=? LIMIT 1");
    $stmt->execute([(int)$ctx["family_id"]]);
    $row = $stmt->fetch();

    if (!$row) {
      Utils::json([
        "default_reminder_offset_days" => 1,
        "default_reminder_time_local" => "09:00:00",
        "scope" => "family",
        "editable" => ($ctx["role"] === "admin")
      ]);
    }

    $row["scope"] = "family";
    $row["editable"] = ($ctx["role"] === "admin");
    Utils::json($row);
  }

  public static function update() {
    $userId = Auth::requireUserId();
    $ctx = self::requireFamilyContext($userId);
    if ($ctx["role"] !== "admin") Utils::json(["error" => "Admin only"], 403);

    $data = Utils::bodyJson();
    $offset = isset($data["default_reminder_offset_days"]) ? (int)$data["default_reminder_offset_days"] : 1;
    if ($offset < 0 || $offset > 3) Utils::json(["error" => "default_reminder_offset_days must be 0..3"], 422);

    $time = $data["default_reminder_time_local"] ?? "09:00:00";
    if (!preg_match('/^\d{2}:\d{2}(:\d{2})?$/', $time)) Utils::json(["error" => "Invalid time format"], 422);
    if (strlen($time) === 5) $time .= ":00";

    $pdo = DB::pdo();
    $stmt = $pdo->prepare("
      INSERT INTO family_settings (family_id, default_reminder_offset_days, default_reminder_time_local)
      VALUES (?,?,?)
      ON DUPLICATE KEY UPDATE
        default_reminder_offset_days=VALUES(default_reminder_offset_days),
        default_reminder_time_local=VALUES(default_reminder_time_local),
        updated_at=CURRENT_TIMESTAMP
    ");
    $stmt->execute([(int)$ctx["family_id"], $offset, $time]);

    Utils::json(["ok" => true]);
  }
}
