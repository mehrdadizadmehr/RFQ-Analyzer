import { useState } from "react";
import { STEPS, delay } from "../constants/rfq";
import { AI_PROVIDERS } from "../constants/providers";
import { buildExtractionPrompt } from "../prompts/buildExtractionPrompt";
import { buildRfqPrompt } from "../prompts/buildRfqPrompt";
import { callClaude } from "../services/claude";
import {
  extractRfqWithOpenAI,
  buildBaseRfqAnalysisWithOpenAI,
} from "../services/openai";
import { searchCompanyBackground } from "../services/companySearch";
import {
  analyzeCustomerRequests,
  analyzeCustomerPurchases,
  enrichCustomerRequestStatsWithPurchases,
} from "../utils/customerAnalysis";
import { analyzeBrandProductStats } from "../utils/brandProductAnalysis";
import { buildCommercialMatcher } from "../utils/commercialMatcher";
import { calculateWinChance } from "../utils/winChance";

function ensureSalesRecommendationFields({ mergedAi, purchaseStats, brandStats, winChance }) {
  const hasRealPurchase =
    Number(purchaseStats?.totalPurchaseCount || 0) > 0 ||
    Number(purchaseStats?.totalPurchaseAmount || 0) > 0;

  const hasBrandHistory = Array.isArray(brandStats?.brandDemandStats)
    ? brandStats.brandDemandStats.length > 0
    : false;

  const fallbackRecommendation = hasRealPurchase
    ? "با توجه به سابقه خرید واقعی مشتری، این RFQ باید سریع وارد فاز قیمت‌گیری شود. پیشنهاد را با تفکیک China sourcing و UAE market آماده کنید، روی اصالت کالا، lead time دقیق و شرایط پرداخت شفاف تاکید کنید."
    : "قبل از صرف زمان زیاد، جدیت مشتری و اعتبار RFQ را با یک تماس یا ایمیل کوتاه تایید کنید. سپس قیمت اولیه، زمان تحویل و شرایط پرداخت را شفاف ارائه دهید.";

  const fallbackRisks = [
    !hasRealPurchase
      ? "سابقه خرید واقعی کافی برای این مشتری ثبت نشده است."
      : null,
    Number(winChance?.score || 0) < 45
      ? "شانس برد پایین یا متوسط است و باید قبل از قیمت‌گیری سنگین، جدیت مشتری تایید شود."
      : null,
    !hasBrandHistory
      ? "برای برندهای این RFQ سابقه قابل اتکای کافی در فایل‌ها پیدا نشد."
      : null,
    "ریسک قیمت‌گذاری، اصالت کالا، availability و lead time باید قبل از ارسال پیشنهاد نهایی کنترل شود.",
  ]
    .filter(Boolean)
    .join(" ");

  const fallbackNextStep =
    "قدم بعدی: 1) تایید دقیق Part Number و Qty با مشتری، 2) استعلام همزمان از China و UAE، 3) محاسبه margin، 4) اعلام بازه قیمت و lead time، 5) درخواست target price یا budget در صورت نیاز.";

  return {
    ...mergedAi,
    recommendation:
      String(mergedAi?.recommendation || "").trim() || fallbackRecommendation,
    risks: String(mergedAi?.risks || "").trim() || fallbackRisks,
    nextStep: String(mergedAi?.nextStep || "").trim() || fallbackNextStep,
  };
}

