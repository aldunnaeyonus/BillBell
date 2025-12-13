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
