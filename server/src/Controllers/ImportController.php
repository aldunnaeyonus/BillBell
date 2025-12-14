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

    if (!$codeRow) Utils::json(["error" => "Invalid import code"], 401);
    if (!empty($codeRow["used_at"])) Utils::json(["error" => "Import code already used"], 401);

    $now = new \DateTime();
    $exp = new \DateTime($codeRow["expires_at"]);
    if ($now > $exp) Utils::json(["error" => "Import code expired"], 401);

    // 3. Mark Code as Used
    $useStmt = $pdo->prepare("UPDATE import_codes SET used_at=NOW() WHERE id=? AND used_at IS NULL");
    $useStmt->execute([(int)$codeRow["id"]]);
    if ($useStmt->rowCount() !== 1) {
      Utils::json(["error" => "Import code already used"], 401);
    }

    // 4. Parse & Insert Payload
    $bills = $data["bills"] ?? null;
    if (!is_array($bills)) Utils::json(["error" => "bills must be an array"], 422);

    $inserted = 0;

    try {
      $pdo->beginTransaction();

      // FIX: Matching 'bills.sql' columns (creditor, amount_cents, notes)
      $ins = $pdo->prepare("
        INSERT INTO bills 
        (family_id, creditor, amount_cents, due_date, notes, recurrence, reminder_offset_days, reminder_time_local, created_by_user_id, created_at)
        VALUES (?,?,?,?,?,?,?,?,?, NOW())
      ");

      foreach ($bills as $b) {
        if (!is_array($b)) continue;
        $rawRecurrence = isset($b["recurrence"]) ? strtolower(trim((string)$b["recurrence"])) : "";
        $validRecurrences = ["none", "weekly", "bi-weekly", "monthly", "annually"];

        // Map CSV 'name' -> DB 'creditor'
        $creditor = isset($b["name"]) ? trim((string)$b["name"]) : "";
        
        // Map CSV 'amount' (float) -> DB 'amount_cents' (int)
        // e.g. 20.50 becomes 2050
        $amountFloat = isset($b["amount"]) ? (float)$b["amount"] : null;
        $amountCents = $amountFloat ? (int)round($amountFloat * 100) : 0;
        
        $dueDate = isset($b["due_date"]) ? trim((string)$b["due_date"]) : ""; 
        $notes = isset($b["notes"]) ? (string)$b["notes"] : null;
        
        // Hardcoded defaults for bulk import
        $recurrence = in_array($rawRecurrence, $validRecurrences) ? $rawRecurrence : "none";        $offset = 1; 
        $time = "09:00:00";

        // Basic validation
        if ($creditor === "" || $amountCents <= 0 || $dueDate === "") {
           continue; 
        }

$ins->execute([
    $familyId, 
    $creditor, 
    $amountCents, 
    $dueDate, 
    $notes, 
    $recurrence, // <-- Now using the CSV value
    $offset, 
    $time, 
    $userId
]);
        $inserted++;
      }

      $pdo->commit();
    } catch (\Throwable $e) {
      if ($pdo->inTransaction()) $pdo->rollBack();
      // Optional: Reset the code so they can try again if the SQL failed
      // $pdo->prepare("UPDATE import_codes SET used_at=NULL WHERE id=?")->execute([(int)$codeRow["id"]]);
      
      Utils::json(["error" => "Import failed", "detail" => $e->getMessage()], 500);
    }

    Utils::json([
      "ok" => true,
      "inserted" => $inserted,
    ]);
  }
}