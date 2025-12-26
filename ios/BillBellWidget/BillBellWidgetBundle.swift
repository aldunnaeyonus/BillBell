//
//  BillBellWidgetBundle.swift
//  BillBellWidget
//
//  Created by Andrew Dunn on 12/26/25.
//

import WidgetKit
import SwiftUI

@main
struct BillBellWidgetBundle: WidgetBundle {
    var body: some Widget {
        BillBellWidget()
        BillBellWidgetLiveActivity()
    }
}
