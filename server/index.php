<?php
require __DIR__ . '/../../vendor/autoload.php';

use Dotenv\Dotenv;
use App\Routes;

// Load env from a non-web directory (good). Keep it OUT of repo.
$dotenv = Dotenv::createImmutable('/home/dunncarabali/');
$dotenv->safeLoad();

// ---- CORS (lock down) ----
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = array_filter(array_map('trim', explode(',', getenv('ALLOWED_ORIGINS') ?: '')));

if ($origin && in_array($origin, $allowed, true)) {
  header("Access-Control-Allow-Origin: $origin");
  header("Vary: Origin");
} else {
  // If no Origin header (server-to-server / mobile), you can omit ACAO entirely.
  // Do NOT wildcard with Authorization.
}

header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=utf-8");

// ---- Security headers ----
header("X-Content-Type-Options: nosniff");
header("Referrer-Policy: no-referrer");
// Only enable HSTS if you are 100% HTTPS:
// header("Strict-Transport-Security: max-age=31536000; includeSubDomains");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
  http_response_code(204);
  exit;
}

Routes::dispatch();
