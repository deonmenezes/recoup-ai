import Foundation
import CoreLocation

private let UA = "GridPath-iOS/1.0 (clean-energy connection estimator)"
private let METERS_TO_FEET = 3.28084
private let NEAR_POLE_FEET = 150.0
private let POLE_PREFERENCE_FEET = 50.0

// MARK: - Geocoding (Nominatim)

enum Geocoder {
    static func search(_ query: String) async -> [GeocodeResult] {
        let q = query.trimmingCharacters(in: .whitespaces)
        guard q.count >= 3 else { return [] }
        var comps = URLComponents(string: "https://nominatim.openstreetmap.org/search")!
        comps.queryItems = [
            .init(name: "q", value: q),
            .init(name: "format", value: "json"),
            .init(name: "limit", value: "5"),
            .init(name: "countrycodes", value: "us"),
        ]
        var req = URLRequest(url: comps.url!)
        req.setValue(UA, forHTTPHeaderField: "User-Agent")
        req.timeoutInterval = 10
        do {
            let (data, _) = try await URLSession.shared.data(for: req)
            let items = try JSONDecoder().decode([NominatimItem].self, from: data)
            return items.compactMap {
                guard let lat = Double($0.lat), let lon = Double($0.lon) else { return nil }
                return GeocodeResult(label: $0.display_name, lat: lat, lon: lon)
            }
        } catch {
            return []
        }
    }

    private struct NominatimItem: Decodable {
        let display_name: String
        let lat: String
        let lon: String
    }
}

// MARK: - Grid estimate (Overpass + Turf-equivalent math)

enum GridService {
    static func estimate(for place: GeocodeResult, mode: ServiceMode, wireScenario: WireScenario = .standard) async throws -> ConnectionEstimate {
        let features = try await queryPower(lat: place.lat, lon: place.lon)
        let origin = place.coordinate
        guard let nearest = findNearest(origin: origin, features: features) else {
            throw NSError(domain: "GridPath", code: 404,
                          userInfo: [NSLocalizedDescriptionKey: "No grid infrastructure found near this address."])
        }

        let needsTransformer = computeNeedsTransformer(origin: origin, nearest: nearest, features: features)
        let distanceFeet = Int(nearest.distanceFeet.rounded())

        // A "house connection" hooks straight onto the existing pole/meter — no wire
        // run and no new transformer, just the base fee + meter service drop.
        let houseConnection = wireScenario == .house
        let ext = houseConnection ? 0 : (Double(distanceFeet) * mode.rate).rounded()
        let breakdown = CostBreakdown(
            baseConnectionFee: 1500,
            lineExtension: ext,
            transformer: (!houseConnection && needsTransformer) ? 1000 : 0,
            meterServiceDrop: 500
        )
        let total = breakdown.baseConnectionFee + breakdown.lineExtension + breakdown.transformer + breakdown.meterServiceDrop
        let timeline = computeTimeline(distanceFeet: Double(distanceFeet), needsTransformer: needsTransformer)

        let typeName: String = nearest.type.label.lowercased()
        let explanation: String
        if houseConnection {
            explanation = "Nearest grid point is a \(typeName) \(distanceFeet) ft away. House connection — cost = base fee + meter drop only (no wire run). You hook onto the existing pole/meter, so there's no line run or new transformer."
        } else {
            let transformerNote: String = needsTransformer
                ? " A new transformer is required (no existing pole/transformer within 150 ft)."
                : " You're within 150 ft of an existing pole/transformer, so no new transformer is needed."
            let transformerWord: String = needsTransformer ? "transformer" : "no transformer"
            explanation = "Nearest grid point is a \(typeName) \(distanceFeet) ft away. Cost = base fee + (\(distanceFeet) ft × \(mode.rawValue) rate) + \(transformerWord) + meter drop.\(transformerNote)"
        }

        return ConnectionEstimate(
            address: place.label, coordinate: origin, nearest: nearest,
            distanceFeet: distanceFeet, needsTransformer: needsTransformer, mode: mode,
            wireScenario: wireScenario,
            breakdown: breakdown, total: total, timeline: timeline,
            explanation: explanation, features: features
        )
    }

    // MARK: Overpass

    private static func queryPower(lat: Double, lon: Double, radii: [Int] = [2000, 4000, 8000]) async throws -> [PowerFeature] {
        for radius in radii {
            if let feats = try? await fetchOverpass(lat: lat, lon: lon, radius: radius), !feats.isEmpty {
                return feats
            }
        }
        return []
    }

