import Foundation
import ActivityKit
import React

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
  
    // --- FIX: Update this string to match the new arguments exactly ---
  @objc(startActivity:overdueCount:monthTotal:monthCount:resolve:reject:)
  func startActivity(_ overdueTotal: String, overdueCount: Int, monthTotal: String, monthCount: Int, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    
    if #available(iOS 16.1, *) {
        // ... (Rest of your code remains the same) ...
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
      // ... (Your existing endAllActivities code) ...
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
