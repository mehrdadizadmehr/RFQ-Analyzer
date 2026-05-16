import { card, secTitle, bar, divider } from "../../styles/theme";

function formatMoney(value, currency = "¥") {
  const n = Number(value || 0);

  if (!Number.isFinite(n) || n <= 0) return "—";

  return `${currency}${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(n)}`;
}

function PriorityBadge({ value }) {
  const tone =
    value === "High"
      ? {
          bg: "rgba(16,185,129,0.15)",
          color: "#34d399",
        }
      : value === "Medium"
        ? {
            bg: "rgba(245,158,11,0.15)",
            color: "#fbbf24",
          }
        : {
            bg: "rgba(148,163,184,0.15)",
            color: "#cbd5e1",
          };

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 20,
        background: tone.bg,
        color: tone.color,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {value || "Low"}
    </span>
  );
}

function EvidenceBadge({ value }) {
  const tone =
    value === "Historical Proven Supplier"
      ? {
          label: "خرید موفق واقعی",
          bg: "rgba(16,185,129,0.15)",
          color: "#34d399",
        }
      : value === "Brand Compatible Supplier"
        ? {
            label: "تطابق برند / قابل بررسی",
            bg: "rgba(59,130,246,0.15)",
            color: "#60a5fa",
          }
        : {
            label: "گزینه بالقوه",
            bg: "rgba(148,163,184,0.15)",
            color: "#cbd5e1",
          };

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 20,
        background: tone.bg,
        color: tone.color,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {tone.label}
    </span>
  );
}


function InfoLine({ label, value }) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  return (
    <div style={{ marginBottom: 4 }}>
      <strong>{label}:</strong> {value}
    </div>
  );
}

