<?php
require __DIR__ . "/../../../vendor/autoload.php";
use App\DB;
use App\Utils;

$pdo = DB::pdo();

// FIX 1: Select ALL recurring paid bills, not just monthly
$stmt = $pdo->prepare("
    SELECT * FROM bills 
    WHERE recurrence != 'none' 
      AND status = 'paid'
");
$stmt->execute();
$rows = $stmt->fetchAll();

$created = 0;
foreach ($rows as $b) {
  // FIX 2: Use robust date calculation (via Utils or inline logic)
  // Ensure we use the same logic as the app to prevent date drift
  $dt = new DateTime($b["due_date"]);
  $recurrence = $b["recurrence"];
  
  // Use the helper from Utils (if available) or fallback to internal logic
  if (method_exists('App\Utils', 'addRecurrenceInterval')) {
      $dt = Utils::addRecurrenceInterval($dt, $recurrence);
  } else {
      // Fallback simple logic if Utils isn't updated yet (safety net)
      $dt->modify("+1 month"); 
  }
  
  $nextDue = $dt->format("Y-m-d");

  // Check if next bill already exists
  $chk = $pdo->prepare("SELECT id FROM bills WHERE family_id=? AND creditor=? AND amount_cents=? AND due_date=? LIMIT 1");
  $chk->execute([(int)$b["family_id"], $b["creditor"], (int)$b["amount_cents"], $nextDue]);
  if ($chk->fetch()) continue;

  // FIX 3: Copy ALL fields (encryption, notes, payment method, etc.)
  $ins = $pdo->prepare("
    INSERT INTO bills
    (family_id, created_by_user_id, updated_by_user_id, creditor, amount_cents, amount_encrypted, due_date, status, snoozed_until, recurrence, reminder_offset_days, reminder_time_local, notes, cipher_version, payment_method)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  ");
  
  $ins->execute([
    (int)$b["family_id"],
    (int)$b["created_by_user_id"], // Keep original creator
    (int)$b["created_by_user_id"], // Updated by same
    $b["creditor"],
    (int)$b["amount_cents"],
    $b["amount_encrypted"],         // Copy encrypted amount
    $nextDue,
    "active",
    null,
    $b["recurrence"],
    (int)$b["reminder_offset_days"],
    $b["reminder_time_local"],
    $b["notes"],                    // Copy encrypted notes
    (int)($b["cipher_version"] ?? 1), // Copy key version
    $b["payment_method"] ?? 'manual'  // Copy payment method
  ]);
  
  $created++;
}

echo "Rollover created: {$created}\n";