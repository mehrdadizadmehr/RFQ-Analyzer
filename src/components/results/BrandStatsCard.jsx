import { card, secTitle, bar, textBox, divider } from "../../styles/theme";

export default function BrandStatsCard({ brandStats, ai }) {
  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        🏷️ تحلیل برند و محصول در فایل‌ها
      </div>

      <div style={textBox}>
        <div>
          <strong>Market Activity:</strong>
          <br />
          {brandStats?.summary || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>Top Brands:</strong>
          <br />
          {(brandStats?.topBrandsAll || []).map(x => `${x.name} (${x.count})`).join(", ") || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>Top Products:</strong>
          <br />
          {(brandStats?.topPartsAll || []).map(x => `${x.name} (${x.count})`).join(", ") || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>Similar Purchase Evidence:</strong>
          <br />
          {ai.brandProductReview?.similarPurchaseEvidence || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>Brand / Model Demand Check:</strong>
          <br />
          Global brand mentions: {brandStats?.mentionedBrandCount || 0}
          <br />
          Global product/model mentions: {brandStats?.mentionedProductCount || 0}
          <br />
          Similar successful purchase records: {brandStats?.similarSuccessfulPurchasesCount || 0}
        </div>
      </div>
    </div>
  );
}
