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
                VStack(alignment: .leading, spacing: 20) {
                    searchSection
                    GridMapView(estimate: estimate)
                        .frame(height: 300)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color.gpInk, lineWidth: 3))
                        .hardShadow(5)
                    if loading { loadingRow }
                    if let error { errorRow(error) }
                    if let e = estimate {
                        estimateSection(e)
                        let offer = Grants.offer(gross: e.total, wireScenario: wireScenario)
                        GrantsOfferView(offer: offer)
                        Button { showGovApp = true } label: {
                            HStack(spacing: 8) {
                                Text("Start government application")
                                Image(systemName: "arrow.right")
                            }
                        }
                        .buttonStyle(NeoButtonStyle(fill: .gpGold, textColor: .gpInk))
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
        .background(Color.gpPaper.ignoresSafeArea())
    }

    // MARK: Header
    private var header: some View {
        HStack {
            LogoFull(size: 34, tagline: false)
            Spacer()
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Color.gpCard)
        .overlay(Rectangle().frame(height: 3).foregroundStyle(Color.gpInk), alignment: .bottom)
    }

    // MARK: Search
    private var searchSection: some View {
        VStack(alignment: .leading, spacing: 10) {
            NeoSectionLabel(text: "Enter an address")
            HStack(spacing: 10) {
                Image(systemName: "location.circle.fill")
                    .font(.system(size: 18, weight: .heavy)).foregroundStyle(Color.gpInk)
                TextField("Any U.S. address…", text: $query)
                    .font(.system(size: 16, weight: .semibold))
                    .textInputAutocapitalization(.words)
                    .autocorrectionDisabled()
                    .foregroundStyle(Color.gpInk)
                    .tint(Color.gpGreen)
                    .onChange(of: query) { _, v in debounceSearch(v) }
                if !query.isEmpty {
                    Button { clearAll() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.system(size: 18, weight: .heavy)).foregroundStyle(Color.gpInk)
                    }
                }
            }
            .padding(13)
            .neoSurface(fill: .white, radius: 10, border: 3, shadow: 3)

            if showSuggestions && !suggestions.isEmpty {
                VStack(spacing: 0) {
                    ForEach(Array(suggestions.enumerated()), id: \.element.id) { idx, s in
                        Button { pick(s) } label: {
                            Text(s.label).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.gpInk)
                                .frame(maxWidth: .infinity, alignment: .leading).padding(12)
                        }
                        if idx < suggestions.count - 1 {
                            Rectangle().frame(height: 2).foregroundStyle(Color.gpInk)
                        }
                    }
                }
                .neoSurface(fill: .gpCard, radius: 10, border: 3, shadow: 3)
            }

            if let s = selected, !showSuggestions {
                HStack(alignment: .center, spacing: 10) {
                    NeoIconTile(systemName: "checkmark", fill: .gpGreen, size: 34, symbolSize: 16)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Address found").font(.system(size: 13, weight: .heavy, design: .rounded))
                        Text(s.label).font(.system(size: 12, weight: .medium)).foregroundStyle(Color.gpInkMuted)
                    }
                }
            }
        }
    }

    private var loadingRow: some View {
        HStack(spacing: 10) {
            ProgressView().tint(.gpGreen)
            Text("Measuring distance to the grid…")
                .font(.system(size: 15, weight: .semibold)).foregroundStyle(Color.gpInk)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .neoCard(fill: .gpCard, radius: 12, border: 3, shadow: 3, padding: 14)
    }

    private func errorRow(_ msg: String) -> some View {
        HStack(spacing: 10) {
            NeoIconTile(systemName: "exclamationmark.triangle.fill", fill: .gpTerracotta, size: 34, symbolSize: 15)
            Text(msg).font(.system(size: 14, weight: .semibold)).foregroundStyle(Color.gpInk)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .neoCard(fill: Color.gpTerracotta.opacity(0.16), radius: 12, border: 3, shadow: 3, padding: 12)
    }

    // MARK: Estimate
    private func estimateSection(_ e: ConnectionEstimate) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            NeoSectionLabel(text: "Your connection estimate")
            statCard(icon: "ruler.fill", tint: .gpSage, k: "Distance to Grid",
                     v: "\(e.distanceFeet) ft", sub: String(format: "%.2f miles", Double(e.distanceFeet) / 5280))
            statCard(icon: "banknote.fill", tint: .gpGold, k: "Estimated Cost",
                     v: usd(e.total), sub: "USD", vColor: .gpForest)
            statCard(icon: "clock.fill", tint: .gpSage, k: "Estimated Timeline",
                     v: e.timeline.label, sub: e.timeline.applicationNote)

            // Connection scenario toggle (house vs standard)
            NeoSectionLabel(text: "Connection scenario", color: .gpInkMuted)
            NeoSegmented(
                options: [
                    .init(icon: WireScenario.standard.icon, label: "Standard", value: WireScenario.standard),
                    .init(icon: WireScenario.house.icon, label: "House", value: WireScenario.house),
                ],
                selection: wireScenario,
                activeFill: .gpGreen, activeText: .white,
                onSelect: { changeWireScenario($0) }
            )
            Text(wireScenario.blurb).font(.system(size: 12, weight: .medium)).foregroundStyle(Color.gpInkMuted)

            // Connection type toggle
            NeoSectionLabel(text: "Connection type", color: .gpInkMuted)
            NeoSegmented(
                options: [
                    .init(icon: "arrow.up.to.line", label: "Overhead · $20/ft", value: ServiceMode.overhead),
                    .init(icon: "arrow.down.to.line", label: "Underground · $60/ft", value: ServiceMode.underground),
                ],
                selection: mode,
                activeFill: .gpGold, activeText: .gpInk,
                onSelect: { changeMode($0) }
            )
            .disabled(wireScenario == .house)
            .opacity(wireScenario == .house ? 0.5 : 1)

            breakdown(e)
        }
        .neoCard(fill: .gpCard, radius: 12, border: 3, shadow: 5)
    }

    private func statCard(icon: String, tint: Color, k: String, v: String, sub: String, vColor: Color = .gpInk) -> some View {
        HStack(spacing: 14) {
            NeoIconTile(systemName: icon, fill: tint, size: 44, symbolSize: 18)
            VStack(alignment: .leading, spacing: 1) {
                Text(k.uppercased()).font(.system(size: 11, weight: .heavy, design: .rounded))
                    .tracking(0.5).foregroundStyle(Color.gpInkMuted)
                Text(v).font(.system(size: 20, weight: .black, design: .rounded)).foregroundStyle(vColor)
                Text(sub).font(.system(size: 11, weight: .medium)).foregroundStyle(Color.gpInkMuted)
            }
            Spacer()
        }
        .padding(12)
        .neoSurface(fill: .white, radius: 10, border: 3, shadow: 3)
    }

    private func breakdown(_ e: ConnectionEstimate) -> some View {
        VStack(spacing: 8) {
            row("Base connection fee", usd(e.breakdown.baseConnectionFee))
            row("Extension (\(e.distanceFeet) ft × \(Int(mode.rate))/ft)", usd(e.breakdown.lineExtension))
            row("Meter service drop", usd(e.breakdown.meterServiceDrop))
            row("Transformer\(e.needsTransformer ? "" : " (not required)")",
                e.needsTransformer ? usd(e.breakdown.transformer) : "—")
            Rectangle().frame(height: 2).foregroundStyle(Color.gpInk)
            HStack {
                Text("Estimated Total").font(.system(size: 15, weight: .black, design: .rounded))
                Spacer()
                Text(usd(e.total)).font(.system(size: 15, weight: .black, design: .rounded)).foregroundStyle(Color.gpGreen)
            }
        }
        .padding(12)
        .background(Color.gpSage.opacity(0.45), in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(Color.gpInk, lineWidth: 3))
    }

    private func row(_ k: String, _ v: String) -> some View {
        HStack {
            Text(k).font(.system(size: 13, weight: .medium)).foregroundStyle(Color.gpInkMuted)
            Spacer()
            Text(v).font(.system(size: 13, weight: .bold)).foregroundStyle(Color.gpInk)
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

// MARK: - Neobrutalist segmented control (physical bordered buttons)

struct NeoSegmented<Value: Equatable>: View {
    struct Option: Identifiable {
        let id = UUID()
        let icon: String?
        let label: String
        let value: Value
        init(icon: String? = nil, label: String, value: Value) {
            self.icon = icon; self.label = label; self.value = value
        }
    }

    let options: [Option]
    let selection: Value
    var activeFill: Color = .gpGreen
    var activeText: Color = .white
    let onSelect: (Value) -> Void

    var body: some View {
        HStack(spacing: 10) {
            ForEach(options) { opt in
                let active = opt.value == selection
                Button { onSelect(opt.value) } label: {
                    HStack(spacing: 6) {
                        if let icon = opt.icon {
                            Image(systemName: icon).font(.system(size: 13, weight: .heavy))
                        }
                        Text(opt.label).font(.system(size: 13, weight: .heavy, design: .rounded))
                            .lineLimit(1).minimumScaleFactor(0.8)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12).padding(.horizontal, 8)
                    .foregroundStyle(active ? activeText : Color.gpInk)
                    // ACTIVE = pressed look (shadow collapses); INACTIVE = raised hard shadow.
                    .background(NeoLayeredBackground(fill: active ? activeFill : Color.white, radius: 10, border: 3, shadow: active ? 0 : 3))
                    .offset(x: active ? 3 : 0, y: active ? 3 : 0)
                }
                .buttonStyle(.plain)
            }
        }
        .animation(.easeOut(duration: 0.08), value: selection)
    }
}
