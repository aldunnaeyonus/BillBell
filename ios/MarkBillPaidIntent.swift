import AppIntents
import WidgetKit
import Foundation

struct MarkBillPaidIntent: AppIntent {
  static var title: LocalizedStringResource = "Mark Paid"
  
  @Parameter(title: "Bill ID")
  var billID: String
  
  init() {}
  init(billID: String) { self.billID = billID }
  
  func perform() async throws -> some IntentResult {
    var bills = BillDataStore.loadBills()
    
    if let index = bills.firstIndex(where: { String($0.id) == billID }) {
      let old = bills[index]
      
        // Replace immutable Bill with a new instance marked paid
      bills[index] = Bill(
        id: old.id,
        creditor: old.creditor,
        amountCents: old.amountCents,
        dueDate: old.dueDate,
        isPaid: true,
        notes: old.notes,
        payment_method: old.payment_method
      )
      
      BillDataStore.saveBills(bills)
      
        // Mailbox for app catch-up
      UserDefaults(suiteName: BillDataStore.suiteName)?
        .set(billID, forKey: "last_paid_bill_id")
      
        // 1) Refresh widget UI
      WidgetCenter.shared.reloadAllTimelines()
      
        // 2) Signal the app (works only if running, but harmless)
      let identifier = "com.billbell.app.refresh" as CFString
      CFNotificationCenterPostNotification(
        CFNotificationCenterGetDarwinNotifyCenter(),
        CFNotificationName(identifier),
        nil, nil, true
      )
    }
    
    return .result()
  }

}
