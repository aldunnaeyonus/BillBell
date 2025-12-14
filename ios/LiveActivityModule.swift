import Foundation
import ActivityKit
import React

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
  
  @objc(startActivity:amount:dueDate:resolver:rejecter:)
  func startActivity(_ billName: String, amount: String, dueDate: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
    
      // Check if iOS 16.1+
    if #available(iOS 16.1, *) {
        // Guard: Check permissions
      guard ActivityAuthorizationInfo().areActivitiesEnabled else {
        reject("not_enabled", "Live Activities are not enabled", nil)
        return
      }
      
        // --- FIX: Use 'BillBellWidgetsAttributes' to match your widget file ---
      let attributes = BillBellWidgetsAttributes(billId: UUID().uuidString)
      
      let contentState = BillBellWidgetsAttributes.ContentState(
        billName: billName,
        amount: amount,
        dueDate: dueDate
      )
      
      do {
          // Request Activity
        let activity = try Activity<BillBellWidgetsAttributes>.request(
          attributes: attributes,
          content: .init(state: contentState, staleDate: nil)
        )
        resolve(activity.id)
      } catch {
        reject("error", "Failed to start: \(error.localizedDescription)", error)
      }
    } else {
      resolve(nil) // Not supported on this version
    }
  }
  
  @objc(endAllActivities)
  func endAllActivities() {
    if #available(iOS 16.1, *) {
      Task {
          // --- FIX: Use 'BillBellWidgetsAttributes' here too ---
        for activity in Activity<BillBellWidgetsAttributes>.activities {
          await activity.end(nil, dismissalPolicy: .immediate)
        }
      }
    }
  }
}
