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

export default function CommercialMatcherCard({ commercialMatcher }) {
  if (!commercialMatcher) {
    return null;
  }

  const matches = commercialMatcher.matches || [];
  const topMatches = matches
    .filter(m => m.matchedRequest)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const matchRate = matches.length
    ? Math.round((commercialMatcher.matchedCount / matches.length) * 100)
    : 0;

  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        🔗 تحلیل اتصال Request ↔ Purchase
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
          این بخش تلاش می‌کند ردیف‌های فایل Purchase را به ردیف‌های متناظر در فایل‌های
          Request وصل کند. اتصال بر اساس Request Code، PI Number، مشتری، برند و مبلغ انجام می‌شود.
        </div>

        <div style={divider} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <StatBox label="کل Purchaseها" value={matches.length || 0} />
          <StatBox
            label="Match شده"
            value={`${commercialMatcher.matchedCount || 0} (${matchRate}%)`}
            tone="green"
          />
          <StatBox
            label="بدون Match"
            value={commercialMatcher.unmatchedCount || 0}
            tone={commercialMatcher.unmatchedCount > 0 ? "yellow" : "green"}
          />
          <StatBox
            label="High Confidence"
            value={commercialMatcher.highConfidenceCount || 0}
            tone="green"
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <StatBox
            label="Revenue شناسایی‌شده"
            value={formatMoney(commercialMatcher.totalRevenue || 0)}
            tone="green"
          />
          <StatBox
            label="Cost شناسایی‌شده"
            value={formatMoney(commercialMatcher.totalCost || 0)}
          />
          <StatBox
            label="Gross Profit"
            value={formatMoney(commercialMatcher.totalGrossProfit || 0)}
            tone="green"
          />
          <StatBox
            label="Average Margin"
            value={`${commercialMatcher.averageMargin || 0}%`}
            tone={commercialMatcher.averageMargin >= 20 ? "green" : "yellow"}
          />
        </div>

        <div style={divider} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 10,
          }}
        >
          <StatBox
            label="Medium Confidence"
            value={commercialMatcher.mediumConfidenceCount || 0}
            tone="yellow"
          />
          <StatBox
            label="Low Confidence"
            value={commercialMatcher.lowConfidenceCount || 0}
            tone="red"
          />
          <StatBox
            label="Confidence Quality"
            value={
              commercialMatcher.highConfidenceCount >= commercialMatcher.mediumConfidenceCount
                ? "Good"
                : "Needs Review"
            }
            tone={
              commercialMatcher.highConfidenceCount >= commercialMatcher.mediumConfidenceCount
                ? "green"
                : "yellow"
            }
          />
        </div>

        {topMatches.length > 0 && (
          <>
            <div style={divider} />

            <div>
              <strong>نمونه بهترین Matchها:</strong>

              <div style={{ marginTop: 10 }}>
                {topMatches.map((m, i) => (
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
                      Revenue: {formatMoney(m.commercialInsights?.revenue || 0)} | Profit:{" "}
                      {formatMoney(m.commercialInsights?.grossProfit || 0)} | Margin:{" "}
                      {m.commercialInsights?.marginPercent || 0}% | Supplier:{" "}
                      {m.commercialInsights?.supplier || "—"}
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
      </div>
    </div>
  );
}
