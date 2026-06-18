import Foundation
import CoreLocation

// Domain models — mirror of the GridPath web app.

enum GridPointType: String {
    case line, minor_line, pole, transformer, substation

    var label: String {
        switch self {
        case .pole: return "Power Pole"
        case .transformer: return "Transformer"
        case .substation: return "Substation"
        default: return "Power Line"
        }
    }
}

enum ServiceMode: String {
    case overhead, underground
    var rate: Double { self == .underground ? 60 : 20 }
    var rateLabel: String { self == .underground ? "$60/ft" : "$20/ft" }
}

/// How the property reaches the grid.
/// - `house`: connect at the existing pole/meter — no wire run (no line extension / transformer cost).
/// - `standard`: run a new service line to the property (distance-based cost).
enum WireScenario: String, CaseIterable {
    case standard, house
    var label: String { self == .house ? "House connection" : "Standard service" }
    var blurb: String {
        self == .house
            ? "Connect at the existing pole/meter — no wire run needed."
            : "Run a new service line to the property."
    }
    var icon: String { self == .house ? "🏠" : "🔌" }
}

struct GeocodeResult: Identifiable, Equatable {
    let id = UUID()
    let label: String
    let lat: Double
    let lon: Double
    var coordinate: CLLocationCoordinate2D { .init(latitude: lat, longitude: lon) }
}

struct PowerFeature {
    let type: GridPointType
    let geometry: [CLLocationCoordinate2D]
}

struct NearestResult {
    let coordinate: CLLocationCoordinate2D
    let type: GridPointType
    let distanceFeet: Double
}

struct CostBreakdown {
    let baseConnectionFee: Double
    let lineExtension: Double
    let transformer: Double
    let meterServiceDrop: Double
}

struct EstimatedTimeline {
    let label: String
    let applicationNote: String
}

struct ConnectionEstimate {
    let address: String
    let coordinate: CLLocationCoordinate2D
    let nearest: NearestResult
    let distanceFeet: Int
    let needsTransformer: Bool
    let mode: ServiceMode
    let wireScenario: WireScenario
    let breakdown: CostBreakdown
    let total: Double
    let timeline: EstimatedTimeline
    let explanation: String
    let features: [PowerFeature]
    var connectionName: String { nearest.type.label }
}

// MARK: - Grants & offer

struct Grant: Identifiable {
    let id = UUID()
    let name: String
    let authority: String
    let detail: String
    let amount: Double
}

struct GrantOffer {
    let gross: Double
    let grants: [Grant]
    let totalApplied: Double
    let net: Double
    let percentOff: Int
}

struct CleanEnergyOption: Identifiable {
    let id = UUID()
    let icon: String
    let name: String
    let recommended: Bool
    let headline: String
    let whatItIs: String
    let estimatedCost: Double
    let annualSavings: Double
    let paybackYears: Double
    let co2ReductionTons: Double
    let incentives: [String]
    let priority: Int
}

struct CleanEnergyPlan {
    let headline: String
    let summary: String
    let cleanScoreBefore: Int
    let cleanScoreAfter: Int
    let options: [CleanEnergyOption]
    let bundleItems: [String]
    let bundleCost: Double
    let bundleSavings: Double
    let bundleNote: String
}

func usd(_ n: Double) -> String {
    let f = NumberFormatter()
    f.numberStyle = .currency
    f.currencyCode = "USD"
    f.maximumFractionDigits = 0
    return f.string(from: NSNumber(value: n)) ?? "$\(Int(n))"
}
