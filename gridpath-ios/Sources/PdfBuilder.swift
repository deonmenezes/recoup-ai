import UIKit

// Renders the auto-filled "Form GP-100" government application to a PDF on disk
// using UIGraphicsPDFRenderer. Mirrors the web app's pdf.ts layout. UIKit's
// coordinate origin is top-left (y grows downward), so the layout math matches
// the web's top-down coordinates directly.

enum GovPdf {
    // Brand palette (mirrors Theme.swift / globals.css).
    private static let ink = UIColor(red: 0.165, green: 0.165, blue: 0.149, alpha: 1)
    private static let muted = UIColor(red: 0.435, green: 0.424, blue: 0.376, alpha: 1)
    private static let forest = UIColor(red: 0.184, green: 0.29, blue: 0.235, alpha: 1)
    private static let gold = UIColor(red: 0.878, green: 0.659, blue: 0.18, alpha: 1)
    private static let line = UIColor(red: 0.78, green: 0.75, blue: 0.68, alpha: 1)
    private static let sage = UIColor(red: 0.867, green: 0.906, blue: 0.867, alpha: 1)
    private static let paleHeaderSub = UIColor(red: 0.85, green: 0.9, blue: 0.85, alpha: 1)

    static func reference(for e: ConnectionEstimate) -> String {
        let a = abs(Int((e.coordinate.latitude * 1000).rounded()))
        let b = abs(Int((e.coordinate.longitude * 1000).rounded()))
        return "GP-100-\(a)-\(b)"
    }

    private static func parcelId(_ lat: Double, _ lon: Double) -> String {
        "APN-\(abs(Int((lat * 1000).rounded())))-\(abs(Int((lon * 1000).rounded())))"
    }

