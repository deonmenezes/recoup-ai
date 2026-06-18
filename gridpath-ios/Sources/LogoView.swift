import SwiftUI

// GridPath logo mark — neobrutalist: a chunky bordered tile holding a bold
// energy bolt over a grid, in flat green + gold with thick black outlines.
struct LogoMark: View {
    var size: CGFloat = 40
    var body: some View {
        Canvas { ctx, rect in
            let s = rect.width / 64
            func P(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: x * s, y: y * s) }

            // Flat green tile body.
            let tile = CGRect(x: 3 * s, y: 3 * s, width: 58 * s, height: 58 * s)
            let tilePath = Path(roundedRect: tile, cornerRadius: 12 * s)
            ctx.fill(tilePath, with: .color(.gpGreen))

            // Thin grid lines (cream) — the "grid".
            var grid = Path()
            for gx in stride(from: 16, through: 48, by: 16) {
                grid.move(to: P(CGFloat(gx), 8)); grid.addLine(to: P(CGFloat(gx), 56))
            }
            for gy in stride(from: 16, through: 48, by: 16) {
                grid.move(to: P(8, CGFloat(gy))); grid.addLine(to: P(56, CGFloat(gy)))
            }
            ctx.stroke(grid, with: .color(.gpCard.opacity(0.30)),
                       style: StrokeStyle(lineWidth: 1.4 * s, lineCap: .round))

            // Bold lightning bolt — flat gold fill, thick black outline.
            var bolt = Path()
            bolt.move(to: P(36, 8))
            bolt.addLine(to: P(20, 36))
            bolt.addLine(to: P(30, 36))
            bolt.addLine(to: P(26, 56))
            bolt.addLine(to: P(46, 26))
            bolt.addLine(to: P(34, 26))
            bolt.closeSubpath()
            ctx.fill(bolt, with: .color(.gpGold))
            ctx.stroke(bolt, with: .color(.gpInk),
                       style: StrokeStyle(lineWidth: 3 * s, lineCap: .round, lineJoin: .round))

            // Thick black tile border on top.
            ctx.stroke(tilePath, with: .color(.gpInk), lineWidth: 3.2 * s)
        }
        .frame(width: size, height: size)
        // Hard offset shadow on the mark itself.
        .shadow(color: .gpInk, radius: 0, x: size * 0.07, y: size * 0.07)
    }
}

struct LogoFull: View {
    var size: CGFloat = 40
    var tagline = true
    var body: some View {
        HStack(spacing: 11) {
            LogoMark(size: size)
            VStack(alignment: .leading, spacing: 1) {
                Text("GridPath")
                    .font(.gpDisplay(size * 0.66, weight: .black))
                    .foregroundStyle(Color.gpInk)
                if tagline {
                    Text("The fastest way to get clean energy.")
                        .font(.system(size: size * 0.3, weight: .semibold, design: .rounded))
                        .foregroundStyle(Color.gpInkMuted)
                }
            }
        }
    }
}
