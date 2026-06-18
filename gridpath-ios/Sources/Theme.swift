import SwiftUI

// GridPath "Bold" — softer neobrutalist palette: bold structure, calm green + cream + gold trio.
extension Color {
    // Core neobrutalist palette (exact spec hex).
    static let gpInk        = Color(red: 0.078, green: 0.078, blue: 0.078) // #141414 ink / borders / text
    static let gpPaper      = Color(red: 0.945, green: 0.914, blue: 0.839) // #F1E9D6 page background
    static let gpCard       = Color(red: 0.988, green: 0.984, blue: 0.961) // #FCFBF5 card / surface
    static let gpGreen      = Color(red: 0.118, green: 0.478, blue: 0.302) // #1E7A4D primary green
    static let gpForest     = Color(red: 0.129, green: 0.251, blue: 0.184) // #21402F deep forest
    static let gpSage       = Color(red: 0.812, green: 0.878, blue: 0.808) // #CFE0CE sage soft
    static let gpGold       = Color(red: 0.961, green: 0.773, blue: 0.094) // #F5C518 gold accent
    static let gpTerracotta = Color(red: 0.761, green: 0.337, blue: 0.184) // #C2562F errors / strikethrough
    static let gpInkMuted   = Color(red: 0.431, green: 0.416, blue: 0.361) // #6E6A5C muted text
    static let gpHeatTile   = Color(red: 0.910, green: 0.725, blue: 0.651) // #E8B9A6 heat tile tint

    // Aliases for legacy names referenced elsewhere — mapped to the new palette.
    static let gpCream     = gpPaper
    static let gpPanel     = gpCard
    static let gpMuted     = gpSage
    static let gpForestDark = gpForest
    static let gpSageSoft  = gpSage
    static let gpLine      = gpInk
}

extension Font {
    // Heavy geometric grotesque feel — system rounded at heavy/black for headings/wordmark.
    static func gpDisplay(_ size: CGFloat, weight: Font.Weight = .heavy) -> Font {
        .system(size: size, weight: weight, design: .rounded)
    }
    // Legacy alias (was a serif display face) — now maps to the bold rounded display.
    static func gpSerif(_ size: CGFloat, weight: Font.Weight = .heavy) -> Font {
        .system(size: size, weight: weight, design: .rounded)
    }
}

// MARK: - Hard offset shadow + neobrutalist card

extension View {
    /// Hard offset shadow (radius 0 = no blur).
    func hardShadow(_ offset: CGFloat = 5) -> some View {
        shadow(color: .gpInk, radius: 0, x: offset, y: offset)
    }

    /// Neobrutalist card: flat warm surface, thick black border, hard offset shadow.
    func neoCard(fill: Color = .gpCard, radius: CGFloat = 12, border: CGFloat = 3,
                 shadow: CGFloat = 5, padding: CGFloat = 16) -> some View {
        modifier(NeoCard(fill: fill, radius: radius, border: border, shadow: shadow, padding: padding))
    }

    /// Same border + hard shadow surface without forcing internal padding.
    func neoSurface(fill: Color = .gpCard, radius: CGFloat = 12, border: CGFloat = 3,
                    shadow: CGFloat = 5) -> some View {
        modifier(NeoSurface(fill: fill, radius: radius, border: border, shadow: shadow))
    }
}

struct NeoCard: ViewModifier {
    var fill: Color = .gpCard
    var radius: CGFloat = 12
    var border: CGFloat = 3
    var shadow: CGFloat = 5
    var padding: CGFloat = 16
    func body(content: Content) -> some View {
        content
            .padding(padding)
            .background(fill, in: RoundedRectangle(cornerRadius: radius))
            .overlay(RoundedRectangle(cornerRadius: radius).strokeBorder(Color.gpInk, lineWidth: border))
            .hardShadow(shadow)
    }
}

struct NeoSurface: ViewModifier {
    var fill: Color = .gpCard
    var radius: CGFloat = 12
    var border: CGFloat = 3
    var shadow: CGFloat = 5
    func body(content: Content) -> some View {
        content
            .background(fill, in: RoundedRectangle(cornerRadius: radius))
            .overlay(RoundedRectangle(cornerRadius: radius).strokeBorder(Color.gpInk, lineWidth: border))
            .hardShadow(shadow)
    }
}

// MARK: - Neobrutalist icon tile

struct NeoIconTile: View {
    let systemName: String
    var fill: Color = .gpGold
    var size: CGFloat = 42
    var symbolSize: CGFloat = 18
    var radius: CGFloat = 8

    var body: some View {
        Image(systemName: systemName)
            .font(.system(size: symbolSize, weight: .heavy))
            .foregroundStyle(Color.gpInk)
            .frame(width: size, height: size)
            .background(fill, in: RoundedRectangle(cornerRadius: radius))
            .overlay(RoundedRectangle(cornerRadius: radius).strokeBorder(Color.gpInk, lineWidth: 3))
    }
}

// MARK: - Neobrutalist button style (press = offset in, shadow shrinks)

struct NeoButtonStyle: ButtonStyle {
    var fill: Color = .gpGreen
    var textColor: Color = .white
    var radius: CGFloat = 12
    var shadow: CGFloat = 5

    func makeBody(configuration: Configuration) -> some View {
        let pressed = configuration.isPressed
        let off: CGFloat = pressed ? min(shadow - 1, 2) : shadow
        return configuration.label
            .font(.system(size: 16, weight: .heavy, design: .rounded))
            .foregroundStyle(textColor)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 15)
            .padding(.horizontal, 16)
            .background(fill, in: RoundedRectangle(cornerRadius: radius))
            .overlay(RoundedRectangle(cornerRadius: radius).strokeBorder(Color.gpInk, lineWidth: 3))
            .shadow(color: .gpInk, radius: 0, x: off, y: off)
            .offset(x: pressed ? (shadow - off) : 0, y: pressed ? (shadow - off) : 0)
            .animation(.easeOut(duration: 0.08), value: pressed)
    }
}

// MARK: - UPPERCASE section label

struct NeoSectionLabel: View {
    let text: String
    var color: Color = .gpInk
    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 13, weight: .black, design: .rounded))
            .tracking(1.2)
            .foregroundStyle(color)
    }
}