    static func render(estimate e: ConnectionEstimate,
                       offer: GrantOffer,
                       applicant: (name: String, email: String, phone: String, propertyType: String)) -> URL {
        let pageW: CGFloat = 612, pageH: CGFloat = 792
        let M: CGFloat = 48, R = pageW - M, W = R - M
        let renderer = UIGraphicsPDFRenderer(bounds: CGRect(x: 0, y: 0, width: pageW, height: pageH))
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("GridPath-Application-\(reference(for: e)).pdf")

        let df = DateFormatter()
        df.dateStyle = .long
        let dateStr = df.string(from: Date())
        let ref = reference(for: e)

        let scenarioLabel = e.wireScenario.label
        let modeLabel = e.mode == .underground ? "Underground" : "Overhead"
        let transformer = e.wireScenario == .house ? "Not required" : (e.needsTransformer ? "Required" : "Not required")

        try? renderer.writePDF(to: url) { ctx in
            ctx.beginPage()
            let cg = ctx.cgContext

            func text(_ s: String, _ x: CGFloat, _ y: CGFloat, size: CGFloat = 10, bold: Bool = false, color: UIColor = ink) {
                let f = bold ? UIFont.boldSystemFont(ofSize: size) : UIFont.systemFont(ofSize: size)
                (s as NSString).draw(at: CGPoint(x: x, y: y), withAttributes: [.font: f, .foregroundColor: color])
            }
            func rtext(_ s: String, rightX: CGFloat, _ y: CGFloat, size: CGFloat = 10, bold: Bool = false, color: UIColor = ink) {
                let f = bold ? UIFont.boldSystemFont(ofSize: size) : UIFont.systemFont(ofSize: size)
                let w = (s as NSString).size(withAttributes: [.font: f]).width
                (s as NSString).draw(at: CGPoint(x: rightX - w, y: y), withAttributes: [.font: f, .foregroundColor: color])
            }
            func rect(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat, fill: UIColor? = nil, stroke: UIColor? = nil, lw: CGFloat = 1) {
                let r = CGRect(x: x, y: y, width: w, height: h)
                if let fill { cg.setFillColor(fill.cgColor); cg.fill(r) }
                if let stroke { cg.setStrokeColor(stroke.cgColor); cg.setLineWidth(lw); cg.stroke(r) }
            }
            func hline(_ x1: CGFloat, _ x2: CGFloat, _ y: CGFloat, color: UIColor = line, lw: CGFloat = 0.75) {
                cg.setStrokeColor(color.cgColor); cg.setLineWidth(lw)
                cg.move(to: CGPoint(x: x1, y: y)); cg.addLine(to: CGPoint(x: x2, y: y)); cg.strokePath()
            }

            // ---- Header band ----
            rect(0, 0, pageW, 96, fill: forest)
            text("GridPath", M, 22, size: 22, bold: true, color: .white)
            text("RESIDENTIAL UTILITY SERVICE CONNECTION APPLICATION", M, 54, size: 10, bold: true, color: .white)
            text("State Public Utilities Commission · Office of Grid Access", M, 70, size: 8.5, color: paleHeaderSub)
            rtext("FORM GP-100", rightX: R, 26, size: 12, bold: true, color: gold)
            rtext("Ref: \(ref)", rightX: R, 48, size: 9, color: .white)
            rtext("Date: \(dateStr)", rightX: R, 62, size: 9, color: paleHeaderSub)

            var y: CGFloat = 116

            func section(_ label: String) {
                rect(M, y, 4, 13, fill: forest)
                text(label, M + 12, y + 1, size: 11, bold: true, color: forest)
                y += 22
            }
            func field(_ label: String, _ value: String) {
                text(label, M, y, size: 8, bold: true, color: muted)
                text(value.isEmpty ? "—" : value, M, y + 11, size: 10.5, color: ink)
                hline(M, R, y + 24)
                y += 30
            }
            func field2(_ l1: String, _ v1: String, _ l2: String, _ v2: String) {
                let mid = M + W / 2 + 8
                text(l1, M, y, size: 8, bold: true, color: muted)
                text(v1.isEmpty ? "—" : v1, M, y + 11, size: 10.5, color: ink)
                text(l2, mid, y, size: 8, bold: true, color: muted)
                text(v2.isEmpty ? "—" : v2, mid, y + 11, size: 10.5, color: ink)
                hline(M, R, y + 24)
                y += 30
            }

            // A. Service address
            section("A.  SERVICE ADDRESS  (auto-populated)")
            field("PROPERTY ADDRESS", e.address)
            field2("LATITUDE", String(format: "%.5f", e.coordinate.latitude),
                   "LONGITUDE", String(format: "%.5f", e.coordinate.longitude))
            field2("ASSESSOR PARCEL ID", parcelId(e.coordinate.latitude, e.coordinate.longitude),
                   "PROPERTY TYPE", applicant.propertyType)

            // B. Applicant
            section("B.  APPLICANT OF RECORD")
            field2("FULL NAME", applicant.name, "PHONE", applicant.phone)
            field("EMAIL", applicant.email)

            // C. Connection details
            section("C.  CONNECTION DETAILS  (auto-populated)")
            field2("CONNECTION SCENARIO", scenarioLabel, "SERVICE TYPE", modeLabel)
            field2("DISTANCE TO GRID", "\(e.distanceFeet) ft", "NEW TRANSFORMER", transformer)
            field2("NEAREST GRID POINT", e.nearest.type.label, "EST. TIMELINE", e.timeline.label)

            // D. Cost & grant summary
            section("D.  COST & GRANT ASSISTANCE SUMMARY")
            text("CONNECTION COST (OFFER)", M, y, size: 8, bold: true, color: muted)
            rtext(usd(offer.gross), rightX: R, y - 2, size: 12, bold: true, color: ink)
            hline(M, R, y + 15)
            y += 24
            text("GRANTS & REBATES APPLIED", M, y, size: 8, bold: true, color: muted)
            y += 15
            for g in offer.grants {
                text("•  \(g.name)", M + 6, y, size: 9.5, color: ink)
                rtext("- \(usd(g.amount))", rightX: R, y, size: 9.5, color: forest)
                y += 15
            }
            hline(M, R, y + 1)
            y += 10
            text("TOTAL ASSISTANCE APPLIED", M, y, size: 9, bold: true, color: muted)
            rtext("- \(usd(offer.totalApplied))", rightX: R, y, size: 10.5, bold: true, color: forest)
            y += 20

            // Net cost highlight box
            rect(M, y, W, 40, fill: sage, stroke: forest, lw: 1.2)
            text("NET COST AFTER GRANTS", M + 14, y + 9, size: 9, bold: true, color: forest)
            text("You save \(offer.percentOff)% vs the original offer", M + 14, y + 23, size: 8.5, color: muted)
            rtext(usd(offer.net), rightX: R - 14, y + 8, size: 18, bold: true, color: forest)
            y += 50

            // E. Certification
            section("E.  APPLICANT CERTIFICATION")
            text("I certify that the information above is accurate to the best of my knowledge and authorize", M, y, size: 8.5, color: muted)
            text("the serving utility to review this request for grid interconnection and grant assistance.", M, y + 12, size: 8.5, color: muted)
            y += 36
            hline(M, M + 230, y + 12, color: ink)
            hline(R - 150, R, y + 12, color: ink)
            text("Signature", M, y + 18, size: 8, color: muted)
            text("Date: \(dateStr)", R - 150, y + 18, size: 8, color: muted)

            // Footer
            hline(M, R, pageH - 56)
            text("This is an automatically generated demonstration form (GridPath Form GP-100). Estimates and grant", M, pageH - 48, size: 7.5, color: muted)
            text("amounts are illustrative and based on public data; actual figures vary by utility and program eligibility.", M, pageH - 38, size: 7.5, color: muted)
        }

        return url
    }
}
