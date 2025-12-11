<?php
require __DIR__ . "/../vendor/autoload.php";
use App\DB;

$pdo = DB::pdo();
$tomorrow = (new DateTime("tomorrow"))->format("Y-m-d");
$now = (new DateTime())->format("Y-m-d H:i:s");

$stmt = $pdo->prepare("
  SELECT b.id, b.creditor, b.amount_cents, b.due_date, b.family_id
  FROM bills b
  WHERE b.status='active'
    AND b.due_date=?
    AND (b.snoozed_until IS NULL OR b.snoozed_until <= ?)
");
$stmt->execute([$tomorrow, $now]);
$bills = $stmt->fetchAll();
if (!$bills) { echo "No due bills.\n"; exit; }

foreach ($bills as $bill) {
  $stmt2 = $pdo->prepare("
    SELECT dt.expo_push_token
    FROM family_members fm
    JOIN device_tokens dt ON dt.user_id = fm.user_id
    WHERE fm.family_id=?
  ");
  $stmt2->execute([(int)$bill["family_id"]]);
  $tokens = array_map(fn($r) => $r["expo_push_token"], $stmt2->fetchAll());
  $tokens = array_values(array_unique(array_filter($tokens)));
  if (!$tokens) continue;

  $amount = number_format(((int)$bill["amount_cents"]) / 100, 2);
  $messages = [];
  foreach ($tokens as $t) {
    $messages[] = [
      "to" => $t,
      "sound" => "default",
      "title" => "Bill due tomorrow",
      "body"  => "{$bill['creditor']} – \${$amount}",
      "data"  => ["bill_id" => (int)$bill["id"]],
    ];
  }

  $ch = curl_init("https://exp.host/--/api/v2/push/send");
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($messages));
  $resp = curl_exec($ch);
  $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  echo "Sent {$code}: {$resp}\n";
}
