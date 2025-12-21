<?php
namespace App;

class Utils {
  public static function json($data, int $status = 200) {
    http_response_code($status);
    header("Content-Type: application/json");
    echo json_encode($data);
    exit;
  }

public static function sendExpoPush(array $tokens, string $title, string $body, array $data = []) {
    if (empty($tokens)) return;
    
    // Chunk tokens to batches of 100 if necessary, but simple loop here
    $payload = [];
    foreach ($tokens as $t) {
        if (empty($t)) continue;
        $payload[] = [
            "to" => $t,
            "title" => $title,
            "body" => $body,
            "data" => $data,
            "sound" => "default"
        ];
    }

    if (empty($payload)) return;

    $ch = curl_init("https://exp.host/--/api/v2/push/send");
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Content-Type: application/json",
        "Accept: application/json"
    ]);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    // Timeout to prevent hanging
    curl_setopt($ch, CURLOPT_TIMEOUT, 5); 
    curl_exec($ch);
    curl_close($ch);
}

  public static function bodyJson(): array {
    $raw = file_get_contents("php://input");
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
  }

  public static function requireFields(array $data, array $fields) {
    foreach ($fields as $f) {
      if (!array_key_exists($f, $data)) {
        self::json(["error" => "Missing field: $f"], 422);
      }
    }
  }

  public static function randomFamilyCode(int $len = 6): string {
    $alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    $out = "";
    for ($i=0; $i<$len; $i++) $out .= $alphabet[random_int(0, strlen($alphabet)-1)];
    return $out;
  }

  // --- ADDED: Smart Date Logic for Recurrence (Shared) ---
  public static function addRecurrenceInterval(\DateTime $date, string $recurrence) {
    $day = (int)$date->format('j');
    $originalDay = $day;

    switch ($recurrence) {
        case 'weekly':
            $date->modify('+1 week');
            break;
        case 'bi-weekly':
            $date->modify('+2 weeks');
            break;
        case 'semi-monthly':
            // 1st -> 15th, 15th -> 1st of next month
            if ($day < 15) {
                $date->setDate((int)$date->format('Y'), (int)$date->format('n'), 15);
            } else {
                $date->modify('first day of next month');
            }
            break;
        case 'monthly':
            $date->modify('+1 month');
            // Fix "February Bug": Snap to last day if we overshot (e.g. Jan 31 -> Feb 28)
            if ((int)$date->format('j') < $originalDay) {
                $date->modify('last day of previous month');
            }
            break;
        case 'quarterly':
            $date->modify('+3 months');
             if ((int)$date->format('j') < $originalDay) {
                $date->modify('last day of previous month');
            }
            break;
        case 'semi-annually':
            $date->modify('+6 months');
             if ((int)$date->format('j') < $originalDay) {
                $date->modify('last day of previous month');
            }
            break;
        case 'annually':
            $date->modify('+1 year');
             if ((int)$date->format('j') < $originalDay) {
                $date->modify('last day of previous month');
            }
            break;
    }
    return $date;
  }
}