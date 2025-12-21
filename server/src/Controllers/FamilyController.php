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

  /**
   * Modified to return existing family details if user is already an admin.
   */
  public static function create() {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();

    $existing = self::requireFamilyIdForUser($userId);
    if ($existing) {
        // Return existing family info
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
    
    // 1. Find Family
    $stmt = $pdo->prepare("SELECT id, family_code FROM families WHERE family_code=? LIMIT 1");
    $stmt->execute([$data["family_code"]]);
    $family = $stmt->fetch();
    
    if (!$family) Utils::json(["error" => "Family not found"], 404);
    $targetFamilyId = (int)$family["id"];

    // 2. Check if already a member
    $check = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id=?");
    $check->execute([$userId]);
    $current = $check->fetch();
    if ($current && $current['family_id'] == $targetFamilyId) {
        Utils::json(["error" => "You are already in this family"], 409);
        return;
    }

    // 3. Check for EXISTING Request (UPDATED Logic)
    $stmtReq = $pdo->prepare("SELECT status FROM family_join_requests WHERE family_id = ? AND user_id = ?");
    $stmtReq->execute([$targetFamilyId, $userId]);
    $existingRequest = $stmtReq->fetch();

    if ($existingRequest) {
        // If they were rejected, tell the client so it can show the "Denied" alert
        if ($existingRequest['status'] === 'rejected') {
            Utils::json(["status" => "rejected"]);
            return;
        }
        // Otherwise, they are still pending
        Utils::json(["status" => "pending"]);
        return;
    }

    // 4. Create New Join Request
    try {
        $pdo->beginTransaction();
        
        // Explicitly set status to 'pending'
        $ins = $pdo->prepare("INSERT INTO family_join_requests (family_id, user_id, status) VALUES (?,?, 'pending')");
        $ins->execute([$targetFamilyId, $userId]);
        
        // 5. Notify Admins
        $stmtAdmins = $pdo->prepare("
            SELECT dt.expo_push_token 
            FROM family_members fm
            JOIN device_tokens dt ON dt.user_id = fm.user_id
            WHERE fm.family_id = ? AND fm.role = 'admin'
        ");
        $stmtAdmins->execute([$targetFamilyId]);
        $tokens = $stmtAdmins->fetchAll(\PDO::FETCH_COLUMN);

        $stmtUser = $pdo->prepare("SELECT name, email FROM users WHERE id = ?");
        $stmtUser->execute([$userId]);
        $u = $stmtUser->fetch();
        $name = $u['name'] ?: ($u['email'] ?: 'Someone');

        $pdo->commit();

        if (!empty($tokens)) {
            Utils::sendExpoPush(
                $tokens, 
                "New Join Request", 
                "$name wants to join your family.", 
                ["url" => "billbell://family-requests"]
            );
        }
        
        Utils::json(["success" => true, "status" => "pending"]);

    } catch (\Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        Utils::json(["error" => "Request failed: " . $e->getMessage()], 500);
    }
  }

  public static function listRequests() {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();

    // Verify user is admin
    $fam = $pdo->prepare("SELECT family_id, role FROM family_members WHERE user_id = ? LIMIT 1");
    $fam->execute([$userId]);
    $membership = $fam->fetch();

    if (!$membership || $membership['role'] !== 'admin') {
        Utils::json(["requests" => []]);
        return;
    }

    // UPDATED: Only show PENDING requests (hide rejected ones from the list)
    $stmt = $pdo->prepare("
        SELECT r.id, r.user_id, r.created_at, u.name, u.email, r.status
        FROM family_join_requests r
        JOIN users u ON u.id = r.user_id
        WHERE r.family_id = ? 
        ORDER BY r.created_at DESC
    ");
    $stmt->execute([$membership['family_id']]);
    
    Utils::json(["requests" => $stmt->fetchAll()]);
  }

  public static function respondRequest() {
    $userId = Auth::requireUserId();
    $data = Utils::bodyJson();
    Utils::requireFields($data, ["request_id", "action"]); // action: 'approve' or 'reject'

    $pdo = DB::pdo();

    try {
        $pdo->beginTransaction();

        // 1. Verify Request
        $reqQ = $pdo->prepare("SELECT * FROM family_join_requests WHERE id = ? FOR UPDATE");
        $reqQ->execute([$data['request_id']]);
        $req = $reqQ->fetch();
        if (!$req) Utils::json(["error" => "Request not found"], 404);

        // 2. Verify Admin Permissions
        $authQ = $pdo->prepare("SELECT role FROM family_members WHERE user_id = ? AND family_id = ?");
        $authQ->execute([$userId, $req['family_id']]);
        $me = $authQ->fetch();

        if (!$me || $me['role'] !== 'admin') {
             throw new \Exception("Unauthorized");
        }

        if ($data['action'] === 'approve') {
            // --- APPROVE LOGIC ---

            // Remove from ANY previous family first
            $pdo->prepare("DELETE FROM family_members WHERE user_id = ?")->execute([$req['user_id']]);
            
            // Add to NEW family
            $ins = $pdo->prepare("INSERT INTO family_members (family_id, user_id, role) VALUES (?,?, 'member')");
            $ins->execute([$req['family_id'], $req['user_id']]);

            // Notify User
            $tokenQ = $pdo->prepare("SELECT expo_push_token FROM device_tokens WHERE user_id = ?");
            $tokenQ->execute([$req['user_id']]);
            $userTokens = $tokenQ->fetchAll(\PDO::FETCH_COLUMN);
            
            Utils::sendExpoPush($userTokens, "Welcome!", "Your request to join the family was approved.", ["url" => "billbell://(app)/bills"]);

            // DELETE the request (it is completed)
            $pdo->prepare("DELETE FROM family_join_requests WHERE id = ?")->execute([$data['request_id']]);

        } else {
            // --- REJECT LOGIC ---
            
            // UPDATE status to 'rejected' (Do NOT delete)
            $pdo->prepare("UPDATE family_join_requests SET status = 'rejected' WHERE id = ?")->execute([$data['request_id']]);
        }

        $pdo->commit();
        Utils::json(["success" => true]);

    } catch (\Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        Utils::json(["error" => $e->getMessage()], 500);
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