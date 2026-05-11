import { card, secTitle, bar, bg3, bdr, btn } from "../styles/theme";

const FILE_FIELDS = [
  { key: "purchase", label: "Purchase 2025", desc: "سوابق خرید", icon: "💰" },
  { key: "req25", label: "Request 2025", desc: "درخواست‌ها", icon: "📋" },
  { key: "req26", label: "Request 2026", desc: "درخواست‌ها", icon: "📋" },
];

export default function FileUploadCard({ fileLabels, loadFile, apiTested, testApi }) {
  return (
    <div style={card}>
      <div style={secTitle}>
        <div style={bar} />
        تنظیمات — فایل‌ها و موتورهای تحلیل
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {FILE_FIELDS.map(f => (
          <label
            key={f.key}
            style={{
              background: bg3,
              border: `1.5px ${fileLabels[f.key] ? "solid" : "dashed"} ${fileLabels[f.key] ? "#10b981" : bdr}`,
              borderRadius: 10,
              padding: "16px 12px",
              textAlign: "center",
              cursor: "pointer",
              display: "block",
            }}
          >
            <input
              type="file"
              accept=".xlsx,.xls"
              style={{ display: "none" }}
              onChange={e => loadFile(e, f.key)}
            />
            <div style={{ fontSize: 24, marginBottom: 6 }}>{f.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{f.label}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>{f.desc}</div>
            <div style={{ fontSize: 11, color: fileLabels[f.key] ? "#34d399" : "#64748b" }}>
              {fileLabels[f.key] || "کلیک برای انتخاب"}
            </div>
          </label>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
        <div style={{ background: bg3, border: `1px solid ${apiTested.openai ? "#10b981" : bdr}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>RFQ Extraction Engine</div>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.8, marginBottom: 10 }}>
            برای استخراج Part Number، Quantity، Brand و Category از متن RFQ استفاده می‌شود.
          </div>
          <button style={btn(apiTested.openai ? "primary" : "secondary")} onClick={() => testApi("openai")}>
            {apiTested.openai ? "✅ Extraction متصل" : "تست اتصال Extraction"}
          </button>
        </div>

        <div style={{ background: bg3, border: `1px solid ${apiTested.claude ? "#10b981" : bdr}`, borderRadius: 10, padding: 14 }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Commercial Intelligence Engine</div>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.8, marginBottom: 10 }}>
            برای تحلیل تجاری، ریسک، شانس برد، استراتژی فروش و پیشنهاد نهایی استفاده می‌شود.
          </div>
          <button style={btn(apiTested.claude ? "primary" : "secondary")} onClick={() => testApi("claude")}>
            {apiTested.claude ? "✅ Intelligence متصل" : "تست اتصال Intelligence"}
          </button>
        </div>
      </div>
    </div>
  );
}
