//
//  BillBellWidgetLiveActivity.swift
//  BillBellWidget
//
//  Created by Andrew Dunn on 12/22/25.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct BillBellWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct BillBellWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: BillBellWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension BillBellWidgetAttributes {
    fileprivate static var preview: BillBellWidgetAttributes {
        BillBellWidgetAttributes(name: "World")
    }
}

extension BillBellWidgetAttributes.ContentState {
    fileprivate static var smiley: BillBellWidgetAttributes.ContentState {
        BillBellWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: BillBellWidgetAttributes.ContentState {
         BillBellWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: BillBellWidgetAttributes.preview) {
   BillBellWidgetLiveActivity()
} contentStates: {
    BillBellWidgetAttributes.ContentState.smiley
    BillBellWidgetAttributes.ContentState.starEyes
}
