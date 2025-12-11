<?php
namespace App\Controllers;

use App\DB;
use App\Utils;
use App\Auth;

class ImportCodeController {

  // Admin: generate an import code for the family
  public static function create() {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();

    // must be admin in family
    $stmt = $pdo->prepare("SELECT family_id, role FROM family_members WHERE user_id=? LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) Utils::json(["error" => "User not in family"], 409);
    if (($row["role"] ?? "") !== "admin") Utils::json(["error" => "Admin only"], 403);

    $familyId = (int)$row["family_id"];
    $data = Utils::bodyJson();

    $minutes = isset($data["ttl_minutes"]) ? (int)$data["ttl_minutes"] : 15;
    if ($minutes < 5 || $minutes > 60) $minutes = 15;

    $code = self::generateCode(8);
    $codeHash = hash("sha256", strtoupper(trim($code)));
    $expiresAt = (new \DateTime("+{$minutes} minutes"))->format("Y-m-d H:i:s");

    $ins = $pdo->prepare("
      INSERT INTO import_codes (family_id, created_by_user_id, code_hash, expires_at)
      VALUES (?,?,?,?)
    ");
    $ins->execute([$familyId, $userId, $codeHash, $expiresAt]);

    Utils::json([
      "code" => $code,
      "expires_at" => $expiresAt,
      "ttl_minutes" => $minutes,
    ]);
  }

  // Admin: validate + mark an import code as used (one-time)
  // If your import flow is elsewhere, you may not even need this endpoint.
  public static function consume() {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();

    // must be admin in family
    $stmt = $pdo->prepare("SELECT family_id, role FROM family_members WHERE user_id=? LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) Utils::json(["error" => "User not in family"], 409);
    if (($row["role"] ?? "") !== "admin") Utils::json(["error" => "Admin only"], 403);

    $familyId = (int)$row["family_id"];
    $data = Utils::bodyJson();

    $importCode = isset($data["import_code"]) ? (string)$data["import_code"] : "";
    $importCode = strtoupper(trim($importCode));
    if ($importCode === "") Utils::json(["error" => "import_code is required"], 422);

    $codeHash = hash("sha256", $importCode);

    $codeStmt = $pdo->prepare("
      SELECT id, expires_at, used_at
      FROM import_codes
      WHERE family_id=? AND code_hash=? LIMIT 1
    ");
    $codeStmt->execute([$familyId, $codeHash]);
    $codeRow = $codeStmt->fetch();

    if (!$codeRow) Utils::json(["error" => "Invalid import code"], 401);
    if (!empty($codeRow["used_at"])) Utils::json(["error" => "Import code already used"], 401);

    $now = new \DateTime();
    $exp = new \DateTime($codeRow["expires_at"]);
    if ($now > $exp) Utils::json(["error" => "Import code expired"], 401);

    // mark as used immediately (one-time)
    $useStmt = $pdo->prepare("UPDATE import_codes SET used_at=NOW() WHERE id=? AND used_at IS NULL");
    $useStmt->execute([(int)$codeRow["id"]]);

    // ensure we actually claimed it (race condition safety)
    if ($useStmt->rowCount() !== 1) {
      Utils::json(["error" => "Import code already used"], 401);
    }

    Utils::json(["ok" => true]);
  }

  private static function generateCode(int $len): string {
    $alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    $out = "";
    $max = strlen($alphabet) - 1;
    for ($i=0; $i<$len; $i++) $out .= $alphabet[random_int(0, $max)];
    return $out;
  }
}
?>
