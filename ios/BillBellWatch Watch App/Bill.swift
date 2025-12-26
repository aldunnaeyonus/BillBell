import Foundation

struct Bill: Identifiable, Codable {
  let id: Int
  let creditor: String
  let amount_cents: Int
  let due_date: String // ISO String YYYY-MM-DD
  let status: String   // "active", "paid"
  
    // Helper to format currency
  var formattedAmount: String {
    let amount = Double(amount_cents) / 100.0
    let formatter = NumberFormatter()
    formatter.numberStyle = .currency
    formatter.currencySymbol = "$"
    return formatter.string(from: NSNumber(value: amount)) ?? "$0.00"
  }
  
    // Helper to check overdue status
  var isOverdue: Bool {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withFullDate, .withDashSeparatorInDate]
    guard let due = formatter.date(from: due_date) else { return false }
    return due < Date() && status == "active"
  }
  
    // Helper for display date
  var displayDate: String {
    let isoFormatter = ISO8601DateFormatter()
    isoFormatter.formatOptions = [.withFullDate, .withDashSeparatorInDate]
    guard let date = isoFormatter.date(from: due_date) else { return due_date }
    
    let displayFormatter = DateFormatter()
    displayFormatter.dateFormat = "MMM d"
    return displayFormatter.string(from: date)
  }
}
