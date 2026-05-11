import { useState, useCallback, useEffect } from "react";

// import { buildExtractionPrompt } from "./prompts/buildExtractionPrompt";
// import { extractRfqWithOpenAI } from "./services/openai";
import { STEPS, delay, AUTO_EXCEL_FILES } from "./constants/rfq";
import { AI_PROVIDERS, DEFAULT_SELECTED_PROVIDERS } from "./constants/providers";
import { readExcelFile, readExcelFromUrl } from "./utils/excel";
import {
  analyzeCustomerRequests,
  analyzeCustomerPurchases,
} from "./utils/customerAnalysis";
import { analyzeBrandProductStats } from "./utils/brandProductAnalysis";
import { buildRfqPrompt } from "./prompts/buildRfqPrompt";
import { callClaude, testClaudeConnection } from "./services/claude";
import {
  callOpenAI,
  extractRfqWithOpenAI,
  testOpenAIConnection,
} from "./services/openai";
import Tag from "./components/Tag";
import SBadge from "./components/SBadge";
import { formatMoney } from "./utils/numbers";
import { calculateWinChance } from "./utils/winChance";

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
  const [manualPurchaseCount, setManualPurchaseCount] = useState("");
  const [manualPurchaseAmount, setManualPurchaseAmount] = useState("");

  const [selectedProviders, setSelectedProviders] = useState(DEFAULT_SELECTED_PROVIDERS);
  const [phase, setPhase] = useState("idle");
  const [steps, setSteps] = useState(STEPS.map(s => ({ ...s, state: "waiting" })));
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState("");
  const [apiTested, setApiTested] = useState({
    claude: false,
    openai: false,
  });

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const isReady = requestText.trim().length > 0;
  const hasSelectedProvider = selectedProviders.claude || selectedProviders.openai;

  useEffect(() => {
    let cancelled = false;

    async function loadDefaultFiles() {
      for (const item of AUTO_EXCEL_FILES) {
        try {
          const rows = await readExcelFromUrl(item.path);

          if (cancelled) return;

          setFiles(prev => ({ ...prev, [item.key]: rows }));
          setFileLabels(prev => ({
            ...prev,
            [item.key]: `✓ ${rows.length} ردیف - Auto`,
          }));
        } catch (err) {
          console.warn(`${item.label} auto-load failed:`, err.message);
        }
      }
    }

    loadDefaultFiles();

    return () => {
      cancelled = true;
    };
  }, []);

  const loadFile = useCallback(async (e, key) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const rows = await readExcelFile(file);

      setFiles(f => ({ ...f, [key]: rows }));
      setFileLabels(l => ({ ...l, [key]: `✓ ${rows.length} ردیف` }));

      showToast(`${file.name} بارگذاری شد`);
    } catch (err) {
      showToast("خطا: " + err.message);
    }
  }, []);

  const toggleProvider = key => {
    setSelectedProviders(prev => {
      const next = { ...prev, [key]: !prev[key] };

      if (!next.claude && !next.openai) {
        showToast("حداقل یک AI باید انتخاب شود.");
        return prev;
      }

      return next;
    });
  };

  const testApi = async providerKey => {
    showToast(`در حال تست اتصال ${AI_PROVIDERS[providerKey].label}...`);

    try {
      if (providerKey === "claude") {
        await testClaudeConnection();
      }

      if (providerKey === "openai") {
        await testOpenAIConnection();
      }

      setApiTested(prev => ({ ...prev, [providerKey]: true }));
      showToast(`✅ اتصال ${AI_PROVIDERS[providerKey].label} موفق بود.`);
    } catch (e) {
      showToast("❌ " + e.message);
    }
  };

  const setStepState = (id, st) => {
    setSteps(prev =>
      prev.map(s => (s.id === id ? { ...s, state: st } : s))
    );
  };

  const startAnalysis = async () => {
    if (!isReady || !hasSelectedProvider) return;

    setPhase("running");
    setSteps(STEPS.map(s => ({ ...s, state: "waiting" })));
    setResult(null);

    setStepState("s1", "active");
    await delay(300);

    let extractedCustomer = customer;
    let extractedRfq = rfqNum;
    let normalizedRequestText = requestText;

    try {
      if (selectedProviders.openai) {
        const extraction = await extractRfqWithOpenAI(
          buildExtractionPrompt(requestText)
        );

        if (extraction?.customer && !customer?.trim()) {
          extractedCustomer = extraction.customer;
          setCustomer(extraction.customer);
        }

        if (extraction?.rfqNumber && !rfqNum?.trim()) {
          extractedRfq = extraction.rfqNumber;
          setRfqNum(extraction.rfqNumber);
        }

        if (extraction?.normalizedText) {
          normalizedRequestText = extraction.normalizedText;
        }
      }
    } catch (err) {
      console.warn("RFQ extraction failed:", err.message);
    }

    const requestStats = analyzeCustomerRequests(
      files.req25,
      files.req26,
      extractedCustomer
    );
    setStepState("s1", "done");

    setStepState("s2", "active");
    await delay(300);
    const purchaseStats = analyzeCustomerPurchases(
      files.purchase,
      extractedCustomer,
      manualPurchaseCount,
      manualPurchaseAmount
    );
    setStepState("s2", "done");

    setStepState("s3", "active");
    await delay(300);
    const brandStats = analyzeBrandProductStats(
      files.req25,
      files.req26,
      files.purchase,
      normalizedRequestText
    );

    const winChance = calculateWinChance({
      requestStats,
      purchaseStats,
      brandStats,
      normalizedRequestText,
    });

    setStepState("s3", "done");

    setStepState("s4", "active");

    const prompt = buildRfqPrompt({
      customer: extractedCustomer,
      rfqNum: extractedRfq,
      requestText: normalizedRequestText,
      notes,
      extraCustomerInfo,
      manualPurchaseCount,
      manualPurchaseAmount,
      requestStats,
      purchaseStats,
      brandStats,
      winChance,
    });

    const aiResults = {};
    const errors = {};

    try {
      const jobs = [];

      if (selectedProviders.claude) {
        jobs.push(
          callClaude(prompt, 3200)
            .then(data => {
              aiResults.claude = data;
            })
            .catch(err => {
              errors.claude = err.message;
            })
        );
      }

      if (selectedProviders.openai) {
        jobs.push(
          callOpenAI(prompt, 3200)
            .then(data => {
              aiResults.openai = data;
            })
            .catch(err => {
              errors.openai = err.message;
            })
        );
      }

      await Promise.all(jobs);

      if (!aiResults.claude && !aiResults.openai) {
        throw new Error(
          Object.entries(errors)
            .map(([k, v]) => `${AI_PROVIDERS[k].label}: ${v}`)
            .join(" | ")
        );
      }

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

    const primaryAi = aiResults.claude || aiResults.openai;

    setResult({
      ai: primaryAi,
      aiResults,
      errors,
      requestStats,
      purchaseStats,
      brandStats,
      parts: primaryAi?.parts || [],
      customer: extractedCustomer,
      rfqNum: extractedRfq,
      winChance,
    });

    setPhase("done");
  };

  const copyReport = () => {
    if (!result) return;

    const { customer: c, rfqNum: r, requestStats, purchaseStats, winChance, aiResults } = result;

    const providerReports = Object.entries(aiResults || {})
      .map(([key, ai]) => {
        return `
--- ${AI_PROVIDERS[key]?.label || key} ---
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
${ai.nextStep || "—"}
`;
      })
      .join("\n");

    navigator.clipboard
      .writeText(
        `گزارش RFQ
مشتری: ${c || "نامشخص"} | RFQ: ${r || "—"}

سوابق فرصت‌های این مشتری:
تعداد فرصت‌های این مشتری: ${requestStats.customerRequests}
تعداد فرصت‌های فروش‌شده: ${requestStats.soldRequests}
ارزش فرصت‌های این مشتری: ${formatMoney(requestStats.requestAmount)}
نرخ تبدیل: ${requestStats.conversionRate}%
کیفیت مشتری: ${requestStats.quality}

سوابق خرید واقعی:
خریدهای فایل Purchase: ${purchaseStats.filePurchaseCount}
مبلغ خرید واقعی از فایل Purchase: ${formatMoney(purchaseStats.filePurchaseAmount)}
خریدهای جدید دستی: ${purchaseStats.manualPurchaseCount}
مبلغ خریدهای جدید دستی: ${formatMoney(purchaseStats.manualPurchaseAmount)}
جمع کل خرید واقعی ثبت‌شده: ${purchaseStats.totalPurchaseCount}
مبلغ کل خرید واقعی ثبت‌شده: ${formatMoney(purchaseStats.totalPurchaseAmount)}

شانس برنده شدن:
${winChance?.score || "—"}% | ${winChance?.level || "—"}
معیارها:
${(winChance?.factors || []).join("، ") || "—"}

${providerReports}`
      )
      .then(() => showToast("✅ کپی شد"));
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
    gap: 12,
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

  const textBox = {
    background: bg3,
    border: `1px solid ${bdr}`,
    borderRadius: 10,
    padding: 14,
    fontSize: 13,
    lineHeight: 1.9,
    color: "#94a3b8",
    textAlign: "right",
    direction: "rtl",
  };

  const divider = {
    borderTop: `1px solid ${bdr}`,
    margin: "10px 0",
  };

  const renderAiResult = (providerKey, ai, shared) => {
    const { requestStats, purchaseStats, brandStats, winChance, parts } = shared;
    const sc = ai.customerScore || 50;
    const itemCount = ai.extractedItemsCount || (parts || ai.parts || []).length || 0;
    const winScore = winChance?.score || 0;

    return (
      <div key={providerKey} style={{ marginBottom: 26 }}>
        <div style={{ ...card, borderRight: providerKey === "claude" ? "4px solid #8b5cf6" : "4px solid #10b981" }}>
          <div style={{ ...secTitle, marginBottom: 10 }}>
            <div style={bar} />
            خروجی {AI_PROVIDERS[providerKey]?.label || providerKey}
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
                  sc >= 70
                    ? "rgba(16,185,129,0.15)"
                    : sc >= 40
                      ? "rgba(245,158,11,0.15)"
                      : "rgba(239,68,68,0.15)",
                color: sc >= 70 ? "#34d399" : sc >= 40 ? "#fbbf24" : "#f87171",
                border: `2px solid ${sc >= 70 ? "#10b981" : sc >= 40 ? "#f59e0b" : "#ef4444"}`,
              }}
            >
              {sc}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>مشتری</div>

              <div style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>
                {result.customer || "نامشخص"}
              </div>

              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 8 }}>
                RFQ: {result.rfqNum || "—"} | {itemCount} آیتم استخراج‌شده | ارزش:{" "}
                {ai.dealValue || "—"} | شانس برد: {winScore || "—"}%
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Tag color="blue">{ai.customerLevel || "Regular"}</Tag>
                <Tag color="yellow">اولویت: {ai.priority || "Normal"}</Tag>
                <Tag color="green">{requestStats.quality}</Tag>
                {winScore > 0 && (
                  <Tag color={winScore >= 65 ? "green" : winScore >= 40 ? "yellow" : "red"}>
                    Win Chance: {winScore}%
                  </Tag>
                )}
                {requestStats.conversionRate > 0 && (
                  <Tag color="blue">نرخ تبدیل {requestStats.conversionRate}%</Tag>
                )}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <div style={card}>
            <div style={{ ...secTitle, marginBottom: 10 }}>
              <div style={bar} />
              📋 سوابق فرصت‌های این مشتری
            </div>

            <div style={mRow}>
              <span style={{ color: "#64748b" }}>کل فرصت‌های فایل‌ها</span>
              <span style={{ fontWeight: 600 }}>{requestStats.totalAllRequests}</span>
            </div>

            <div style={mRow}>
              <span style={{ color: "#64748b" }}>فرصت‌های این مشتری</span>
              <span style={{ fontWeight: 600, color: "#60a5fa" }}>
                {requestStats.customerRequests}
              </span>
            </div>

            <div style={mRow}>
              <span style={{ color: "#64748b" }}>فرصت‌های فروش‌شده</span>
              <span style={{ fontWeight: 600, color: "#34d399" }}>
                {requestStats.soldRequests}
              </span>
            </div>

            <div style={mRow}>
              <span style={{ color: "#64748b" }}>ارزش فرصت‌های این مشتری</span>
              <span style={{ fontWeight: 600 }}>
                {formatMoney(requestStats.requestAmount)}
              </span>
            </div>

            <div style={mRow}>
              <span style={{ color: "#64748b" }}>کیفیت مشتری</span>
              <span style={{ fontWeight: 600, color: "#fbbf24" }}>
                {requestStats.quality}
              </span>
            </div>
          </div>

          <div style={card}>
            <div style={{ ...secTitle, marginBottom: 10 }}>
              <div style={bar} />
              💰 سوابق خرید واقعی
            </div>

            <div style={mRow}>
              <span style={{ color: "#64748b" }}>جمع کل خرید واقعی ثبت‌شده</span>
              <span style={{ fontWeight: 700, color: "#34d399" }}>
                {purchaseStats.totalPurchaseCount} خرید / {formatMoney(purchaseStats.totalPurchaseAmount)}
              </span>
            </div>

            <div style={mRow}>
              <span style={{ color: "#64748b" }}>خریدهای فایل Purchase</span>
              <span style={{ fontWeight: 600, color: "#34d399" }}>
                {purchaseStats.filePurchaseCount}
              </span>
            </div>

            <div style={mRow}>
              <span style={{ color: "#64748b" }}>مبلغ خرید واقعی از فایل Purchase</span>
              <span style={{ fontWeight: 600, color: "#60a5fa" }}>
                {formatMoney(purchaseStats.filePurchaseAmount)}
              </span>
            </div>

            <div style={mRow}>
              <span style={{ color: "#64748b" }}>خریدهای جدید دستی</span>
              <span style={{ fontWeight: 600, color: "#34d399" }}>
                {purchaseStats.manualPurchaseCount}
              </span>
            </div>

            <div style={mRow}>
              <span style={{ color: "#64748b" }}>مبلغ خریدهای جدید دستی</span>
              <span style={{ fontWeight: 600, color: "#60a5fa" }}>
                {formatMoney(purchaseStats.manualPurchaseAmount)}
              </span>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "#94a3b8",
                lineHeight: 1.8,
                marginTop: 10,
                direction: "rtl",
                textAlign: "right",
              }}
            >
              {purchaseStats.background}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <div style={card}>
            <div style={{ ...secTitle, marginBottom: 10 }}>
              <div style={bar} />
              🏷️ تحلیل برند و محصول در فایل‌ها
            </div>

            <div style={textBox}>
              <div>{brandStats?.summary || "—"}</div>

              <div style={divider} />

              <div>
                برندهای پرتکرار:
                <br />
                {(brandStats?.topBrandsAll || [])
                  .map(x => `${x.name} (${x.count})`)
                  .join("، ") || "—"}
              </div>

              <div style={divider} />

              <div>
                محصولات پرتکرار:
                <br />
                {(brandStats?.topPartsAll || [])
                  .map(x => `${x.name} (${x.count})`)
                  .join("، ") || "—"}
              </div>

              <div style={divider} />

              <div>{ai.brandProductReview?.brandAttractiveness || "—"}</div>
              <div>{ai.brandProductReview?.productDemandSignal || "—"}</div>
              <div>{ai.brandProductReview?.valueComment || "—"}</div>
              <div>{ai.brandProductReview?.similarPurchaseEvidence || "—"}</div>
            </div>
          </div>

          <div style={card}>
            <div style={{ ...secTitle, marginBottom: 10 }}>
              <div style={bar} />
              🎯 شانس برنده شدن پیشنهاد
            </div>

            <div style={textBox}>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color:
                    winScore >= 65
                      ? "#34d399"
                      : winScore >= 40
                        ? "#fbbf24"
                        : "#f87171",
                }}
              >
                {winScore || "—"}%
              </div>

              <div style={divider} />

              <div>سطح: {winChance?.level || "—"}</div>

              <div style={divider} />

              <div>
                معیارهای اصلی:
                <br />
                {(winChance?.factors || []).slice(0, 4).map((f, i) => (
                  <span key={i}>• {f}<br /></span>
                ))}
              </div>

              <div style={divider} />

              <div>{winChance?.explanation || "—"}</div>

              <div style={divider} />

              <div>
                راه افزایش شانس:
                <br />
                {ai.winChanceCommentary?.howToIncreaseChance || "—"}
              </div>
            </div>
          </div>
        </div>

        {(ai.summary || ai.customerBackgroundCheck || ai.companyBackground) && (
          <div
            style={{
              ...card,
              borderRight: "4px solid #3b82f6",
            }}
          >
            <div style={textBox}>
              {ai.summary && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
                    📝 خلاصه درخواست
                  </div>
                  <div>{ai.summary}</div>
                  <div style={divider} />
                </>
              )}

              {ai.companyBackground && (
                <>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
                    🔎 بک‌گراند چک شرکت
                  </div>
                  <div>اندازه شرکت: {ai.companyBackground.companySize || "—"}</div>
                  <div>حوزه فعالیت: {ai.companyBackground.industry || "—"}</div>
                  <div>جغرافیا: {ai.companyBackground.geography || "—"}</div>
                  <div>نوع شرکت: {ai.companyBackground.companyType || "—"}</div>
                  <div>اطمینان: {ai.companyBackground.confidence || "low"}</div>
                  <div style={{ color: "#64748b", marginTop: 8 }}>
                    {ai.companyBackground.note ||
                      "این بخش بدون وب‌سرچ واقعی و بر اساس نام/متن RFQ تخمین زده شده است."}
                  </div>
                </>
              )}

              {ai.customerBackgroundCheck && (
                <>
                  <div style={divider} />
                  <div>{ai.customerBackgroundCheck}</div>
                </>
              )}
            </div>
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
                {[
                  "Part Number",
                  "Qty",
                  "Manufacturer",
                  "Category",
                  "Description",
                  "Application",
                  "Status",
                  "China Price",
                  "UAE Price",
                  "Alternative",
                ].map(h => (
                  <th key={h} style={th}>
                    {h}
                  </th>
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
                  <td style={td}>{p.category || "—"}</td>
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
                  <td style={{ ...td, color: "#94a3b8" }}>
                    {p.alternatives || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(ai.parts || []).length > 0 && (
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
                direction: "ltr",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 8 }}>
                Simple Application Notes
              </div>

              {(ai.parts || []).map((p, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <strong style={{ color: "#60a5fa" }}>
                    {p.partNumber || `Item ${i + 1}`}:
                  </strong>{" "}
                  {p.application || p.description || "Application needs further technical review."}
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            background: bg2,
            border: `1px solid ${bdr}`,
            borderRight: "4px solid #3b82f6",
            borderRadius: 14,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", marginBottom: 10 }}>
            💡 توصیه تیم فروش
          </div>

          <div style={textBox}>
            <div>{ai.recommendation || "—"}</div>
            <div style={divider} />
            <div>{ai.risks || "—"}</div>
            <div style={divider} />
            <div style={{ color: "#60a5fa", fontWeight: 600 }}>
              {ai.nextStep || "—"}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        fontFamily: "'Vazirmatn','Tahoma',sans-serif",
        direction: "rtl",
        background: bg,
        minHeight: "100vh",
        color: "#e2e8f0",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
      `}</style>

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
            <div style={{ fontSize: 15, fontWeight: 700 }}>
              RFQ Analyzer Pro
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              سیستم تحلیل هوشمند — Claude AI + ChatGPT
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 11,
            padding: "3px 12px",
            borderRadius: 20,
            background:
              isReady && hasSelectedProvider
                ? "rgba(16,185,129,0.15)"
                : "rgba(100,116,139,0.15)",
            color: isReady && hasSelectedProvider ? "#34d399" : "#94a3b8",
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
              background: isReady && hasSelectedProvider ? "#34d399" : "#64748b",
              display: "inline-block",
            }}
          />
          {isReady && hasSelectedProvider ? "آماده تحلیل" : "در انتظار تنظیمات"}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        <div style={card}>
          <div style={secTitle}>
            <div style={bar} />
            تنظیمات — فایل‌ها و مدل‌های AI
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 12,
            }}
          >
            {[
              { key: "purchase", label: "Purchase 2025", desc: "سوابق خرید", icon: "💰" },
              { key: "req25", label: "Request 2025", desc: "درخواست‌ها", icon: "📋" },
              { key: "req26", label: "Request 2026", desc: "درخواست‌ها", icon: "📋" },
            ].map(f => (
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

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginTop: 16,
            }}
          >
            {Object.values(AI_PROVIDERS).map(provider => (
              <div
                key={provider.key}
                style={{
                  background: bg3,
                  border: `1px solid ${selectedProviders[provider.key] ? "#3b82f6" : bdr}`,
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    cursor: "pointer",
                    marginBottom: 10,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selectedProviders[provider.key]}
                    onChange={() => toggleProvider(provider.key)}
                  />
                  <span style={{ fontWeight: 700 }}>{provider.label}</span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{provider.badge}</span>
                </label>

                <button
                  style={btn(apiTested[provider.key] ? "primary" : "secondary")}
                  onClick={() => testApi(provider.key)}
                >
                  {apiTested[provider.key] ? "✅ متصل" : `تست اتصال ${provider.label}`}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={card}>
          <div style={secTitle}>
            <div style={bar} />
            اطلاعات درخواست جدید
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 14,
            }}
          >
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
                style={{
                  ...inp,
                  minHeight: 90,
                  resize: "vertical",
                  direction: "rtl",
                  lineHeight: 1.7,
                }}
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
              background: isReady && phase !== "running" && hasSelectedProvider ? "linear-gradient(135deg,#3b82f6,#6366f1)" : bg3,
              color: isReady && phase !== "running" && hasSelectedProvider ? "#fff" : "#64748b",
              border: "none",
              borderRadius: 10,
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 700,
              cursor: isReady && phase !== "running" && hasSelectedProvider ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
            onClick={startAnalysis}
            disabled={!isReady || phase === "running" || !hasSelectedProvider}
          >
            {phase === "running" ? (
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

        {phase === "running" && (
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
                      s.state === "active"
                        ? "rgba(59,130,246,0.08)"
                        : s.state === "done"
                          ? "rgba(16,185,129,0.06)"
                          : s.state === "error"
                            ? "rgba(239,68,68,0.06)"
                            : bg3,
                    border: `1px solid ${
                      s.state === "active"
                        ? "#3b82f6"
                        : s.state === "done"
                          ? "#10b981"
                          : s.state === "error"
                            ? "#ef4444"
                            : bdr
                    }`,
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <span style={{ fontSize: 17, width: 24, textAlign: "center" }}>
                    {s.state === "active"
                      ? "⏳"
                      : s.state === "done"
                        ? "✅"
                        : s.state === "error"
                          ? "❌"
                          : s.icon}
                  </span>

                  <span style={{ flex: 1 }}>{s.text}</span>

                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 20,
                      fontWeight: 600,
                      background:
                        s.state === "active"
                          ? "rgba(59,130,246,0.2)"
                          : s.state === "done"
                            ? "rgba(16,185,129,0.2)"
                            : "rgba(100,116,139,0.15)",
                      color:
                        s.state === "active"
                          ? "#60a5fa"
                          : s.state === "done"
                            ? "#34d399"
                            : "#94a3b8",
                    }}
                  >
                    {s.state === "active"
                      ? "در حال پردازش"
                      : s.state === "done"
                        ? "تکمیل"
                        : s.state === "error"
                          ? "خطا"
                          : "در انتظار"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "done" && result && (
          <>
            {Object.entries(result.errors || {}).length > 0 && (
              <div style={{ ...card, borderRight: "4px solid #ef4444" }}>
                <div style={{ ...secTitle, marginBottom: 10 }}>
                  <div style={bar} />
                  خطاهای مدل‌ها
                </div>
                <div style={textBox}>
                  {Object.entries(result.errors).map(([key, msg]) => (
                    <div key={key}>
                      {AI_PROVIDERS[key]?.label || key}: {msg}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.entries(result.aiResults || {}).map(([providerKey, ai]) =>
              renderAiResult(providerKey, ai, {
                requestStats: result.requestStats,
                purchaseStats: result.purchaseStats,
                brandStats: result.brandStats,
                winChance: result.winChance,
                parts: ai.parts || [],
              })
            )}

            <div style={{ display: "flex", gap: 12 }}>
              <button style={btn("primary")} onClick={copyReport}>
                📋 کپی گزارش
              </button>
              <button
                style={btn("secondary")}
                onClick={() => {
                  setPhase("idle");
                  setResult(null);
                }}
              >
                🔄 تحلیل جدید
              </button>
            </div>
          </>
        )}
      </div>

      <div
        style={{
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
        }}
      >
        {toast}
      </div>
    </div>
  );
}