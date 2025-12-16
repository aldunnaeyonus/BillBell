import Foundation
import ActivityKit
import React
import WidgetKit

@objc(LiveActivityModule)
class LiveActivityModule: RCTEventEmitter {
  
    // MARK: - Event Emitter state
  
  private var hasListeners = false
  private let darwinIdentifier = "com.billbell.app.refresh" as CFString
  private let lastPaidBillKey = "last_paid_bill_id"
  
  override static func requiresMainQueueSetup() -> Bool {
    true
  }
  
  override func supportedEvents() -> [String]! {
    return ["onBillMarkedPaid"]
  }
  
  override func startObserving() {
    hasListeners = true
  }
  
  override func stopObserving() {
    hasListeners = false
  }
  
    // RN sometimes expects these when you use NativeEventEmitter(module)
  @objc(addListener:)
  override func addListener(_ eventName: String) {
      // RCTEventEmitter handles listener accounting; keep for RN compatibility
    super.addListener(eventName)
  }
  
  @objc(removeListeners:)
  override func removeListeners(_ count: Double) {
    super.removeListeners(count)
  }
  
    // MARK: - Init (Darwin notification listener)
  
  override init() {
    super.init()
    
    CFNotificationCenterAddObserver(
      CFNotificationCenterGetDarwinNotifyCenter(),
      Unmanaged.passUnretained(self).toOpaque(),
      { (_, observer, _, _, _) in
        guard let observer else { return }
        let me = Unmanaged<LiveActivityModule>.fromOpaque(observer).takeUnretainedValue()
        
        DispatchQueue.main.async {
          guard me.hasListeners else { return }
          
            // Read last paid bill id from the shared app group (set by the AppIntent)
          let prefs = UserDefaults(suiteName: BillDataStore.suiteName)
          let billId = prefs?.string(forKey: me.lastPaidBillKey) ?? "refresh_all"
          
          me.sendEvent(withName: "onBillMarkedPaid", body: ["billId": billId])
        }
      },
      darwinIdentifier,
      nil,
      .deliverImmediately
    )
  }
  
  deinit {
    CFNotificationCenterRemoveObserver(
      CFNotificationCenterGetDarwinNotifyCenter(),
      Unmanaged.passUnretained(self).toOpaque(),
      CFNotificationName(darwinIdentifier),
      nil
    )
  }
  
    // MARK: - Widget Refresh
  
  @objc(refreshWidget)
  func refreshWidget() {
    WidgetCenter.shared.reloadTimelines(ofKind: "BillBellWidget")
  }
  
    // MARK: - Clear Store
  
  @objc(clearAllSavedBills)
  func clearAllSavedBills() {
    BillDataStore.saveBills([])
    print("--- FORCED: Cleared all bills from App Group. ---")
    WidgetCenter.shared.reloadAllTimelines()
  }
  
    // MARK: - Save Bills from JS (CRITICAL for widget population)
  
  @objc(consumeLastPaidBillId:rejecter:)
  func consumeLastPaidBillId(_ resolve: RCTPromiseResolveBlock, _ reject: RCTPromiseRejectBlock) {
    let prefs = UserDefaults(suiteName: BillDataStore.suiteName)
    let key = "last_paid_bill_id"
    
    let id = prefs?.string(forKey: key)
    if id != nil {
      prefs?.removeObject(forKey: key)
      prefs?.synchronize()
    }
    
    resolve(id ?? NSNull())
  }
  
  @objc(saveBillsToStore:)
  func saveBillsToStore(_ jsonString: String) {
    guard let data = jsonString.data(using: .utf8) else {
      print("APP DEBUG: saveBillsToStore invalid UTF-8")
      return
    }
    
    do {
      let obj = try JSONSerialization.jsonObject(with: data, options: [])
      guard let arr = obj as? [[String: Any]] else {
        print("APP DEBUG: saveBillsToStore JSON was not [[String: Any]]")
        return
      }
      
      let fFrac = ISO8601DateFormatter()
      fFrac.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
      let fPlain = ISO8601DateFormatter()
      
      let bills: [Bill] = arr.compactMap { (dict) -> Bill? in
        guard
          let id = dict["id"] as? Int,
          let creditor = dict["creditor"] as? String,
          let dueStr = dict["due_date"] as? String,
          let isPaid = dict["is_paid"] as? Bool,
          let payment_method = dict["payment_method"] as? String
        else {
          return nil
        }
        
        guard let due = fFrac.date(from: dueStr) ?? fPlain.date(from: dueStr) else {
          print("APP DEBUG: bad due_date for bill \(id): \(dueStr)")
          return nil
        }
        
        let amountCents = dict["amount_cents"] as? Int ?? 0
        
        return Bill(
          id: id,
          creditor: creditor,
          dueDate: due,
          amountCents: amountCents,
          isPaid: isPaid,
          notes: "",
          payment_method: payment_method
        )
      }
      
      BillDataStore.saveBills(bills)
      print("APP DEBUG: saved \(bills.count) bills to app group (key saved_bills)")
      
        // Helpful verification
      let prefs = UserDefaults(suiteName: BillDataStore.suiteName)
      print("APP DEBUG: saved bills count=\(bills.count), bytes=\(prefs?.data(forKey: BillDataStore.key)?.count ?? -1)")
      
      WidgetCenter.shared.reloadAllTimelines()
      
    } catch {
      print("APP DEBUG: saveBillsToStore JSON error: \(error)")
    }
  }
  
