<?php
namespace App;

use PDO;

class DB {
  public static function pdo(): PDO {
    $c = Config::db();
    $dsn = "mysql:host={$c['host']};dbname={$c['name']};charset=utf8mb4";
    return new PDO($dsn, $c['user'], $c['pass'], [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
  }
}
