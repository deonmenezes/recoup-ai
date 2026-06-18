import SwiftUI
import MapKit

struct GridMapView: View {
    let estimate: ConnectionEstimate?
    @State private var camera: MapCameraPosition = .region(
        MKCoordinateRegion(center: .init(latitude: 39.5, longitude: -98.35),
                           span: .init(latitudeDelta: 38, longitudeDelta: 38))
    )

    private var key: String {
        guard let e = estimate else { return "none" }
        return "\(e.coordinate.latitude),\(e.coordinate.longitude),\(e.nearest.coordinate.latitude),\(e.distanceFeet)"
    }

    var body: some View {
        Map(position: $camera) {
            if let e = estimate {
                MapPolyline(coordinates: [e.coordinate, e.nearest.coordinate])
                    .stroke(Color.gpGold, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                Annotation("Your Property", coordinate: e.coordinate) {
                    pin(system: "house.fill", bg: .gpForest)
                }
                Annotation(e.connectionName, coordinate: e.nearest.coordinate) {
                    pin(system: "bolt.fill", bg: .gpTerracotta)
                }
            }
        }
        .mapStyle(.standard(elevation: .realistic, pointsOfInterest: .excludingAll))
        .onAppear { fly() }
        .onChange(of: key) { _, _ in fly() }
    }

    private func pin(system: String, bg: Color) -> some View {
        Image(systemName: system)
            .font(.system(size: 13, weight: .bold))
            .foregroundStyle(.white)
            .frame(width: 32, height: 32)
            .background(bg, in: Circle())
            .overlay(Circle().strokeBorder(.white, lineWidth: 2.5))
            .shadow(color: .black.opacity(0.3), radius: 3, y: 1)
    }

    private func fly() {
        guard let e = estimate else { return }
        let a = e.coordinate, b = e.nearest.coordinate
        let mid = CLLocationCoordinate2D(latitude: (a.latitude + b.latitude) / 2,
                                         longitude: (a.longitude + b.longitude) / 2)
        let sep = CLLocation(latitude: a.latitude, longitude: a.longitude)
            .distance(from: CLLocation(latitude: b.latitude, longitude: b.longitude))
        let distance = max(450, sep * 6)
        withAnimation(.easeInOut(duration: 1.1)) {
            camera = .camera(MapCamera(centerCoordinate: mid, distance: distance, heading: 20, pitch: 50))
        }
    }
}
