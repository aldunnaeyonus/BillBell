<?php
require __DIR__ . "/../../../vendor/autoload.php";

use App\DB;

$pdo = DB::pdo();

// Delete expired (and optionally used) import codes
// - uses UTC to match your DB dump timezone usage
// - keeps it simple for cron usage

$deleteUsedToo = true;

$sql = $deleteUsedToo
  ? "DELETE FROM import_codes WHERE expires_at < UTC_TIMESTAMP() OR used_at IS NOT NULL"
  : "DELETE FROM import_codes WHERE expires_at < UTC_TIMESTAMP()";

$stmt = $pdo->prepare($sql);
$stmt->execute();

$deleted = $stmt->rowCount();

echo "Import codes deleted: {$deleted}\n";
