import Foundation

  // --- File: BillDataStore.swift ---
  // CHECK TARGET MEMBERSHIP FOR BOTH APP AND WIDGET

struct BillDataStore {
    // MUST match your Apple Developer Portal / Xcode Capabilities App Group ID
  private static let suiteName = "group.com.billbell.shared"
  private static let storageKey = "saved_bills_data"
  
  static func saveBills(_ bills: [Bill]) {
    let encoder = JSONEncoder()
    encoder.dateEncodingStrategy = .iso8601
    
    guard let sharedDefaults = UserDefaults(suiteName: suiteName) else {
      print("DEBUG: FAILED TO ACCESS APP GROUP: \(suiteName)")
      return
    }
    
    if let encoded = try? encoder.encode(bills) {
      sharedDefaults.set(encoded, forKey: storageKey)
      sharedDefaults.synchronize()
    }
  }
  
  static func loadBills() -> [Bill] {
    guard let sharedDefaults = UserDefaults(suiteName: suiteName),
          let data = sharedDefaults.data(forKey: storageKey) else {
      return []
    }
    
    let decoder = JSONDecoder()
    decoder.dateDecodingStrategy = .iso8601
    return (try? decoder.decode([Bill].self, from: data)) ?? []
  }
}
