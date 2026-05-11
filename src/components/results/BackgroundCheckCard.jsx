import { card, secTitle, bar, textBox } from "../../styles/theme";

export default function BackgroundCheckCard({ text }) {
  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        🔎 بک‌گراند چک شرکت
      </div>
      <div style={textBox}>{text || "—"}</div>
    </div>
  );
}
