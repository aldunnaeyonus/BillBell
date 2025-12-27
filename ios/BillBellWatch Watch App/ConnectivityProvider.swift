import Foundation
import Combine
import WatchConnectivity
import SwiftUI

class ConnectivityProvider: NSObject, ObservableObject, WCSessionDelegate {
  
    // A published property to display debug messages or status on the watch screen
  @Published var receivedText: String = NSLocalizedString("status_ready", comment: "")
  
  func connect() {
    if WCSession.isSupported() {
      let session = WCSession.default
      session.delegate = self
      session.activate()
    }
  }
  
    // MARK: - Sending Data to Phone
  
  func sendToPhone(data: [String: Any]) {
    let session = WCSession.default
    
    if session.isReachable {
      session.sendMessage(data, replyHandler: nil) { error in
        print("Error sending immediate message: \(error.localizedDescription)")
        session.transferUserInfo(data)
      }
    } else {
      session.transferUserInfo(data)
    }
  }
  
    // MARK: - Receiving Data from Phone
  
  func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String : Any]) {
    DispatchQueue.main.async {
      if let billsData = applicationContext["bills"] as? [[String: Any]] {
          // String(format: ...) allows us to inject the number into the localized string
        let format = NSLocalizedString("status_synced_count", comment: "")
        self.receivedText = String(format: format, billsData.count)
      }
    }
  }
  
  func session(_ session: WCSession, didReceiveMessage message: [String : Any]) {
    DispatchQueue.main.async {
      if let text = message["text"] as? String {
        self.receivedText = text
      }
    }
  }
  
    // MARK: - WCSessionDelegate Boilerplate
  
  func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
    if let error = error {
      print("WCSession activation failed: \(error.localizedDescription)")
    } else {
      print("WCSession activated with state: \(activationState.rawValue)")
    }
  }
}
