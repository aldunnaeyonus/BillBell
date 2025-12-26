import SwiftUI

struct BillDetailView: View {
  let bill: Bill
  var onMarkPaid: (Int) -> Void
  @Environment(\.presentationMode) var presentation
  
  var body: some View {
    ScrollView {
      VStack(spacing: 16) {
        Text(bill.formattedAmount)
          .font(.system(size: 34, weight: .bold, design: .rounded))
          .foregroundColor(.blue)
        
        Divider()
        
        VStack(alignment: .leading, spacing: 8) {
            // CHANGED: Localized Keys
          Text("detail_pay_to")
            .font(.caption)
            .foregroundColor(.gray)
          Text(bill.creditor)
            .font(.title3)
          
            // CHANGED: Localized Keys
          Text("detail_due_date")
            .font(.caption)
            .foregroundColor(.gray)
            .padding(.top, 4)
          Text(bill.displayDate)
            .font(.title3)
            .foregroundColor(bill.isOverdue ? .red : .primary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        
        Spacer()
        
        Button(action: {
          onMarkPaid(bill.id)
          presentation.wrappedValue.dismiss()
        }) {
            // CHANGED: Localized Key
          Text("action_mark_paid")
            .fontWeight(.semibold)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
        }
        .background(Color.green)
        .cornerRadius(25)
        .padding(.top, 10)
      }
    }
  }
}
