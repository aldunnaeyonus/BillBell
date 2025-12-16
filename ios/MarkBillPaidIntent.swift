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
    
    UserDefaults(suiteName: BillDataStore.suiteName)?
      .set(billID, forKey: "last_paid_bill_id")
    
    if let index = bills.firstIndex(where: { String($0.id) == billID }) {
      bills[index].isPaid = true
      BillDataStore.saveBills(bills)
      
        // 1. Force Widget to redraw
      WidgetCenter.shared.reloadAllTimelines()
      
        // 2. Broadcast signal to the App process via Darwin
      let identifier = "com.billbell.app.refresh" as CFString
      if let prefs = UserDefaults(suiteName: BillDataStore.suiteName) {
        prefs.set(billID, forKey: "last_paid_bill_id")
        prefs.synchronize()
      }
      UserDefaults(suiteName: BillDataStore.suiteName)?
        .set(billID, forKey: "last_paid_bill_id")
      
      CFNotificationCenterPostNotification(
        CFNotificationCenterGetDarwinNotifyCenter(),
        CFNotificationName(identifier),
        nil, nil, true
      )
    }
    return .result()
  }
}
