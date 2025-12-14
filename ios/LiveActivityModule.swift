import Foundation
import ActivityKit
import React

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
  
  @objc(startActivity:amount:dueDate:resolver:rejecter:)
  func startActivity(_ billName: String, amount: String, dueDate: String, resolve: RCTPromiseResolveBlock, reject: RCTPromiseRejectBlock) {
      // Guard: Check if Live Activities are supported (iOS 16.1+)
    guard ActivityAuthorizationInfo().areActivitiesEnabled else {
      reject("not_enabled", "Live Activities are not enabled", nil)
      return
    }
    
    let attributes = BillAttributes(billId: UUID().uuidString)
    let contentState = BillAttributes.ContentState(billName: billName, amount: amount, dueDate: dueDate)
    
    do {
      let activity = try Activity<BillAttributes>.request(
        attributes: attributes,
        content: .init(state: contentState, staleDate: nil)
      )
      resolve(activity.id)
    } catch {
      reject("error", "Failed to start activity: \(error.localizedDescription)", error)
    }
  }
  
  @objc(endAllActivities)
  func endAllActivities() {
    Task {
      for activity in Activity<BillAttributes>.activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }
  }
}
