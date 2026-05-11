import { card, secTitle, bar, bg3, bdr } from "../styles/theme";

export default function ProgressSteps({ steps }) {
  return (
    <div style={card}>
      <div style={secTitle}>
        <div style={bar} />
        در حال پردازش...
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map(s => (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              background:
                s.state === "active" ? "rgba(59,130,246,0.08)"
                : s.state === "done" ? "rgba(16,185,129,0.06)"
                : s.state === "error" ? "rgba(239,68,68,0.06)"
                : bg3,
              border: `1px solid ${
                s.state === "active" ? "#3b82f6"
                : s.state === "done" ? "#10b981"
                : s.state === "error" ? "#ef4444"
                : bdr
              }`,
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            <span style={{ fontSize: 17, width: 24, textAlign: "center" }}>
              {s.state === "active" ? "⏳" : s.state === "done" ? "✅" : s.state === "error" ? "❌" : s.icon}
            </span>

            <span style={{ flex: 1 }}>{s.text}</span>

            <span
              style={{
                fontSize: 10,
                padding: "2px 8px",
                borderRadius: 20,
                fontWeight: 600,
                background:
                  s.state === "active" ? "rgba(59,130,246,0.2)"
                  : s.state === "done" ? "rgba(16,185,129,0.2)"
                  : "rgba(100,116,139,0.15)",
                color:
                  s.state === "active" ? "#60a5fa"
                  : s.state === "done" ? "#34d399"
                  : "#94a3b8",
              }}
            >
              {s.state === "active" ? "در حال پردازش"
               : s.state === "done" ? "تکمیل"
               : s.state === "error" ? "خطا"
               : "در انتظار"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
