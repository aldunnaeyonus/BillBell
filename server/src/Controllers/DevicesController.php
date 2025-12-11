<?php
namespace App\Controllers;

use App\DB;
use App\Utils;
use App\Auth;

class DevicesController {
  public static function upsert() {
    $userId = Auth::requireUserId();
    $data = Utils::bodyJson();
    Utils::requireFields($data, ["expo_push_token"]);

    $pdo = DB::pdo();
    $stmt = $pdo->prepare("
      INSERT INTO device_tokens (user_id, expo_push_token, platform)
      VALUES (?,?,?)
      ON DUPLICATE KEY UPDATE platform=VALUES(platform), updated_at=CURRENT_TIMESTAMP
    ");
    $stmt->execute([$userId, $data["expo_push_token"], $data["platform"] ?? null]);

    Utils::json(["ok" => true]);
  }
}
