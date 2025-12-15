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
    Utils::requireFields($data, ["public_key"]);

    $publicKey = (string)$data["public_key"];

    if (strlen($publicKey) < 200 || strlen($publicKey) > 10000) {
      Utils::json(["error" => "public_key size invalid"], 422);
    }
    if (strpos($publicKey, "BEGIN PUBLIC KEY") === false) {
      Utils::json(["error" => "public_key format invalid"], 422);
    }

    $pdo = DB::pdo();
    $stmt = $pdo->prepare("
      INSERT INTO user_public_keys (user_id, public_key)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE public_key = VALUES(public_key)
    ");
    $stmt->execute([$userId, $publicKey]);

    Utils::json(["status" => "ok"]);
  }

  // Get a specific user's Public Key
  public static function getUserPublicKey($targetUserId) {
    $userId = Auth::requireUserId();
    RateLimit::hit("keys_fetch:{$userId}", 60, 60);

    $pdo = DB::pdo();
    $stmt = $pdo->prepare("
      SELECT public_key
      FROM user_public_keys
      WHERE user_id = ?
      LIMIT 1
    ");
    $stmt->execute([(int)$targetUserId]);
    $row = $stmt->fetch();

    if (!$row) {
      Utils::json(["error" => "Public key not found for user"], 404);
    }

    Utils::json(["public_key" => $row["public_key"]]);
  }

  // Store wrapped family key for the family's CURRENT key_version
  // Version-history: inserts (family_id, user_id, key_version)
  public static function storeSharedKey() {
    $userId = Auth::requireUserId();
    RateLimit::hit("keys_shared:{$userId}", 30, 60);

    $data = Utils::bodyJson();
    Utils::requireFields($data, ["family_id", "target_user_id", "encrypted_key"]);

    $familyId = (int)$data["family_id"];
    $targetUserId = (int)$data["target_user_id"];
    $encryptedKey = (string)$data["encrypted_key"];

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

    // Insert versioned row; if the same version already exists, update encrypted_key
    // (requires PRIMARY KEY / UNIQUE on (family_id,user_id,key_version))
    $stmt = $pdo->prepare("
      INSERT INTO family_shared_keys (family_id, user_id, key_version, encrypted_key)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE encrypted_key = VALUES(encrypted_key)
    ");
    $stmt->execute([$familyId, $targetUserId, $keyVersion, $encryptedKey]);

    Utils::json([
      "status" => "ok",
      "family_id" => $familyId,
      "user_id" => $targetUserId,
      "key_version" => $keyVersion
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

    // Fetch versioned shared key row
    $stmt = $pdo->prepare("
      SELECT encrypted_key
      FROM family_shared_keys
      WHERE family_id = ? AND user_id = ? AND key_version = ?
      LIMIT 1
    ");
    $stmt->execute([$familyId, $userId, $keyVersion]);
    $row = $stmt->fetch();

    if (!$row) {
      // Not an error in logic—means rotation occurred and this user hasn't received the new wrapped key yet.
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

  // Optional helper endpoint if you want clients to fetch older versions (debug / migration)
  // Not required for normal operation; keep disabled unless you need it.
  /*
  public static function getMySharedKeyVersion(int $version) {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();

    $stmt = $pdo->prepare("
      SELECT f.id AS family_id
      FROM family_members fm
      JOIN families f ON f.id = fm.family_id
      WHERE fm.user_id = ?
      LIMIT 1
    ");
    $stmt->execute([$userId]);
    $fam = $stmt->fetch();
    if (!$fam) Utils::json(["error" => "User not in family"], 409);

    $familyId = (int)$fam["family_id"];

    $stmt = $pdo->prepare("
      SELECT encrypted_key
      FROM family_shared_keys
      WHERE family_id=? AND user_id=? AND key_version=?
      LIMIT 1
    ");
    $stmt->execute([$familyId, $userId, $version]);
    $row = $stmt->fetch();

    if (!$row) Utils::json(["error" => "Key not found"], 404);
    Utils::json(["encrypted_key" => $row["encrypted_key"], "family_id" => $familyId, "key_version" => $version]);
  }
  */
}
