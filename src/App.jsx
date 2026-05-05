import * as XLSX from "xlsx";
import { useState, useCallback } from "react";

const MODEL_NAME = "claude-haiku-4-5-20251001";

const STEPS = [
  { id: "s1", icon: "📋", text: "بررسی سوابق درخواست این مشتری" },
  { id: "s2", icon: "💰", text: "بررسی سوابق خرید و اطلاعات تکمیلی" },
  { id: "s3", icon: "🔍", text: "استخراج آیتم‌ها از متن درخواست" },
  { id: "s4", icon: "🤖", text: "تحلیل هوشمند با Claude AI" },
  { id: "s5", icon: "📊", text: "آماده‌سازی گزارش نهایی" },
];

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function normalizeText(v) {
  return String(v || "").trim().toLowerCase();
}

function parseNumber(v) {
  if (v === null || v === undefined) return 0;
  const cleaned = String(v)
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");
  return parseFloat(cleaned) || 0;
}

function findColumn(rows, candidates) {
  if (!rows || !rows.length) return null;
  const keys = Object.keys(rows[0]);

  for (const c of candidates) {
    const found = keys.find(k => normalizeText(k).includes(normalizeText(c)));
    if (found) return found;
  }

  return null;
}

function isSameCustomer(rowValue, customer) {
  const val = normalizeText(rowValue);
  const c = normalizeText(customer);

  if (!val || !c) return false;

  return (
    val.includes(c) ||
    c.includes(val) ||
    val.split(" ").some(w => w.length > 2 && c.includes(w)) ||
    c.split(" ").some(w => w.length > 2 && val.includes(w))
  );
}

function analyzeCustomerRequests(rows25, rows26, customer) {
  const allRows = [...(rows25 || []), ...(rows26 || [])];

  if (!allRows.length || !customer) {
    return {
      loaded: false,
      found: false,
      totalAllRequests: allRows.length,
      customerRequests: 0,
      soldRequests: 0,
      requestAmount: 0,
      conversionRate: 0,
      quality: "نامشخص",
      background: "فایل درخواست‌ها بارگذاری نشده یا نام مشتری وارد نشده است.",
    };
  }

  const nameCol = findColumn(allRows, [
    "customer",
    "مشتری",
    "customer name",
    "نام مشتری",
    "company",
    "شرکت",
  ]);

  const statusCol = findColumn(allRows, [
    "status",
    "وضعیت",
    "commercial status",
    "نتیجه",
    "result",
  ]);

  const amountCol = findColumn(allRows, [
    "estimate price",
    "estimate",
    "pi amount",
    "amount",
    "مبلغ",
    "قیمت",
    "total",
    "جمع",
    "aed",
  ]);

  const brandCol = findColumn(allRows, [
    "brand",
    "برند",
  ]);

  if (!nameCol) {
    return {
      loaded: true,
      found: false,
      totalAllRequests: allRows.length,
      customerRequests: 0,
      soldRequests: 0,
      requestAmount: 0,
      conversionRate: 0,
      quality: "نامشخص",
      background: "ستون نام مشتری در فایل‌های درخواست پیدا نشد.",
    };
  }

  const matched = allRows.filter(r => isSameCustomer(r[nameCol], customer));

  const sold = matched.filter(r => {
    const s = normalizeText(r[statusCol]);
    return (
      s.includes("sold") ||
      s.includes("sale") ||
      s.includes("order") ||
      s.includes("confirm") ||
      s.includes("تایید") ||
      s.includes("فروش") ||
      s.includes("خرید") ||
      s.includes("موفق")
    );
  });

  const requestAmount = matched.reduce((sum, r) => sum + parseNumber(r[amountCol]), 0);

  const conversionRate = matched.length
    ? Math.round((sold.length / matched.length) * 100)
    : 0;

  let quality = "مشتری جدید / بدون سابقه کافی";

  if (matched.length >= 10 && conversionRate >= 35) quality = "کیفیت بالا";
  else if (matched.length >= 5 && conversionRate >= 20) quality = "کیفیت متوسط رو به بالا";
  else if (matched.length >= 2 && conversionRate > 0) quality = "کیفیت متوسط";
  else if (matched.length > 0 && conversionRate === 0) quality = "درخواست‌محور بدون تبدیل ثبت‌شده";

  const brands = {};
  matched.forEach(r => {
    const b = String(r[brandCol] || "").trim();
    if (b) brands[b] = (brands[b] || 0) + 1;
  });

  const topBrands = Object.entries(brands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([b, count]) => `${b} (${count})`);

  return {
    loaded: true,
    found: matched.length > 0,
    totalAllRequests: allRows.length,
    customerRequests: matched.length,
    soldRequests: sold.length,
    requestAmount,
    conversionRate,
    quality,
    topBrands,
    background: matched.length
      ? `این مشتری ${matched.length} درخواست ثبت‌شده دارد، ${sold.length} مورد فروش/تبدیل شده و نرخ تبدیل ${conversionRate}% است.`
      : "برای این مشتری در فایل‌های درخواست، سابقه‌ای پیدا نشد.",
  };
}

