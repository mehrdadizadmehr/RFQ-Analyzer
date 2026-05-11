import { card, secTitle, bar, textBox } from "../../styles/theme";

export default function SummaryCard({ summary }) {
  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        📝 خلاصه درخواست
      </div>
      <div style={textBox}>{summary || "—"}</div>
    </div>
  );
}
