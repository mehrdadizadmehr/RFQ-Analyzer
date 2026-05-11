import { card, secTitle, bar, textBox, divider } from "../../styles/theme";

export default function SalesRecommendationCard({ ai }) {
  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        💡 توصیه تیم فروش
      </div>

      <div style={textBox}>
        <div>
          <strong>Recommendation:</strong>
          <br />
          {ai.recommendation || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>Risks:</strong>
          <br />
          {ai.risks || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>Next Step:</strong>
          <br />
          {ai.nextStep || "—"}
        </div>
      </div>
    </div>
  );
}
