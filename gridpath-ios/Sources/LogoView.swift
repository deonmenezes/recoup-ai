import SwiftUI

// GridPath logo mark — foliage + winding grid path + a blooming flower.
struct LogoMark: View {
    var size: CGFloat = 40
    var body: some View {
        Canvas { ctx, rect in
            let s = rect.width / 64
            func P(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: x * s, y: y * s) }

            // soft sage backdrop
            var bg = Path()
            bg.addEllipse(in: CGRect(x: 9 * s, y: 13 * s, width: 46 * s, height: 42 * s))
            ctx.fill(bg, with: .color(.gpSageSoft))

            // foliage
            var f1 = Path()
            f1.move(to: P(12, 41))
            f1.addQuadCurve(to: P(31, 24), control: P(16, 24))
            f1.addQuadCurve(to: P(28, 44), control: P(26, 34))
            f1.addQuadCurve(to: P(12, 41), control: P(18, 46))
            ctx.fill(f1, with: .color(.gpForest))

            var f2 = Path()
            f2.move(to: P(30, 45))
            f2.addQuadCurve(to: P(52, 29), control: P(36, 26))
            f2.addQuadCurve(to: P(49, 51), control: P(46, 40))
            f2.addQuadCurve(to: P(30, 45), control: P(38, 51))
            ctx.fill(f2, with: .color(Color(red: 0.275, green: 0.404, blue: 0.310)))

            // winding path
            var path = Path()
            path.move(to: P(15, 51))
            path.addCurve(to: P(52, 31), control1: P(28, 45), control2: P(40, 37))
            ctx.stroke(path, with: .color(.gpCream), style: StrokeStyle(lineWidth: 3.2 * s, lineCap: .round))

            // flower
            let center = P(44, 17)
            for i in 0..<5 {
                let angle = Double(i) * 72 * .pi / 180
                var petal = Path()
                let r: CGFloat = 6.4 * s
                let px = center.x + CGFloat(sin(angle)) * r * 0.0
                _ = px
                petal.addEllipse(in: CGRect(x: -3.3 * s, y: -12.8 * s, width: 6.6 * s, height: 12.8 * s))
                var t = CGAffineTransform(translationX: center.x, y: center.y)
                t = t.rotated(by: angle)
                ctx.fill(petal.applying(t), with: .color(.gpPanel))
            }
            var core = Path()
            core.addEllipse(in: CGRect(x: center.x - 3.4 * s, y: center.y - 3.4 * s, width: 6.8 * s, height: 6.8 * s))
            ctx.fill(core, with: .color(.gpGold))
        }
        .frame(width: size, height: size)
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
                    .font(.gpSerif(size * 0.62, weight: .semibold))
                    .foregroundStyle(Color.gpForest)
                if tagline {
                    Text("The fastest way to get clean energy.")
                        .font(.gpSerif(size * 0.3).italic())
                        .foregroundStyle(Color.gpInkMuted)
                }
            }
        }
    }
}
