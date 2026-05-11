import { card, secTitle, bar, textBox, divider } from "../../styles/theme";

export default function SalesRecommendationCard({ ai }) {
  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        💡 توصیه تیم فروش
      </div>

      <div
        style={{
          ...textBox,
          textAlign: "right",
          direction: "rtl",
          unicodeBidi: "plaintext",
          lineHeight: 2,
          whiteSpace: "pre-line",
        }}
      >
        <div>
          <strong>توصیه:</strong>
          <br />
          {ai?.recommendation || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>ریسک‌ها:</strong>
          <br />
          {ai?.risks || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>اقدام بعدی:</strong>
          <br />
          {ai?.nextStep || "—"}
        </div>

        {!!ai?.supplierSuggestions?.length && (
          <>
            <div style={divider} />

            <div>
              <strong>پیشنهاد تامین‌کننده:</strong>

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
