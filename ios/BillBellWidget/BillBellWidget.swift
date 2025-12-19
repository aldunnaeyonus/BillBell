import WidgetKit
import SwiftUI
import AppIntents

  // --- UI EXTENSIONS ---
extension Color {
  init(hex: String) {
    let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
    var int: UInt64 = 0
    Scanner(string: hex).scanHexInt64(&int)
    let a, r, g, b: UInt64
    switch hex.count {
      case 6: (a, r, g, b) = (255, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
      case 8: (a, r, g, b) = ((int >> 24) & 0xFF, (int >> 16) & 0xFF, (int >> 8) & 0xFF, int & 0xFF)
      default: (a, r, g, b) = (255, 0, 0, 0)
    }
    self.init(.sRGB, red: Double(r) / 255, green: Double(g) / 255, blue: Double(b) / 255, opacity: Double(a) / 255)
  }
}

  // --- 1. THE TIMELINE PROVIDER ---
struct Provider: TimelineProvider {
  fileprivate static func createEntry(for date: Date) -> SimpleEntry {
    let allBills = BillDataStore.loadBills()
    let unpaidBills = allBills.filter { !$0.isPaid }
    
    let calendar = Calendar.current
    let todayStart = calendar.startOfDay(for: date)
    let overdueBills = unpaidBills.filter { $0.dueDate < todayStart }
    
    let nextBill = unpaidBills
      .filter { $0.dueDate >= todayStart }
      .sorted { $0.dueDate < $1.dueDate }
      .first
    
    return SimpleEntry(
      date: date,
      overdueCount: allBills.isEmpty ? -1 : overdueBills.count,
      nextBillName: nextBill?.creditor ?? "None",
      nextBillDueDate: nextBill?.dueDate ?? date,
      nextBillID: nextBill != nil ? String(nextBill!.id) : "",
      lastUpdated: Date(),
      payment_method: nextBill?.payment_method ?? "manual"
    )
  }
  
  func placeholder(in context: Context) -> SimpleEntry { Provider.createEntry(for: Date()) }
  func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> ()) { completion(Provider.createEntry(for: Date())) }
  func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
    let entry = Provider.createEntry(for: Date())
    let refreshDate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
    completion(Timeline(entries: [entry], policy: .after(refreshDate)))
  }
}

  // --- 2. THE ENTRY MODEL ---
struct SimpleEntry: TimelineEntry {
  let date: Date
  let overdueCount: Int
  let nextBillName: String
  let nextBillDueDate: Date
  let nextBillID: String
  let lastUpdated: Date
  let payment_method: String
}

  // --- 3. THE MAIN VIEW ---
struct BillBellWidgetEntryView : View {
  var entry: Provider.Entry
  @Environment(\.widgetFamily) var family
  @Environment(\.colorScheme) private var scheme

  var body: some View {
    Group {
      if entry.overdueCount == -1 {
        VStack(spacing: 8) {
          Image(systemName: "bell.slash").font(.title2).foregroundColor(.secondary)
          Text(LocalizedStringKey("no_data")).font(.caption).bold()
          Text(LocalizedStringKey("sync_prompt")).font(.system(size: 10)).foregroundColor(.teal)
        }
      } else {
        switch family {
          case .systemSmall: SmallWidgetView(entry: entry)
          case .systemMedium: MediumWidgetView(entry: entry)
          default: Text("Unsupported")
        }
      }
    }
    .containerBackground(scheme == .dark ? Color(hex: "#0E1626") : Color.white, for: .widget)
  }
}

  // --- 4. SPECIALIZED UI COMPONENTS ---

struct SmallWidgetView: View {
  var entry: SimpleEntry
  @Environment(\.colorScheme) private var scheme
  
  private let navy = Color(hex: "#0B1F3B")
  private let mint = Color(hex: "#71E3C3")
  private let danger = Color(hex: "#B00020")
  
  private var isAlert: Bool { entry.overdueCount > 0 }
  
