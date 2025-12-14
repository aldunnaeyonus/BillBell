<?php
namespace App\Controllers;

use App\DB;
use App\Utils;
use App\Auth;

class FamilyController {

  // --- Helpers ---

  private static function requireFamilyIdForUser(int $userId): ?int {
    $pdo = DB::pdo();
    $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id=? LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    return $row ? (int)$row["family_id"] : null;
  }

  // Core logic to move a user to a fresh family (used by Leave and Remove)
  private static function moveUserToNewFamily($userId, $currentFamilyId) {
    $pdo = DB::pdo();
    
    // 1. Generate unique code
    $newCode = null;
    for ($i=0; $i<10; $i++) {
      $try = \App\Utils::randomFamilyCode(6);
      $check = $pdo->prepare("SELECT id FROM families WHERE family_code=? LIMIT 1");
      $check->execute([$try]);
      if (!$check->fetch()) { $newCode = $try; break; }
    }
    if (!$newCode) throw new \Exception("Failed to generate family code");

    // 2. Create new Family
    $stmt = $pdo->prepare("INSERT INTO families (family_code, created_by_user_id) VALUES (?, ?)");
    $stmt->execute([$newCode, $userId]);
    $newFamilyId = $pdo->lastInsertId();

    // 3. Move User (Set as Admin of new family)
    $stmt = $pdo->prepare("UPDATE family_members SET family_id = ?, role = 'admin' WHERE user_id = ?");
    $stmt->execute([$newFamilyId, $userId]);

    // 4. Move User's Bills
    $stmt = $pdo->prepare("UPDATE bills SET family_id = ? WHERE family_id = ? AND created_by_user_id = ?");
    $stmt->execute([$newFamilyId, $currentFamilyId, $userId]);

    return $newCode;
  }

  // --- Endpoints ---

  public static function create() {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();

    $existing = self::requireFamilyIdForUser($userId);
    if ($existing) Utils::json(["error" => "User already in a family"], 409);

    try {
        $pdo->beginTransaction();
        
        // Use the same logic as "moving to new family" but without old bills
        // Manually doing it here since we need to INSERT family_members, not UPDATE
        $code = null;
        for ($i=0; $i<10; $i++) {
            $try = \App\Utils::randomFamilyCode(6);
            $check = $pdo->prepare("SELECT id FROM families WHERE family_code=? LIMIT 1");
            $check->execute([$try]);
            if (!$check->fetch()) { $code = $try; break; }
        }
        
        $ins = $pdo->prepare("INSERT INTO families (family_code, created_by_user_id) VALUES (?,?)");
        $ins->execute([$code, $userId]);
        $familyId = (int)$pdo->lastInsertId();

        $mem = $pdo->prepare("INSERT INTO family_members (family_id, user_id, role) VALUES (?,?, 'admin')");
        $mem->execute([$familyId, $userId]);

        $pdo->commit();
        Utils::json(["family_id" => $familyId, "family_code" => $code]);
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
      "current_user_id" => $userId,
      "members" => $stmt2->fetchAll()
    ]);
  }

  public static function removeMember($id) {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();
    
    // Check Admin Permissions
    $stmt = $pdo->prepare("SELECT family_id, role FROM family_members WHERE user_id = ?");
    $stmt->execute([$userId]);
    $currentUser = $stmt->fetch();

    if (!$currentUser || $currentUser['role'] !== 'admin') {
        Utils::json(['error' => 'Only admins can remove members'], 403);
    }

    $currentFamilyId = $currentUser['family_id'];

    // Check Target
    $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id = ?");
    $stmt->execute([$id]);
    $targetUser = $stmt->fetch();

    if (!$targetUser || $targetUser['family_id'] !== $currentFamilyId) {
        Utils::json(['error' => 'Member not found in your family'], 404);
    }

    if ($id == $userId) {
         Utils::json(['error' => 'You cannot remove yourself.'], 400);
    }

    try {
        $pdo->beginTransaction();
        $newCode = self::moveUserToNewFamily($id, $currentFamilyId);
        $pdo->commit();
        Utils::json(['success' => true, 'message' => 'Member moved to new family ' . $newCode]);
    } catch (\Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        Utils::json(['error' => 'Failed to remove member: ' . $e->getMessage()], 500);
    }
  }

  public static function leave() {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();

    // Check current status
    $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id = ?");
    $stmt->execute([$userId]);
    $currentUser = $stmt->fetch();

    if (!$currentUser) Utils::json(['error' => 'You are not in a family'], 400);
    
    $currentFamilyId = $currentUser['family_id'];

    try {
        $pdo->beginTransaction();
        $newCode = self::moveUserToNewFamily($userId, $currentFamilyId);
        $pdo->commit();
        Utils::json(['success' => true, 'message' => 'You have left the family.', 'new_family_code' => $newCode]);
    } catch (\Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        Utils::json(['error' => 'Failed to leave family: ' . $e->getMessage()], 500);
    }
  }
}