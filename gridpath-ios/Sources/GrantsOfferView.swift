import SwiftUI

// "This is your offer — and these grants make it much cheaper."
struct GrantsOfferView: View {
    let offer: GrantOffer

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 12) {
                NeoIconTile(systemName: "banknote.fill", fill: .gpGold, size: 42, symbolSize: 18)
                Text("Your offer & available grants")
                    .font(.system(size: 15, weight: .black, design: .rounded)).foregroundStyle(Color.gpInk)
                Spacer()
                Text("SAVE \(offer.percentOff)%")
                    .font(.system(size: 11, weight: .black, design: .rounded)).foregroundStyle(Color.gpInk)
                    .padding(.horizontal, 9).padding(.vertical, 4)
                    .background(Color.gpGold, in: RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(Color.gpInk, lineWidth: 2))
            }

            // Offer -> net
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("CONNECTION OFFER").font(.system(size: 10, weight: .black, design: .rounded)).tracking(0.4).foregroundStyle(Color.gpInkMuted)
                    Text(usd(offer.gross)).font(.system(size: 18, weight: .bold, design: .rounded))
                        .foregroundStyle(Color.gpTerracotta).strikethrough(true, color: .gpTerracotta)
                }
                Image(systemName: "arrow.right").font(.system(size: 16, weight: .heavy)).foregroundStyle(Color.gpInk)
                VStack(alignment: .leading, spacing: 2) {
                    Text("YOUR COST AFTER GRANTS").font(.system(size: 10, weight: .black, design: .rounded)).tracking(0.4).foregroundStyle(Color.gpInkMuted)
                    Text(usd(offer.net)).font(.system(size: 24, weight: .black, design: .rounded)).foregroundStyle(Color.gpForest)
                }
                Spacer()
            }

            // Grant rows
            VStack(spacing: 10) {
                ForEach(offer.grants) { g in
                    HStack(alignment: .top, spacing: 10) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(g.name).font(.system(size: 14, weight: .heavy, design: .rounded)).foregroundStyle(Color.gpInk)
                            Text(g.authority).font(.system(size: 11, weight: .bold)).foregroundStyle(Color.gpGreen)
                            Text(g.detail).font(.system(size: 11, weight: .medium)).foregroundStyle(Color.gpInkMuted).lineSpacing(1)
                        }
                        Spacer()
                        Text("−\(usd(g.amount))").font(.system(size: 15, weight: .black, design: .rounded)).foregroundStyle(Color.gpGreen)
                    }
                    .padding(10)
                    .neoSurface(fill: .white, radius: 10, border: 3, shadow: 3)
                }
            }

            HStack {
                Text("Total assistance applied").font(.system(size: 14, weight: .heavy, design: .rounded))
                Spacer()
                Text("−\(usd(offer.totalApplied))").font(.system(size: 14, weight: .black, design: .rounded)).foregroundStyle(Color.gpGreen)
            }
            .padding(.top, 2)

            Text("Grants are illustrative and based on program eligibility — GridPath pre-fills your application so you can claim them in one step.")
                .font(.system(size: 11, weight: .medium)).foregroundStyle(Color.gpInkMuted).lineSpacing(1)
        }
        .neoCard(fill: .gpCard, radius: 12, border: 3, shadow: 5)
    }
}
