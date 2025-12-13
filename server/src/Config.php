<?php
namespace App;

class Config {
  public static function db() {
    return [
      "host" => $_ENV["DB_HOST"],
      "name" => $_ENV["DB_NAME"],
      "user" => $_ENV["DB_USER"],
      "pass" => $_ENV["DB_PASS"],
    ];
  }

  public static function jwtSecret() { return $_ENV["JWT_SECRET"]; }
  public static function expoAccessToken() { return $_ENV["EXPO_ACCESS_TOKEN"]; }
}
