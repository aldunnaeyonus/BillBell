<?php
namespace App\Controllers;

use App\DB;
use App\Utils;
use App\Auth;
use App\RateLimit;

class KeysController {

  // Upload User's RSA Public Key
  public static function uploadPublicKey() {
    $userId = Auth::requireUserId();
    RateLimit::hit("keys_public:{$userId}", 20, 60);

    $data = Utils::bodyJson();
    // FIX: Require both public_key AND the new device_id
    Utils::requireFields($data, ["public_key", "device_id"]); 

    $publicKey = (string)$data["public_key"];
    $deviceId = (string)$data["device_id"]; // <-- Extract device_id

    if (strlen($publicKey) < 200 || strlen($publicKey) > 10000) {
      Utils::json(["error" => "public_key size invalid"], 422);
    }
    if (strpos($publicKey, "BEGIN PUBLIC KEY") === false) {
      Utils::json(["error" => "public_key format invalid"], 422);
    }

    $pdo = DB::pdo();
    
    // FIX: Insert/Update now uses both user_id and device_id for uniqueness
    $stmt = $pdo->prepare("
      INSERT INTO user_public_keys (user_id, device_id, public_key)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE public_key = VALUES(public_key)
    ");
    $stmt->execute([$userId, $deviceId, $publicKey]); // <-- EXECUTE with device_id

    Utils::json(["status" => "ok"]);
  }

  // Get ALL a specific user's Public Keys (one per device)
  public static function getUserPublicKey($targetUserId) {
    $userId = Auth::requireUserId();
    RateLimit::hit("keys_fetch:{$userId}", 60, 60);

    $pdo = DB::pdo();
    $stmt = $pdo->prepare("
      SELECT public_key, device_id
      FROM user_public_keys
      WHERE user_id = ?
    "); // FIX: Removed LIMIT 1 and added device_id selection
    $stmt->execute([(int)$targetUserId]);
    $rows = $stmt->fetchAll(); // FIX: Changed fetch() to fetchAll()

    if (!$rows) {
      Utils::json(["error" => "Public keys not found for user"], 404);
    }

    // FIX: Return an array of keys for multi-device support
    Utils::json(["public_keys" => $rows]);
  }

  // Store wrapped family key for the family's CURRENT key_version
  public static function storeSharedKey() {
    $userId = Auth::requireUserId();
    RateLimit::hit("keys_shared:{$userId}", 30, 60);

    $data = Utils::bodyJson();
    // FIX 1: Require the new device_id field
    Utils::requireFields($data, ["family_id", "target_user_id", "encrypted_key", "device_id"]); 

    $familyId = (int)$data["family_id"];
    $targetUserId = (int)$data["target_user_id"];
    $encryptedKey = (string)$data["encrypted_key"];
    $deviceId = (string)$data["device_id"]; // FIX 2: Extract device ID

    if (strlen($encryptedKey) < 50 || strlen($encryptedKey) > 4096) {
      Utils::json(["error" => "encrypted_key size invalid"], 422);
    }
    if (!preg_match('/^[A-Za-z0-9+\/=]+$/', $encryptedKey)) {
      Utils::json(["error" => "encrypted_key format invalid"], 422);
    }

    $pdo = DB::pdo();

    // Verify caller is in this family + get role
    $stmt = $pdo->prepare("
      SELECT family_id, role
      FROM family_members
      WHERE user_id = ?
      LIMIT 1
    ");
    $stmt->execute([$userId]);
    $caller = $stmt->fetch();

    if (!$caller || (int)$caller["family_id"] !== $familyId) {
      Utils::json(["error" => "Access denied"], 403);
    }

    // Verify target is also in the same family
    $stmt = $pdo->prepare("
      SELECT 1
      FROM family_members
      WHERE user_id = ? AND family_id = ?
      LIMIT 1
    ");
    $stmt->execute([$targetUserId, $familyId]);
    if (!$stmt->fetch()) {
      Utils::json(["error" => "Target user not in family"], 404);
    }

    // Only admins can set keys for other users (self-update allowed)
    $callerRole = (string)($caller["role"] ?? "member");
    if ($targetUserId !== $userId && $callerRole !== "admin") {
      Utils::json(["error" => "Admin only"], 403);
    }

    // Current key_version
    $stmt = $pdo->prepare("SELECT key_version FROM families WHERE id = ? LIMIT 1");
    $stmt->execute([$familyId]);
    $fam = $stmt->fetch();
    if (!$fam) {
      Utils::json(["error" => "Family not found"], 404);
    }
    $keyVersion = (int)($fam["key_version"] ?? 1);

    // FIX 3: Insert versioned row using device_id for uniqueness
    $stmt = $pdo->prepare("
      INSERT INTO family_shared_keys (family_id, user_id, key_version, encrypted_key, device_id)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE encrypted_key = VALUES(encrypted_key)
    ");
    // FIX 4: Execute with device_id
    $stmt->execute([$familyId, $targetUserId, $keyVersion, $encryptedKey, $deviceId]);

    Utils::json([
      "status" => "ok",
      "family_id" => $familyId,
      "user_id" => $targetUserId,
      "key_version" => $keyVersion,
      "device_id" => $deviceId 
    ]);
  }

  // Fetch my wrapped key for the family's CURRENT version
  public static function getMySharedKey() {
    $userId = Auth::requireUserId();
    RateLimit::hit("keys_fetch:{$userId}", 60, 60);

    $pdo = DB::pdo();

    // Find my family + current key_version
    $stmt = $pdo->prepare("
      SELECT f.id AS family_id, f.key_version
      FROM family_members fm
      JOIN families f ON f.id = fm.family_id
      WHERE fm.user_id = ?
      LIMIT 1
    ");
    $stmt->execute([$userId]);
    $fam = $stmt->fetch();

    if (!$fam) {
      Utils::json(["error" => "User not in family"], 409);
    }

    $familyId = (int)$fam["family_id"];
    $keyVersion = (int)($fam["key_version"] ?? 1);
    
    // FIX 1: Retrieve device_id from the query parameters (sent by client)
    $deviceId = $_GET['device_id'] ?? '00000000-0000-0000-0000-000000000000'; // Default to legacy ID

    // FIX 2: Fetch versioned shared key row using device_id
    $stmt = $pdo->prepare("
      SELECT encrypted_key
      FROM family_shared_keys
      WHERE family_id = ? AND user_id = ? AND key_version = ? AND device_id = ?
      LIMIT 1
    ");
    // Execute with the new device ID
    $stmt->execute([$familyId, $userId, $keyVersion, $deviceId]);
    $row = $stmt->fetch();

    if (!$row) {
      Utils::json([
        "error" => "Key not found for current version",
        "family_id" => $familyId,
        "key_version" => $keyVersion
      ], 404);
    }

    Utils::json([
      "encrypted_key" => $row["encrypted_key"],
      "family_id" => $familyId,
      "key_version" => $keyVersion
    ]);
  }
// --- FIX: Added Missing rotateKey method ---
  public static function rotateKey() {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();

    // 1. Check Permissions (Admin only)
    $stmt = $pdo->prepare("SELECT family_id, role FROM family_members WHERE user_id=? LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();

    if (!$row) Utils::json(["error" => "User not in family"], 409);
    
    // Strict check: Only admins can trigger rotation
    if (($row["role"] ?? 'member') !== 'admin') {
        Utils::json(["error" => "Only admins can rotate keys"], 403);
    }

    $familyId = (int)$row["family_id"];

    try {
        $pdo->beginTransaction();

        // 2. Increment key_version
        $upd = $pdo->prepare("UPDATE families SET key_version = key_version + 1 WHERE id = ?");
        $upd->execute([$familyId]);

        // 3. Fetch the new version
        $get = $pdo->prepare("SELECT key_version FROM families WHERE id = ?");
        $get->execute([$familyId]);
        $newVersion = $get->fetchColumn();

        $pdo->commit();

        // 4. Return new version so client can generate and share new keys
        Utils::json([
            "status" => "ok",
            "family_id" => $familyId,
            "key_version" => (int)$newVersion
        ]);
    } catch (\Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        Utils::json(["error" => "Key rotation failed"], 500);
    }
  }
}