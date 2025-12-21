<?php
require __DIR__ . "/../../../vendor/autoload.php";
use App\DB;
use App\Utils;

$pdo = DB::pdo();
$tomorrow = (new DateTime("tomorrow"))->format("Y-m-d");
$now = (new DateTime())->format("Y-m-d H:i:s");

// 1. Fetch bills due tomorrow AND their associated device tokens
$sql = "
  SELECT 
    b.id as bill_id, 
    b.creditor, 
    b.amount_cents, 
    b.family_id,
    dt.expo_push_token
  FROM bills b
  JOIN family_members fm ON fm.family_id = b.family_id
  JOIN device_tokens dt ON dt.user_id = fm.user_id
  WHERE b.status = 'active'
    AND b.due_date = ?
    AND (b.snoozed_until IS NULL OR b.snoozed_until <= ?)
";

$stmt = $pdo->prepare($sql);
$stmt->execute([$tomorrow, $now]);
$rows = $stmt->fetchAll();

if (!$rows) { echo "No due bills or no tokens found.\n"; exit; }

// 2. Group tokens by Bill ID so we send one batch per bill
// (Handles users with multiple devices or families with multiple members)
$notifications = [];

foreach ($rows as $row) {
    $billId = $row["bill_id"];
    $token = $row["expo_push_token"];

    if (!$token || strpos($token, 'ExponentPushToken') === false) continue;

    if (!isset($notifications[$billId])) {
        $notifications[$billId] = [
            'creditor' => $row['creditor'],
            'amount_cents' => $row['amount_cents'],
            'tokens' => []
        ];
    }
    $notifications[$billId]['tokens'][] = $token;
}

// 3. Send Notifications
$sentCount = 0;

foreach ($notifications as $billId => $info) {
    $amount = number_format(((int)$info["amount_cents"]) / 100, 2);
    
    Utils::sendExpoPush(
        $info['tokens'], 
        "Bill due tomorrow",
        "{$info['creditor']} – \${$amount}",
        ["bill_id" => (int)$billId],
        "bill-due-actions" // Adds the "Mark as Paid" button
    );
    
    $sentCount += count($info['tokens']);
}

echo "Processed {$sentCount} notifications for " . count($notifications) . " bills.\n";