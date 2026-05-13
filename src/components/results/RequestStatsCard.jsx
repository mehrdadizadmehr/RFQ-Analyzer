import { card, secTitle, bar, mRow } from "../../styles/theme";
import { formatMoney } from "../../utils/numbers";

export default function RequestStatsCard({ requestStats }) {
  const manualPurchaseCount = requestStats.manualPurchaseCount || 0;
  const manualPurchaseAmount = requestStats.manualPurchaseAmount || 0;

  const totalCommercialEvidence =
    (requestStats.soldRequests || 0) + manualPurchaseCount;

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
        <span style={{ color: "#64748b" }}>WIN ثبت‌شده در فایل Request</span>
        <span style={{ fontWeight: 600, color: "#34d399" }}>
          {requestStats.soldRequests}
        </span>
      </div>

      {(manualPurchaseCount > 0 || manualPurchaseAmount > 0) && (
        <>
          <div style={mRow}>
            <span style={{ color: "#64748b" }}>خرید / فروش دستی ثبت‌شده</span>
            <span style={{ fontWeight: 600, color: "#fbbf24" }}>
              {manualPurchaseCount}
            </span>
          </div>

          <div style={mRow}>
            <span style={{ color: "#64748b" }}>مبلغ خریدهای دستی</span>
            <span style={{ fontWeight: 600, color: "#fbbf24" }}>
              {formatMoney(manualPurchaseAmount)}
            </span>
          </div>

          <div style={mRow}>
            <span style={{ color: "#64748b" }}>جمع کل شواهد فروش واقعی</span>
            <span style={{ fontWeight: 700, color: "#34d399" }}>
              {totalCommercialEvidence}
            </span>
          </div>
        </>
      )}

      <div style={mRow}>
        <span style={{ color: "#64748b" }}>ارزش فرصت‌ها</span>
        <span style={{ fontWeight: 600, color: "#60a5fa" }}>{formatMoney(requestStats.requestAmount)}</span>
      </div>

      <div style={mRow}>
        <span style={{ color: "#64748b" }}>نرخ تبدیل خام فایل Request</span>
        <span style={{ fontWeight: 600 }}>
          {requestStats.conversionRate}%
        </span>
      </div>

      <div
        style={{
          marginTop: 12,
          color: "#94a3b8",
          lineHeight: 1.9,
          fontSize: 13,
        }}
      >
        کیفیت مشتری: {requestStats.quality}

        {(manualPurchaseCount > 0 || requestStats.soldRequests > 0) && (
          <div style={{ marginTop: 8 }}>
            این تحلیل علاوه بر WINهای فایل Request، سوابق خرید واقعی و خریدهای دستی ثبت‌شده را نیز در نظر می‌گیرد.
          </div>
        )}
      </div>
    </div>
  );
}
