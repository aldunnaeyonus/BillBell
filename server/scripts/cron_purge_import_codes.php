<?php
require __DIR__ . "/../../../vendor/autoload.php";

use App\DB;

$pdo = DB::pdo();

// FIX: Use PHP DateTime to match the timezone used during creation.
// Using MySQL's UTC_TIMESTAMP() causes premature deletion if PHP is configured for a different timezone.
$now = (new DateTime())->format("Y-m-d H:i:s");

$deleteUsedToo = true;

$sql = $deleteUsedToo
  ? "DELETE FROM import_codes WHERE expires_at < ? OR used_at IS NOT NULL"
  : "DELETE FROM import_codes WHERE expires_at < ?";

$stmt = $pdo->prepare($sql);

// Execute with the calculated timestamp
$stmt->execute([$now]);

$deleted = $stmt->rowCount();

echo "Import codes deleted: {$deleted}\n";