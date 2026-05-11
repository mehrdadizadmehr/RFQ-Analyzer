import { useState } from "react";
import { STEPS, delay } from "../constants/rfq";
import { AI_PROVIDERS } from "../constants/providers";
import { buildExtractionPrompt } from "../prompts/buildExtractionPrompt";
import { buildRfqPrompt } from "../prompts/buildRfqPrompt";
import { callClaude } from "../services/claude";
import { extractRfqWithOpenAI } from "../services/openai";
import { analyzeCustomerRequests, analyzeCustomerPurchases } from "../utils/customerAnalysis";
import { analyzeBrandProductStats } from "../utils/brandProductAnalysis";
import { calculateWinChance } from "../utils/winChance";

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

    const requestStats = analyzeCustomerRequests(files.req25, files.req26, extractedCustomer);
    setStepState("s1", "done");

    setStepState("s2", "active");
    await delay(300);

    const purchaseStats = analyzeCustomerPurchases(files.purchase, extractedCustomer, manualPurchaseCount, manualPurchaseAmount);
    setStepState("s2", "done");

    setStepState("s3", "active");
    await delay(300);

    const brandStats = analyzeBrandProductStats(files.req25, files.req26, files.purchase, normalizedRequestText);

    const winChance = calculateWinChance({ requestStats, purchaseStats, brandStats, requestText: normalizedRequestText });

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
      extractedRfq: extractedRfqData,
    });

    const aiResults = {};
    const errors = {};

    try {
      await callClaude(prompt, 3200)
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

    const mergedAi = { ...aiResults.claude };

    setResult({
      ai: mergedAi,
      aiResults,
      errors,
      requestStats,
      purchaseStats,
      brandStats,
      parts: mergedAi.parts || [],
      customer: extractedCustomer,
      rfqNum: extractedRfq,
      winChance,
      extractedRfq: extractedRfqData,
    });

    setPhase("done");
  };

  return { phase, steps, result, startAnalysis };
}
