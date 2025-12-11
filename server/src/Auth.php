<?php
namespace App;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class Auth {
  public static function issueToken(int $userId): string {
    $payload = ["sub" => $userId, "iat" => time(), "exp" => time() + (60 * 60 * 24 * 30)];
    return JWT::encode($payload, Config::jwtSecret(), 'HS256');
  }

  public static function requireUserId(): int {
  // Try multiple places for the Authorization header
  $headers = function_exists('getallheaders') ? getallheaders() : [];

  $authHeader =
      ($headers['Authorization'] ?? null) ??
      ($headers['authorization'] ?? null) ??
      ($_SERVER['HTTP_AUTHORIZATION'] ?? null) ??
      ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? null);

  if (!$authHeader || !preg_match('/^Bearer\s+(.+)/i', $authHeader, $m)) {
    Utils::json(["error" => "Missing Authorization header"], 401);
  }

  $token = $m[1];

  $userId = self::verifyToken($token);
  if (!$userId) {
    Utils::json(["error" => "Invalid token"], 401);
  }

  return $userId;
}


?>