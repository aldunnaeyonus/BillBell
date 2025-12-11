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
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.*)$/i', $hdr, $m)) Utils::json(["error" => "Missing Authorization header"], 401);
    try {
      $decoded = JWT::decode($m[1], new Key(Config::jwtSecret(), 'HS256'));
      return (int)$decoded->sub;
    } catch (\Throwable $e) {
      Utils::json(["error" => "Invalid token"], 401);
    }
  }
}

?>