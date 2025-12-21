<?php
namespace App\Controllers;

use App\DB;
use App\Utils;

class ImportController {

  public static function upload() {
    return self::run();
  }

  public static function run() {
    // Wrap everything in a try-catch to ensure we ALWAYS return JSON (fixes "Unexpected end of JSON input")
    try {
      $pdo = DB::pdo();
      $data = Utils::bodyJson();

      // --- STEP 1: Validate Family Share ID ---
      $shareId = isset($data["family_code"]) ? trim((string)$data["family_code"]) : "";
      if ($shareId === "") Utils::json(["error" => "Family Share ID is required"], 422);

      // Note: Ensure your 'families' table has a column for this ID (e.g., 'share_id' or 'code')
      $stmt = $pdo->prepare("SELECT id FROM families WHERE family_code=? LIMIT 1");
      $stmt->execute([$shareId]);
      $familyRow = $stmt->fetch();

      if (!$familyRow) Utils::json(["error" => "Invalid Family Share ID"], 404);
      $familyId = (int)$familyRow["id"];

      // --- STEP 2: Find a Family Admin (to assign the bills to) ---
      // We do this to avoid inserting NULL into 'created_by_user_id', which would crash the DB
      $adminStmt = $pdo->prepare("SELECT user_id FROM family_members WHERE family_id=? AND role='admin' LIMIT 1");
      $adminStmt->execute([$familyId]);
      $adminRow = $adminStmt->fetch();
      
      // Fallback: If no admin found, use the first member, or 0 if empty
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
          // Weekly
          'weekly'    => 'weekly', 'week' => 'weekly', 'wk' => 'weekly',
          
          // Bi-Weekly
          'bi-weekly' => 'bi-weekly', 'biweekly' => 'bi-weekly', 'bi weekly' => 'bi-weekly', 
          'fortnightly'=> 'bi-weekly', '2 weeks' => 'bi-weekly',
          
          // Semi-Monthly
          'semi-monthly'  => 'semi-monthly', 'semimonthly' => 'semi-monthly', 
          'twice a month' => 'semi-monthly',
          
          // Monthly
          'monthly'   => 'monthly', 'month' => 'monthly', 'mon' => 'monthly', 
          'montly'    => 'monthly', 
          
          // Quarterly
          'quarterly' => 'quarterly', 'quarter' => 'quarterly', 'qtr' => 'quarterly', 
          'quartlery' => 'quarterly', // Specific typo handled
          
          // Semi-Annually
          'semi-annually' => 'semi-annually', 'semiannually' => 'semi-annually', 
          'half-yearly'   => 'semi-annually', 'biannual' => 'semi-annually',
          
          // Annually
          'annually'  => 'annually', 'annual' => 'annually', 'yearly' => 'annually', 
          'year'      => 'annually', 'yr' => 'annually',
      ];

      $pdo->beginTransaction();
      
      // Mark code as used
      $pdo->prepare("UPDATE import_codes SET used_at=NOW() WHERE id=?")->execute([$codeRow["id"]]);

      $ins = $pdo->prepare("
        INSERT INTO bills
        (family_id, created_by_user_id, updated_by_user_id, creditor, amount_cents, amount_encrypted, due_date, notes, recurrence, reminder_offset_days, reminder_time_local, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
      ");

      foreach ($bills as $b) {
        $creditor = isset($b["name"]) ? trim((string)$b["name"]) : "";
        $amountFloat = isset($b["amount"]) ? (float)$b["amount"] : 0;
        $amountCents = (int)round($amountFloat * 100);
        $dueDate = isset($b["due_date"]) ? trim((string)$b["due_date"]) : "";
        
        if ($creditor === "" || $amountCents <= 0 || $dueDate === "") continue;

        // Clean input and map to canonical key
        $inputRec = strtolower(trim($b["recurrence"] ?? "none"));
        $recurrence = $recurrenceMap[$inputRec] ?? "none";

        $ins->execute([
          $familyId,
          $systemUserId, // Assigned to the Family Admin
          $systemUserId,
          $creditor,
          $amountCents,
          null, // Encrypted amount is null for imports
          $dueDate,
          isset($b["notes"]) ? (string)$b["notes"] : null,
          $recurrence,
          1,
          "09:00:00"
        ]);
        $inserted++;
      }

      $pdo->commit();
      Utils::json(["ok" => true, "inserted" => $inserted]);

    } catch (\Throwable $e) {
      if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
      // Return the actual error message to the frontend for debugging
      Utils::json(["error" => "Server Error: " . $e->getMessage()], 500);
    }
  }
}