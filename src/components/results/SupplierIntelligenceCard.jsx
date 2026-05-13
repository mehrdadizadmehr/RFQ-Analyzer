import { card, secTitle, bar, divider } from "../../styles/theme";

function formatMoney(value) {
  const n = Number(value || 0);

  if (!Number.isFinite(n) || n <= 0) return "—";

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(n);
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
        این بخش بر اساس سوابق واقعی خرید، Supplier Winnerها و برندهای RFQ فعلی ساخته می‌شود. تامین‌کننده‌ها بر اساس تطابق دقیق برند RFQ، تعداد خرید موفق، مبلغ خرید تاریخی و کیفیت اطلاعات رتبه‌بندی شده‌اند.
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

                <PriorityBadge value={supplier.priority} />
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
                    label="Successful Purchases"
                    value={supplier.successfulPurchaseCount}
                  />

                  <InfoLine
                    label="Historical Purchase Amount"
                    value={formatMoney(supplier.successfulPurchaseAmount)}
                  />

                  <InfoLine label="Score" value={supplier.score} />

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

                  <InfoLine
                    label="Website"
                    value={supplier.website}
                  />

                  <InfoLine label="Store" value={supplier.store} />
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}