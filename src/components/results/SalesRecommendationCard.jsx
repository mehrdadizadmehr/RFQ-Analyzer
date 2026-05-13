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
      </div>
    </div>
  );
}
