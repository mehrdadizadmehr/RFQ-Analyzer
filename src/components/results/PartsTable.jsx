import { card, secTitle, bar, th, td, bg3, bdr } from "../../styles/theme";
import SBadge from "../SBadge";

const HEADERS = [
  "Part Number",
  "Qty",
  "Manufacturer",
  "Description",
  "Application",
  "Status",
  "China Unit Price",
  "China Line Total",
  "UAE Unit Price",
  "UAE Line Total",
  "Alternatives",
];

export default function PartsTable({ parts, ai }) {
  return (
    <div style={{ ...card, overflowX: "auto" }}>
      <div style={{ ...secTitle, marginBottom: 12 }}>
        <div style={bar} />
        ⚙️ تحلیل قطعات استخراج‌شده
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {HEADERS.map(h => <th key={h} style={th}>{h}</th>)}
          </tr>
        </thead>

        <tbody>
          {parts.map((p, i) => (
            <tr key={i}>
              <td style={td}><code style={{ color: "#60a5fa", fontSize: 11 }}>{p.partNumber || "—"}</code></td>
              <td style={td}>{p.qty || "—"}</td>
              <td style={td}>{p.manufacturer || "—"}</td>
              <td style={td}>{p.description || "—"}</td>
              <td style={td}>{p.application || "—"}</td>
              <td style={td}><SBadge status={p.status} /></td>
              <td style={td}>{p.priceChina || "—"}</td>
              <td style={td}>{p.estimatedLineTotalChina || "—"}</td>
              <td style={td}>{p.priceUAE || "—"}</td>
              <td style={td}>{p.estimatedLineTotalUAE || "—"}</td>
              <td style={td}>{p.alternatives || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        style={{
          marginTop: 16,
          background: bg3,
          border: `1px solid ${bdr}`,
          borderRadius: 10,
          padding: 14,
          fontSize: 13,
          lineHeight: 1.9,
          color: "#94a3b8",
          direction: "rtl",
          textAlign: "right",
        }}
      >
        <div style={{ fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
          جمع‌بندی تخمینی ارزش RFQ
        </div>

        <div>
          برآورد کل China sourcing:
          <strong style={{ marginRight: 6, color: "#e2e8f0" }}>
            {ai?.estimatedTotalChina || "نامشخص"}
          </strong>
        </div>

        <div>
          برآورد کل UAE market:
          <strong style={{ marginRight: 6, color: "#e2e8f0" }}>
            {ai?.estimatedTotalUAE || "نامشخص"}
          </strong>
        </div>

        {!!ai?.pricingNotes && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: `1px solid ${bdr}`,
              whiteSpace: "pre-line",
            }}
          >
            <strong style={{ color: "#e2e8f0" }}>فرضیات قیمت‌گذاری:</strong>
            <br />
            {ai.pricingNotes}
          </div>
        )}
      </div>
    </div>
  );
}