    private static func fetchOverpass(lat: Double, lon: Double, radius: Int) async throws -> [PowerFeature] {
        let query = """
        [out:json][timeout:25];
        (
          way["power"="line"](around:\(radius),\(lat),\(lon));
          way["power"="minor_line"](around:\(radius),\(lat),\(lon));
          node["power"="pole"](around:\(radius),\(lat),\(lon));
          node["power"="transformer"](around:\(radius),\(lat),\(lon));
          way["power"="transformer"](around:\(radius),\(lat),\(lon));
          way["power"="substation"](around:\(radius),\(lat),\(lon));
          node["power"="substation"](around:\(radius),\(lat),\(lon));
        );
        out geom;
        """
        var req = URLRequest(url: URL(string: "https://overpass-api.de/api/interpreter")!)
        req.httpMethod = "POST"
        req.setValue(UA, forHTTPHeaderField: "User-Agent")
        req.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        req.httpBody = "data=\(query.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? query)".data(using: .utf8)
        req.timeoutInterval = 25
        let (data, _) = try await URLSession.shared.data(for: req)
        let res = try JSONDecoder().decode(OverpassResponse.self, from: data)
        return res.elements.compactMap { el -> PowerFeature? in
            guard let type = GridPointType(rawValue: el.tags?.power ?? "") else { return nil }
            if let lat = el.lat, let lon = el.lon {
                return PowerFeature(type: type, geometry: [.init(latitude: lat, longitude: lon)])
            } else if let geom = el.geometry, !geom.isEmpty {
                return PowerFeature(type: type, geometry: geom.map { .init(latitude: $0.lat, longitude: $0.lon) })
            }
            return nil
        }
    }

    private struct OverpassResponse: Decodable { let elements: [Element] }
    private struct Element: Decodable {
        let type: String
        let lat: Double?
        let lon: Double?
        let geometry: [Geom]?
        let tags: Tags?
        struct Geom: Decodable { let lat: Double; let lon: Double }
        struct Tags: Decodable { let power: String? }
    }

    // MARK: Nearest point

    private static let nodeTypes: Set<GridPointType> = [.pole, .transformer]

    private static func findNearest(origin: CLLocationCoordinate2D, features: [PowerFeature]) -> NearestResult? {
        var best: NearestResult?
        var bestNode: NearestResult?

        for f in features {
            var candidate: NearestResult?
            if f.geometry.count >= 2 {
                var localBest: (CLLocationCoordinate2D, Double)?
                for i in 0..<(f.geometry.count - 1) {
                    let r = nearestOnSegment(origin, f.geometry[i], f.geometry[i + 1])
                    if localBest == nil || r.1 < localBest!.1 { localBest = r }
                }
                if let lb = localBest {
                    candidate = NearestResult(coordinate: lb.0, type: f.type, distanceFeet: lb.1 * METERS_TO_FEET)
                }
            } else if let g = f.geometry.first {
                let m = meters(origin, g)
                candidate = NearestResult(coordinate: g, type: f.type, distanceFeet: m * METERS_TO_FEET)
            }
            guard let c = candidate else { continue }
            if best == nil || c.distanceFeet < best!.distanceFeet { best = c }
            if nodeTypes.contains(c.type), bestNode == nil || c.distanceFeet < bestNode!.distanceFeet { bestNode = c }
        }

        // Prefer a pole/transformer when ~as close as the nearest line.
        if let b = best, !nodeTypes.contains(b.type), let n = bestNode,
           n.distanceFeet <= b.distanceFeet + POLE_PREFERENCE_FEET {
            return n
        }
        return best
    }

    private static func computeNeedsTransformer(origin: CLLocationCoordinate2D, nearest: NearestResult, features: [PowerFeature]) -> Bool {
        if nearest.type == .pole || nearest.type == .transformer { return false }
        let hasNearbyDrop = features.contains { f in
            guard f.type == .pole || f.type == .transformer, let g = f.geometry.first else { return false }
            return meters(origin, g) * METERS_TO_FEET <= NEAR_POLE_FEET
        }
        return !hasNearbyDrop
    }

    private static func computeTimeline(distanceFeet: Double, needsTransformer: Bool) -> EstimatedTimeline {
        let note = "+2 weeks application & review"
        if distanceFeet > 500 || needsTransformer { return .init(label: "3–6 months", applicationNote: note) }
        if distanceFeet > 150 { return .init(label: "6–12 weeks", applicationNote: note) }
        return .init(label: "4–6 weeks", applicationNote: note)
    }

    // MARK: Geo math

    private static func meters(_ a: CLLocationCoordinate2D, _ b: CLLocationCoordinate2D) -> Double {
        CLLocation(latitude: a.latitude, longitude: a.longitude)
            .distance(from: CLLocation(latitude: b.latitude, longitude: b.longitude))
    }

    /// Nearest point on segment a→b to point p, via a local tangent plane. Returns (point, meters).
    private static func nearestOnSegment(_ p: CLLocationCoordinate2D, _ a: CLLocationCoordinate2D, _ b: CLLocationCoordinate2D) -> (CLLocationCoordinate2D, Double) {
        let mPerDegLat = 111_320.0
        let mPerDegLon = 111_320.0 * cos(p.latitude * .pi / 180)
        func xy(_ c: CLLocationCoordinate2D) -> (Double, Double) {
            ((c.longitude - p.longitude) * mPerDegLon, (c.latitude - p.latitude) * mPerDegLat)
        }
        let A = xy(a), B = xy(b)
        let dx = B.0 - A.0, dy = B.1 - A.1
        let len2 = dx * dx + dy * dy
        var t = len2 > 0 ? -((A.0 * dx + A.1 * dy) / len2) : 0
        t = max(0, min(1, t))
        let nx = A.0 + t * dx, ny = A.1 + t * dy
        let dist = (nx * nx + ny * ny).squareRoot()
        let coord = CLLocationCoordinate2D(latitude: p.latitude + ny / mPerDegLat,
                                           longitude: p.longitude + nx / mPerDegLon)
        return (coord, dist)
    }
}
