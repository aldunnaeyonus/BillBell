<?php
namespace App;

use App\DB;
use App\Utils;

class RateLimit {
  // $key: e.g. "keys_public:{userId}" or "keys_shared:{userId}"
  public static function hit(string $key, int $limit, int $windowSeconds) {
    $pdo = DB::pdo();
    $now = new \DateTimeImmutable("now");
    $reset = $now->modify("+{$windowSeconds} seconds")->format("Y-m-d H:i:s");
    $nowStr = $now->format("Y-m-d H:i:s");

    // Create row if missing or expired, else increment
    $stmt = $pdo->prepare("
      INSERT INTO rate_limits (k, count, reset_at)
      VALUES (?, 1, ?)
      ON DUPLICATE KEY UPDATE
        count = IF(reset_at < ?, 1, count + 1),
        reset_at = IF(reset_at < ?, VALUES(reset_at), reset_at)
    ");
    $stmt->execute([$key, $reset, $nowStr, $nowStr]);

    $check = $pdo->prepare("SELECT count, reset_at FROM rate_limits WHERE k=? LIMIT 1");
    $check->execute([$key]);
    $row = $check->fetch();

    if ($row && (int)$row["count"] > $limit) {
      Utils::json(["error" => "Rate limit exceeded"], 429);
    }
  }
}
