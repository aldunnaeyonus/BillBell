import Foundation

  // The core model must match the JSON keys from React Native exactly
public struct Bill: Codable, Identifiable {
  public let id: Int
  public let creditor: String
  public let dueDate: Date
  public let amountCents: Int
  public var isPaid: Bool
  public let notes: String
  public let payment_method: String

  enum CodingKeys: String, CodingKey {
    case id, creditor, notes
    case dueDate = "due_date"
    case amountCents = "amount_cents"
    case isPaid = "is_paid"
    case payment_method = "payment_method"
  }
}

public class BillDataStore {
  static let suiteName = "group.com.billbell.shared"
  static let key = "saved_bills"
  
  public static func saveBills(_ bills: [Bill]) {
    guard let prefs = UserDefaults(suiteName: suiteName) else { return }
    
    let encoder = JSONEncoder()
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    
      // IMPORTANT: write dates as ISO strings (matches what your decoder expects)
    encoder.dateEncodingStrategy = .custom { date, enc in
      var c = enc.singleValueContainer()
      try c.encode(formatter.string(from: date))
    }
    
    if let encoded = try? encoder.encode(bills) {
      prefs.set(encoded, forKey: key)
      prefs.synchronize()
    }
  }
  
  public static func loadBills() -> [Bill] {
    guard let prefs = UserDefaults(suiteName: suiteName),
          let data = prefs.data(forKey: key) else { return [] }
    
    let decoder = JSONDecoder()
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    
      // IMPORTANT: accept both ISO string and numeric timestamp (old saved data)
    decoder.dateDecodingStrategy = .custom { dec in
      let c = try dec.singleValueContainer()
      
      if let s = try? c.decode(String.self),
         let d = formatter.date(from: s) ?? ISO8601DateFormatter().date(from: s) {
        return d
      }
      if let ts = try? c.decode(Double.self) {
        return Date(timeIntervalSince1970: ts)
      }
      return Date()
    }
    
    return (try? decoder.decode([Bill].self, from: data)) ?? []
  }
}