  var body: some View {
    VStack(spacing: 12) {
      HStack(spacing: 8) {
        Image(systemName: isAlert ? "exclamationmark.triangle.fill" : "checkmark.seal.fill")
          .symbolRenderingMode(.palette)
          .foregroundStyle(isAlert ? danger : navy, mint)
        
        Text("BillBell")
          .font(.system(size: 14, weight: .bold))
      }
      
      ZStack {
        Circle().stroke(Color.secondary.opacity(0.18), lineWidth: 8)
        Circle()
          .trim(from: 0, to: min(1, CGFloat(max(entry.overdueCount, 0)) / 6.0))
          .stroke((isAlert ? danger : mint), style: StrokeStyle(lineWidth: 8, lineCap: .round))
          .rotationEffect(.degrees(-90))
        
        VStack(spacing: 2) {
          Text("\(max(entry.overdueCount, 0))")
            .font(.system(size: 26, weight: .heavy))
          Text(LocalizedStringKey("overdue_label"))
            .font(.system(size: 10, weight: .semibold))
        }
      }
      .frame(width: 90, height: 90)
      
      Text("updated_at \(entry.lastUpdated, style: .time)")
        .font(.system(size: 9))
    }
      // ✅ internal padding (breathing room)
    .padding(.horizontal, 14)
    .padding(.vertical, 12)
      // ✅ card styling
    .background(.clear)
    .cornerRadius(18)
      // ✅ remove outer padding so card can expand
    .padding(0)
  }
}

struct MediumWidgetView: View {
  var entry: SimpleEntry
  @Environment(\.colorScheme) private var scheme
  
  private let mint = Color(hex: "#71E3C3")
  private let navy = Color(hex: "#0B1F3B")
  private let danger = Color(hex: "#B00020")
  
  private var isAlert: Bool { entry.overdueCount > 0 }
  
  var body: some View {
    HStack(spacing: 0) {
      
        // LEFT
      VStack(alignment: .leading, spacing: 10) {
        HStack(spacing: 8) {
          Image(systemName: isAlert ? "exclamationmark.triangle.fill" : "checkmark.seal.fill")
            .foregroundStyle(isAlert ? danger : navy, mint)
          Text(LocalizedStringKey(isAlert ? "needs_attention" : "all_clear"))
            .font(.system(size: 14, weight: .bold))
        }
        
        Text("\(max(entry.overdueCount, 0))")
          .font(.system(size: 40, weight: .heavy))
        
        Text(LocalizedStringKey(isAlert ? "overdue_bills" : "nothing_overdue"))
          .font(.caption)
        
        Spacer()
        
        Text("updated_at \(entry.lastUpdated, style: .time)")
          .font(.system(size: 9))
      }
      .padding(.horizontal, 14)
      .padding(.vertical, 12)
      .frame(maxWidth: .infinity, alignment: .leading)
      
      Divider().padding(.vertical, 12)
      
        // RIGHT
      VStack(alignment: .leading, spacing: 10) {
        Text(LocalizedStringKey("next_bill"))
          .font(.caption)
          .bold()
        
        if !entry.nextBillID.isEmpty {
          Text(entry.nextBillName)
            .font(.headline)
            .lineLimit(1)
          
          Text(LocalizedStringKey(entry.payment_method == "auto" ? "auto_draft" : "manual_pay"))
            .font(.caption2)
            .bold()
          
          Text(entry.nextBillDueDate, style: .date)
            .font(.caption)
            .foregroundColor(.secondary)
          
          Spacer()
          
          Button(intent: MarkBillPaidIntent(billID: entry.nextBillID)) {
            Label(LocalizedStringKey("mark_paid"), systemImage: "checkmark.circle.fill")
          }
          .buttonStyle(.borderedProminent)
          .tint(mint)
          .foregroundStyle(navy)
          .font(.caption)
        } else {
          Text(LocalizedStringKey("no_upcoming"))
            .font(.caption2)
        }
      }
      .padding(.horizontal, 14)
      .padding(.vertical, 12)
      .frame(maxWidth: .infinity, alignment: .leading)
    }
      // ✅ Removed outer .padding() so the card can expand left/right
    .background(.clear)
    .cornerRadius(18)
  }
}

  // --- 5. CONFIGURATION ---
struct BillBellWidget: Widget {
  let kind: String = "BillBellWidget"
  
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: Provider()) { entry in
      BillBellWidgetEntryView(entry: entry)
    }
    .configurationDisplayName(LocalizedStringKey("widget_title"))
    .description(LocalizedStringKey("widget_description"))
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
