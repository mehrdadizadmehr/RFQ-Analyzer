import { card, secTitle, bar, mRow } from "../../styles/theme";
import { formatMoney } from "../../utils/numbers";

export default function PurchaseStatsCard({ purchaseStats }) {
  return (
    <div style={card}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        💰 سوابق خرید واقعی
      </div>

      <div style={mRow}>
        <span style={{ color: "#64748b" }}>خریدهای فایل Purchase</span>
        <span style={{ fontWeight: 600 }}>{purchaseStats.filePurchaseCount}</span>
      </div>

      <div style={mRow}>
        <span style={{ color: "#64748b" }}>مبلغ خرید فایل</span>
        <span style={{ fontWeight: 600, color: "#60a5fa" }}>{formatMoney(purchaseStats.filePurchaseAmount)}</span>
      </div>

      <div style={mRow}>
        <span style={{ color: "#64748b" }}>خریدهای دستی</span>
        <span style={{ fontWeight: 600, color: "#34d399" }}>{purchaseStats.manualPurchaseCount}</span>
      </div>

      <div style={mRow}>
        <span style={{ color: "#64748b" }}>مبلغ خریدهای دستی</span>
        <span style={{ fontWeight: 600, color: "#60a5fa" }}>{formatMoney(purchaseStats.manualPurchaseAmount)}</span>
      </div>

      <div style={mRow}>
        <span style={{ color: "#64748b" }}>جمع کل خرید واقعی</span>
        <span style={{ fontWeight: 700, color: "#34d399" }}>{formatMoney(purchaseStats.totalPurchaseAmount)}</span>
      </div>
    </div>
  );
}
