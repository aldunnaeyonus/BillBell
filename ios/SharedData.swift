  // MARK: - File: SharedData.swift (Needs to be added to both targets in Xcode)
import Foundation
import WidgetKit
import AppIntents // Required if MarkBillPaidIntent is in this file

  // --- 0. Core Data Model (Shared) ---
  // Note: Added 'amount' to the Bill struct to make the 'monthTotal' calculation possible.
struct Bill: Identifiable, Codable {
  let id: UUID
  let name: String
  let dueDate: Date
  var amount: Double // Added for calculating totals
  var isPaid: Bool = false
  
    // Helper to check if a bill is overdue
  var isOverdue: Bool {
    return !isPaid && dueDate < Date()
  }
}

// --- 0. Data Store (Handles reading/writing to the App Group container) ---
// CRITICAL: Ensure this App Group ID is enabled in both your main app and extension targets.
class BillDataStore {
  private static let appGroupName = "group.com.billbell.shared"
  private static let billsKey = "BillBellWidget"
  
  private static var sharedDefaults: UserDefaults? {
    return UserDefaults(suiteName: appGroupName)
  }
  
    // Static method to load all bills from the shared container
  static func loadBills() -> [Bill] {
    guard let defaults = sharedDefaults,
          let savedData = defaults.data(forKey: billsKey),
          let bills = try? JSONDecoder().decode([Bill].self, from: savedData) else {
      
        // FIX APPLIED: Return an empty array if no real data is found.
      return []
    }
    return bills
  }
  
    // Static method to save all bills to the shared container
  static func saveBills(_ bills: [Bill]) {
    guard let defaults = sharedDefaults,
          let encoded = try? JSONEncoder().encode(bills) else { return }
    defaults.set(encoded, forKey: billsKey)
    defaults.synchronize()
  }
}

// --- Mark Bill Paid Intent (Interactivity for Widget) ---
// This is required for the interactive button on the Widget
struct MarkBillPaidIntent: AppIntent {
  static var title: LocalizedStringResource = "Mark Bill as Paid"
  
  @Parameter(title: "Bill ID")
  var billID: String
  
  init(billID: String) {
    self.billID = billID
  }
  init() {}
  
  func perform() async throws -> some IntentResult {
    var bills = BillDataStore.loadBills()
    if let index = bills.firstIndex(where: { $0.id.uuidString == billID }) {
      bills[index].isPaid = true
      BillDataStore.saveBills(bills)
    }
    
    WidgetCenter.shared.reloadTimelines(ofKind: "BillBellWidget")
    return .result()
  }
}