function analyzeCustomerPurchases(rows, customer) {
  if (!rows || !customer) {
    return {
      loaded: false,
      found: false,
      purchaseCount: 0,
      purchaseAmount: 0,
      background: "فایل خرید بارگذاری نشده یا نام مشتری وارد نشده است.",
    };
  }

  const nameCol = findColumn(rows, [
    "customer",
    "مشتری",
    "customer name",
    "نام مشتری",
    "company",
    "شرکت",
  ]);

  const amountCol = findColumn(rows, [
    "amount",
    "buy amount",
    "purchase amount",
    "pi amount",
    "مبلغ",
    "قیمت",
    "total",
    "جمع",
    "aed",
    "rmb",
  ]);

  if (!nameCol) {
    return {
      loaded: true,
      found: false,
      purchaseCount: 0,
      purchaseAmount: 0,
      background: "ستون نام مشتری در فایل خرید پیدا نشد.",
    };
  }

  const matched = rows.filter(r => isSameCustomer(r[nameCol], customer));

  const purchaseAmount = matched.reduce(
    (sum, r) => sum + parseNumber(r[amountCol]),
    0
  );

  return {
    loaded: true,
    found: matched.length > 0,
    purchaseCount: matched.length,
    purchaseAmount,
    background: matched.length
      ? `برای این مشتری ${matched.length} رکورد خرید ثبت‌شده پیدا شد.`
      : "برای این مشتری در فایل خرید، رکوردی پیدا نشد.",
  };
}

function buildPrompt({
  customer,
  rfqNum,
  requestText,
  notes,
  extraCustomerInfo,
  requestStats,
  purchaseStats,
}) {
  return `
Role: B2B industrial automation RFQ analyst.

Task:
Extract items from the customer RFQ/email and analyze them.
Return ONLY valid JSON. No markdown. No explanation.

Customer:
name=${customer || "unknown"}
rfq=${rfqNum || "unknown"}
internal_notes=${notes || "none"}
extra_customer_info=${extraCustomerInfo || "none"}

Customer request history from local files:
total_all_requests=${requestStats.totalAllRequests}
customer_requests=${requestStats.customerRequests}
sold_requests=${requestStats.soldRequests}
customer_request_amount=${requestStats.requestAmount}
conversion_rate=${requestStats.conversionRate}
customer_quality=${requestStats.quality}
top_brands=${(requestStats.topBrands || []).join(", ") || "unknown"}
background=${requestStats.background}

Purchase history from local files:
purchase_records=${purchaseStats.purchaseCount}
purchase_amount=${purchaseStats.purchaseAmount}
purchase_background=${purchaseStats.background}

RFQ/email text:
"""
${requestText}
"""

JSON schema:
{
  "customerScore": 0,
  "customerLevel": "VIP|Regular|New|Low",
  "dealValue": "High|Medium|Low",
  "priority": "Urgent|High|Normal|Low",
  "summary": "",
  "extractedItemsCount": 0,
  "customerBackgroundCheck": "",
  "parts": [
    {
      "partNumber": "",
      "qty": "",
      "manufacturer": "",
      "description": "",
      "application": "",
      "status": "active|eol|warning|unknown",
      "statusLabel": "",
      "priceChina": "",
      "priceUAE": "",
      "alternatives": "",
      "eolNote": ""
    }
  ],
  "recommendation": "",
  "risks": "",
  "nextStep": ""
}
`;
}