    // MARK: - Summary Data for JS
  
  @objc(getSummaryDataWithResolver:rejecter:)
  func getSummaryData(_ resolve: RCTPromiseResolveBlock, _ reject: RCTPromiseRejectBlock) {
    let allBills = BillDataStore.loadBills()
    let unpaidBills = allBills.filter { !$0.isPaid }
    
    let now = Date()
    let calendar = Calendar.current
    let todayStart = calendar.startOfDay(for: now)
    
      // Overdue = before today (not "earlier today")
    let overdueBills = unpaidBills.filter { $0.dueDate < todayStart }
    let overdueCount = overdueBills.count
    let overdueTotal = overdueBills.reduce(0.0) { $0 + (Double($1.amountCents) / 100.0) }
    
      // This month window
    let components = calendar.dateComponents([.year, .month], from: now)
    let monthStart = calendar.date(from: components) ?? todayStart
    let nextMonthStart = calendar.date(byAdding: .month, value: 1, to: monthStart) ?? now
    
    let billsThisMonth = unpaidBills.filter {
      $0.dueDate >= todayStart && $0.dueDate < nextMonthStart
    }
    let monthCount = billsThisMonth.count
    let monthTotal = billsThisMonth.reduce(0.0) { $0 + (Double($1.amountCents) / 100.0) }
    
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.currencyCode = "USD"
    
    let overdueTotalFormatted = formatter.string(from: NSNumber(value: overdueTotal)) ?? "$0.00"
    let monthTotalFormatted = formatter.string(from: NSNumber(value: monthTotal)) ?? "$0.00"
    
    resolve([
      "overdueCount": overdueCount,
      "overdueTotal": overdueTotalFormatted,
      "monthCount": monthCount,
      "monthTotal": monthTotalFormatted
    ])
  }
  
    // MARK: - Live Activity
  
  @objc(startActivity:overdueCount:monthTotal:monthCount:resolve:reject:)
  func startActivity(
    _ overdueTotal: String,
    overdueCount: Int,
    monthTotal: String,
    monthCount: Int,
    resolve: RCTPromiseResolveBlock,
    reject: RCTPromiseRejectBlock
  ) {
    if #available(iOS 16.1, *) {
      guard ActivityAuthorizationInfo().areActivitiesEnabled else {
        reject("not_enabled", "Live Activities are not enabled", nil)
        return
      }
      
      let attributes = BillBellWidgetAttributes(billId: "bill_summary")
      let contentState = BillBellWidgetAttributes.ContentState(
        overdueTotal: overdueTotal,
        overdueCount: overdueCount,
        monthTotal: monthTotal,
        monthCount: monthCount
      )
      
      do {
        if let currentActivity = Activity<BillBellWidgetAttributes>.activities.first {
          if #available(iOS 16.2, *) {
            let content = ActivityContent(state: contentState, staleDate: nil)
            Task { await currentActivity.update(content) }
          } else {
            Task { await currentActivity.update(using: contentState) }
          }
          resolve(currentActivity.id)
        } else {
          let activity: Activity<BillBellWidgetAttributes>
          if #available(iOS 16.2, *) {
            let content = ActivityContent(state: contentState, staleDate: nil)
            activity = try Activity.request(attributes: attributes, content: content, pushType: nil)
          } else {
            activity = try Activity.request(attributes: attributes, contentState: contentState, pushType: nil)
          }
          resolve(activity.id)
        }
      } catch {
        reject("error", error.localizedDescription, error)
      }
    } else {
      resolve(nil)
    }
  }
  
  @objc(endAllActivities)
  func endAllActivities() {
    if #available(iOS 16.1, *) {
      Task {
        for activity in Activity<BillBellWidgetAttributes>.activities {
          if #available(iOS 16.2, *) {
            await activity.end(nil, dismissalPolicy: .immediate)
          } else {
            await activity.end(using: nil, dismissalPolicy: .immediate)
          }
        }
      }
    }
  }
}
