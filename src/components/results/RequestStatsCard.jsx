import { card, secTitle, bar, mRow } from "../../styles/theme";
import { formatMoney } from "../../utils/numbers";

export default function RequestStatsCard({ requestStats }) {
  return (
    <div style={card}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        📋 سوابق فرصت‌های این مشتری
      </div>

      <div style={mRow}>
        <span style={{ color: "#64748b" }}>تعداد فرصت‌های مشتری</span>
        <span style={{ fontWeight: 600 }}>{requestStats.customerRequests}</span>
      </div>

      <div style={mRow}>
        <span style={{ color: "#64748b" }}>فرصت‌های فروش‌شده</span>
        <span style={{ fontWeight: 600, color: "#34d399" }}>{requestStats.soldRequests}</span>
      </div>

      <div style={mRow}>
        <span style={{ color: "#64748b" }}>ارزش فرصت‌ها</span>
        <span style={{ fontWeight: 600, color: "#60a5fa" }}>{formatMoney(requestStats.requestAmount)}</span>
      </div>

      <div style={mRow}>
        <span style={{ color: "#64748b" }}>نرخ تبدیل</span>
        <span style={{ fontWeight: 600 }}>{requestStats.conversionRate}%</span>
      </div>

      <div style={{ marginTop: 12, color: "#94a3b8", lineHeight: 1.9, fontSize: 13 }}>
        کیفیت مشتری: {requestStats.quality}
      </div>
    </div>
  );
}
