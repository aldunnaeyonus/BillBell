<?php
require __DIR__ . "/../vendor/autoload.php";
use App\DB;

$pdo = DB::pdo();

function addOneMonth(string $dueDate): string {
  $dt = new DateTime($dueDate);
  $dt->modify("+1 month");
  return $dt->format("Y-m-d");
}

$stmt = $pdo->prepare("SELECT * FROM bills WHERE recurrence='monthly' AND status='paid'");
$stmt->execute();
$rows = $stmt->fetchAll();

$created = 0;
foreach ($rows as $b) {
  $nextDue = addOneMonth($b["due_date"]);

  $chk = $pdo->prepare("SELECT id FROM bills WHERE family_id=? AND creditor=? AND amount_cents=? AND due_date=? LIMIT 1");
  $chk->execute([(int)$b["family_id"], $b["creditor"], (int)$b["amount_cents"], $nextDue]);
  if ($chk->fetch()) continue;

  $ins = $pdo->prepare("
    INSERT INTO bills
    (family_id, created_by_user_id, updated_by_user_id, creditor, amount_cents, due_date, status, snoozed_until, recurrence, reminder_offset_days, reminder_time_local)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)
  ");
  $ins->execute([
    (int)$b["family_id"],
    (int)$b["created_by_user_id"],
    (int)$b["created_by_user_id"],
    $b["creditor"],
    (int)$b["amount_cents"],
    $nextDue,
    "active",
    null,
    "monthly",
    (int)$b["reminder_offset_days"],
    $b["reminder_time_local"]
  ]);
  $created++;
}

echo "Rollover created: {$created}\n";
