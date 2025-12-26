import SwiftUI

struct ContentView: View {
  @StateObject var connectivity = ConnectivityProvider()
  @State var bills: [Bill] = [] // Empty by default until sync
  
  var body: some View {
    NavigationView {
      List {
        if bills.isEmpty {
            // CHANGED: Localized Key
          Text("list_empty")
            .padding()
        } else {
            // CHANGED: Localized Key
          Section(header: Text("list_section_upcoming")) {
            ForEach(bills) { bill in
              NavigationLink(destination: BillDetailView(bill: bill, onMarkPaid: markPaid)) {
                BillRow(bill: bill)
              }
            }
          }
        }
      }
      .navigationTitle("BillBell")
    }
    .onAppear { connectivity.connect() }
  }
  
  func markPaid(id: Int) {
    withAnimation { bills.removeAll { $0.id == id } }
    connectivity.sendToPhone(data: ["action": "markPaid", "id": id])
  }
}
