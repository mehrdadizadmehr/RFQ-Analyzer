import { card, secTitle, bar, textBox } from "../../styles/theme";

export default function SummaryCard({ summary }) {
  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        📝 خلاصه درخواست
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
        {summary || "—"}
      </div>
    </div>
  );
}
