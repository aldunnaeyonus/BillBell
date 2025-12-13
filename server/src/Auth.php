<?php
namespace App;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class Auth {
  public static function issueToken(int $userId): string {
    $payload = [
      "sub" => $userId,
      "iat" => time(),
      "exp" => time() + (60 * 60 * 24 * 30),
    ];
    return JWT::encode($payload, Config::jwtSecret(), 'HS256');
  }

  public static function requireUserId(): int {
    // 1) Try normal CGI var
    $hdr = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    // 2) Some Apache + PHP-FPM setups put it here
    if (!$hdr && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
      $hdr = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }

    // 3) Fallback to getallheaders, which often has it
    if (!$hdr && function_exists('getallheaders')) {
      $headers = getallheaders();
      if (isset($headers['Authorization'])) {
        $hdr = $headers['Authorization'];
      } elseif (isset($headers['authorization'])) {
        $hdr = $headers['authorization'];
      }
    }

    // Debug (optional): uncomment temporarily if needed
    // file_put_contents(__DIR__ . '/../auth_debug.log',
    //   "Auth header raw: " . $hdr . PHP_EOL,
    //   FILE_APPEND
    // );

    if (!preg_match('/Bearer\s+(.+)$/i', $hdr, $m)) {
      Utils::json(["error" => "Missing Authorization header"], 401);
    }

    try {
      $decoded = JWT::decode($m[1], new Key(Config::jwtSecret(), 'HS256'));
      return (int)$decoded->sub;
    } catch (\Throwable $e) {
      Utils::json(["error" => "Invalid token"], 401);
    }
  }
}
