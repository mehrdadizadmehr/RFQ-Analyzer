import { Fragment, useMemo, useState } from "react";

import { card, secTitle, bar, th, td, bg3, bdr } from "../../styles/theme";
import SBadge from "../SBadge";

const HEADERS = [
  "Part Number",
  "Qty",
  "Manufacturer",
  "Status",
  "China",
  "UAE",
];

export default function PartsTable({ parts, ai }) {
  const [expandedRows, setExpandedRows] = useState({});

  const safeParts = Array.isArray(parts) ? parts : [];

  const summary = useMemo(() => {
    const oemCount = safeParts.filter(p =>
      String(p?.status || "").toLowerCase().includes("oem")
    ).length;

    const criticalCount = safeParts.filter(p =>
      String(p?.status || "").toLowerCase().includes("critical")
    ).length;

    return {
      total: safeParts.length,
      oemCount,
      criticalCount,
    };
  }, [safeParts]);

  const sourcingStrategy = ai?.sourcingStrategy || null;

  const toggleRow = index => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div style={{ ...card, overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ ...secTitle, marginBottom: 0 }}>
          <div style={bar} />
          ⚙️ تحلیل قطعات استخراج‌شده
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <SmallStat label="تعداد قطعات" value={summary.total} />
          <SmallStat label="OEM" value={summary.oemCount} />
          <SmallStat label="Critical" value={summary.criticalCount} />
        </div>
      </div>

      <div
        style={{
          overflowX: "auto",
          border: `1px solid ${bdr}`,
          borderRadius: 12,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
            minWidth: 920,
          }}
        >
          <thead>
            <tr>
              {HEADERS.map(h => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}

              <th style={th}>جزئیات</th>
            </tr>
          </thead>

          <tbody>
            {safeParts.map((p, i) => {
              const expanded = !!expandedRows[i];

              return (
                <Fragment key={p.partNumber || `part-${i}`}>
                  <tr
                    key={`row-${i}`}
                    style={{
                      background: expanded
                        ? "rgba(59,130,246,0.04)"
                        : "transparent",
                    }}
                  >
                    <td style={td}>
                      <code style={{ color: "#60a5fa", fontSize: 11 }}>
                        {p.partNumber || "—"}
                      </code>
                    </td>

                    <td style={td}>{p.qty || "—"}</td>

                    <td style={td}>{p.manufacturer || "—"}</td>

                    <td style={td}>
                      <SBadge status={p.status} />
                    </td>

                    <td style={td}>
                      <div>{p.priceChina || "—"}</div>

                      {!!p.estimatedLineTotalChina && (
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 11,
                            color: "#94a3b8",
                          }}
                        >
                          Total: {p.estimatedLineTotalChina}
                        </div>
                      )}
                    </td>

                    <td style={td}>
                      <div>{p.priceUAE || "—"}</div>

                      {!!p.estimatedLineTotalUAE && (
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 11,
                            color: "#94a3b8",
                          }}
                        >
                          Total: {p.estimatedLineTotalUAE}
                        </div>
                      )}
                    </td>

                    <td style={td}>
                      <button
                        onClick={() => toggleRow(i)}
                        style={{
                          padding: "6px 10px",
                          borderRadius: 8,
                          border: `1px solid ${bdr}`,
                          background: expanded
                            ? "rgba(59,130,246,0.12)"
                            : bg3,
                          color: expanded ? "#60a5fa" : "#cbd5e1",
                          cursor: "pointer",
                          fontSize: 12,
                          fontFamily: "inherit",
                        }}
                      >
                        {expanded ? "بستن" : "مشاهده"}
                      </button>
                    </td>
                  </tr>

                  {expanded && (
                    <tr key={`expanded-${i}`}>
                      <td
                        colSpan={7}
                        style={{
                          ...td,
                          background: "rgba(255,255,255,0.02)",
                          padding: 16,
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 16,
                          }}
                        >
                          <ExpandedField
                            label="Description"
                            value={p.description}
                          />

                          <ExpandedField
                            label="Application"
                            value={p.application}
                          />

                          <ExpandedField
                            label="Alternatives"
                            value={p.alternatives}
                          />

                          <ExpandedField
                            label="Procurement Notes"
                            value={p.procurementNotes || p.sourcingNotes}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        style={{
          marginTop: 16,
          background: bg3,
          border: `1px solid ${bdr}`,
          borderRadius: 12,
          padding: 16,
          fontSize: 13,
          lineHeight: 1.9,
          color: "#94a3b8",
          direction: "rtl",
          textAlign: "right",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: "#e2e8f0",
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>جمع‌بندی تخمینی ارزش RFQ</span>

          <span
            style={{
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 20,
              background: "rgba(59,130,246,0.12)",
              color: "#60a5fa",
            }}
          >
            AI Estimated Pricing
          </span>
        </div>

        <div style={{ marginBottom: 8 }}>
          برآورد کل China sourcing:
          <strong style={{ marginRight: 6, color: "#e2e8f0" }}>
            {ai?.estimatedTotalChina || "نامشخص"}
          </strong>
        </div>

        <div>
          برآورد کل UAE market:
          <strong style={{ marginRight: 6, color: "#e2e8f0" }}>
            {ai?.estimatedTotalUAE || "نامشخص"}
          </strong>
        </div>

        {!!ai?.pricingNotes && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: `1px solid ${bdr}`,
              whiteSpace: "pre-line",
            }}
          >
            <strong style={{ color: "#e2e8f0" }}>
              تحلیل و فرضیات قیمت‌گذاری:
            </strong>
            <br />
            {ai.pricingNotes}
          </div>
        )}

        {!!sourcingStrategy && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: `1px solid ${bdr}`,
              whiteSpace: "pre-line",
            }}
          >
            <strong style={{ color: "#e2e8f0" }}>
              استراتژی تامین / OEM Sourcing:
            </strong>

            <div style={{ marginTop: 10 }}>
              <strong style={{ color: "#cbd5e1" }}>
                مسیر پیشنهادی تامین:
              </strong>{" "}
              {sourcingStrategy.preferredRoute || "—"}
            </div>

            <div style={{ marginTop: 8 }}>
              <strong style={{ color: "#cbd5e1" }}>
                سطح الزام OEM:
              </strong>{" "}
              {sourcingStrategy.oemRequirementLevel || "—"}
            </div>

            <div style={{ marginTop: 8 }}>
              <strong style={{ color: "#cbd5e1" }}>
                مدارک / Certificate مورد نیاز:
              </strong>{" "}
              {sourcingStrategy.certificateRequirement || "—"}
            </div>

            <div style={{ marginTop: 8 }}>
              <strong style={{ color: "#cbd5e1" }}>
                نوع تامین‌کننده پیشنهادی:
              </strong>{" "}
              {sourcingStrategy.recommendedSupplierType || "—"}
            </div>

            <div style={{ marginTop: 8 }}>
              <strong style={{ color: "#cbd5e1" }}>
                ریسک تامین:
              </strong>{" "}
              {sourcingStrategy.sourcingRisk || "—"}
            </div>

            <div style={{ marginTop: 8 }}>
              <strong style={{ color: "#cbd5e1" }}>
                دلیل پیشنهاد مسیر تامین:
              </strong>{" "}
              {sourcingStrategy.sourcingReason || "—"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SmallStat({ label, value }) {
  return (
    <div
      style={{
        padding: "6px 10px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
        fontSize: 12,
      }}
    >
      <span style={{ color: "#94a3b8" }}>{label}:</span>
      <strong style={{ marginRight: 6 }}>{value}</strong>
    </div>
  );
}

function ExpandedField({ label, value }) {
  return (
    <div>
      <div
        style={{
          fontSize: 11,
          color: "#64748b",
          marginBottom: 6,
        }}
      >
        {label}
      </div>

      <div style={{ color: "#e2e8f0", lineHeight: 1.8 }}>
        {value || "—"}
      </div>
    </div>
  );
}
