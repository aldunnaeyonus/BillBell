import ActivityKit
import Foundation

public struct BillBellWidgetAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
      // New Summary Data
    public var overdueTotal: String
    public var overdueCount: Int
    public var monthTotal: String // This month's remaining bills
    public var monthCount: Int
    
    public init(overdueTotal: String, overdueCount: Int, monthTotal: String, monthCount: Int) {
      self.overdueTotal = overdueTotal
      self.overdueCount = overdueCount
      self.monthTotal = monthTotal
      self.monthCount = monthCount
    }
  }
  
  public var billId: String // Keep this to track the specific activity instance
  public init(billId: String) {
    self.billId = billId
  }
}