async function callClaude(prompt, maxTokens = 2500) {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const raw = await response.text();

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("API پاسخ JSON معتبر نداد.");
  }

  if (!response.ok) {
    throw new Error(data.error?.message || data.error || "HTTP " + response.status);
  }

  const text = data.content?.map(c => c.text || "").join("") || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("در پاسخ Claude خروجی JSON پیدا نشد.");
  }

  return JSON.parse(jsonMatch[0]);
}

function Tag({ color, children }) {
  const c = {
    blue: { background: "rgba(59,130,246,0.15)", color: "#60a5fa" },
    green: { background: "rgba(16,185,129,0.15)", color: "#34d399" },
    yellow: { background: "rgba(245,158,11,0.15)", color: "#fbbf24" },
    red: { background: "rgba(239,68,68,0.15)", color: "#f87171" },
  };

  return (
    <span style={{
      fontSize: 11,
      padding: "3px 10px",
      borderRadius: 20,
      fontWeight: 600,
      ...c[color],
    }}>
      {children}
    </span>
  );
}

function SBadge({ status }) {
  const m = {
    active: {
      bg: "rgba(16,185,129,0.15)",
      color: "#34d399",
      label: "Active",
    },
    eol: {
      bg: "rgba(239,68,68,0.15)",
      color: "#f87171",
      label: "EOL",
    },
    warning: {
      bg: "rgba(245,158,11,0.15)",
      color: "#fbbf24",
      label: "Check",
    },
    unknown: {
      bg: "rgba(148,163,184,0.15)",
      color: "#94a3b8",
      label: "Unknown",
    },
  };

  const s = m[status] || m.unknown;

  return (
    <span style={{
      fontSize: 10,
      padding: "2px 8px",
      borderRadius: 20,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
    }}>
      {s.label}
    </span>
  );
}

