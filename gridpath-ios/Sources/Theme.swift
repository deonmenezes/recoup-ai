import SwiftUI

// GridPath brand palette — cream, forest green, gold.
extension Color {
    static let gpCream = Color(red: 0.957, green: 0.945, blue: 0.918)   // #F4F1EA
    static let gpPanel = Color(red: 0.984, green: 0.980, blue: 0.957)   // #FBFAF4
    static let gpMuted = Color(red: 0.925, green: 0.906, blue: 0.859)   // #ECE7DB
    static let gpInk = Color(red: 0.165, green: 0.165, blue: 0.149)     // #2A2A26
    static let gpInkMuted = Color(red: 0.435, green: 0.424, blue: 0.376) // #6F6C60
    static let gpForest = Color(red: 0.184, green: 0.290, blue: 0.235)  // #2F4A3C
    static let gpForestDark = Color(red: 0.137, green: 0.227, blue: 0.180) // #233A2E
    static let gpSage = Color(red: 0.541, green: 0.659, blue: 0.576)    // #8AA893
    static let gpSageSoft = Color(red: 0.867, green: 0.906, blue: 0.867) // #DDE7DD
    static let gpGold = Color(red: 0.878, green: 0.659, blue: 0.180)    // #E0A82E
    static let gpTerracotta = Color(red: 0.761, green: 0.439, blue: 0.294) // #C2704B
    static let gpLine = Color(red: 0.867, green: 0.839, blue: 0.773)    // #DDD6C5
}

extension Font {
    // Use a serif display face for the brand + headlines (matches the web Fraunces vibe).
    static func gpSerif(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        .system(size: size, weight: weight, design: .serif)
    }
}
