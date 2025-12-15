<?php
namespace App\Controllers;

use App\DB;
use App\Utils;
use App\Auth;

class FamilyController {

  // --- Helpers ---
public static function rotateKey() {
  $userId = Auth::requireUserId();
  $pdo = DB::pdo();

  // verify admin + get family
  $stmt = $pdo->prepare("SELECT family_id, role FROM family_members WHERE user_id=? LIMIT 1");
  $stmt->execute([$userId]);
  $row = $stmt->fetch();
  if (!$row) Utils::json(["error" => "User not in family"], 409);
  if (($row["role"] ?? "") !== "admin") Utils::json(["error" => "Admin only"], 403);

  $familyId = (int)$row["family_id"];

  // increment key_version
  $pdo->beginTransaction();
  $pdo->prepare("UPDATE families SET key_version = key_version + 1 WHERE id=?")->execute([$familyId]);
  $stmt = $pdo->prepare("SELECT key_version FROM families WHERE id=? LIMIT 1");
  $stmt->execute([$familyId]);
  $ver = (int)($stmt->fetch()["key_version"] ?? 1);
  $pdo->commit();

  Utils::json(["ok" => true, "family_id" => $familyId, "key_version" => $ver]);
}

  private static function requireFamilyIdForUser(int $userId): ?int {
    $pdo = DB::pdo();
    $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id=? LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    return $row ? (int)$row["family_id"] : null;
  }

  // Core logic to move a user to a fresh family (used by Leave and Remove)
  private static function moveUserToNewFamily(int $userId, int $currentFamilyId): array {
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
    $newFamilyId = (int)$pdo->lastInsertId();

    // 3. Move User (Set as Admin of new family)
    $stmt = $pdo->prepare("UPDATE family_members SET family_id = ?, role = 'admin' WHERE user_id = ?");
    $stmt->execute([$newFamilyId, $userId]);

    // 4. Move User's Bills
    $stmt = $pdo->prepare("UPDATE bills SET family_id = ? WHERE family_id = ? AND created_by_user_id = ?");
    $stmt->execute([$newFamilyId, $currentFamilyId, $userId]);

    return ["code" => $newCode, "id" => $newFamilyId];
  }

  // --- Endpoints ---