export default function App() {
  const [files, setFiles] = useState({
    purchase: null,
    req25: null,
    req26: null,
  });

  const [fileLabels, setFileLabels] = useState({
    purchase: "",
    req25: "",
    req26: "",
  });

  const [customer, setCustomer] = useState("");
  const [rfqNum, setRfqNum] = useState("");
  const [requestText, setRequestText] = useState("");
  const [notes, setNotes] = useState("");
  const [extraCustomerInfo, setExtraCustomerInfo] = useState("");
  const [phase, setPhase] = useState("idle");
  const [steps, setSteps] = useState(STEPS.map(s => ({ ...s, state: "waiting" })));
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState("");
  const [apiTested, setApiTested] = useState(false);

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const isReady = requestText.trim().length > 0;

  const loadFile = useCallback((e, key) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "binary" });
        const rows = [];

        wb.SheetNames.forEach(n => {
          rows.push(...XLSX.utils.sheet_to_json(wb.Sheets[n], { defval: "" }));
        });

        setFiles(f => ({ ...f, [key]: rows }));
        setFileLabels(l => ({ ...l, [key]: `✓ ${rows.length} ردیف` }));
        showToast(`${file.name} بارگذاری شد`);
      } catch (err) {
        showToast("خطا: " + err.message);
      }
    };

    reader.readAsBinaryString(file);
  }, []);

  const testApi = async () => {
    showToast("در حال تست اتصال...");

    try {
      const response = await fetch("/api/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL_NAME,
          max_tokens: 20,
          messages: [{ role: "user", content: "Return only JSON: {\"ok\":true}" }],
        }),
      });

      const raw = await response.text();

      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        showToast("❌ API Route پاسخ JSON نداد");
        return;
      }

      if (response.ok) {
        setApiTested(true);
        showToast("✅ اتصال موفق!");
      } else {
        showToast("❌ " + (data.error?.message || data.error || response.status));
      }
    } catch (e) {
      showToast("❌ خطا: " + e.message);
    }
  };

  const setStepState = (id, st) => {
    setSteps(prev => prev.map(s => (
      s.id === id ? { ...s, state: st } : s
    )));
  };

  const startAnalysis = async () => {
    if (!isReady) return;

    setPhase("running");
    setSteps(STEPS.map(s => ({ ...s, state: "waiting" })));
    setResult(null);

    setStepState("s1", "active");
    await delay(300);
    const requestStats = analyzeCustomerRequests(files.req25, files.req26, customer);
    setStepState("s1", "done");

    setStepState("s2", "active");
    await delay(300);
    const purchaseStats = analyzeCustomerPurchases(files.purchase, customer);
    setStepState("s2", "done");

    setStepState("s3", "active");
    await delay(300);
    setStepState("s3", "done");

    setStepState("s4", "active");

    let ai;

    try {
      ai = await callClaude(
        buildPrompt({
          customer,
          rfqNum,
          requestText,
          notes,
          extraCustomerInfo,
          requestStats,
          purchaseStats,
        }),
        2800
      );

      setStepState("s4", "done");
    } catch (err) {
      setStepState("s4", "error");
      setPhase("error");
      showToast("خطا: " + err.message);
      return;
    }

    setStepState("s5", "active");
    await delay(300);
    setStepState("s5", "done");

    setResult({
      ai,
      requestStats,
      purchaseStats,
      parts: ai.parts || [],
      customer,
      rfqNum,
    });

    setPhase("done");
  };

  const copyReport = () => {
    if (!result) return;

    const { ai, customer: c, rfqNum: r, requestStats, purchaseStats } = result;

    navigator.clipboard.writeText(
      `گزارش RFQ
مشتری: ${c || "نامشخص"} | RFQ: ${r || "—"}

سوابق درخواست این مشتری:
تعداد درخواست‌های این مشتری: ${requestStats.customerRequests}
تعداد درخواست‌های فروش‌شده: ${requestStats.soldRequests}
مبلغ درخواست‌های این مشتری: ${requestStats.requestAmount.toLocaleString()}
نرخ تبدیل: ${requestStats.conversionRate}%
کیفیت مشتری: ${requestStats.quality}

سوابق خرید ثبت‌شده:
تعداد خرید: ${purchaseStats.purchaseCount}
مبلغ خرید: ${purchaseStats.purchaseAmount.toLocaleString()}

امتیاز AI: ${ai.customerScore || "—"}
سطح مشتری: ${ai.customerLevel || "—"}
ارزش معامله: ${ai.dealValue || "—"}
اولویت: ${ai.priority || "—"}

خلاصه:
${ai.summary || "—"}

بک‌گراند چک مشتری:
${ai.customerBackgroundCheck || "—"}

توصیه:
${ai.recommendation || "—"}

ریسک‌ها:
${ai.risks || "—"}

قدم بعدی:
${ai.nextStep || "—"}`
    ).then(() => showToast("✅ کپی شد"));
  };

  const bg = "#0f1117";
  const bg2 = "#161b27";
  const bg3 = "#1e2538";
  const bdr = "#2a3148";

  const card = {
    background: bg2,
    border: `1px solid ${bdr}`,
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  };

  const inp = {
    width: "100%",
    background: bg3,
    border: `1px solid ${bdr}`,
    borderRadius: 8,
    padding: "9px 12px",
    color: "#e2e8f0",
    fontFamily: "inherit",
    fontSize: 13,
    outline: "none",
    direction: "ltr",
  };

  const lbl = {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 5,
    display: "block",
  };

  const bar = {
    width: 3,
    height: 14,
    background: "#3b82f6",
    borderRadius: 2,
    flexShrink: 0,
  };

  const secTitle = {
    fontSize: 12,
    fontWeight: 700,
    color: "#94a3b8",
    letterSpacing: "0.08em",
    marginBottom: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
  };

  const btn = v => ({
    padding: "9px 18px",
    borderRadius: 8,
    border: v === "primary" ? "none" : `1px solid ${bdr}`,
    background: v === "primary" ? "#3b82f6" : bg3,
    color: v === "primary" ? "#fff" : "#94a3b8",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  });

  const mRow = {
    display: "flex",
    justifyContent: "space-between",
    padding: "7px 0",
    borderBottom: `1px solid ${bdr}`,
    fontSize: 13,
  };

  const th = {
    background: bg3,
    padding: "9px 10px",
    textAlign: "right",
    fontWeight: 600,
    fontSize: 11,
    color: "#64748b",
    borderBottom: `1px solid ${bdr}`,
  };

  const td = {
    padding: "9px 10px",
    borderBottom: `1px solid ${bg3}`,
    color: "#e2e8f0",
    verticalAlign: "top",
    lineHeight: 1.5,
    fontSize: 12,
  };

  return (
    <div style={{
      fontFamily: "'Vazirmatn','Tahoma',sans-serif",
      direction: "rtl",
      background: bg,
      minHeight: "100vh",
      color: "#e2e8f0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
      `}</style>

      <div style={{
        background: bg2,
        borderBottom: `1px solid ${bdr}`,
        padding: "14px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: "linear-gradient(135deg,#3b82f6,#6366f1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
          }}>
            ⚙️
          </div>

          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>RFQ Analyzer Pro</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>سیستم تحلیل هوشمند — Claude AI</div>
          </div>
        </div>

        <div style={{
          fontSize: 11,
          padding: "3px 12px",
          borderRadius: 20,
          background: isReady && apiTested ? "rgba(16,185,129,0.15)" : "rgba(100,116,139,0.15)",
          color: isReady && apiTested ? "#34d399" : "#94a3b8",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: isReady && apiTested ? "#34d399" : "#64748b",
            display: "inline-block",
          }} />
          {isReady && apiTested ? "آماده تحلیل" : "در انتظار تنظیمات"}
        </div>
      </div>

      <div style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "24px 20px",
      }}>
        <div style={card}>
          <div style={secTitle}>
            <div style={bar} />
            تنظیمات — فایل‌ها و اتصال API
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 12,
          }}>
            {[
              { key: "purchase", label: "Purchase 2025", desc: "سوابق خرید", icon: "💰" },
              { key: "req25", label: "Request 2025", desc: "درخواست‌ها", icon: "📋" },
              { key: "req26", label: "Request 2026", desc: "درخواست‌ها", icon: "📋" },
            ].map(f => (
              <label key={f.key} style={{
                background: bg3,
                border: `1.5px ${fileLabels[f.key] ? "solid" : "dashed"} ${fileLabels[f.key] ? "#10b981" : bdr}`,
                borderRadius: 10,
                padding: "16px 12px",
                textAlign: "center",
                cursor: "pointer",
                display: "block",
              }}>
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

          <div style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 14,
          }}>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              کلید API از Vercel Environment Variable خوانده می‌شود.
            </div>

            <button style={btn(apiTested ? "primary" : "secondary")} onClick={testApi}>
              {apiTested ? "✅ متصل" : "تست اتصال"}
            </button>
          </div>
        </div>

        <div style={card}>
          <div style={secTitle}>
            <div style={bar} />
            اطلاعات درخواست جدید
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 14,
          }}>
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
                placeholder={`Dear Sir,

Please quote:
Siemens 6ES7314-6EH04-0AB0 qty 2 pcs
6ES7321-1BL00-0AA0 qty 5
3RT2025-1AP00 qty 10

Please send price for China and UAE.`}
                value={requestText}
                onChange={e => setRequestText(e.target.value)}
              />
            </div>

            <div style={{ gridColumn: "1/-1" }}>
              <label style={lbl}>اطلاعات تکمیلی مشتری / خریدهای ثبت‌نشده / نکات دستی</label>
              <textarea
                style={{
                  ...inp,
                  minHeight: 90,
                  resize: "vertical",
                  direction: "rtl",
                  lineHeight: 1.7,
                }}
                placeholder="مثال: این مشتری قبلاً یک خرید موفق خارج از فایل داشته؛ پرداخت منظم بوده؛ پروژه فعلی فوری است."
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
              background: isReady && phase !== "running"
                ? "linear-gradient(135deg,#3b82f6,#6366f1)"
                : bg3,
              color: isReady && phase !== "running" ? "#fff" : "#64748b",
              border: "none",
              borderRadius: 10,
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 700,
              cursor: isReady && phase !== "running" ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
            onClick={startAnalysis}
            disabled={!isReady || phase === "running"}
          >
            {phase === "running" ? (
              <>
                <span style={{
                  width: 18,
                  height: 18,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                  display: "inline-block",
                }} />
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

        {phase === "running" && (
          <div style={card}>
            <div style={secTitle}>
              <div style={bar} />
              در حال پردازش...
            </div>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}>
              {steps.map(s => (
                <div key={s.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  background:
                    s.state === "active" ? "rgba(59,130,246,0.08)" :
                    s.state === "done" ? "rgba(16,185,129,0.06)" :
                    s.state === "error" ? "rgba(239,68,68,0.06)" :
                    bg3,
                  border: `1px solid ${
                    s.state === "active" ? "#3b82f6" :
                    s.state === "done" ? "#10b981" :
                    s.state === "error" ? "#ef4444" :
                    bdr
                  }`,
                  borderRadius: 8,
                  fontSize: 13,
                }}>
                  <span style={{ fontSize: 17, width: 24, textAlign: "center" }}>
                    {s.state === "active" ? "⏳" : s.state === "done" ? "✅" : s.state === "error" ? "❌" : s.icon}
                  </span>

                  <span style={{ flex: 1 }}>{s.text}</span>

                  <span style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 20,
                    fontWeight: 600,
                    background:
                      s.state === "active" ? "rgba(59,130,246,0.2)" :
                      s.state === "done" ? "rgba(16,185,129,0.2)" :
                      "rgba(100,116,139,0.15)",
                    color:
                      s.state === "active" ? "#60a5fa" :
                      s.state === "done" ? "#34d399" :
                      "#94a3b8",
                  }}>
                    {s.state === "active" ? "در حال پردازش" : s.state === "done" ? "تکمیل" : s.state === "error" ? "خطا" : "در انتظار"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "done" && result && (() => {
          const { ai, requestStats, purchaseStats, parts: pts, customer: cust, rfqNum: rfq } = result;
          const sc = ai.customerScore || 50;
          const itemCount = ai.extractedItemsCount || (pts || []).length || 0;

          return (
            <>
              <div style={{ ...card, display: "flex", gap: 20, alignItems: "center" }}>
                <div style={{
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
                    sc >= 70 ? "rgba(16,185,129,0.15)" :
                    sc >= 40 ? "rgba(245,158,11,0.15)" :
                    "rgba(239,68,68,0.15)",
                  color:
                    sc >= 70 ? "#34d399" :
                    sc >= 40 ? "#fbbf24" :
                    "#f87171",
                  border: `2px solid ${
                    sc >= 70 ? "#10b981" :
                    sc >= 40 ? "#f59e0b" :
                    "#ef4444"
                  }`,
                }}>
                  {sc}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>
                    مشتری
                  </div>

                  <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>
                    {cust || "نامشخص"}
                  </div>

                  <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>
                    RFQ: {rfq || "—"} | {itemCount} آیتم استخراج‌شده | ارزش: {ai.dealValue || "—"}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Tag color="blue">{ai.customerLevel || "Regular"}</Tag>
                    <Tag color="yellow">اولویت: {ai.priority || "Normal"}</Tag>
                    <Tag color="green">{requestStats.quality}</Tag>
                    {requestStats.conversionRate > 0 && (
                      <Tag color="blue">نرخ تبدیل {requestStats.conversionRate}%</Tag>
                    )}
                  </div>
                </div>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginBottom: 14,
              }}>
                <div style={card}>
                  <div style={{ ...secTitle, marginBottom: 10 }}>
                    <div style={bar} />
                    📋 سوابق درخواست این مشتری
                  </div>

                  <div style={mRow}>
                    <span style={{ color: "#64748b" }}>کل درخواست‌های فایل‌ها</span>
                    <span style={{ fontWeight: 600 }}>{requestStats.totalAllRequests}</span>
                  </div>

                  <div style={mRow}>
                    <span style={{ color: "#64748b" }}>درخواست‌های این مشتری</span>
                    <span style={{ fontWeight: 600, color: "#60a5fa" }}>{requestStats.customerRequests}</span>
                  </div>

                  <div style={mRow}>
                    <span style={{ color: "#64748b" }}>درخواست‌های فروش‌شده</span>
                    <span style={{ fontWeight: 600, color: "#34d399" }}>{requestStats.soldRequests}</span>
                  </div>

                  <div style={mRow}>
                    <span style={{ color: "#64748b" }}>مبلغ درخواست‌های این مشتری</span>
                    <span style={{ fontWeight: 600 }}>
                      {requestStats.requestAmount ? requestStats.requestAmount.toLocaleString() : "—"}
                    </span>
                  </div>

                  <div style={mRow}>
                    <span style={{ color: "#64748b" }}>کیفیت مشتری</span>
                    <span style={{ fontWeight: 600, color: "#fbbf24" }}>{requestStats.quality}</span>
                  </div>
                </div>

                <div style={card}>
                  <div style={{ ...secTitle, marginBottom: 10 }}>
                    <div style={bar} />
                    💰 سوابق خرید و اطلاعات تکمیلی
                  </div>

                  <div style={mRow}>
                    <span style={{ color: "#64748b" }}>تعداد خرید ثبت‌شده</span>
                    <span style={{ fontWeight: 600, color: "#34d399" }}>{purchaseStats.purchaseCount}</span>
                  </div>

                  <div style={mRow}>
                    <span style={{ color: "#64748b" }}>مبلغ خرید ثبت‌شده</span>
                    <span style={{ fontWeight: 600, color: "#60a5fa" }}>
                      {purchaseStats.purchaseAmount ? purchaseStats.purchaseAmount.toLocaleString() : "—"}
                    </span>
                  </div>

                  <div style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    lineHeight: 1.8,
                    marginTop: 10,
                  }}>
                    {purchaseStats.background}
                  </div>
                </div>
              </div>

              {(ai.summary || ai.customerBackgroundCheck) && (
                <div style={{
                  ...card,
                  borderRight: "4px solid #3b82f6",
                  fontSize: 13,
                  lineHeight: 1.8,
                  color: "#94a3b8",
                }}>
                  {ai.summary && (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
                        📝 خلاصه درخواست
                      </div>
                      <div style={{ marginBottom: 12 }}>{ai.summary}</div>
                    </>
                  )}

                  {ai.customerBackgroundCheck && (
                    <>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
                        🔎 بک‌گراند چک مشتری
                      </div>
                      <div>{ai.customerBackgroundCheck}</div>
                    </>
                  )}
                </div>
              )}

              <div style={{ ...card, overflowX: "auto" }}>
                <div style={{ ...secTitle, marginBottom: 12 }}>
                  <div style={bar} />
                  ⚙️ تحلیل قطعات استخراج‌شده
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr>
                      {["Part Number", "Qty", "سازنده", "شرح", "کاربرد", "وضعیت", "قیمت چین", "قیمت امارات", "جایگزین"].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {(ai.parts || []).map((p, i) => (
                      <tr key={i}>
                        <td style={td}>
                          <code style={{ color: "#60a5fa", fontSize: 11 }}>
                            {p.partNumber || "—"}
                          </code>
                        </td>
                        <td style={td}>{p.qty || "—"}</td>
                        <td style={td}>{p.manufacturer || "—"}</td>
                        <td style={td}>{p.description || "—"}</td>
                        <td style={td}>{p.application || "—"}</td>
                        <td style={td}>
                          <SBadge status={p.status} />
                          {p.eolNote && (
                            <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                              {p.eolNote}
                            </div>
                          )}
                        </td>
                        <td style={td}>{p.priceChina || "—"}</td>
                        <td style={td}>{p.priceUAE || "—"}</td>
                        <td style={{ ...td, color: "#94a3b8" }}>{p.alternatives || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{
                background: bg2,
                border: `1px solid ${bdr}`,
                borderRight: "4px solid #3b82f6",
                borderRadius: 14,
                padding: 20,
                marginBottom: 16,
                fontSize: 13,
                lineHeight: 1.8,
                color: "#94a3b8",
              }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>
                  💡 توصیه تیم فروش
                </div>

                <div style={{ marginBottom: 6 }}>{ai.recommendation || "—"}</div>
                <div style={{ marginBottom: 6, color: "#64748b" }}>{ai.risks || "—"}</div>
                <div style={{ color: "#60a5fa", fontWeight: 600 }}>{ai.nextStep || "—"}</div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button style={btn("primary")} onClick={copyReport}>📋 کپی گزارش</button>
                <button style={btn("secondary")} onClick={() => { setPhase("idle"); setResult(null); }}>
                  🔄 تحلیل جدید
                </button>
              </div>
            </>
          );
        })()}
      </div>

      <div style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: bg3,
        border: `1px solid ${bdr}`,
        borderRadius: 10,
        padding: "10px 20px",
        fontSize: 13,
        color: "#e2e8f0",
        zIndex: 9999,
        opacity: toast ? 1 : 0,
        transition: "opacity 0.3s",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}>
        {toast}
      </div>
    </div>
  );
}