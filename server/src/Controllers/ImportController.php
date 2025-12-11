<?php
namespace App\Controllers;

use App\DB;
use App\Utils;
use App\Auth;

class ImportController {

  // POST /import
  // Body (JSON): { "import_code": "ABCDEFGH", "bills": [ ... ] }
  public static function run() {
    $userId = Auth::requireUserId();
    $pdo = DB::pdo();
    $data = Utils::bodyJson();

    // must be admin in family (import destination is your family)
    $stmt = $pdo->prepare("SELECT family_id, role FROM family_members WHERE user_id=? LIMIT 1");
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) Utils::json(["error" => "User not in family"], 409);
    if (($row["role"] ?? "") !== "admin") Utils::json(["error" => "Admin only"], 403);

    $familyId = (int)$row["family_id"];

    // --- validate import_code ---
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

    // Claim the code (one-time use) BEFORE importing (race safe)
    $useStmt = $pdo->prepare("UPDATE import_codes SET used_at=NOW() WHERE id=? AND used_at IS NULL");
    $useStmt->execute([(int)$codeRow["id"]]);
    if ($useStmt->rowCount() !== 1) {
      Utils::json(["error" => "Import code already used"], 401);
    }

    // --- payload parsing ---
    $bills = $data["bills"] ?? null;
    if (!is_array($bills)) Utils::json(["error" => "Debts must be an array"], 422);

    // --- import ---
    // Adjust table/columns to match YOUR schema. This is a sane, explicit default.
    // Expected bill keys: name, amount, due_date, notes (optional), autopay (optional)
    $inserted = 0;

    try {
      $pdo->beginTransaction();

      $ins = $pdo->prepare("
        INSERT INTO bills (family_id, name, amount, due_date, notes, autopay, created_by_user_id, created_at)
        VALUES (?,?,?,?,?,?,?, NOW())
      ");

      foreach ($bills as $b) {
        if (!is_array($b)) continue;

        $name = isset($b["name"]) ? trim((string)$b["name"]) : "";
        $amount = isset($b["amount"]) ? (float)$b["amount"] : null;
        $dueDate = isset($b["due_date"]) ? trim((string)$b["due_date"]) : ""; // expect YYYY-MM-DD
        $notes = isset($b["notes"]) ? (string)$b["notes"] : null;
        $autopay = isset($b["autopay"]) ? (int)!!$b["autopay"] : 0;

        if ($name === "" || $amount === null || $dueDate === "") {
          // You can choose to hard-fail instead:
          // $pdo->rollBack(); Utils::json(["error" => "Invalid bill payload"], 422);
          continue;
        }

        $ins->execute([$familyId, $name, $amount, $dueDate, $notes, $autopay, $userId]);
        $inserted++;
      }

      $pdo->commit();
    } catch (\Throwable $e) {
      if ($pdo->inTransaction()) $pdo->rollBack();

      // Optional: un-claim code on failure (depends on your desired semantics).
      // If you want that behavior, uncomment:
      // $pdo->prepare("UPDATE import_codes SET used_at=NULL WHERE id=?")->execute([(int)$codeRow["id"]]);

      Utils::json(["error" => "Import failed", "detail" => $e->getMessage()], 500);
    }

    Utils::json([
      "ok" => true,
      "inserted" => $inserted,
    ]);
  }
}
?>
