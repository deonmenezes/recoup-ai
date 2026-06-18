import Foundation

// On-device clean-energy advisor — a transparent, deterministic plan derived
// from regional averages. (The web app additionally enriches this with the
// Google Solar API + Claude; the iOS app runs fully offline.)

enum CleanEnergy {
    // Reasonable U.S. reference figures (illustrative).
    private static let utilityRate = 0.21        // $/kWh
    private static let sunHoursPerYear = 1650.0   // peak sun hours
    private static let annualUsageKwh = 10_500.0
    private static let gridCarbonKgPerKwh = 0.37  // US grid avg
    private static let installPerWatt = 3.1
    private static let panelWatts = 400.0
    private static let maxPanels = 22.0
    private static let itc = 0.30

    static func plan(for address: String) -> CleanEnergyPlan {
        let systemKw = maxPanels * panelWatts / 1000
        let solarKwh = systemKw * sunHoursPerYear * 0.85
        let annualBill = annualUsageKwh * utilityRate

        let solarGross = systemKw * 1000 * installPerWatt
        let solarNet = round(solarGross * (1 - itc), 100)
        let solarOffset = min(solarKwh, annualUsageKwh)
        let solarSavings = round(solarOffset * utilityRate, 10)
        let solarCo2 = (solarOffset * gridCarbonKgPerKwh / 1000).rounded(toPlaces: 1)
        let offsetPct = Int((solarOffset / annualUsageKwh) * 100)

        let batteryNet = round(13_500 * (1 - itc), 100)
        let heatPumpNet = round(16_000 - 3_000, 100)
        let evNet = round(1_600 - 500, 50)

        let options: [CleanEnergyOption] = [
            .init(icon: "sun.max.fill", name: "Rooftop Solar", recommended: true,
                  headline: "\(String(format: "%.1f", systemKw)) kW system offsets ~\(offsetPct)% of your power",
                  whatItIs: "About \(Int(maxPanels)) panels producing ~\(Int(round(solarKwh, 100)).formatted()) kWh/yr.",
                  estimatedCost: solarNet, annualSavings: solarSavings,
                  paybackYears: (solarNet / max(solarSavings, 1)).rounded(toPlaces: 1),
                  co2ReductionTons: solarCo2,
                  incentives: ["30% federal ITC", "Net metering"], priority: 1),
            .init(icon: "minus.plus.batteryblock.fill", name: "Home Battery", recommended: true,
                  headline: "Store daytime solar, ride through outages",
                  whatItIs: "A ~13.5 kWh battery shifts solar into the evening peak and backs up outages.",
                  estimatedCost: batteryNet, annualSavings: 650,
                  paybackYears: (batteryNet / 650).rounded(toPlaces: 1), co2ReductionTons: 0.4,
                  incentives: ["30% federal ITC", "State storage rebates"], priority: 2),
            .init(icon: "flame.fill", name: "Heat Pump", recommended: true,
                  headline: "Replace gas/propane heating + hot water",
                  whatItIs: "A high-efficiency heat pump for space and water heating — the biggest fossil load.",
                  estimatedCost: heatPumpNet, annualSavings: 900,
                  paybackYears: (heatPumpNet / 900).rounded(toPlaces: 1), co2ReductionTons: 2.1,
                  incentives: ["25C tax credit", "Electrification rebates"], priority: 3),
            .init(icon: "powerplug.fill", name: "EV Charger", recommended: false,
                  headline: "Level 2 home charging, fueled by your solar",
                  whatItIs: "A 240V charger so an EV runs on rooftop solar instead of gasoline.",
                  estimatedCost: evNet, annualSavings: 1200,
                  paybackYears: (evNet / 1200).rounded(toPlaces: 1), co2ReductionTons: 2.4,
                  incentives: ["Utility rebate", "Federal 30C credit"], priority: 4),
        ]

        let bundle = options.filter { $0.recommended }
        let bundleCost = bundle.reduce(0) { $0 + $1.estimatedCost }
        let bundleSavings = bundle.reduce(0) { $0 + $1.annualSavings }
        let totalCo2 = options.reduce(0) { $0 + $1.co2ReductionTons }
        let scoreBefore = 14
        let scoreAfter = min(96, Int((solarOffset / annualUsageKwh) * 70) + 26)

        return CleanEnergyPlan(
            headline: "You could cut ~\(String(format: "%.1f", totalCo2)) tons of CO₂ a year and save \(usd(bundleSavings))/yr.",
            summary: "From a clean-energy score of \(scoreBefore), pairing rooftop solar with a battery and electrifying heating gets this property to roughly \(scoreAfter)/100 — most of your energy carbon-free, with backup power through outages.",
            cleanScoreBefore: scoreBefore, cleanScoreAfter: scoreAfter, options: options,
            bundleItems: bundle.map { $0.name }, bundleCost: bundleCost, bundleSavings: bundleSavings,
            bundleNote: "After the 30% federal tax credit and state rebates. Start with solar + battery, then electrify heating."
        )
    }
}

private func round(_ n: Double, _ step: Double) -> Double { (n / step).rounded() * step }
extension Double {
    func rounded(toPlaces p: Int) -> Double {
        let m = pow(10.0, Double(p)); return (self * m).rounded() / m
    }
}
