import { card, secTitle, bar, textBox, divider } from "../../styles/theme";

export default function BrandStatsCard({ brandStats, ai }) {
  const brandDemandStats = brandStats?.brandDemandStats || [];

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

          {brandDemandStats.length > 0 ? (
            <div style={{ marginTop: 10 }}>
              {brandDemandStats.map((b, i) => (
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
                      {b.brand}
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
                        ? "سابقه موفق دارد"
                        : "بدون خرید موفق مشابه"}
                    </span>
                  </div>

                  <div>
                    درخواست‌های همین مشتری:
                    <strong style={{ marginRight: 6 }}>
                      {b.currentCustomerRequestCount || 0}
                    </strong>
                  </div>

                  <div>
                    خرید / فروش موفق همین مشتری:
                    <strong style={{ marginRight: 6 }}>
                      {b.currentCustomerSuccessfulCount || 0}
                    </strong>
                  </div>

                  <div>
                    درخواست‌های سایر مشتریان:
                    <strong style={{ marginRight: 6 }}>
                      {b.otherCustomersRequestCount || 0}
                    </strong>
                  </div>

                  <div>
                    خرید / فروش موفق سایر مشتریان:
                    <strong style={{ marginRight: 6 }}>
                      {b.otherCustomersSuccessfulCount || 0}
                    </strong>
                  </div>

                  <div style={{ marginTop: 6, color: "#94a3b8" }}>
                    جمع کل درخواست‌های این برند در فایل‌ها:
                    <strong style={{ marginRight: 6 }}>
                      {b.totalRequestCount || 0}
                    </strong>
                    {" | "}
                    جمع کل موفق‌ها:
                    <strong style={{ marginRight: 6 }}>
                      {b.totalSuccessfulCount || 0}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ marginTop: 10, color: "#fbbf24" }}>
              برند قابل اتکایی از متن RFQ با سوابق فایل‌ها match نشد.
            </div>
          )}
        </div>

        {!!ai?.brandProductReview?.similarPurchaseEvidence && (
          <>
            <div style={divider} />

            <div>
              <strong>تحلیل AI از سوابق مشابه:</strong>
              <br />
              {ai.brandProductReview.similarPurchaseEvidence}
            </div>
          </>
        )}

        {!!ai?.brandProductReview?.brandAttractiveness && (
          <>
            <div style={divider} />

            <div>
              <strong>جذابیت برند از دید فروش:</strong>
              <br />
              {ai.brandProductReview.brandAttractiveness}
            </div>
          </>
        )}

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
