import SwiftUI

// Automated government application: auto-fills the service address + connection
// details, collects the applicant, and generates a downloadable Form GP-100 PDF
// (shared via the system share sheet → Files / AirDrop / Mail).
struct GovApplicationView: View {
    let estimate: ConnectionEstimate
    let offer: GrantOffer
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var propertyType = "New construction"
    @State private var pdfURL: URL?

    private let propertyTypes = ["New construction", "Raw land", "ADU", "Major load upgrade"]
    private var scenarioLabel: String { estimate.wireScenario.label }
    private var modeLabel: String { estimate.mode == .underground ? "Underground" : "Overhead" }
    private var reference: String { GovPdf.reference(for: estimate) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if let url = pdfURL {
                        confirmation(url)
                    } else {
                        autoFilled
                        formFields
                        GrantsOfferView(offer: offer)
                        Button(action: generate) {
                            Text("⬇  Generate & download application PDF")
                                .font(.subheadline.bold()).foregroundStyle(.white)
                                .frame(maxWidth: .infinity).padding(15)
                                .background(canGenerate ? Color.gpForest : Color.gpInkMuted,
                                            in: RoundedRectangle(cornerRadius: 12))
                        }
                        .disabled(!canGenerate)
                    }
                }
                .padding(16)
            }
            .background(Color.gpCream.ignoresSafeArea())
            .navigationTitle("Government application")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                }
            }
        }
    }

    private var canGenerate: Bool {
        !name.trimmingCharacters(in: .whitespaces).isEmpty
            && email.contains("@") && !phone.trimmingCharacters(in: .whitespaces).isEmpty
    }

    // MARK: Auto-filled summary
    private var autoFilled: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("AUTO-FILLED").font(.caption2.bold()).foregroundStyle(.white)
                .padding(.horizontal, 9).padding(.vertical, 3)
                .background(Color.gpForest, in: Capsule())
            VStack(alignment: .leading, spacing: 2) {
                Text("Service address").font(.system(size: 10)).foregroundStyle(Color.gpInkMuted)
                Text(estimate.address).font(.footnote.bold()).foregroundStyle(Color.gpInk)
            }
            HStack {
                autoCell("Scenario", scenarioLabel)
                autoCell("Service type", modeLabel)
            }
            HStack {
                autoCell("Distance to grid", "\(estimate.distanceFeet) ft")
                autoCell("Net after grants", usd(offer.net), color: .gpForest)
            }
        }
        .padding(14)
        .background(Color.gpSageSoft, in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color.gpForest.opacity(0.35), lineWidth: 1.5))
    }

    private func autoCell(_ k: String, _ v: String, color: Color = .gpInk) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(k).font(.system(size: 10)).foregroundStyle(Color.gpInkMuted)
            Text(v).font(.footnote.bold()).foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: Applicant fields
    private var formFields: some View {
        VStack(alignment: .leading, spacing: 12) {
            field("Full name", text: $name)
            field("Email", text: $email, keyboard: .emailAddress)
            field("Phone", text: $phone, keyboard: .phonePad)
            VStack(alignment: .leading, spacing: 5) {
                Text("Property type").font(.caption.bold()).foregroundStyle(Color.gpInkMuted)
                Picker("Property type", selection: $propertyType) {
                    ForEach(propertyTypes, id: \.self) { Text($0).tag($0) }
                }
                .pickerStyle(.menu).tint(Color.gpForest)
            }
        }
    }

    private func field(_ label: String, text: Binding<String>, keyboard: UIKeyboardType = .default) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(label).font(.caption.bold()).foregroundStyle(Color.gpInkMuted)
            TextField(label, text: text)
                .keyboardType(keyboard)
                .textInputAutocapitalization(keyboard == .emailAddress ? .never : .words)
                .autocorrectionDisabled()
                .padding(12)
                .background(Color.gpPanel, in: RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(Color.gpLine, lineWidth: 1.5))
        }
    }

    // MARK: Confirmation
    private func confirmation(_ url: URL) -> some View {
        VStack(spacing: 14) {
            Text("✓").font(.system(size: 30, weight: .bold)).foregroundStyle(Color.gpForest)
                .frame(width: 56, height: 56).background(Color.gpSageSoft, in: Circle())
            Text("Application Form GP-100 generated").font(.headline).multilineTextAlignment(.center)
            Text("Reference \(reference) · net cost after grants \(usd(offer.net)).")
                .font(.footnote).foregroundStyle(Color.gpInkMuted).multilineTextAlignment(.center)
            ShareLink(item: url) {
                Text("⬇  Save / share PDF").font(.subheadline.bold()).foregroundStyle(.white)
                    .frame(maxWidth: .infinity).padding(15)
                    .background(Color.gpForest, in: RoundedRectangle(cornerRadius: 12))
            }
            Button("Edit details") { pdfURL = nil }
                .font(.subheadline.bold()).foregroundStyle(Color.gpInk)
                .frame(maxWidth: .infinity).padding(13)
                .background(Color.gpMuted, in: RoundedRectangle(cornerRadius: 12))
        }
        .padding(.top, 20)
    }

    private func generate() {
        pdfURL = GovPdf.render(
            estimate: estimate, offer: offer,
            applicant: (name: name, email: email, phone: phone, propertyType: propertyType)
        )
    }
}
