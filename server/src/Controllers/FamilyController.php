<?php
namespace App\Controllers;

use App\DB;
use App\Utils;
use App\Auth;

class FamilyController {
  private static function requireFamilyIdForUser(int $userId): ?int {
    $pdo = DB::pdo();
    $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id=? LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    return $row ? (int)$row["family_id"] : null;
  }

  public static function create() {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();

    $existing = self::requireFamilyIdForUser($userId);
    if ($existing) Utils::json(["error" => "User already in a family"], 409);

    $code = null;
    for ($i=0; $i<10; $i++) {
      $try = \App\Utils::randomFamilyCode(6);
      $check = $pdo->prepare("SELECT id FROM families WHERE family_code=? LIMIT 1");
      $check->execute([$try]);
      if (!$check->fetch()) { $code = $try; break; }
    }
    if (!$code) Utils::json(["error" => "Failed to generate code"], 500);

    $pdo->beginTransaction();
    $ins = $pdo->prepare("INSERT INTO families (family_code, created_by_user_id) VALUES (?,?)");
    $ins->execute([$code, $userId]);
    $familyId = (int)$pdo->lastInsertId();

    $mem = $pdo->prepare("INSERT INTO family_members (family_id, user_id, role) VALUES (?,?, 'admin')");
    $mem->execute([$familyId, $userId]);

    $pdo->commit();
    Utils::json(["family_id" => $familyId, "family_code" => $code]);
  }

  public static function join() {
    $userId = Auth::requireUserId();
    $data = Utils::bodyJson();
    Utils::requireFields($data, ["family_code"]);

    $pdo = DB::pdo();
    $existing = self::requireFamilyIdForUser($userId);
    if ($existing) Utils::json(["error" => "User already in a family"], 409);

    $stmt = $pdo->prepare("SELECT id FROM families WHERE family_code=? LIMIT 1");
    $stmt->execute([$data["family_code"]]);
    $family = $stmt->fetch();
    if (!$family) Utils::json(["error" => "Family not found"], 404);

    $ins = $pdo->prepare("INSERT INTO family_members (family_id, user_id, role) VALUES (?,?, 'member')");
    $ins->execute([(int)$family["id"], $userId]);

    Utils::json(["family_id" => (int)$family["id"]]);
  }

  public static function members() {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();

    $stmt = $pdo->prepare("
      SELECT fm.family_id, f.family_code
      FROM family_members fm
      JOIN families f ON f.id = fm.family_id
      WHERE fm.user_id=? LIMIT 1
    ");
    $stmt->execute([$userId]);
    $fam = $stmt->fetch();
    if (!$fam) Utils::json(["error" => "User not in family"], 409);

    $stmt2 = $pdo->prepare("
      SELECT u.id, u.name, u.email, fm.role, fm.created_at
      FROM family_members fm
      JOIN users u ON u.id = fm.user_id
      WHERE fm.family_id=?
      ORDER BY fm.role='admin' DESC, fm.created_at ASC
    ");
    $stmt2->execute([(int)$fam["family_id"]]);

    Utils::json([
      "family_id" => (int)$fam["family_id"],
      "family_code" => $fam["family_code"],
      "members" => $stmt2->fetchAll()
    ]);
  }
}
