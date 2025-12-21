<?php
namespace App\Controllers;

use App\DB;
use App\Utils;
use App\Auth;
use Firebase\JWT\JWT;
use Firebase\JWT\JWK;

class AuthController {
  
  public static function apple() {
    $data = Utils::bodyJson();
    Utils::requireFields($data, ["identity_token"]);

    $claims = self::verifyAppleIdentityToken($data["identity_token"]);
    $providerUserId = $claims["sub"] ?? null;
    if (!$providerUserId) Utils::json(["error" => "Apple token missing sub"], 401);

    $email = $claims["email"] ?? ($data["email"] ?? null);
    $name = $data["name"] ?? null;

    Utils::json(self::upsertUser("apple", $providerUserId, $email, $name));
  }

  public static function google() {
    $data = Utils::bodyJson();
    Utils::requireFields($data, ["id_token"]);

    $claims = self::verifyGoogleIdToken($data["id_token"]);
    $providerUserId = $claims["sub"] ?? null;
    if (!$providerUserId) Utils::json(["error" => "Google token missing sub"], 401);

    $email = $claims["email"] ?? null;
    $name = $claims["name"] ?? null;

    Utils::json(self::upsertUser("google", $providerUserId, $email, $name));
  }

  // --- UPDATED DELETE METHOD (Transactional & Complete) ---
  public static function delete() {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();

    try {
      $pdo->beginTransaction();

      // Lock my membership (if any)
      $stmt = $pdo->prepare("
        SELECT family_id, role
        FROM family_members
        WHERE user_id = ?
        LIMIT 1
        FOR UPDATE
      ");
      $stmt->execute([$userId]);
      $membership = $stmt->fetch();

      if ($membership) {
        $familyId = (int)$membership["family_id"];
        $myRole = (string)($membership["role"] ?? "member");

        // Lock all members of the family so it can't change mid-delete
        $stmt = $pdo->prepare("
          SELECT user_id, role, created_at
          FROM family_members
          WHERE family_id = ?
          ORDER BY (role='admin') DESC, created_at ASC
          FOR UPDATE
        ");
        $stmt->execute([$familyId]);
        $members = $stmt->fetchAll();

        $memberCount = count($members);

        if ($memberCount <= 1) {
          // CASE A: Last member -> Delete everything (Order matters for Foreign Keys)
          $pdo->prepare("DELETE FROM family_settings WHERE family_id = ?")->execute([$familyId]);
          $pdo->prepare("DELETE FROM family_shared_keys WHERE family_id = ?")->execute([$familyId]);
          $pdo->prepare("DELETE FROM import_codes WHERE family_id = ?")->execute([$familyId]);
          $pdo->prepare("DELETE FROM bills WHERE family_id = ?")->execute([$familyId]);
          $pdo->prepare("DELETE FROM family_members WHERE family_id = ?")->execute([$familyId]);
          $pdo->prepare("DELETE FROM families WHERE id = ?")->execute([$familyId]);

        } else {
          // CASE B: Other members exist -> Assign successor
          $successorId = null;

          // 1. Prefer an existing admin (not me)
          foreach ($members as $m) {
            $uid = (int)$m["user_id"];
            if ($uid === $userId) continue;
            if ((string)$m["role"] === "admin") { $successorId = $uid; break; }
          }
          // 2. Fallback to oldest member
          if ($successorId === null) {
            foreach ($members as $m) {
              $uid = (int)$m["user_id"];
              if ($uid === $userId) continue;
              $successorId = $uid;
              break;
            }
          }
          if (!$successorId) throw new \Exception("No successor found");

          // If I was the only admin, promote successor
          if ($myRole === "admin") {
            $admins = $pdo->prepare("
              SELECT COUNT(*) AS c
              FROM family_members
              WHERE family_id = ? AND role = 'admin' AND user_id <> ?
            ");
            $admins->execute([$familyId, $userId]);
            $adminCount = (int)($admins->fetch()["c"] ?? 0);

            if ($adminCount === 0) {
              $pdo->prepare("UPDATE family_members SET role = 'admin' WHERE family_id = ? AND user_id = ? LIMIT 1")
                  ->execute([$familyId, $successorId]);
            }
          }

          // Reassign my contributions to successor
          $pdo->prepare("UPDATE bills SET created_by_user_id = ? WHERE family_id = ? AND created_by_user_id = ?")
              ->execute([$successorId, $familyId, $userId]);
          $pdo->prepare("UPDATE bills SET updated_by_user_id = ? WHERE family_id = ? AND updated_by_user_id = ?")
              ->execute([$successorId, $familyId, $userId]);

          // Reassign family ownership
          $pdo->prepare("UPDATE families SET created_by_user_id = ? WHERE id = ? AND created_by_user_id = ?")
              ->execute([$successorId, $familyId, $userId]);

          // Remove me
          $pdo->prepare("DELETE FROM family_members WHERE family_id = ? AND user_id = ? LIMIT 1")
              ->execute([$familyId, $userId]);
        }
      }

      // Cleanup user data
      $pdo->prepare("DELETE FROM device_tokens WHERE user_id = ?")->execute([$userId]);
      $pdo->prepare("DELETE FROM user_public_keys WHERE user_id = ?")->execute([$userId]);
      $pdo->prepare("DELETE FROM users WHERE id = ? LIMIT 1")->execute([$userId]);

      $pdo->commit();
      Utils::json(["ok" => true]);

    } catch (\Throwable $e) {
      if ($pdo->inTransaction()) $pdo->rollBack();
      Utils::json(["error" => "Account deletion failed: " . $e->getMessage()], 500);
    }
  }

  // --- Helpers ---
  private static function upsertUser(string $provider, string $providerUserId, ?string $email, ?string $name): array {
    $pdo = DB::pdo();

    $stmt = $pdo->prepare("SELECT id FROM users WHERE provider=? AND provider_user_id=? LIMIT 1");
    $stmt->execute([$provider, $providerUserId]);
    $row = $stmt->fetch();

    if ($row) {
      $userId = (int)$row["id"];
      $upd = $pdo->prepare("UPDATE users SET email=COALESCE(?, email), name=COALESCE(?, name) WHERE id=?");
      $upd->execute([$email, $name, $userId]);
    } else {
      $ins = $pdo->prepare("INSERT INTO users (provider, provider_user_id, email, name) VALUES (?,?,?,?)");
      $ins->execute([$provider, $providerUserId, $email, $name]);
      $userId = (int)$pdo->lastInsertId();
    }

    return ["token" => Auth::issueToken($userId), "user_id" => $userId];
  }

  private static function verifyGoogleIdToken(string $idToken): array {
    $clientId = $_ENV["GOOGLE_CLIENT_ID"];
    if (!$clientId) Utils::json(["error" => "GOOGLE_CLIENT_ID not set"], 500);

    $g = new \Google\Client(["client_id" => $clientId]);
    $payload = $g->verifyIdToken($idToken);

    if (!$payload) Utils::json(["error" => "Invalid Google ID token"], 401);
    if (($payload["aud"] ?? null) !== $clientId) Utils::json(["error" => "Google aud mismatch"], 401);
    return $payload;
  }

  private static function verifyAppleIdentityToken(string $jwt): array {
    $bundleId = $_ENV["APPLE_BUNDLE_ID"];
    if (!$bundleId) Utils::json(["error" => "APPLE_BUNDLE_ID not set"], 500);

    $jwksJson = file_get_contents("https://appleid.apple.com/auth/keys");
    if (!$jwksJson) Utils::json(["error" => "Unable to fetch Apple keys"], 500);
    $jwks = json_decode($jwksJson, true);
    if (!is_array($jwks)) Utils::json(["error" => "Invalid Apple keys response"], 500);

    try {
      $keys = JWK::parseKeySet($jwks);
      $decoded = JWT::decode($jwt, $keys);
      $claims = json_decode(json_encode($decoded), true);
    } catch (\Throwable $e) {
      Utils::json(["error" => "Invalid Apple identity token"], 401);
    }

    if (($claims["iss"] ?? null) !== "https://appleid.apple.com") Utils::json(["error" => "Apple iss mismatch"], 401);
    if (($claims["aud"] ?? null) !== $bundleId) Utils::json(["error" => "Apple aud mismatch"], 401);
    if (isset($claims["exp"]) && time() > (int)$claims["exp"]) Utils::json(["error" => "Apple token expired"], 401);

    return $claims;
  }
}