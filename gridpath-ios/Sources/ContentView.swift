import SwiftUI

struct ContentView: View {
    @State private var query = ""
    @State private var suggestions: [GeocodeResult] = []
    @State private var showSuggestions = false
    @State private var selected: GeocodeResult?
    @State private var estimate: ConnectionEstimate?
    @State private var plan: CleanEnergyPlan?
    @State private var mode: ServiceMode = .overhead
    @State private var wireScenario: WireScenario = .standard
    @State private var showGovApp = false
    @State private var loading = false
    @State private var error: String?
    @State private var searchTask: Task<Void, Never>?

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    searchSection
                    GridMapView(estimate: estimate)
                        .frame(height: 300)
                        .clipShape(RoundedRectangle(cornerRadius: 18))
                        .overlay(RoundedRectangle(cornerRadius: 18).strokeBorder(Color.gpLine))
                    if loading { loadingRow }
                    if let error { errorRow(error) }
                    if let e = estimate {
                        estimateSection(e)
                        let offer = Grants.offer(gross: e.total, wireScenario: wireScenario)
                        GrantsOfferView(offer: offer)
                        Button { showGovApp = true } label: {
                            Text("Start government application →")
                                .font(.subheadline.bold()).foregroundStyle(.white)
                                .frame(maxWidth: .infinity).padding(15)
                                .background(Color.gpForest, in: RoundedRectangle(cornerRadius: 12))
                        }
                        .sheet(isPresented: $showGovApp) {
                            GovApplicationView(estimate: e, offer: offer)
                        }
                    }
                    if let p = plan { CleanEnergyPlanView(plan: p) }
                    Spacer(minLength: 24)
                }
                .padding(16)
            }
        }
        .background(Color.gpCream.ignoresSafeArea())
    }

    // MARK: Header
    private var header: some View {
        HStack {
            LogoFull(size: 34, tagline: false)
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(Color.gpPanel)
        .overlay(Divider(), alignment: .bottom)
    }

    // MARK: Search
    private var searchSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Enter an address")
                .font(.subheadline.bold()).foregroundStyle(Color.gpInk)
            HStack(spacing: 8) {
                Image(systemName: "location.circle").foregroundStyle(Color.gpInkMuted)
                TextField("Any U.S. address…", text: $query)
                    .textInputAutocapitalization(.words)
                    .autocorrectionDisabled()
                    .foregroundStyle(Color.gpInk)
                    .tint(Color.gpForest)
                    .onChange(of: query) { _, v in debounceSearch(v) }
                if !query.isEmpty {
                    Button { clearAll() } label: {
                        Image(systemName: "xmark.circle.fill").foregroundStyle(Color.gpInkMuted)
                    }
                }
            }
            .padding(13)
            .background(Color.gpPanel, in: RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color.gpLine, lineWidth: 1.5))

            if showSuggestions && !suggestions.isEmpty {
                VStack(spacing: 0) {
                    ForEach(suggestions) { s in
                        Button { pick(s) } label: {
                            Text(s.label).font(.footnote).foregroundStyle(Color.gpInk)
                                .frame(maxWidth: .infinity, alignment: .leading).padding(11)
                        }
                        Divider()
                    }
                }
                .background(Color.gpPanel, in: RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color.gpLine))
            }

            if let s = selected, !showSuggestions {
                HStack(alignment: .top, spacing: 8) {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(Color.gpForest)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Address found").font(.footnote.bold())
                        Text(s.label).font(.caption).foregroundStyle(Color.gpInkMuted)
                    }
                }
            }
        }
    }

    private var loadingRow: some View {
        HStack(spacing: 10) {
            ProgressView()
            Text("Measuring distance to the grid…").font(.subheadline).foregroundStyle(Color.gpInkMuted)
        }
    }

    private func errorRow(_ msg: String) -> some View {
        Text(msg).font(.footnote).foregroundStyle(Color.gpTerracotta)
            .padding(12).frame(maxWidth: .infinity, alignment: .leading)
            .background(Color.gpTerracotta.opacity(0.1), in: RoundedRectangle(cornerRadius: 10))
    }

    // MARK: Estimate
    private func estimateSection(_ e: ConnectionEstimate) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Your connection estimate").font(.subheadline.bold())
            statCard(icon: "ruler", tint: .gpForest, k: "Distance to Grid",
                     v: "\(e.distanceFeet) ft", sub: String(format: "%.2f miles", Double(e.distanceFeet) / 5280))
            statCard(icon: "dollarsign.circle", tint: .gpGold, k: "Estimated Cost",
                     v: usd(e.total), sub: "USD", vColor: .gpForest)
            statCard(icon: "clock", tint: .gpSage, k: "Estimated Timeline",
                     v: e.timeline.label, sub: e.timeline.applicationNote)

            // Connection scenario toggle (house vs standard)
            Text("Connection scenario").font(.caption.bold()).foregroundStyle(Color.gpInkMuted)
            Picker("", selection: Binding(get: { wireScenario }, set: { changeWireScenario($0) })) {
                Text("🔌 Standard").tag(WireScenario.standard)
                Text("🏠 House").tag(WireScenario.house)
            }
            .pickerStyle(.segmented)
            Text(wireScenario.blurb).font(.caption2).foregroundStyle(Color.gpInkMuted)

            // Connection type toggle
            Text("Connection type").font(.caption.bold()).foregroundStyle(Color.gpInkMuted)
            Picker("", selection: Binding(get: { mode }, set: { changeMode($0) })) {
                Text("Overhead · $20/ft").tag(ServiceMode.overhead)
                Text("Underground · $60/ft").tag(ServiceMode.underground)
            }
            .pickerStyle(.segmented)
            .disabled(wireScenario == .house)
            .opacity(wireScenario == .house ? 0.5 : 1)

            breakdown(e)
        }
        .padding(16)
        .background(Color.gpPanel, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(Color.gpLine))
    }

    private func statCard(icon: String, tint: Color, k: String, v: String, sub: String, vColor: Color = .gpInk) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon).font(.system(size: 16, weight: .bold))
                .foregroundStyle(tint).frame(width: 42, height: 42)
                .background(tint.opacity(0.14), in: RoundedRectangle(cornerRadius: 12))
            VStack(alignment: .leading, spacing: 1) {
                Text(k).font(.caption).foregroundStyle(Color.gpInkMuted)
                Text(v).font(.title3.bold()).foregroundStyle(vColor)
                Text(sub).font(.caption2).foregroundStyle(Color.gpInkMuted)
            }
            Spacer()
        }
        .padding(12)
        .background(Color.gpMuted, in: RoundedRectangle(cornerRadius: 14))
    }

    private func breakdown(_ e: ConnectionEstimate) -> some View {
        VStack(spacing: 6) {
            row("Base connection fee", usd(e.breakdown.baseConnectionFee))
            row("Extension (\(e.distanceFeet) ft × \(Int(mode.rate))/ft)", usd(e.breakdown.lineExtension))
            row("Meter service drop", usd(e.breakdown.meterServiceDrop))
            row("Transformer\(e.needsTransformer ? "" : " (not required)")",
                e.needsTransformer ? usd(e.breakdown.transformer) : "—")
            Divider()
            HStack {
                Text("Estimated Total").font(.subheadline.bold())
                Spacer()
                Text(usd(e.total)).font(.subheadline.bold()).foregroundStyle(Color.gpForest)
            }
        }
        .padding(.top, 4)
    }

    private func row(_ k: String, _ v: String) -> some View {
        HStack {
            Text(k).font(.footnote).foregroundStyle(Color.gpInkMuted)
            Spacer()
            Text(v).font(.footnote).foregroundStyle(Color.gpInk)
        }
    }

    // MARK: Actions
    private func debounceSearch(_ v: String) {
        searchTask?.cancel()
        if v.count < 3 { suggestions = []; return }
        searchTask = Task {
            try? await Task.sleep(nanoseconds: 350_000_000)
            if Task.isCancelled { return }
            let res = await Geocoder.search(v)
            if Task.isCancelled { return }
            await MainActor.run { suggestions = res; showSuggestions = true }
        }
    }

    private func pick(_ s: GeocodeResult) {
        selected = s
        query = s.label
        showSuggestions = false
        suggestions = []
        runEstimate(s, mode, wireScenario)
        plan = CleanEnergy.plan(for: s.label)
    }

    private func changeMode(_ m: ServiceMode) {
        mode = m
        if let s = selected { runEstimate(s, m, wireScenario) }
    }

    private func changeWireScenario(_ w: WireScenario) {
        wireScenario = w
        if let s = selected { runEstimate(s, mode, w) }
    }

    private func runEstimate(_ s: GeocodeResult, _ m: ServiceMode, _ w: WireScenario) {
        loading = true; error = nil
        Task {
            do {
                let est = try await GridService.estimate(for: s, mode: m, wireScenario: w)
                await MainActor.run { estimate = est; loading = false }
            } catch {
                await MainActor.run { self.error = error.localizedDescription; estimate = nil; loading = false }
            }
        }
    }

    private func clearAll() {
        query = ""; selected = nil; estimate = nil; plan = nil; error = nil
        suggestions = []; showSuggestions = false
    }
}
