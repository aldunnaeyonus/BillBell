//
//  BillBellWidgetLiveActivity.swift
//  BillBellWidget
//
//  Created by Andrew Dunn on 12/22/25.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct BillBellWidgetLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: BillBellWidgetAttributes.self) { context in
        // --- LOCK SCREEN UI ---
      HStack(spacing: 0) {
          // LEFT: Overdue
        VStack {
          Text("Overdue")
            .font(.caption2)
            .fontWeight(.bold)
            .foregroundColor(.red)
            .textCase(.uppercase)
          Text(context.state.overdueTotal)
            .font(.title2)
            .fontWeight(.heavy)
            .foregroundColor(.white)
          Text("\(context.state.overdueCount) bills")
            .font(.caption)
            .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
        
        Divider().background(Color.white.opacity(0.2))
        
          // RIGHT: This Month
        VStack {
          Text("This Month")
            .font(.caption2)
            .fontWeight(.bold)
            .foregroundColor(.blue)
            .textCase(.uppercase)
          Text(context.state.monthTotal)
            .font(.title2)
            .fontWeight(.heavy)
            .foregroundColor(.white)
          Text("\(context.state.monthCount) left")
            .font(.caption)
            .foregroundColor(.gray)
        }
        .frame(maxWidth: .infinity)
      }
      .padding()
      .activityBackgroundTint(Color.black.opacity(0.85))
      
    } dynamicIsland: { context in
        // --- DYNAMIC ISLAND (Compact) ---
      DynamicIsland {
          // Expanded
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading) {
            Text("Overdue").font(.caption).foregroundColor(.red)
            Text(context.state.overdueTotal).font(.title2).fontWeight(.bold)
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          VStack(alignment: .trailing) {
            Text("Month").font(.caption).foregroundColor(.blue)
            Text(context.state.monthTotal).font(.title2).fontWeight(.bold)
          }
        }
      } compactLeading: {
        Text(context.state.overdueTotal).foregroundColor(.red).fontWeight(.bold)
      } compactTrailing: {
        Text(context.state.monthTotal).foregroundColor(.blue)
      } minimal: {
        Text("!") .foregroundColor(.red)
      }
    }
  }
}
