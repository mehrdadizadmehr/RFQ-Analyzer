import { bg2, bdr } from "../styles/theme";

export default function AppHeader({ isReady }) {
  return (
    <div
      style={{
        background: bg2,
        borderBottom: `1px solid ${bdr}`,
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "linear-gradient(135deg,#3b82f6,#6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}
        >
          ⚙️
        </div>

        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>RFQ Analyzer Pro</div>
          <div style={{ fontSize: 11, color: "#64748b" }}>AI Procurement Intelligence Platform</div>
        </div>
      </div>

      <div
        style={{
          fontSize: 11,
          padding: "3px 12px",
          borderRadius: 20,
          background: isReady ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
          color: isReady ? "#34d399" : "#94a3b8",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: isReady ? "#34d399" : "#64748b",
            display: "inline-block",
          }}
        />
        {isReady ? "آماده تحلیل" : "در انتظار تنظیمات"}
      </div>
    </div>
  );
}