  public static function create() {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();

    $existing = self::requireFamilyIdForUser($userId);
    if ($existing) Utils::json(["error" => "User already in a family"], 409);

    try {
      $pdo->beginTransaction();

      $code = null;
      // ... (Family code generation logic) ...
      if (!$code) throw new \Exception("Failed to generate family code");

      $ins = $pdo->prepare("INSERT INTO families (family_code, created_by_user_id) VALUES (?,?)");
      $ins->execute([$code, $userId]);
      $familyId = (int)$pdo->lastInsertId();

      $mem = $pdo->prepare("INSERT INTO family_members (family_id, user_id, role) VALUES (?,?, 'admin')");
      $mem->execute([$familyId, $userId]);

      // NEW: Also insert default family settings
      $settings = $pdo->prepare("INSERT INTO family_settings (family_id) VALUES (?)");
      $settings->execute([$familyId]);

      $pdo->commit();
      
      // NEW: Fetch the creator's public key for the client to wrap the key
      $publicKeyResp = KeysController::getUserPublicKey($userId);
      $publicKey = Utils::bodyJson($publicKeyResp)["public_key"] ?? null;

      // The client MUST now generate a key, wrap it with this public key, and call POST /keys/shared
      Utils::json([
        "family_id" => $familyId,
        "family_code" => $code,
        "key_exchange_needed" => true, // Flag for the client
        "creator_public_key" => $publicKey // Client needs this to wrap the key
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
    $existing = self::requireFamilyIdForUser($userId);
    if ($existing) Utils::json(["error" => "User already in a family"], 409);

    $stmt = $pdo->prepare("SELECT id, created_by_user_id FROM families WHERE family_code=? LIMIT 1");
    $stmt->execute([$data["family_code"]]);
    $family = $stmt->fetch();
    if (!$family) Utils::json(["error" => "Family not found"], 404);

    $familyId = (int)$family["id"];
    
    // Find an active admin
    $adminStmt = $pdo->prepare("
        SELECT user_id 
        FROM family_members 
        WHERE family_id = ? AND role = 'admin' 
        ORDER BY created_at ASC LIMIT 1
    ");
    $adminStmt->execute([$familyId]);
    $admin = $adminStmt->fetch();

    $ins = $pdo->prepare("INSERT INTO family_members (family_id, user_id, role) VALUES (?,?, 'member')");
    $ins->execute([$familyId, $userId]);

    Utils::json([
      "family_id" => $familyId,
      "key_exchange_needed" => true, // Flag for the client
      // NEW: Tell the client who the key should be requested from
      "key_sharer_admin_id" => (int)($admin["user_id"] ?? $family["created_by_user_id"] ?? 0),
      "new_member_public_key_api" => "/keys/public/{$userId}" // API endpoint for the key
    ]);
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

  public static function removeMember(int $id) {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();

    // Check Admin Permissions
    $stmt = $pdo->prepare("SELECT family_id, role FROM family_members WHERE user_id = ?");
    $stmt->execute([$userId]);
    $currentUser = $stmt->fetch();

    if (!$currentUser || ($currentUser['role'] ?? '') !== 'admin') {
      Utils::json(['error' => 'Only admins can remove members'], 403);
    }

    $currentFamilyId = (int)$currentUser['family_id'];

    // Check Target
    $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id = ?");
    $stmt->execute([$id]);
    $targetUser = $stmt->fetch();

    if (!$targetUser || (int)$targetUser['family_id'] !== $currentFamilyId) {
      Utils::json(['error' => 'Member not found in your family'], 404);
    }

    if ($id === $userId) {
      Utils::json(['error' => 'You cannot remove yourself.'], 400);
    }

    try {
      $pdo->beginTransaction();
      $new = self::moveUserToNewFamily($id, $currentFamilyId);
      $pdo->commit();
      Utils::json(['success' => true, 'message' => 'Member moved to new family ' . $new['code']]);
    } catch (\Exception $e) {
      if ($pdo->inTransaction()) $pdo->rollBack();
      Utils::json(['error' => 'Failed to remove member: ' . $e->getMessage()], 500);
    }
  }

  public static function leave() {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();

    $stmt = $pdo->prepare("SELECT family_id, role FROM family_members WHERE user_id=? LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) Utils::json(["error" => "User not in family"], 409);

    $currentFamilyId = (int)$row["family_id"];
    $role = (string)($row["role"] ?? "member");

    try {
      $pdo->beginTransaction();

      // If the leaving user is the only admin and there are other members,
      // promote the oldest remaining member to admin to avoid an admin-less family.
      if ($role === "admin") {
        $admins = $pdo->prepare("SELECT COUNT(*) AS c FROM family_members WHERE family_id=? AND role='admin' AND user_id<>?");
        $admins->execute([$currentFamilyId, $userId]);
        $adminCount = (int)($admins->fetch()["c"] ?? 0);

        if ($adminCount === 0) {
          $pick = $pdo->prepare("
            SELECT user_id
            FROM family_members
            WHERE family_id=? AND user_id<>?
            ORDER BY created_at ASC
            LIMIT 1
          ");
          $pick->execute([$currentFamilyId, $userId]);
          $next = $pick->fetch();

          if ($next) {
            $promote = $pdo->prepare("UPDATE family_members SET role='admin' WHERE family_id=? AND user_id=?");
            $promote->execute([$currentFamilyId, (int)$next["user_id"]]);
          }
        }
      }

      $result = self::moveUserToNewFamily($userId, $currentFamilyId);

      $pdo->commit();

      Utils::json([
        "success" => true,
        "message" => "You have left the family.",
        "new_family_code" => $result["code"],
        "new_family_id" => $result["id"]
      ]);
    } catch (\Exception $e) {
      if ($pdo->inTransaction()) $pdo->rollBack();
      Utils::json(["error" => "Failed to leave family: " . $e->getMessage()], 500);
    }
  }
}