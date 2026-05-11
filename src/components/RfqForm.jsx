import { card, secTitle, bar, inp, lbl, bg3 } from "../styles/theme";

export default function RfqForm({ form, phase, onSubmit }) {
  const {
    customer, setCustomer,
    rfqNum, setRfqNum,
    requestText, setRequestText,
    notes, setNotes,
    extraCustomerInfo, setExtraCustomerInfo,
    manualPurchaseCount, setManualPurchaseCount,
    manualPurchaseAmount, setManualPurchaseAmount,
  } = form;

  const isReady = requestText.trim().length > 0;
  const running = phase === "running";

  return (
    <div style={card}>
      <div style={secTitle}>
        <div style={bar} />
        اطلاعات درخواست جدید
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div>
          <label style={lbl}>نام / شرکت مشتری</label>
          <input
            style={{ ...inp, direction: "rtl" }}
            placeholder="مثال: Petro Kimia"
            value={customer}
            onChange={e => setCustomer(e.target.value)}
          />
        </div>

        <div>
          <label style={lbl}>شماره RFQ / شناسه داخلی</label>
          <input
            style={inp}
            placeholder="RFQ-2026-0142"
            value={rfqNum}
            onChange={e => setRfqNum(e.target.value)}
          />
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <label style={lbl}>متن کامل درخواست / ایمیل مشتری</label>
          <textarea
            style={{
              ...inp,
              minHeight: 150,
              resize: "vertical",
              fontFamily: "monospace",
              fontSize: 12,
              direction: "ltr",
              lineHeight: 1.6,
            }}
            placeholder={`Dear Sir,\n\nPlease quote:\nSiemens 6ES7314-6EH04-0AB0 qty 2 pcs\n6ES7321-1BL00-0AA0 qty 5\n3RT2025-1AP00 qty 10\n\nPlease send price for China and UAE.`}
            value={requestText}
            onChange={e => setRequestText(e.target.value)}
          />
        </div>

        <div>
          <label style={lbl}>تعداد خریدهای جدید دستی</label>
          <input
            style={inp}
            placeholder="مثال: 2"
            value={manualPurchaseCount}
            onChange={e => setManualPurchaseCount(e.target.value)}
          />
        </div>

        <div>
          <label style={lbl}>مبلغ خریدهای جدید دستی</label>
          <input
            style={inp}
            placeholder="مثال: 15000"
            value={manualPurchaseAmount}
            onChange={e => setManualPurchaseAmount(e.target.value)}
          />
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <label style={lbl}>توضیحات تکمیلی مشتری</label>
          <textarea
            style={{ ...inp, minHeight: 90, resize: "vertical", direction: "rtl", lineHeight: 1.7 }}
            placeholder="مثال: خریدهای جدید در فایل ثبت نشده‌اند؛ پرداخت منظم بوده؛ پروژه فوری است."
            value={extraCustomerInfo}
            onChange={e => setExtraCustomerInfo(e.target.value)}
          />
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <label style={lbl}>یادداشت داخلی این RFQ</label>
          <input
            style={{ ...inp, direction: "rtl" }}
            placeholder="مثال: فوری — پروژه پالایشگاه"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>

      <button
        style={{
          width: "100%",
          padding: 13,
          background: isReady && !running ? "linear-gradient(135deg,#3b82f6,#6366f1)" : bg3,
          color: isReady && !running ? "#fff" : "#64748b",
          border: "none",
          borderRadius: 10,
          fontFamily: "inherit",
          fontSize: 15,
          fontWeight: 700,
          cursor: isReady && !running ? "pointer" : "not-allowed",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
        onClick={onSubmit}
        disabled={!isReady || running}
      >
        {running ? (
          <>
            <span
              style={{
                width: 18,
                height: 18,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
                display: "inline-block",
              }}
            />
            در حال تحلیل...
          </>
        ) : (
          <>
            <span>🔍</span>
            تحلیل هوشمند RFQ
          </>
        )}
      </button>
    </div>
  );
}