export function useAnalysis(showToast) {
  const [phase, setPhase] = useState("idle");
  const [steps, setSteps] = useState(STEPS.map(s => ({ ...s, state: "waiting" })));
  const [result, setResult] = useState(null);

  const setStepState = (id, st) => {
    setSteps(prev => prev.map(s => (s.id === id ? { ...s, state: st } : s)));
  };

  const startAnalysis = async ({ files, customer, setCustomer, rfqNum, setRfqNum, requestText, notes, extraCustomerInfo, manualPurchaseCount, manualPurchaseAmount }) => {
    setPhase("running");
    setSteps(STEPS.map(s => ({ ...s, state: "waiting" })));
    setResult(null);

    setStepState("s1", "active");
    await delay(300);

    let extractedCustomer = customer;
    let extractedRfq = rfqNum;
    let normalizedRequestText = requestText;
    let extractedRfqData = null;

    try {
      extractedRfqData = await extractRfqWithOpenAI(buildExtractionPrompt({ requestText }));

      if (extractedRfqData?.customer && !customer?.trim()) {
        extractedCustomer = extractedRfqData.customer;
        setCustomer(extractedRfqData.customer);
      }

      if (extractedRfqData?.rfqNumber && !rfqNum?.trim()) {
        extractedRfq = extractedRfqData.rfqNumber;
        setRfqNum(extractedRfqData.rfqNumber);
      }

      if (extractedRfqData?.normalizedText) {
        normalizedRequestText = extractedRfqData.normalizedText;
      }
    } catch (err) {
      console.warn("RFQ extraction failed:", err.message);
      showToast("⚠️ استخراج ChatGPT انجام نشد؛ تحلیل با متن خام ادامه پیدا می‌کند.");
    }

    let requestStats = analyzeCustomerRequests(
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

    const allRequestRows = [
      ...(Array.isArray(files.req25) ? files.req25 : []),
      ...(Array.isArray(files.req26) ? files.req26 : []),
    ];

    const commercialMatcher = buildCommercialMatcher({
      requestRows: allRequestRows,
      purchaseRows: Array.isArray(files.purchase) ? files.purchase : [],
      currentCustomer: extractedCustomer,
    });

    console.log("Commercial Matcher Summary:", {
      matched: commercialMatcher.matchedCount,
      unmatched: commercialMatcher.unmatchedCount,
      high: commercialMatcher.highConfidenceCount,
      medium: commercialMatcher.mediumConfidenceCount,
      low: commercialMatcher.lowConfidenceCount,
      revenue: commercialMatcher.totalRevenue,
      grossProfit: commercialMatcher.totalGrossProfit,
      avgMargin: commercialMatcher.averageMargin,
      relevantMatches: commercialMatcher.relevantMatchCount,
      relevantRevenue: commercialMatcher.relevantRevenue,
      relevantGrossProfit: commercialMatcher.relevantGrossProfit,
      relevantAverageMargin: commercialMatcher.relevantAverageMargin,
      relevantSuppliers: commercialMatcher.topRelevantSuppliers,
      relevantBrands: commercialMatcher.topRelevantBrands,
    });

    requestStats = enrichCustomerRequestStatsWithPurchases(
      requestStats,
      purchaseStats,
      commercialMatcher
    );

    setStepState("s2", "done");

    setStepState("s3", "active");
    await delay(300);

    const brandStats = analyzeBrandProductStats(
      files.req25,
      files.req26,
      files.purchase,
      normalizedRequestText,
      extractedCustomer,
      commercialMatcher
    );

    let companySearch = null;

    try {
      companySearch = await searchCompanyBackground(
        extractedCustomer,
        normalizedRequestText
      );

      if (companySearch?.cacheHit) {
        console.log("Company background loaded from cache");
      } else if (companySearch?.onlineAvailable) {
        console.log("Company background loaded from Tavily");
      } else {
        console.warn("Online company background unavailable");
      }
    } catch (err) {
      console.warn("Company search failed:", err.message);

      companySearch = {
        ok: false,
        onlineAvailable: false,
        answer:
          "اطلاعات آنلاین قابل دریافت نیست؛ تحلیل بر اساس متن RFQ انجام می‌شود.",
        results: [],
      };
    }

    const winChance = calculateWinChance({
      requestStats,
      purchaseStats,
      brandStats,
      requestText: normalizedRequestText,
    });

    setStepState("s3", "done");
    setStepState("s4", "active");

    let baseAi = null;

    try {
      baseAi = await buildBaseRfqAnalysisWithOpenAI({
        customer: extractedCustomer,
        rfqNum: extractedRfq,
        requestText: normalizedRequestText,
        requestStats,
        purchaseStats,
        commercialMatcher,
        brandStats,
        companySearch,
      });
    } catch (err) {
      console.warn("OpenAI base analysis failed:", err.message);
      baseAi = {
        summary: "خلاصه پایه توسط OpenAI قابل تولید نبود؛ تحلیل اصلی با Claude ادامه پیدا کرد.",
        backgroundSummary: "بک‌گراند پایه توسط OpenAI قابل تولید نبود.",
        onlineDataStatus:
          companySearch?.onlineAvailable
            ? "اطلاعات آنلاین دریافت شد اما خلاصه‌سازی پایه انجام نشد."
            : "اطلاعات آنلاین قابل دریافت نیست؛ تحلیل بر اساس متن RFQ انجام می‌شود.",
        estimatedTotalChina: "نامشخص",
        estimatedTotalUAE: "نامشخص",
        pricingNotes: "برآورد پایه قیمت توسط OpenAI قابل تولید نبود.",
        parts: extractedRfqData?.items || [],
      };
    }

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
      commercialMatcher,
      brandStats,
      winChance,
      extractedRfq: extractedRfqData,
      companySearch,
      baseAi,
    });

    const aiResults = {};
    const errors = {};

    try {
      await callClaude(prompt, 4500)
        .then(data => { aiResults.claude = data; })
        .catch(err => { errors.claude = err.message; });

      if (!aiResults.claude) {
        throw new Error(
          Object.entries(errors)
            .map(([k, v]) => `${AI_PROVIDERS[k]?.label || k}: ${v}`)
            .join(" | ") || "Claude analysis failed"
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

    const mergedAiRaw = {
      ...(baseAi || {}),
      ...(aiResults.claude || {}),
      summary: aiResults.claude?.summary || baseAi?.summary || "—",
      backgroundSummary:
        aiResults.claude?.backgroundSummary || baseAi?.backgroundSummary || "—",
      onlineDataStatus:
        aiResults.claude?.onlineDataStatus || baseAi?.onlineDataStatus || "—",
      estimatedTotalChina:
        aiResults.claude?.estimatedTotalChina || baseAi?.estimatedTotalChina || "نامشخص",
      estimatedTotalUAE:
        aiResults.claude?.estimatedTotalUAE || baseAi?.estimatedTotalUAE || "نامشخص",
      pricingNotes:
        aiResults.claude?.pricingNotes || baseAi?.pricingNotes || "—",
      parts:
        Array.isArray(aiResults.claude?.parts) && aiResults.claude.parts.length > 0
          ? aiResults.claude.parts
          : baseAi?.parts || [],
    };

    const mergedAi = ensureSalesRecommendationFields({
      mergedAi: mergedAiRaw,
      purchaseStats,
      brandStats,
      winChance,
    });

    setResult({
      ai: mergedAi,
      aiResults,
      baseAi,
      errors,
      requestStats,
      purchaseStats,
      commercialMatcher,
      brandStats,
      parts: mergedAi.parts || [],
      customer: extractedCustomer,
      rfqNum: extractedRfq,
      winChance,
      extractedRfq: extractedRfqData,
      companySearch,
    });

    setPhase("done");
  };

  return { phase, steps, result, startAnalysis };
}
