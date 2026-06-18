import Foundation

// Grants & offer model — mirrors the web app's grants.ts exactly.
// Takes the gross connection cost (the "offer") and stacks (illustrative)
// government grants to reach a much cheaper net cost. Deterministic.

enum Grants {
    private static func round10(_ n: Double) -> Double { (n / 10).rounded() * 10 }

    static func offer(gross: Double, propertyType: String = "new_build", wireScenario: WireScenario) -> GrantOffer {
        var grants: [Grant] = [
            Grant(name: "USDA REAP Grant",
                  authority: "USDA Rural Energy for America",
                  detail: "Covers up to 40% of rural energy connection costs.",
                  amount: round10(min(gross * 0.40, 40000))),
            Grant(name: "Grid Resilience Grant",
                  authority: "U.S. Dept. of Energy · IIJA",
                  detail: "Bipartisan Infrastructure Law formula grant for grid hardening.",
                  amount: round10(min(gross * 0.15, 25000))),
        ]
        // Line-extension cost-share only applies when a line is actually being run.
        if wireScenario == .standard {
            grants.append(Grant(name: "Line-Extension Cost-Share",
                                authority: "State Public Utilities Commission",
                                detail: "State cost-share for new distribution line extensions.",
                                amount: round10(min(gross * 0.10, 12000))))
        }
        grants.append(Grant(name: "LMI Connection Subsidy",
                            authority: "State Energy Office",
                            detail: "Low- & moderate-income service connection subsidy.",
                            amount: round10(min(gross * 0.08, 8000))))
        grants.append(Grant(name: "GridPath Clean-Connect Credit",
                            authority: "GridPath",
                            detail: "Unlocked by bundling a clean-energy plan.",
                            amount: 1500))

        let totalFace = grants.reduce(0) { $0 + $1.amount }
        // You always pay at least a floor — assistance can't zero out the bill.
        let floor = max(round10(gross * 0.12), 250)
        let totalApplied = min(totalFace, max(gross - floor, 0))
        let net = max(gross - totalApplied, 0)
        let percentOff = gross > 0 ? Int((totalApplied / gross * 100).rounded()) : 0

        return GrantOffer(gross: gross, grants: grants, totalApplied: totalApplied, net: net, percentOff: percentOff)
    }
}
