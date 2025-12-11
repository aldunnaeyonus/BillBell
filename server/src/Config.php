<?php
namespace App;

class Config {
  public static function db() {
    return [
      "host" => getenv("DB_HOST"),
      "name" => getenv("DB_NAME"),
      "user" => getenv("DB_USER"),
      "pass" => getenv("DB_PASS"),
    ];
  }
    public const APPLE_BUNDLE_ID = 'com.dunn.carabali.billbell';

  public static function jwtSecret() { return getenv("JWT_SECRET"); }
  public static function expoAccessToken() { return getenv("EXPO_ACCESS_TOKEN"); }
}
