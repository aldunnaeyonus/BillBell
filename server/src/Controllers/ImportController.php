<?php
namespace App\Controllers;

use App\DB;
use App\Utils;
use App\Auth;

class ImportController {

  // POST /import/bills
  public static function run() {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();
    $data = Utils::bodyJson();

    // 1. Verify User is Family Admin
    $stmt = $pdo->prepare("SELECT family_id, role FROM family_members WHERE user_id=? LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) Utils::json(["error" => "User not in family"], 409);
    if (($row["role"] ?? "") !== "admin") Utils::json(["error" => "Admin only"], 403);

    $familyId = (int)$row["family_id"];

    // 2. Validate Import Code
    $importCode = isset($data["import_code"]) ? (string)$data["import_code"] : "";
    $importCode = strtoupper(trim($importCode));
    if ($importCode === "") Utils::json(["error" => "import_code is required"], 422);

    $codeHash = hash("sha256", $importCode);

    $codeStmt = $pdo->prepare("
      SELECT id, expires_at, used_at
      FROM import_codes
      WHERE family_id=? AND code_hash=? LIMIT 1
    ");
    $codeStmt->execute([$familyId, $codeHash]);
    $codeRow = $codeStmt->fetch();

    if (!$codeRow) Utils::json(["error" => "Invalid code"], 404);
    if ($codeRow["used_at"]) Utils::json(["error" => "Code already used"], 410); // 410 Gone
    if (new \DateTime() > new \DateTime($codeRow["expires_at"])) Utils::json(["error" => "Code expired"], 410);

    // 3. Process Bills
    $bills = $data["bills"] ?? [];
    if (!is_array($bills)) Utils::json(["error" => "bills must be an array"], 422);

    $validRecurrences = ["monthly","weekly","bi-weekly","annually"];
    
    $inserted = 0;
    
    $pdo->beginTransaction();
    try {
      // Mark code as used
      $upd = $pdo->prepare("UPDATE import_codes SET used_at=NOW() WHERE id=?");
      $upd->execute([$codeRow["id"]]);

      // [UPDATE] Added amount_encrypted to the INSERT columns
      $ins = $pdo->prepare("
        INSERT INTO bills
        (family_id, created_by_user_id, updated_by_user_id, creditor, amount_cents, amount_encrypted, due_date, notes, recurrence, reminder_offset_days, reminder_time_local, status)
        VALUES (?,?,?,?,?,?,?,?,?,?,?, 'active')
      ");

      foreach ($bills as $b) {
        $rawRecurrence = strtolower(trim($b["recurrence"] ?? ""));
        
        $creditor = isset($b["name"]) ? trim((string)$b["name"]) : "";
        
        // Map CSV 'amount' (float) -> DB 'amount_cents' (int)
        $amountFloat = isset($b["amount"]) ? (float)$b["amount"] : null;
        $amountCents = $amountFloat ? (int)round($amountFloat * 100) : 0;
        
        $dueDate = isset($b["due_date"]) ? trim((string)$b["due_date"]) : ""; 
        $notes = isset($b["notes"]) ? (string)$b["notes"] : null;
        
        $recurrence = in_array($rawRecurrence, $validRecurrences) ? $rawRecurrence : "none";
        $offset = 1; 
        $time = "09:00:00";

        // Basic validation
        if ($creditor === "" || $amountCents <= 0 || $dueDate === "") {
           continue; 
        }

        $ins->execute([
            $familyId, 
            $userId, 
            $userId, 
            $creditor,       // Plain text (server can't encrypt)
            $amountCents, 
            null,            // [UPDATE] Explicitly set amount_encrypted to NULL
            $dueDate, 
            $notes,          // Plain text (server can't encrypt)
            $recurrence,
            $offset, 
            $time
        ]);
        $inserted++;
      }

      $pdo->commit();
    } catch (\Throwable $e) {
      if ($pdo->inTransaction()) $pdo->rollBack();
      throw $e;
    }

    Utils::json(["ok" => true, "inserted" => $inserted]);
  }
}