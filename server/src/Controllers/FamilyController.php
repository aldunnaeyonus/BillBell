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

    // FIX: Check if user is already in a family
    $existing = self::requireFamilyIdForUser($userId);
    if ($existing) {
        $stmt = $pdo->prepare("SELECT family_code FROM families WHERE id=?");
        $stmt->execute([$existing]);
        $fam = $stmt->fetch();
        
        Utils::json([
            "family_id" => $existing, 
            "family_code" => $fam["family_code"] ?? '',
            "current_user_id" => $userId
        ]);
        return;
    }

    try {
      $pdo->beginTransaction();

      $code = null;
      for ($i=0; $i<10; $i++) {
        $try = \App\Utils::randomFamilyCode(6);
        $check = $pdo->prepare("SELECT id FROM families WHERE family_code=? LIMIT 1");
        $check->execute([$try]);
        if (!$check->fetch()) { $code = $try; break; }
      }
      
      if (!$code) throw new \Exception("Failed to generate family code");

      $ins = $pdo->prepare("INSERT INTO families (family_code, created_by_user_id) VALUES (?,?)");
      $ins->execute([$code, $userId]);
      $familyId = (int)$pdo->lastInsertId();

      $mem = $pdo->prepare("INSERT INTO family_members (family_id, user_id, role) VALUES (?,?, 'admin')");
      $mem->execute([$familyId, $userId]);
      
      $settings = $pdo->prepare("INSERT INTO family_settings (family_id) VALUES (?)");
      $settings->execute([$familyId]);

      $pdo->commit();
      
      Utils::json([
        "family_id" => $familyId, 
        "family_code" => $code,
        "current_user_id" => $userId
      ]);
    } catch (\Exception $e) {
      if ($pdo->inTransaction()) $pdo->rollBack();
      Utils::json(["error" => $e->getMessage()], 500);
    }
  }

  public static function join() {
    $userId = Auth::requireUserId();
    $data = Utils::bodyJson();
    Utils::requireFields($data, ["family_code"]);

    $pdo = DB::pdo();
    $stmt = $pdo->prepare("SELECT id FROM families WHERE family_code=? LIMIT 1");
    $stmt->execute([$data["family_code"]]);
    $family = $stmt->fetch();
    
    if (!$family) Utils::json(["error" => "Family not found"], 404);
    
    $newFamilyId = (int)$family["id"];

    try {
        $pdo->beginTransaction();
        
        // Remove from old family if exists
        $pdo->prepare("DELETE FROM family_members WHERE user_id = ?")->execute([$userId]);

        $ins = $pdo->prepare("INSERT INTO family_members (family_id, user_id, role) VALUES (?,?, 'member')");
        $ins->execute([$newFamilyId, $userId]);

        $pdo->commit();
        
        Utils::json(["success" => true, "family_id" => $newFamilyId]);
    } catch (\Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        Utils::json(["error" => "Join failed: " . $e->getMessage()], 500);
    }
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
      SELECT u.id, u.name, fm.role
      FROM family_members fm
      JOIN users u ON u.id = fm.user_id
      WHERE fm.family_id=?
    ");
    $stmt2->execute([(int)$fam["family_id"]]);

    Utils::json([
      "family_id" => (int)$fam["family_id"],
      "family_code" => $fam["family_code"],
      "current_user_id" => $userId,
      "members" => $stmt2->fetchAll()
    ]);
  }
}