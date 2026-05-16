import { card, secTitle, bar, textBox, divider } from "../../styles/theme";
import { formatMoney } from "../../utils/numbers";

function BrandStatLine({ label, value, muted = false }) {
  return (
    <div style={{ color: muted ? "#94a3b8" : "#cbd5e1" }}>
      {label}
      <strong style={{ marginRight: 6, color: "#e2e8f0" }}>
        {value}
      </strong>
    </div>
  );
}

export default function BrandStatsCard({ brandStats, ai }) {
  const brandDemandStats = brandStats?.brandDemandStats || [];

  const decisionGradeBrandStats = brandDemandStats
    .filter(b => {
      const hasCustomerPurchase =
        (b.currentCustomerSuccessfulCount || 0) > 0;
      const hasMarketPurchase =
        (b.otherCustomersSuccessfulCount || 0) > 0;
      const hasCustomerDemand =
        (b.currentCustomerRequestCount || 0) > 0;

      return (
        hasCustomerPurchase ||
        hasMarketPurchase ||
        hasCustomerDemand
      );
    })
    .slice(0, 3);

  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        🏷️ تحلیل برند در فایل‌ها
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
          <strong>خلاصه سابقه برندهای RFQ فعلی:</strong>
          <br />
          {brandStats?.summary || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>برندهای شناسایی‌شده در RFQ فعلی:</strong>

          {decisionGradeBrandStats.length > 0 ? (
            <div style={{ marginTop: 10 }}>
              {decisionGradeBrandStats.map((b, i) => (
                <div
                  key={`${b.brand}-${i}`}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
                    <strong style={{ color: "#e2e8f0", direction: "ltr" }}>
                      {b.canonicalBrand || b.brand}
                    </strong>

                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 10px",
                        borderRadius: 20,
                        background:
                          b.totalSuccessfulCount > 0
                            ? "rgba(16,185,129,0.15)"
                            : "rgba(245,158,11,0.15)",
                        color:
                          b.totalSuccessfulCount > 0 ? "#34d399" : "#fbbf24",
                      }}
                    >
                      {b.totalSuccessfulCount > 0
                        ? "سابقه خرید واقعی دارد"
                        : "خرید واقعی ثبت‌شده ندارد"}
                    </span>
                  </div>

                  <BrandStatLine
                    label="درخواست‌های همین مشتری:"
                    value={b.currentCustomerRequestCount || 0}
                  />

                  <BrandStatLine
                    label="خرید واقعی همین مشتری:"
                    value={b.currentCustomerSuccessfulCount || 0}
                  />

                  <BrandStatLine
                    label="درخواست‌های سایر مشتریان:"
                    value={b.otherCustomersRequestCount || 0}
                  />

                  <BrandStatLine
                    label="خرید واقعی سایر مشتریان:"
                    value={b.otherCustomersSuccessfulCount || 0}
                  />

                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      color: "#94a3b8",
                    }}
                  >
                    <BrandStatLine
                      label="جمع کل درخواست‌های این برند:"
                      value={b.totalRequestCount || 0}
                      muted
                    />

                    <BrandStatLine
                      label="جمع کل خریدهای واقعی این برند:"
                      value={b.totalSuccessfulCount || 0}
                      muted
                    />

                    <BrandStatLine
                      label="Revenue شناسایی‌شده برای این برند:"
                      value={formatMoney(b.totalRevenue || 0)}
                      muted
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 10, color: "#fbbf24" }}>
              برای برند اصلی RFQ سابقه تصمیم‌ساز قابل اتکا پیدا نشد. برندهای عمومی، vendor nameها و موارد بدون خرید واقعی یا بدون ارتباط با همین مشتری عمداً حذف شده‌اند.
            </div>
          )}
        </div>


        {!!ai?.brandProductReview?.customerSpecificPurchaseEvidence && (
          <>
            <div style={divider} />

            <div>
              <strong>سوابق خرید همین مشتری برای برند RFQ:</strong>
              <br />
              {ai.brandProductReview.customerSpecificPurchaseEvidence}
            </div>
          </>
        )}

        {!!ai?.brandProductReview?.marketSimilarPurchaseEvidence && (
          <>
            <div style={divider} />

            <div>
              <strong>سوابق مشابه بازار برای همین برند/دسته:</strong>
              <br />
              {ai.brandProductReview.marketSimilarPurchaseEvidence}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
