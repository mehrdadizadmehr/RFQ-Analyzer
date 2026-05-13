
import { card, secTitle, bar, textBox, divider } from "../../styles/theme";
import { formatMoney } from "../../utils/numbers";

function StatBox({ label, value, tone = "default" }) {
  const color =
    tone === "green"
      ? "#34d399"
      : tone === "yellow"
        ? "#fbbf24"
        : tone === "red"
          ? "#f87171"
          : "#e2e8f0";

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function MatchReason({ reason }) {
  const labelMap = {
    pi_number_match: "PI Number",
    customer_match: "Customer",
    brand_match: "Brand",
    amount_match_5pct: "Amount ±5%",
    amount_match_15pct: "Amount ±15%",
  };

  const label = reason?.startsWith("request_code:")
    ? `Request Code ${reason.replace("request_code:", "")}`
    : labelMap[reason] || reason;

  return (
    <span
      style={{
        display: "inline-block",
        margin: "2px 4px",
        padding: "2px 8px",
        borderRadius: 20,
        background: "rgba(59,130,246,0.12)",
        color: "#60a5fa",
        fontSize: 11,
      }}
    >
      {label}
    </span>
  );
}

function MiniList({ title, items }) {
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <div>
      <strong>{title}</strong>
      <div style={{ marginTop: 8 }}>
        {items.map((x, i) => (
          <span
            key={`${x}-${i}`}
            style={{
              display: "inline-block",
              margin: "3px 4px",
              padding: "3px 9px",
              borderRadius: 20,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.06)",
              color: "#cbd5e1",
              direction: "ltr",
            }}
          >
            {x}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CommercialMatcherCard({ commercialMatcher }) {
  if (!commercialMatcher) return null;

  const relevantMatches = commercialMatcher.relevantMatches || [];

  const topRelevantMatches = relevantMatches
    .filter(m => m.matchedRequest)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const hasRelevantData = relevantMatches.length > 0;

  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        🔗 سوابق تجاری مرتبط با این RFQ
      </div>

      <div
        style={{
          ...textBox,
          textAlign: "right",
          direction: "rtl",
          lineHeight: 1.9,
        }}
      >
        <div>
          این بخش فقط خریدها و فروش‌هایی را نشان می‌دهد که به مشتری فعلی یا برندهای مرتبط با RFQ فعلی نزدیک هستند. آمار کلی فایل‌ها اینجا ملاک تصمیم نیست؛ ملاک، ارتباط واقعی با همین درخواست است.
        </div>

        <div style={divider} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <StatBox
            label="Match مرتبط با این RFQ"
            value={commercialMatcher.relevantMatchCount || 0}
            tone={hasRelevantData ? "green" : "yellow"}
          />

          <StatBox
            label="Revenue مرتبط"
            value={formatMoney(commercialMatcher.relevantRevenue || 0)}
            tone={hasRelevantData ? "green" : "default"}
          />

          <StatBox
            label="Gross Profit مرتبط"
            value={formatMoney(commercialMatcher.relevantGrossProfit || 0)}
            tone={hasRelevantData ? "green" : "default"}
          />

          <StatBox
            label="Margin مرتبط"
            value={`${commercialMatcher.relevantAverageMargin || 0}%`}
            tone={commercialMatcher.relevantAverageMargin >= 20 ? "green" : "yellow"}
          />
        </div>

        <div style={divider} />

        {hasRelevantData ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <MiniList
                title="Supplierهای مرتبط قبلی:"
                items={commercialMatcher.topRelevantSuppliers}
              />

              <MiniList
                title="برندهای مرتبط قبلی:"
                items={commercialMatcher.topRelevantBrands}
              />
            </div>

            {topRelevantMatches.length > 0 && (
              <>
                <div style={divider} />

                <div>
                  <strong>نمونه سوابق مرتبط:</strong>

                  <div style={{ marginTop: 10 }}>
                    {topRelevantMatches.map((m, i) => (
                      <div
                        key={i}
                        style={{
                          marginBottom: 10,
                          padding: 12,
                          borderRadius: 10,
                          background: "rgba(255,255,255,0.02)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            flexWrap: "wrap",
                            marginBottom: 8,
                          }}
                        >
                          <strong style={{ color: "#e2e8f0" }}>
                            Purchase Row #{m.purchaseIndex + 1}
                          </strong>

                          <span
                            style={{
                              padding: "2px 10px",
                              borderRadius: 20,
                              fontSize: 11,
                              background:
                                m.confidence === "high"
                                  ? "rgba(16,185,129,0.15)"
                                  : m.confidence === "medium"
                                    ? "rgba(245,158,11,0.15)"
                                    : "rgba(239,68,68,0.15)",
                              color:
                                m.confidence === "high"
                                  ? "#34d399"
                                  : m.confidence === "medium"
                                    ? "#fbbf24"
                                    : "#f87171",
                            }}
                          >
                            {m.confidence} | score {m.score}
                          </span>
                        </div>

                        <div style={{ color: "#94a3b8", marginBottom: 8 }}>
                          Brand: {m.commercialInsights?.brand || "—"} | Supplier:{" "}
                          {m.commercialInsights?.supplier || "—"} | Revenue:{" "}
                          {formatMoney(m.commercialInsights?.revenue || 0)} | Profit:{" "}
                          {formatMoney(m.commercialInsights?.grossProfit || 0)} | Margin:{" "}
                          {m.commercialInsights?.marginPercent || 0}%
                        </div>

                        <div style={{ color: "#64748b", marginBottom: 8, direction: "ltr", textAlign: "left" }}>
                          PI: {m.commercialInsights?.purchasePi || "—"} | Request Code:{" "}
                          {m.commercialInsights?.requestCode || "—"}
                        </div>

                        <div>
                          {(m.matchReasons || []).map(reason => (
                            <MatchReason key={reason} reason={reason} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div style={{ color: "#fbbf24" }}>
            برای مشتری یا برندهای این RFQ، سابقه خرید مرتبط قابل اتکایی در فایل Purchase پیدا نشد. این به معنی نبودن درخواست‌های قبلی نیست؛ یعنی خرید واقعی مرتبط از روی matcher شناسایی نشده است.
          </div>
        )}

        <div style={divider} />

        <div style={{ color: "#64748b", fontSize: 12 }}>
          آمار کلی matcher برای کنترل کیفیت: کل Matchها {commercialMatcher.matchedCount || 0} از {(commercialMatcher.matches || []).length || 0} Purchase row | High confidence: {commercialMatcher.highConfidenceCount || 0} | Medium: {commercialMatcher.mediumConfidenceCount || 0} | Low: {commercialMatcher.lowConfidenceCount || 0}
        </div>
      </div>
    </div>
  );
}
