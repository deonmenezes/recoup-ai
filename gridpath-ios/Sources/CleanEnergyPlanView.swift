import SwiftUI

struct CleanEnergyPlanView: View {
    let plan: CleanEnergyPlan

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            NeoSectionLabel(text: "Make your energy clean")
            Text(plan.headline)
                .font(.system(size: 19, weight: .black, design: .rounded))
                .foregroundStyle(Color.gpInk)

            scoreBar
            Text(plan.summary).font(.system(size: 13, weight: .medium))
                .foregroundStyle(Color.gpInkMuted).lineSpacing(2)

            ForEach(plan.options.sorted { $0.priority < $1.priority }) { o in
                optionCard(o)
            }
            bundleCard
        }
        .neoCard(fill: .gpCard, radius: 12, border: 3, shadow: 5)
    }

    // Theme each option's icon tile using ONLY palette colors.
    private func tileFill(for o: CleanEnergyOption) -> Color {
        switch o.icon {
        case "sun.max.fill": return .gpGold                    // solar = gold
        case "minus.plus.batteryblock.fill": return .gpSage    // battery = sage
        case "flame.fill": return .gpHeatTile                  // heat = terracotta tint
        case "powerplug.fill": return .gpSage                  // plug = sage
        default: return .gpSage
        }
    }

    private var scoreBar: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                NeoSectionLabel(text: "Clean energy score", color: .gpInkMuted)
                Spacer()
                Text("\(plan.cleanScoreBefore) → ").font(.system(size: 13, weight: .bold)).foregroundStyle(Color.gpInkMuted)
                + Text("\(plan.cleanScoreAfter)").font(.system(size: 17, weight: .black, design: .rounded)).foregroundStyle(Color.gpGreen)
            }
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 999).fill(Color.white)
                    RoundedRectangle(cornerRadius: 999).fill(Color.gpGreen)
                        .frame(width: max(0, geo.size.width * CGFloat(plan.cleanScoreAfter) / 100))
                }
                .overlay(RoundedRectangle(cornerRadius: 999).strokeBorder(Color.gpInk, lineWidth: 3))
            }
            .frame(height: 16)
        }
        .padding(12)
        .background(Color.gpSage.opacity(0.45), in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(Color.gpInk, lineWidth: 3))
    }

    private func optionCard(_ o: CleanEnergyOption) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 12) {
                NeoIconTile(systemName: o.icon, fill: tileFill(for: o), size: 42, symbolSize: 18)
                Text(o.name).font(.system(size: 16, weight: .black, design: .rounded))
                Spacer()
                if o.recommended {
                    Text("RECOMMENDED").font(.system(size: 10, weight: .black, design: .rounded))
                        .tracking(0.6).foregroundStyle(Color.gpInk)
                        .padding(.horizontal, 8).padding(.vertical, 4)
                        .background(Color.gpGold, in: RoundedRectangle(cornerRadius: 8))
                        .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color.gpInk, lineWidth: 2))
                }
            }
            Text(o.headline).font(.system(size: 13, weight: .bold))
            Text(o.whatItIs).font(.system(size: 12, weight: .medium)).foregroundStyle(Color.gpInkMuted).lineSpacing(1)
            HStack(spacing: 14) {
                stat("Cost", usd(o.estimatedCost))
                stat("Saves/yr", usd(o.annualSavings), .gpGreen)
                stat("Payback", "\(o.paybackYears) yr")
                stat("CO₂/yr", "\(o.co2ReductionTons) t")
            }
            if !o.incentives.isEmpty {
                HStack {
                    ForEach(o.incentives, id: \.self) { i in
                        Text(i).font(.system(size: 11, weight: .bold)).foregroundStyle(Color.gpInk)
                            .padding(.horizontal, 8).padding(.vertical, 4)
                            .background(Color.gpSage, in: RoundedRectangle(cornerRadius: 8))
                            .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color.gpInk, lineWidth: 2))
                    }
                }
            }
        }
        .padding(12)
        .neoSurface(fill: .white, radius: 10, border: 3, shadow: 3)
    }

    private func stat(_ k: String, _ v: String, _ color: Color = .gpInk) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(k.uppercased()).font(.system(size: 9, weight: .black, design: .rounded)).tracking(0.4).foregroundStyle(Color.gpInkMuted)
            Text(v).font(.system(size: 13, weight: .black, design: .rounded)).foregroundStyle(color)
        }
    }

    private var bundleCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            NeoSectionLabel(text: "Recommended bundle", color: .gpInk)
            Text(plan.bundleItems.joined(separator: " + ")).font(.system(size: 16, weight: .black, design: .rounded))
            HStack(spacing: 18) {
                (Text(usd(plan.bundleCost)).font(.system(size: 16, weight: .black, design: .rounded))
                 + Text(" upfront").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.gpInkMuted))
                (Text(usd(plan.bundleSavings)).font(.system(size: 16, weight: .black, design: .rounded)).foregroundStyle(Color.gpGreen)
                 + Text("/yr saved").font(.system(size: 12, weight: .semibold)).foregroundStyle(Color.gpInkMuted))
            }
            Text(plan.bundleNote).font(.system(size: 12, weight: .medium)).foregroundStyle(Color.gpInkMuted).lineSpacing(1)
        }
        .padding(14)
        .background(Color.gpGold, in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(Color.gpInk, lineWidth: 3))
        .hardShadow(3)
    }
}
