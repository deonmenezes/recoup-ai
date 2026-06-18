import SwiftUI

struct CleanEnergyPlanView: View {
    let plan: CleanEnergyPlan

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Make your energy clean").font(.subheadline.bold())
            Text(plan.headline).font(.gpSerif(18, weight: .semibold)).foregroundStyle(Color.gpInk)

            scoreBar
            Text(plan.summary).font(.footnote).foregroundStyle(Color.gpInkMuted).lineSpacing(2)

            ForEach(plan.options.sorted { $0.priority < $1.priority }) { o in
                optionCard(o)
            }
            bundleCard
        }
        .padding(16)
        .background(Color.gpPanel, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(Color.gpLine))
    }

    private var scoreBar: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Clean energy score").font(.caption).foregroundStyle(Color.gpInkMuted)
                Spacer()
                Text("\(plan.cleanScoreBefore) → ").font(.caption).foregroundStyle(Color.gpInkMuted)
                + Text("\(plan.cleanScoreAfter)").font(.callout.bold()).foregroundStyle(Color.gpForest)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.gpMuted)
                    Capsule().fill(Color.gpSage)
                        .frame(width: geo.size.width * CGFloat(plan.cleanScoreBefore) / 100)
                    Capsule().fill(LinearGradient(colors: [.gpForest, .gpSage], startPoint: .leading, endPoint: .trailing))
                        .frame(width: geo.size.width * CGFloat(plan.cleanScoreAfter) / 100)
                        .opacity(0.0)
                    Capsule().fill(Color.gpForest)
                        .frame(width: geo.size.width * CGFloat(plan.cleanScoreAfter) / 100)
                }
            }
            .frame(height: 10)
        }
        .padding(12)
        .background(Color.gpMuted, in: RoundedRectangle(cornerRadius: 12))
    }

    private func optionCard(_ o: CleanEnergyOption) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(o.icon)
                Text(o.name).font(.subheadline.bold())
                Spacer()
                if o.recommended {
                    Text("Recommended").font(.caption2.bold()).foregroundStyle(Color.gpForest)
                        .padding(.horizontal, 8).padding(.vertical, 3)
                        .background(Color.gpSageSoft, in: Capsule())
                }
            }
            Text(o.headline).font(.footnote.weight(.semibold))
            Text(o.whatItIs).font(.caption).foregroundStyle(Color.gpInkMuted).lineSpacing(1)
            HStack(spacing: 14) {
                stat("Cost", usd(o.estimatedCost))
                stat("Saves/yr", usd(o.annualSavings), .gpForest)
                stat("Payback", "\(o.paybackYears) yr")
                stat("CO₂/yr", "\(o.co2ReductionTons) t")
            }
            if !o.incentives.isEmpty {
                HStack {
                    ForEach(o.incentives, id: \.self) { i in
                        Text(i).font(.caption2).foregroundStyle(Color.gpInkMuted)
                            .padding(.horizontal, 8).padding(.vertical, 3)
                            .background(Color.gpMuted, in: Capsule())
                    }
                }
            }
        }
        .padding(12)
        .background(o.recommended ? Color.gpSageSoft.opacity(0.4) : Color.gpMuted, in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12)
            .strokeBorder(o.recommended ? Color.gpForest.opacity(0.5) : Color.clear, lineWidth: 1.5))
    }

    private func stat(_ k: String, _ v: String, _ color: Color = .gpInk) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(k).font(.system(size: 9, weight: .bold)).foregroundStyle(Color.gpInkMuted)
            Text(v).font(.footnote.bold()).foregroundStyle(color)
        }
    }

    private var bundleCard: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("RECOMMENDED BUNDLE").font(.caption2.bold()).foregroundStyle(Color.gpForest)
            Text(plan.bundleItems.joined(separator: " + ")).font(.subheadline.bold())
            HStack(spacing: 18) {
                Text(usd(plan.bundleCost)) + Text(" upfront").font(.caption).foregroundStyle(Color.gpInkMuted)
                (Text(usd(plan.bundleSavings)).foregroundStyle(Color.gpForest) + Text("/yr saved").font(.caption).foregroundStyle(Color.gpInkMuted))
            }
            .font(.callout.bold())
            Text(plan.bundleNote).font(.caption).foregroundStyle(Color.gpInkMuted).lineSpacing(1)
        }
        .padding(14)
        .background(Color.gpSageSoft, in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color.gpForest.opacity(0.5), lineWidth: 1.5))
    }
}
