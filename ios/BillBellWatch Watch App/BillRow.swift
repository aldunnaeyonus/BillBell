import SwiftUI

struct BillRow: View {
  let bill: Bill
  
  var body: some View {
    HStack {
      Circle()
        .fill(bill.isOverdue ? Color.red : Color.blue)
        .frame(width: 10, height: 10)
      
      VStack(alignment: .leading) {
        Text(bill.creditor)
          .font(.headline)
          .lineLimit(1)
        
          // CHANGED: Uses localized format string "Due %@"
        Text("row_due \(bill.displayDate)")
          .font(.caption)
          .foregroundColor(bill.isOverdue ? .red : .gray)
      }
      
      Spacer()
      
      Text(bill.formattedAmount)
        .font(.system(.body, design: .rounded))
        .fontWeight(.bold)
    }
    .padding(.vertical, 4)
  }
}
