<?php
namespace App;

use App\Utils;
use App\Controllers\AuthController;
use App\Controllers\FamilyController;
use App\Controllers\BillsController;
use App\Controllers\DevicesController;
use App\Controllers\FamilySettingsController;
use App\Controllers\ImportCodeController;
use App\Controllers\ImportController;
use App\Controllers\KeysController;

class Routes {
  private static function normalizedPath(): string {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';

    // strip the subdirectory your app is hosted under
    $base = '/billMVP';
    if (strpos($path, $base) === 0) {
      $path = substr($path, strlen($base));
      if ($path === '') $path = '/';
    }

    return $path;
  }

  public static function dispatch() {
    $path = self::normalizedPath();
    $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

    // CORS preflight
    if ($method === 'OPTIONS') {
      http_response_code(204);
      exit;
    }

    // --- Keys Routes ---
    if ($method === "POST" && $path === "/keys/public") { KeysController::uploadPublicKey(); return; }

    if ($method === "GET" && preg_match('#^/keys/public/(\d+)$#', $path, $m)) { KeysController::getUserPublicKey((int)$m[1]); return; }

    if ($method === "POST" && $path === "/keys/shared") { KeysController::storeSharedKey(); return; }
    if ($method === "GET"  && $path === "/keys/shared") { KeysController::getMySharedKey(); return; }

    // --- Account / Health ---
    if ($method === "DELETE" && $path === "/auth/user") { AuthController::delete(); return; }
    if ($method === "GET" && $path === "/health") { Utils::json(["ok" => true]); return; }

    // --- Import / Export ---
    if ($method === "POST" && $path === "/import-code/create") { ImportCodeController::create(); return; }
    if ($method === "POST" && $path === "/import/bills") { ImportController::upload(); return; }
    if ($method === "POST" && $path === "/family/rotate-key") { FamilyController::rotateKey(); return; }
    // --- Auth ---
    if ($method === "GET" && $path === "/auth/apple") { Utils::json(["ok"=>false,"hint"=>"POST /auth/apple"], 405); return; }
    if ($method === "GET" && $path === "/auth/google") { Utils::json(["ok"=>false,"hint"=>"POST /auth/google"], 405); return; }
    if ($method === "POST" && $path === "/auth/apple") { AuthController::apple(); return; }
    if ($method === "POST" && $path === "/auth/google") { AuthController::google(); return; }

    // --- Family Routes ---
    if ($method === "POST" && $path === "/family/create") { FamilyController::create(); return; }
    if ($method === "POST" && $path === "/family/join") { FamilyController::join(); return; }
    if ($method === "POST" && $path === "/family/leave") { FamilyController::leave(); return; }
    if ($method === "GET"  && $path === "/family/members") { FamilyController::members(); return; }
    if ($method === "DELETE" && preg_match('#^/family/members/(\d+)$#', $path, $m)) { FamilyController::removeMember((int)$m[1]); return; }

    if ($method === "GET" && $path === "/family/settings") { FamilySettingsController::get(); return; }
    if ($method === "PUT" && $path === "/family/settings") { FamilySettingsController::update(); return; }

    // --- Bill Routes ---
    if ($method === "GET" && $path === "/bills") { BillsController::list(); return; }
    if ($method === "POST" && $path === "/bills") { BillsController::create(); return; }
    if ($method === "PUT" && preg_match('#^/bills/(\d+)$#', $path, $m)) { BillsController::update((int)$m[1]); return; }
    if ($method === "DELETE" && preg_match('#^/bills/(\d+)$#', $path, $m)) { BillsController::delete((int)$m[1]); return; }
    if ($method === "POST" && preg_match('#^/bills/(\d+)/mark-paid$#', $path, $m)) { BillsController::markPaid((int)$m[1]); return; }
    if ($method === "POST" && preg_match('#^/bills/(\d+)/snooze$#', $path, $m)) { BillsController::snooze((int)$m[1]); return; }

    // --- Devices ---
    if ($method === "POST" && $path === "/devices/token") { DevicesController::upsert(); return; }

    Utils::json(["error" => "Not found", "method" => $method, "path" => $path], 404);
  }
}