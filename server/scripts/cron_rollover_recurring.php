// server/scripts/cron_rollover_recurring.php
<?php
require __DIR__ . "/../../../vendor/autoload.php";
use App\DB;
use App\Utils;

$pdo = DB::pdo();

// Select all recurring paid bills
$stmt = $pdo->prepare("
    SELECT * FROM bills 
    WHERE recurrence != 'none' 
      AND status = 'paid'
");
$stmt->execute();
$rows = $stmt->fetchAll();

$created = 0;
foreach ($rows as $b) {
  $dt = new DateTime($b["due_date"]);
  $recurrence = $b["recurrence"];
  
  if (method_exists('App\Utils', 'addRecurrenceInterval')) {
      $dt = Utils::addRecurrenceInterval($dt, $recurrence);
  } else {
      $dt->modify("+1 month"); 
  }
  
  $nextDue = $dt->format("Y-m-d");

  // CHECK: If end_date is set and next due date is past it, skip.
  if (!empty($b["end_date"]) && $nextDue > $b["end_date"]) {
      continue;
  }

  // Check if next bill already exists
  $chk = $pdo->prepare("SELECT id FROM bills WHERE family_id=? AND creditor=? AND amount_cents=? AND due_date=? LIMIT 1");
  $chk->execute([(int)$b["family_id"], $b["creditor"], (int)$b["amount_cents"], $nextDue]);
  if ($chk->fetch()) continue;

  $ins = $pdo->prepare("
    INSERT INTO bills
    (family_id, created_by_user_id, updated_by_user_id, creditor, amount_cents, amount_encrypted, due_date, end_date, status, snoozed_until, recurrence, reminder_offset_days, reminder_time_local, notes, cipher_version, payment_method)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  ");
  
  $ins->execute([
    (int)$b["family_id"],
    (int)$b["created_by_user_id"],
    (int)$b["created_by_user_id"],
    $b["creditor"],
    (int)$b["amount_cents"],
    $b["amount_encrypted"],
    $nextDue,
    $b["end_date"], // Copy end_date
    "active",
    null,
    $b["recurrence"],
    (int)$b["reminder_offset_days"],
    $b["reminder_time_local"],
    $b["notes"],
    (int)($b["cipher_version"] ?? 1),
    $b["payment_method"] ?? 'manual'
  ]);
  
  $created++;
}

echo "Rollover created: {$created}\n";