function LinkButton({ label, url }) {
  if (!url) return null;

  const safeUrl = String(url || "").trim();

  if (!safeUrl || /^s\d+$/i.test(safeUrl)) return null;

  const href = /^https?:\/\//i.test(safeUrl)
    ? safeUrl
    : `https://${safeUrl}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(59,130,246,0.15)",
        color: "#93c5fd",
        border: "1px solid rgba(59,130,246,0.25)",
        textDecoration: "none",
        fontSize: 12,
        fontWeight: 700,
        marginRight: 6,
        marginTop: 6,
      }}
    >
      {label}
    </a>
  );
}

export default function SupplierIntelligenceCard({ supplierIntelligence }) {
  if (!supplierIntelligence) return null;

  const suppliers = supplierIntelligence.topSuppliers || [];
  const brands = supplierIntelligence.targetBrands || [];

  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...secTitle, marginBottom: 12 }}>
        <div style={bar} />
        🏭 Supplier Intelligence
      </div>

      <div
        style={{
          color: "#94a3b8",
          lineHeight: 1.9,
          marginBottom: 14,
          fontSize: 13,
        }}
      >
        این بخش تامین‌کننده‌های مرتبط با برند RFQ را نشان می‌دهد. اولویت با تامین‌کننده‌هایی است که برای همین برند سابقه خرید موفق، مبلغ خرید قابل اتکا یا تطابق برند قابل بررسی دارند.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            border: "1px solid rgba(148,163,184,0.15)",
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ color: "#64748b", fontSize: 12 }}>
            برندهای هدف RFQ
          </div>

          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            {brands.length > 0 ? (
              brands.map(b => (
                <span
                  key={b}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    background: "rgba(59,130,246,0.15)",
                    color: "#93c5fd",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {String(b).toUpperCase()}
                </span>
              ))
            ) : (
              <span style={{ color: "#94a3b8" }}>—</span>
            )}
          </div>
        </div>

        <div
          style={{
            border: "1px solid rgba(148,163,184,0.15)",
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ color: "#64748b", fontSize: 12 }}>
            تامین‌کننده‌های برتر این برند
          </div>

          <div
            style={{
              marginTop: 8,
              fontSize: 26,
              fontWeight: 700,
              color: "#f8fafc",
            }}
          >
            {suppliers.length}
          </div>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <div
          style={{
            border: "1px dashed rgba(148,163,184,0.2)",
            borderRadius: 10,
            padding: 14,
            color: "#94a3b8",
            lineHeight: 1.9,
          }}
        >
          برای برندهای فعلی RFQ، Supplier تاریخی قابل اتکایی شناسایی نشد.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {suppliers.map((supplier, index) => (
            <div
              key={`${supplier.code}-${index}`}
              style={{
                border: "1px solid rgba(148,163,184,0.12)",
                borderRadius: 12,
                padding: 14,
                background: "rgba(15,23,42,0.35)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "flex-start",
                  marginBottom: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#f8fafc",
                      marginBottom: 4,
                    }}
                  >
                    {supplier.companyName || supplier.code || "Unknown Supplier"}
                  </div>

                  <div style={{ color: "#94a3b8", fontSize: 12 }}>
                    Supplier Code: {supplier.code || "—"}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 6,
                    flexWrap: "wrap",
                    justifyContent: "flex-end",
                  }}
                >
                  <EvidenceBadge
                    value={supplier.procurementEvidenceLevel}
                  />

                  <PriorityBadge value={supplier.priority} />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
                  gap: 14,
                  lineHeight: 1.9,
                  color: "#cbd5e1",
                  fontSize: 13,
                }}
              >
                <div>
                  <InfoLine
                    label="تعداد سفارش / خرید موفق ثبت‌شده"
                    value={supplier.successfulPurchaseCount || 0}
                  />

                  <InfoLine
                    label="مبلغ خرید موفق ثبت‌شده"
                    value={formatMoney(
                      supplier.successfulPurchaseAmount,
                      "¥"
                    )}
                  />

                  {(supplier.successfulPurchaseCount || 0) > 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "6px 10px",
                        borderRadius: 10,
                        background: "rgba(16,185,129,0.10)",
                        color: "#34d399",
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      این تامین‌کننده در فایل Winner سابقه خرید واقعی دارد.
                    </div>
                  )}

                  <InfoLine
                    label="سطح شواهد تامین"
                    value={supplier.procurementEvidenceLevel}
                  />

                  <InfoLine label="Score" value={supplier.score} />

                  <InfoLine
                    label="Brand Match Score"
                    value={supplier.brandMatchScore}
                  />

                  <InfoLine
                    label="Brand Match Strength"
                    value={supplier.exactBrandPurchaseStrength}
                  />
                </div>

                <div>
                  <InfoLine
                    label="Country"
                    value={supplier.country}
                  />

                  <div style={{ marginTop: 4 }}>
                    <LinkButton
                      label="باز کردن وبسایت"
                      url={supplier.website}
                    />

                    <LinkButton
                      label="باز کردن فروشگاه"
                      url={supplier.store}
                    />
                  </div>
                </div>
              </div>

              {supplier.brands?.length > 0 && (
                <>
                  <div style={divider} />

                  <div style={{ marginBottom: 8, color: "#94a3b8" }}>
                    برندهای مرتبط:
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    {supplier.brands.map(brand => (
                      <span
                        key={brand}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          background: supplier.brandMatched
                            ? "rgba(16,185,129,0.15)"
                            : "rgba(148,163,184,0.12)",
                          color: supplier.brandMatched
                            ? "#34d399"
                            : "#cbd5e1",
                          fontSize: 12,
                          fontWeight: supplier.brandMatched ? 700 : 500,
                        }}
                      >
                        {String(brand).toUpperCase()}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {supplier.matchedBrandAliases?.length > 0 && (
                <>
                  <div style={divider} />

                  <div
                    style={{
                      marginBottom: 8,
                      color: "#34d399",
                      fontWeight: 700,
                    }}
                  >
                    Alias Match Intelligence:
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    {supplier.matchedBrandAliases.map(alias => (
                      <span
                        key={alias}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 20,
                          background: "rgba(16,185,129,0.15)",
                          color: "#34d399",
                          fontSize: 12,
                          fontWeight: 700,
                          border: "1px solid rgba(16,185,129,0.25)",
                        }}
                      >
                        {String(alias).toUpperCase()}
                      </span>
                    ))}
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      color: "#94a3b8",
                      fontSize: 12,
                      lineHeight: 1.8,
                    }}
                  >
                    این تامین‌کننده بر اساس تطبیق هوشمند برند، alias detection و overlap بین برند RFQ و سوابق تاریخی تامین‌کننده شناسایی شده است.
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}