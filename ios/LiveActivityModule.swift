import Foundation
import ActivityKit
import React
import WidgetKit

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
  
  
  @objc(clearAllSavedBills)
  func clearAllSavedBills() {
      // Overwrite the saved bills with an empty array
    BillDataStore.saveBills([])
    print("--- FORCED: Cleared all bills from App Group. ---")
    
      // FIX APPLIED: Use the more aggressive reloadAllTimelines() to ensure cache purge
    WidgetCenter.shared.reloadAllTimelines()
  }
  
  
  
    // --- NEW: Function to Fetch Summary Data for JavaScript ---
    // FIX APPLIED: Simplified Swift function signature to eliminate argument label mismatch issues.
    // The arguments are now unlabeled, making the internal Objective-C call simpler.
  @objc(getSummaryDataWithResolver:rejecter:)
  func getSummaryData(_ resolve: RCTPromiseResolveBlock, _ reject: RCTPromiseRejectBlock) {
      
    let allBills = BillDataStore.loadBills()
    let unpaidBills = allBills.filter { !$0.isPaid }
    let currentDate = Date()
    let calendar = Calendar.current
    
      // --- CALCULATIONS ---
    
    let overdueBills = unpaidBills.filter { $0.dueDate < currentDate }
    let overdueCount = overdueBills.count
    let overdueTotal = overdueBills.reduce(0.0) { $0 + $1.amount }
    
    let components = calendar.dateComponents([.year, .month], from: currentDate)
    let monthStart = calendar.date(from: components)!
    let nextMonthStart = calendar.date(byAdding: .month, value: 1, to: monthStart)!
    
    let billsThisMonth = unpaidBills.filter {
      $0.dueDate >= currentDate && $0.dueDate < nextMonthStart
    }
    let monthCount = billsThisMonth.count
    let monthTotal = billsThisMonth.reduce(0.0) { $0 + $1.amount }
    
      // 3. Formatting
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.currencyCode = "USD"
    
    let overdueTotalFormatted = formatter.string(from: NSNumber(value: overdueTotal)) ?? "$0.00"
    let monthTotalFormatted = formatter.string(from: NSNumber(value: monthTotal)) ?? "$0.00"
    
      // 4. Return the results
    let results: [String: Any] = [
      "overdueCount": overdueCount,
      "overdueTotal": overdueTotalFormatted,
      "monthCount": monthCount,
      "monthTotal": monthTotalFormatted
    ]
    
    resolve(results)
  }
  
    // --- EXISTING: startActivity ---
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
  
    // --- EXISTING: endAllActivities (Unchanged) ---
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
