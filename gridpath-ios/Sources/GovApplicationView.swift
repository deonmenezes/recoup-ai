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
                VStack(alignment: .leading, spacing: 18) {
                    if let url = pdfURL {
                        confirmation(url)
                    } else {
                        autoFilled
                        formFields
                        GrantsOfferView(offer: offer)
                        Button(action: generate) {
                            HStack(spacing: 8) {
                                Image(systemName: "arrow.down.circle.fill")
                                Text("Generate & download application PDF")
                            }
                        }
                        .buttonStyle(NeoButtonStyle(fill: canGenerate ? .gpGreen : .gpInkMuted, textColor: .white))
                        .disabled(!canGenerate)
                    }
                }
                .padding(16)
            }
            .background(Color.gpPaper.ignoresSafeArea())
            .navigationTitle("Government application")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Close") { dismiss() }
                        .font(.system(size: 15, weight: .heavy, design: .rounded))
                        .foregroundStyle(Color.gpInk)
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
        VStack(alignment: .leading, spacing: 12) {
            Text("AUTO-FILLED").font(.system(size: 11, weight: .black, design: .rounded)).tracking(0.8).foregroundStyle(.white)
                .padding(.horizontal, 10).padding(.vertical, 4)
                .background(Color.gpGreen, in: RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color.gpInk, lineWidth: 2))
            VStack(alignment: .leading, spacing: 2) {
                Text("SERVICE ADDRESS").font(.system(size: 10, weight: .black, design: .rounded)).tracking(0.4).foregroundStyle(Color.gpInkMuted)
                Text(estimate.address).font(.system(size: 14, weight: .heavy, design: .rounded)).foregroundStyle(Color.gpInk)
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
        .background(Color.gpSage, in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color.gpInk, lineWidth: 3))
        .hardShadow(5)
    }

    private func autoCell(_ k: String, _ v: String, color: Color = .gpInk) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(k.uppercased()).font(.system(size: 10, weight: .black, design: .rounded)).tracking(0.4).foregroundStyle(Color.gpInkMuted)
            Text(v).font(.system(size: 14, weight: .heavy, design: .rounded)).foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // MARK: Applicant fields
    private var formFields: some View {
        VStack(alignment: .leading, spacing: 14) {
            field("Full name", text: $name)
            field("Email", text: $email, keyboard: .emailAddress)
            field("Phone", text: $phone, keyboard: .phonePad)
            VStack(alignment: .leading, spacing: 6) {
                NeoSectionLabel(text: "Property type", color: .gpInkMuted)
                Menu {
                    ForEach(propertyTypes, id: \.self) { t in
                        Button(t) { propertyType = t }
                    }
                } label: {
                    HStack {
                        Text(propertyType).font(.system(size: 15, weight: .semibold)).foregroundStyle(Color.gpInk)
                        Spacer()
                        Image(systemName: "chevron.up.chevron.down").font(.system(size: 13, weight: .heavy)).foregroundStyle(Color.gpInk)
                    }
                    .padding(12)
                    .neoSurface(fill: .white, radius: 10, border: 3, shadow: 3)
                }
            }
        }
    }

    private func field(_ label: String, text: Binding<String>, keyboard: UIKeyboardType = .default) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            NeoSectionLabel(text: label, color: .gpInkMuted)
            TextField(label, text: text)
                .font(.system(size: 15, weight: .semibold))
                .foregroundStyle(Color.gpInk)
                .tint(Color.gpGreen)
                .keyboardType(keyboard)
                .textInputAutocapitalization(keyboard == .emailAddress ? .never : .words)
                .autocorrectionDisabled()
                .padding(12)
                .neoSurface(fill: .white, radius: 10, border: 3, shadow: 3)
        }
    }

    // MARK: Confirmation
    private func confirmation(_ url: URL) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark")
                .font(.system(size: 28, weight: .black))
                .foregroundStyle(Color.gpInk)
                .frame(width: 64, height: 64)
                .background(Color.gpGreen, in: Circle())
                .overlay(Circle().strokeBorder(Color.gpInk, lineWidth: 3))
                .hardShadow(5)
            Text("Application Form GP-100 generated")
                .font(.system(size: 18, weight: .black, design: .rounded)).multilineTextAlignment(.center)
            Text("Reference \(reference) · net cost after grants \(usd(offer.net)).")
                .font(.system(size: 13, weight: .medium)).foregroundStyle(Color.gpInkMuted).multilineTextAlignment(.center)
            ShareLink(item: url) {
                HStack(spacing: 8) {
                    Image(systemName: "square.and.arrow.up")
                    Text("Save / share PDF")
                }
                .font(.system(size: 16, weight: .heavy, design: .rounded)).foregroundStyle(.white)
                .frame(maxWidth: .infinity).padding(.vertical, 15).padding(.horizontal, 16)
                .background(Color.gpGreen, in: RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color.gpInk, lineWidth: 3))
                .hardShadow(5)
            }
            Button("Edit details") { pdfURL = nil }
                .buttonStyle(NeoButtonStyle(fill: .gpCard, textColor: .gpInk))
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
