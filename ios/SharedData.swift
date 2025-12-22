import Foundation

  // MARK: - Bill Model
struct Bill: Codable, Identifiable {
  let id: Int
  let creditor: String
  let amountCents: Int
  let dueDate: Date
  let isPaid: Bool
  let notes: String
  let payment_method: String

}

  // MARK: - BillDataStore
enum BillDataStore {
  
    // ✅ MUST match App Group everywhere (app, widget, intents)
  static let suiteName = "group.com.billbell.shared"
  
  private static let billsKey = "saved_bills"
  private static let lastPaidKey = "last_paid_bill_id"
  
    // MARK: - Save / Load Bills
  
  static func saveBills(_ bills: [Bill]) {
    guard let prefs = UserDefaults(suiteName: suiteName) else { return }
    
    do {
      let data = try JSONEncoder().encode(bills)
      prefs.set(data, forKey: billsKey)
      prefs.synchronize()
      
      print("APP DEBUG: saved \(bills.count) bills to app group (key \(billsKey))")
      print("APP DEBUG: saved bills count=\(bills.count), bytes=\(data.count)")
    } catch {
      print("APP ERROR: failed to encode bills:", error)
    }
  }
  
  static func loadBills() -> [Bill] {
    guard
      let prefs = UserDefaults(suiteName: suiteName),
      let data = prefs.data(forKey: billsKey)
    else {
      return []
    }
    
    do {
      let bills = try JSONDecoder().decode([Bill].self, from: data)
      return bills
    } catch {
      print("WIDGET ERROR: failed to decode bills:", error)
      return []
    }
  }
  
    // MARK: - Mark Bill Paid (Shared Store)
  
    /// Updates the shared store immediately (used by Widget / AppIntent)
  static func markBillPaidLocally(billId: Int) {
    var bills = loadBills()
    var didUpdate = false
    
    bills = bills.map { bill in
      if bill.id == billId && !bill.isPaid {
        didUpdate = true
        return Bill(
          id: bill.id,
          creditor: bill.creditor,
          amountCents: bill.amountCents,
          dueDate: bill.dueDate,
          isPaid: true,
          notes: "",
          payment_method: bill.payment_method
        )
      }
      return bill
    }
    
    if didUpdate {
      saveBills(bills)
      setLastPaidBillId(billId)
    }
  }
  
    // MARK: - Last Paid Bill (Mailbox)
  
  static func setLastPaidBillId(_ id: Int) {
    guard let prefs = UserDefaults(suiteName: suiteName) else { return }
    prefs.set(String(id), forKey: lastPaidKey)
    prefs.synchronize()
  }
  
  static func consumeLastPaidBillId() -> String? {
    guard let prefs = UserDefaults(suiteName: suiteName) else { return nil }
    
    let id = prefs.string(forKey: lastPaidKey)
    if id != nil {
      prefs.removeObject(forKey: lastPaidKey)
      prefs.synchronize()
    }
    return id
  }
  
    // MARK: - Debug / Reset Helpers
  
  static func clearAll() {
    guard let prefs = UserDefaults(suiteName: suiteName) else { return }
    prefs.removeObject(forKey: billsKey)
    prefs.removeObject(forKey: lastPaidKey)
    prefs.synchronize()
  }
}
