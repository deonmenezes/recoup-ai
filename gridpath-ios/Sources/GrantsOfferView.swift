import SwiftUI

// "This is your offer — and these grants make it much cheaper."
struct GrantsOfferView: View {
    let offer: GrantOffer

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text("💸 Your offer & available grants")
                    .font(.caption.bold()).foregroundStyle(Color.gpForest)
                Spacer()
                Text("Save \(offer.percentOff)%")
                    .font(.caption2.bold()).foregroundStyle(Color(red: 0.42, green: 0.31, blue: 0.04))
                    .padding(.horizontal, 9).padding(.vertical, 3)
                    .background(Color.gpGold, in: Capsule())
            }

            // Offer -> net
            HStack(alignment: .center, spacing: 10) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Connection offer").font(.system(size: 10)).foregroundStyle(Color.gpInkMuted)
                    Text(usd(offer.gross)).font(.headline)
                        .foregroundStyle(Color.gpInkMuted).strikethrough()
                }
                Text("→").font(.title3).foregroundStyle(Color.gpForest)
                VStack(alignment: .leading, spacing: 2) {
                    Text("Your cost after grants").font(.system(size: 10)).foregroundStyle(Color.gpInkMuted)
                    Text(usd(offer.net)).font(.title2.bold()).foregroundStyle(Color.gpForest)
                }
                Spacer()
            }

            // Grant rows
            VStack(spacing: 8) {
                ForEach(offer.grants) { g in
                    HStack(alignment: .top, spacing: 10) {
                        VStack(alignment: .leading, spacing: 1) {
                            Text(g.name).font(.footnote.bold()).foregroundStyle(Color.gpInk)
                            Text(g.authority).font(.caption2.weight(.semibold)).foregroundStyle(Color.gpForest)
                            Text(g.detail).font(.caption2).foregroundStyle(Color.gpInkMuted).lineSpacing(1)
                        }
                        Spacer()
                        Text("−\(usd(g.amount))").font(.subheadline.bold()).foregroundStyle(Color.gpForest)
                    }
                    .padding(10)
                    .background(Color.gpPanel, in: RoundedRectangle(cornerRadius: 10))
                    .overlay(RoundedRectangle(cornerRadius: 10).strokeBorder(Color.gpLine))
                }
            }

            HStack {
                Text("Total assistance applied").font(.footnote.bold())
                Spacer()
                Text("−\(usd(offer.totalApplied))").font(.footnote.bold()).foregroundStyle(Color.gpForest)
            }
            .padding(.top, 6)

            Text("Grants are illustrative and based on program eligibility — GridPath pre-fills your application so you can claim them in one step.")
                .font(.caption2).foregroundStyle(Color.gpInkMuted).lineSpacing(1)
        }
        .padding(16)
        .background(
            LinearGradient(colors: [Color(red: 0.957, green: 0.973, blue: 0.953), Color.gpPanel],
                           startPoint: .top, endPoint: .bottom),
            in: RoundedRectangle(cornerRadius: 16)
        )
        .overlay(RoundedRectangle(cornerRadius: 16).strokeBorder(Color.gpSageSoft, lineWidth: 1.5))
    }
}
