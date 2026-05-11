import { card, secTitle, bar } from "../../styles/theme";
import Tag from "../Tag";

export default function ReportHeader({ result }) {
  const { ai, requestStats, customer, rfqNum, winChance } = result;
  const sc = ai.customerScore || 50;
  const winScore = winChance?.score || 0;
  const itemCount = (ai.parts || []).length;

  return (
    <div style={{ ...card, borderRight: "4px solid #3b82f6" }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        Combined Procurement Intelligence Report
      </div>

      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <div
          style={{
            width: 84,
            height: 84,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 700,
            flexShrink: 0,
            background:
              sc >= 70 ? "rgba(16,185,129,0.15)"
              : sc >= 40 ? "rgba(245,158,11,0.15)"
              : "rgba(239,68,68,0.15)",
            color: sc >= 70 ? "#34d399" : sc >= 40 ? "#fbbf24" : "#f87171",
            border: `2px solid ${sc >= 70 ? "#10b981" : sc >= 40 ? "#f59e0b" : "#ef4444"}`,
          }}
        >
          {sc}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>مشتری</div>
          <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>{customer || "نامشخص"}</div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>
            RFQ: {rfqNum || "—"} | {itemCount} Extracted Items | Deal Value: {ai.dealValue || "—"} | Win Chance: {winScore || "—"}%
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag color="blue">{ai.customerLevel || "Regular"}</Tag>
            <Tag color="yellow">Priority: {ai.priority || "Normal"}</Tag>
            <Tag color="green">{requestStats.quality}</Tag>
            <Tag color={winScore >= 65 ? "green" : winScore >= 40 ? "yellow" : "red"}>
              Win Chance: {winScore}%
            </Tag>
          </div>
        </div>
      </div>
    </div>
  );
}
