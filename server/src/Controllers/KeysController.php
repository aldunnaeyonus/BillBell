<?php
namespace App\Controllers;

use App\DB;
use App\Utils;
use App\Auth;

class KeysController {
    
    // Upload User's RSA Public Key (Call this on app init if missing)
    public static function uploadPublicKey() {
        $userId = Auth::requireUserId();
        $data = Utils::bodyJson();
        Utils::requireFields($data, ["public_key"]);
        
        $pdo = DB::pdo();
        $stmt = $pdo->prepare("INSERT INTO user_public_keys (user_id, public_key) VALUES (?, ?) ON DUPLICATE KEY UPDATE public_key = ?");
        $stmt->execute([$userId, $data['public_key'], $data['public_key']]);
        
        Utils::json(["status" => "ok"]);
    }

    // Get a specific user's Public Key (Used by Admin to share the key)
    public static function getUserPublicKey($targetUserId) {
        Auth::requireUserId(); // Ensure logged in
        $pdo = DB::pdo();
        
        $stmt = $pdo->prepare("SELECT public_key FROM user_public_keys WHERE user_id = ?");
        $stmt->execute([$targetUserId]);
        $row = $stmt->fetch();
        
        if (!$row) Utils::json(["error" => "Public key not found for user"], 404);
        Utils::json(["public_key" => $row['public_key']]);
    }

    // Upload Encrypted Shared Key (For self or other members)
    public static function storeSharedKey() {
        $userId = Auth::requireUserId(); // The person performing the upload
        $data = Utils::bodyJson();
        Utils::requireFields($data, ["family_id", "target_user_id", "encrypted_key"]);

        // Validate permission: You must be in the family to set keys
        $pdo = DB::pdo();
        $stmt = $pdo->prepare("SELECT family_id FROM family_members WHERE user_id = ?");
        $stmt->execute([$userId]);
        $currentUser = $stmt->fetch();

        if (!$currentUser || $currentUser['family_id'] != $data['family_id']) {
            Utils::json(["error" => "Access denied"], 403);
        }

        $stmt = $pdo->prepare("REPLACE INTO family_shared_keys (family_id, user_id, encrypted_key) VALUES (?, ?, ?)");
        $stmt->execute([$data['family_id'], $data['target_user_id'], $data['encrypted_key']]);

        Utils::json(["status" => "ok"]);
    }

    // Get My Encrypted Shared Key
    public static function getMySharedKey() {
        $userId = Auth::requireUserId();
        $pdo = DB::pdo();
        
        $stmt = $pdo->prepare("
            SELECT k.encrypted_key 
            FROM family_shared_keys k
            JOIN family_members fm ON fm.family_id = k.family_id
            WHERE k.user_id = ? AND fm.user_id = ?
        ");
        $stmt->execute([$userId, $userId]);
        $row = $stmt->fetch();
        
        if (!$row) Utils::json(["error" => "Key not found"], 404);
        Utils::json(["encrypted_key" => $row['encrypted_key']]);
    }
}