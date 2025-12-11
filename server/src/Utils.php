<?php
namespace App;

class Utils {
  public static function json($data, int $status = 200) {
    http_response_code($status);
    header("Content-Type: application/json");
    echo json_encode($data);
    exit;
  }

  public static function bodyJson(): array {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
  }

  public static function requireFields(array $data, array $fields) {
    foreach ($fields as $f) {
      if (!array_key_exists($f, $data)) {
        self::json(["error" => "Missing field: $f"], 422);
      }
    }
  }

  public static function randomFamilyCode(int $len = 6): string {
    $alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    $out = "";
    for ($i=0; $i<$len; $i++) $out .= $alphabet[random_int(0, strlen($alphabet)-1)];
    return $out;
  }
}
