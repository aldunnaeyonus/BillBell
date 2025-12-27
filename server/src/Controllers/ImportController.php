<?php
namespace App\Controllers;

use App\DB;
use App\Utils;

class ImportController {

  public static function upload() {
    return self::run();
  }

  public static function run() {
    // Wrap everything in a try-catch to ensure we ALWAYS return JSON
    try {
      $pdo = DB::pdo();
      $data = Utils::bodyJson();

      // --- STEP 1: Validate Family Share ID ---
      $shareId = isset($data["family_code"]) ? trim((string)$data["family_code"]) : "";
      if ($shareId === "") Utils::json(["error" => "Family Share ID is required"], 422);

      $stmt = $pdo->prepare("SELECT id FROM families WHERE family_code=? LIMIT 1");
      $stmt->execute([$shareId]);
      $familyRow = $stmt->fetch();

      if (!$familyRow) Utils::json(["error" => "Invalid Family Share ID"], 404);
      $familyId = (int)$familyRow["id"];

      // --- STEP 2: Find a Family Admin ---
      $adminStmt = $pdo->prepare("SELECT user_id FROM family_members WHERE family_id=? AND role='admin' LIMIT 1");
      $adminStmt->execute([$familyId]);
      $adminRow = $adminStmt->fetch();
      
      $systemUserId = $adminRow ? (int)$adminRow["user_id"] : 0;

      // --- STEP 3: Validate Import Code ---
      $importCode = isset($data["import_code"]) ? strtoupper(trim((string)$data["import_code"])) : "";
      if ($importCode === "") Utils::json(["error" => "Import Code is required"], 422);

      $codeHash = hash("sha256", $importCode);
      $codeStmt = $pdo->prepare("SELECT id, expires_at, used_at FROM import_codes WHERE family_id=? AND code_hash=? LIMIT 1");
      $codeStmt->execute([$familyId, $codeHash]);
      $codeRow = $codeStmt->fetch();

      if (!$codeRow) Utils::json(["error" => "Invalid Import Code"], 404);
      if ($codeRow["used_at"]) Utils::json(["error" => "Code already used"], 410);
      if (new \DateTime() > new \DateTime($codeRow["expires_at"])) Utils::json(["error" => "Code expired"], 410);

      // --- STEP 4: Process Bills ---
      $bills = $data["bills"] ?? [];
      if (!is_array($bills)) Utils::json(["error" => "bills must be an array"], 422);

      $inserted = 0;

      // Mapping array to handle typos and aliases
      $recurrenceMap = [
    // --- English (Base) ---
    // Weekly
    'weekly' => 'weekly', 'week' => 'weekly', 'wk' => 'weekly', 'w' => 'weekly',
    // Bi-Weekly
    'bi-weekly' => 'bi-weekly', 'biweekly' => 'bi-weekly', 'bi weekly' => 'bi-weekly',
    'fortnightly'=> 'bi-weekly', '2 weeks' => 'bi-weekly', 'bi-w' => 'bi-weekly',
    // Semi-Monthly
    'semi-monthly'  => 'semi-monthly', 'semimonthly' => 'semi-monthly',
    'twice a month' => 'semi-monthly','semi month' => 'semi-monthly','semi monthly'  => 'semi-monthly',
    // Monthly
    'monthly'    => 'monthly', 'month' => 'monthly', 'mon' => 'monthly',
    'montly'     => 'monthly', 'monthy'     => 'monthly', 'mth'    => 'monthly', 'm'    => 'monthly',
    // Quarterly
    'quarterly' => 'quarterly', 'quarter' => 'quarterly', 'qtr' => 'quarterly',
    'quartlery' => 'quarterly',
    // Semi-Annually
    'semi-annually' => 'semi-annually', 'semiannually' => 'semi-annually',
    'half-yearly'   => 'semi-annually', 'biannual' => 'semi-annually', 'semi annually' => 'semi-annually',
    // Annually
    'annually'  => 'annually', 'annual' => 'annually', 'yearly' => 'annually',
    'year'      => 'annually', 'yr' => 'annually',

    // --- Spanish (es) ---
    'semanal' => 'weekly', 'semana' => 'weekly', 'sem' => 'weekly',
    'quincenal' => 'bi-weekly', 'bisemanal' => 'bi-weekly', 'dos semanas' => 'bi-weekly',
    'bimensual' => 'semi-monthly', 'semimensual' => 'semi-monthly', 'dos veces al mes' => 'semi-monthly',
    'mensual' => 'monthly', 'mes' => 'monthly',
    'trimestral' => 'quarterly', 'trimestre' => 'quarterly',
    'semestral' => 'semi-annually', 'medio año' => 'semi-annually',
    'anual' => 'annually', 'año' => 'annually', 'anualmente' => 'annually',

    // --- Portuguese (pt) ---
    // 'semanal' handled in Spanish overlap
    'quinzenal' => 'bi-weekly', 'duas semanas' => 'bi-weekly',
    'bimestral' => 'semi-monthly', // careful: bimestral in PT usually means every 2 months, but sometimes used loosely.
    'semi-mensal' => 'semi-monthly',
    // 'mensal' handled by Spanish 'mensual' proximity? No, explicit:
    'mensal' => 'monthly',
    // 'trimestral' handled in Spanish overlap
    'semestral' => 'semi-annually', 'meio ano' => 'semi-annually',
    // 'anual' handled in Spanish overlap

    // --- French (fr) ---
    'hebdomadaire' => 'weekly', 'hebdo' => 'weekly', 'semaine' => 'weekly',
    'bi-hebdomadaire' => 'bi-weekly', 'quinzaine' => 'bi-weekly', 'deux semaines' => 'bi-weekly',
    'bimensuel' => 'semi-monthly', 'mi-mensuel' => 'semi-monthly', 'deux fois par mois' => 'semi-monthly',
    'mensuel' => 'monthly', 'mois' => 'monthly',
    'trimestriel' => 'quarterly', 'trimestre' => 'quarterly',
    'semestriel' => 'semi-annually', 'mi-annuel' => 'semi-annually',
    'annuel' => 'annually', 'an' => 'annually', 'année' => 'annually',

    // --- Italian (it) ---
    'settimanale' => 'weekly', 'settimana' => 'weekly', 'sett' => 'weekly',
    'bisettimanale' => 'bi-weekly', 'due settimane' => 'bi-weekly',
    'bimensile' => 'semi-monthly', 'semimensile' => 'semi-monthly',
    'mensile' => 'monthly', 'mese' => 'monthly',
    'trimestrale' => 'quarterly',
    'semestrale' => 'semi-annually', 'metà anno' => 'semi-annually',
    'annuale' => 'annually', 'anno' => 'annually',

    // --- German (de) ---
    'wöchentlich' => 'weekly', 'woche' => 'weekly',
    'zweiwöchentlich' => 'bi-weekly', 'alle zwei wochen' => 'bi-weekly', '14-tägig' => 'bi-weekly',
    'halbmonatlich' => 'semi-monthly', 'zweimal im monat' => 'semi-monthly',
    'monatlich' => 'monthly', 'monat' => 'monthly',
    'vierteljährlich' => 'quarterly', 'quartal' => 'quarterly',
    'halbjährlich' => 'semi-annually',
    'jährlich' => 'annually', 'jahr' => 'annually',

    // --- Dutch (nl) ---
    'wekelijks' => 'weekly', 'week' => 'weekly',
    'tweewekelijks' => 'bi-weekly', 'om de week' => 'bi-weekly', '14 dagen' => 'bi-weekly',
    'halfmaandelijks' => 'semi-monthly', 'twee keer per maand' => 'semi-monthly',
    'maandelijks' => 'monthly', 'maand' => 'monthly',
    'driemaandelijks' => 'quarterly', 'kwartaal' => 'quarterly',
    'halfjaarlijks' => 'semi-annually',
    'jaarlijks' => 'annually', 'jaar' => 'annually',

    // --- Chinese (zh - Simplified) ---
    '每周' => 'weekly', '周' => 'weekly', '每星期' => 'weekly',
    '每两周' => 'bi-weekly', '双周' => 'bi-weekly',
    '半月' => 'semi-monthly', '每月两次' => 'semi-monthly',
    '每月' => 'monthly', '月' => 'monthly',
    '每季度' => 'quarterly', '季度' => 'quarterly', '季' => 'quarterly',
    '每半年' => 'semi-annually', '半年' => 'semi-annually',
    '每年' => 'annually', '年' => 'annually', '年度' => 'annually',

    // --- Japanese (ja) ---
    '毎週' => 'weekly', '週' => 'weekly',
    '隔週' => 'bi-weekly', '2週間ごと' => 'bi-weekly',
    '月2回' => 'semi-monthly', '半月ごと' => 'semi-monthly',
    '毎月' => 'monthly', '月' => 'monthly', '月次' => 'monthly',
    '四半期ごと' => 'quarterly', '四半期' => 'quarterly', '3ヶ月ごと' => 'quarterly',
    '半年ごと' => 'semi-annually', '半期' => 'semi-annually',
    '毎年' => 'annually', '年' => 'annually', '年次' => 'annually',
];

      $pdo->beginTransaction();
      
      // Mark code as used
      $pdo->prepare("UPDATE import_codes SET used_at=NOW() WHERE id=?")->execute([$codeRow["id"]]);

      $ins = $pdo->prepare("
        INSERT INTO bills
        (family_id, created_by_user_id, updated_by_user_id, creditor, amount_cents, amount_encrypted, due_date, notes, recurrence, reminder_offset_days, reminder_time_local, status, payment_method)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)
      ");

      foreach ($bills as $b) {
        $creditor = isset($b["name"]) ? trim((string)$b["name"]) : "";
        $amountFloat = isset($b["amount"]) ? (float)$b["amount"] : 0;
        $amountCents = (int)round($amountFloat * 100);
        $rawDate = isset($b["due_date"]) ? trim((string)$b["due_date"]) : "";
        
        if ($creditor === "" || $amountCents <= 0 || $rawDate === "") continue;

        // --- BACKEND DATE PARSING FALLBACK ---
        // If frontend didn't convert to YYYY-MM-DD, try to be smart here.
        // Check if it's already YYYY-MM-DD
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $rawDate)) {
            $dueDate = $rawDate;
        } else {
            // Try robust parsing
            $ts = strtotime($rawDate);
            if ($ts === false) {
                // If slashes failed, try swapping separators to dashes (common trick for EU vs US formats)
                $ts = strtotime(str_replace('/', '-', $rawDate));
            }
            if ($ts === false) continue; // Skip invalid date
            $dueDate = date('Y-m-d', $ts);
        }

        // Clean recurrence input
        $inputRec = strtolower(trim($b["recurrence"] ?? "none"));
        $recurrence = $recurrenceMap[$inputRec] ?? "none";

        // FIX: Extract and normalize payment_method
        $rawPayment = isset($b["payment_method"]) ? $b["payment_method"] : ($b["paymentMethod"] ?? "manual");
        $rawPayment = strtolower(trim($rawPayment));
        
$paymentMethodMap = [
    // --- English (Base) ---
    'auto' => 'auto', 'autopay' => 'auto', 'auto_pay' => 'auto', 'automatic' => 'auto',
    'manual' => 'manual',

    // --- Spanish (es) ---
    'automático' => 'auto', 'automatizado' => 'auto',
    'manual' => 'manual',

    // --- Portuguese (pt) ---
    'automático' => 'auto',
    'manual' => 'manual',

    // --- French (fr) ---
    'automatique' => 'auto', 'auto' => 'auto', 'prélèvement' => 'auto', // Prélèvement = Direct Debit
    'manuel' => 'manual',

    // --- Italian (it) ---
    'automatico' => 'auto',
    'manuale' => 'manual',

    // --- German (de) ---
    'automatisch' => 'auto', 'lastschrift' => 'auto', // Lastschrift = Direct Debit
    'manuell' => 'manual',

    // --- Dutch (nl) ---
    'automatisch' => 'auto', 'incasso' => 'auto', // Incasso = Direct Debit
    'handmatig' => 'manual',

    // --- Chinese (zh) ---
    '自动' => 'auto', '自动支付' => 'auto',
    '手动' => 'manual',

    // --- Japanese (ja) ---
    '自動' => 'auto', 'オート' => 'auto', '自動支払' => 'auto',
    '手動' => 'manual',
];

$paymentMethod = $paymentMethodMap[strtolower($rawPayment)] ?? 'manual';

        $ins->execute([
          $familyId,
          $systemUserId,
          $systemUserId,
          $creditor,
          $amountCents,
          null, // Encrypted amount is null for imports
          $dueDate,
          isset($b["notes"]) ? (string)$b["notes"] : null,
          $recurrence,
          1,
          "09:00:00",
          $paymentMethod 
        ]);
        $inserted++;
      }

      $pdo->commit();
      Utils::json(["ok" => true, "inserted" => $inserted]);

    } catch (\Throwable $e) {
      if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
      Utils::json(["error" => "Server Error: " . $e->getMessage()], 500);
    }
  }
}