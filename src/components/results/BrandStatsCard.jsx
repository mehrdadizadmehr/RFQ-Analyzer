import { card, secTitle, bar, textBox, divider } from "../../styles/theme";

export default function BrandStatsCard({ brandStats, ai }) {
  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        🏷️ تحلیل برند و محصول در فایل‌ها
      </div>

      <div
        style={{
          ...textBox,
          textAlign: "right",
          direction: "rtl",
          lineHeight: 2,
        }}
      >
        <div>
          <strong>وضعیت بازار و سابقه فایل‌ها:</strong>
          <br />
          {brandStats?.summary || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>برندهای پرتکرار:</strong>
          <br />
          {(brandStats?.topBrandsAll || [])
            .map(x => `${x.name} (${x.count})`)
            .join(" ، ") || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>محصولات / مدل‌های پرتکرار:</strong>
          <br />
          {(brandStats?.topPartsAll || [])
            .map(x => `${x.name} (${x.count})`)
            .join(" ، ") || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>سوابق خرید مشابه:</strong>
          <br />
          {ai?.brandProductReview?.similarPurchaseEvidence || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>وضعیت تقاضای برند / مدل:</strong>

          <div style={{ marginTop: 10 }}>
            تعداد تکرار برند در کل فایل‌ها:
            <strong style={{ marginRight: 6 }}>
              {brandStats?.mentionedBrandCount || 0}
            </strong>
          </div>

          <div>
            تعداد تکرار مدل / محصول:
            <strong style={{ marginRight: 6 }}>
              {brandStats?.mentionedProductCount || 0}
            </strong>
          </div>

          <div>
            تعداد خریدهای موفق مشابه:
            <strong style={{ marginRight: 6 }}>
              {brandStats?.similarSuccessfulPurchasesCount || 0}
            </strong>
          </div>

          {!!brandStats?.similarSuccessfulPurchasesAmount && (
            <div>
              ارزش تقریبی خریدهای مشابه:
              <strong style={{ marginRight: 6 }}>
                {brandStats.similarSuccessfulPurchasesAmount}
              </strong>
            </div>
          )}
        </div>

        {!!ai?.supplierSuggestions?.length && (
          <>
            <div style={divider} />

            <div>
              <strong>پیشنهاد تامین‌کننده / سورسینگ:</strong>

              <div style={{ marginTop: 10 }}>
                {ai.supplierSuggestions.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: 10,
                      padding: 10,
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.02)",
                    }}
                  >
                    <div>
                      <strong>{s.supplierName || "Unknown Supplier"}</strong>
                    </div>

                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      منطقه تامین: {s.region || "Global"}
                    </div>

                    <div style={{ marginTop: 6 }}>
                      {s.reason || "—"}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
