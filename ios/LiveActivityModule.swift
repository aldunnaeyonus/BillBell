import Foundation
import ActivityKit
import React
import WidgetKit

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
  
    // --- 1. Save Decrypted Bills from React Native ---
  @objc(saveBillsToStore:)
  func saveBillsToStore(jsonString: String) {
    let decoder = JSONDecoder()
      // Ensure this matches your API date format (usually ISO8601)
    decoder.dateDecodingStrategy = .iso8601
    
    if let data = jsonString.data(using: .utf8) {
      do {
        let bills = try decoder.decode([Bill].self, from: data)
        BillDataStore.saveBills(bills)
          // Force all widgets to update immediately with the new data
        WidgetCenter.shared.reloadAllTimelines()
      } catch {
        print("DEBUG: Failed to decode bills from JS: \(error)")
      }
    }
  }
  
    // --- 2. Explicit Widget Refresh ---
  @objc(refreshWidget)
  func refreshWidget() {
    WidgetCenter.shared.reloadAllTimelines()
  }
  
    // --- 3. Force Clear (Reset Switch) ---
  @objc(clearAllSavedBills)
  func clearAllSavedBills() {
    BillDataStore.saveBills([])
    WidgetCenter.shared.reloadAllTimelines()
  }
  
    // --- 4. Get Summary Data (For Live Activities) ---
  @objc(getSummaryDataWithResolver:rejecter:)
  func getSummaryData(_ resolve: RCTPromiseResolveBlock, _ reject: RCTPromiseRejectBlock) {
    let allBills = BillDataStore.loadBills()
    let unpaidBills = allBills.filter { !$0.isPaid }
    let currentDate = Date()
    let calendar = Calendar.current
    
    let overdueBills = unpaidBills.filter { $0.dueDate < currentDate }
    let overdueTotal = overdueBills.reduce(0.0) { $0 + $1.amount }
    
    let components = calendar.dateComponents([.year, .month], from: currentDate)
    let nextMonthStart = calendar.date(byAdding: .month, value: 1, to: calendar.date(from: components)!)!
    
    let billsThisMonth = unpaidBills.filter {
      $0.dueDate >= currentDate && $0.dueDate < nextMonthStart
    }
    let monthTotal = billsThisMonth.reduce(0.0) { $0 + $1.amount }
    
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.currencyCode = "USD"
    
    let results: [String: Any] = [
      "overdueCount": overdueBills.count,
      "overdueTotal": formatter.string(from: NSNumber(value: overdueTotal)) ?? "$0.00",
      "monthCount": billsThisMonth.count,
      "monthTotal": formatter.string(from: NSNumber(value: monthTotal)) ?? "$0.00"
    ]
    
    resolve(results)
  }
  
    // --- 5. Start/Update Live Activity ---
  @objc(startActivity:overdueCount:monthTotal:monthCount:resolve:reject:)
  func startActivity(_ overdueTotal: String, overdueCount: Int, monthTotal: String, monthCount: Int, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    
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
          let content = ActivityContent(state: contentState, staleDate: nil)
          Task { await currentActivity.update(content) }
          resolve(currentActivity.id)
        } else {
          let content = ActivityContent(state: contentState, staleDate: nil)
          let activity = try Activity.request(attributes: attributes, content: content, pushType: nil)
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
          await activity.end(nil, dismissalPolicy: .immediate)
        }
      }
    }
  }
}
