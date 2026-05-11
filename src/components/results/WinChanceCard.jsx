import { card, secTitle, bar, textBox, divider } from "../../styles/theme";

export default function WinChanceCard({ winChance, ai }) {
  const winScore = winChance?.score || 0;

  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        🎯 شانس برنده شدن پیشنهاد
      </div>

      <div style={textBox}>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: winScore >= 65 ? "#34d399" : winScore >= 40 ? "#fbbf24" : "#f87171",
          }}
        >
          {winScore}%
        </div>

        <div style={divider} />

        <div>
          <strong>سطح:</strong>
          <br />
          {winChance?.level || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>معیارهای اصلی:</strong>
          <br />
          {(winChance?.factors || []).join("، ") || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>افزایش شانس:</strong>
          <br />
          {ai.winChanceCommentary?.howToIncreaseChance || "—"}
        </div>
      </div>
    </div>
  );
}
