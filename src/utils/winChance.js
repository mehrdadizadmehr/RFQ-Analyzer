import { parseNumber } from "./numbers";

function clamp(n, min = 0, max = 92) {
  return Math.max(min, Math.min(max, Math.round(n)));
}

function hasUrgency(text) {
  const t = String(text || "").toLowerCase();
  return (
    t.includes("urgent") ||
    t.includes("asap") ||
    t.includes("immediate") ||
    t.includes("shutdown") ||
    t.includes("فوری") ||
    t.includes("اضطراری")
  );
}

function hasBudgetOrCommercialSignal(text) {
  const t = String(text || "").toLowerCase();
  return (
    t.includes("target price") ||
    t.includes("budget") ||
    t.includes("best price") ||
    t.includes("delivery") ||
    t.includes("lead time") ||
    t.includes("payment") ||
    t.includes("قیمت") ||
    t.includes("بودجه") ||
    t.includes("زمان تحویل") ||
    t.includes("پرداخت")
  );
}

export function calculateWinChance({
  requestStats,
  purchaseStats,
  brandStats,
  requestText,
}) {
  const rawConversionRate = parseNumber(requestStats?.conversionRate);
  const effectiveConversionRate = parseNumber(
    requestStats?.effectiveConversionRate ?? requestStats?.conversionRate
  );

  const customerRequests = parseNumber(requestStats?.customerRequests);
  const soldRequests = parseNumber(requestStats?.soldRequests);
  const totalPurchaseAmount = parseNumber(purchaseStats?.totalPurchaseAmount);
  const totalPurchaseCount = parseNumber(purchaseStats?.totalPurchaseCount);
  const mentionedBrandCount = parseNumber(brandStats?.mentionedBrandCount);
  const mentionedProductCount = parseNumber(brandStats?.mentionedProductCount);
  const mentionedCategoryCount = parseNumber(brandStats?.mentionedCategoryCount);
  const similarSuccessfulPurchasesCount = parseNumber(
    brandStats?.similarSuccessfulPurchasesCount
  );
  const similarSuccessfulPurchasesAmount = parseNumber(
    brandStats?.similarSuccessfulPurchasesAmount
  );

  const matchedPurchaseRows = parseNumber(requestStats?.matchedPurchaseRows);
  const highConfidenceMatches = parseNumber(requestStats?.highConfidenceMatches);
  const estimatedAverageMargin = parseNumber(requestStats?.estimatedAverageMargin);

  const urgencyDetected = hasUrgency(requestText);
  const commercialSignalDetected = hasBudgetOrCommercialSignal(requestText);
  const hasRealPurchase = totalPurchaseCount > 0 || totalPurchaseAmount > 0;
  const hasHistoricalDemand =
    mentionedBrandCount > 0 ||
    mentionedProductCount > 0 ||
    mentionedCategoryCount > 0;

  let score = 32;
  const factors = [];
  const riskFactors = [];
  const positiveSignals = [];

  if (rawConversionRate >= 20) {
    score += 12;
    factors.push("نرخ تبدیل ثبت‌شده مشتری در فایل Request قابل قبول است.");
    positiveSignals.push("raw_conversion_acceptable");
  } else if (rawConversionRate > 0) {
    score += 5;
    factors.push("در فایل Request تعدادی فروش/WIN برای مشتری ثبت شده است.");
    positiveSignals.push("some_raw_conversion");
  } else if (customerRequests > 3 && soldRequests === 0 && !hasRealPurchase) {
    score -= 10;
    factors.push("مشتری درخواست‌های متعدد داشته اما فروش یا خرید واقعی ثبت‌شده ندارد.");
    riskFactors.push("many_requests_without_sale_or_purchase");
  }

  if (hasRealPurchase) {
    score += Math.min(16, 7 + Math.log10(totalPurchaseAmount + 1) * 2);
    factors.push("سابقه خرید واقعی وجود دارد و این مشتری را از حالت صرفاً فرصت‌محور خارج می‌کند.");
    positiveSignals.push("real_purchase_history");
  }

  if (matchedPurchaseRows > 0) {
    score += Math.min(10, 4 + matchedPurchaseRows * 1.2);
    factors.push("بین Request و Purchase ارتباط تجاری واقعی شناسایی شده است.");
    positiveSignals.push("matched_purchase_linkage");
  }

  if (highConfidenceMatches > 0) {
    score += Math.min(8, highConfidenceMatches * 1.5);
    factors.push("بخشی از ارتباط‌های Request و Purchase با اطمینان بالا شناسایی شده‌اند.");
    positiveSignals.push("high_confidence_commercial_matches");
  }

  if (estimatedAverageMargin >= 20) {
    score += 5;
    factors.push("حاشیه سود تاریخی مرتبط مناسب است.");
    positiveSignals.push("healthy_historical_margin");
  } else if (estimatedAverageMargin > 0 && estimatedAverageMargin < 12) {
    score -= 4;
    factors.push("حاشیه سود تاریخی مرتبط پایین است و باید در قیمت‌گذاری احتیاط شود.");
    riskFactors.push("low_historical_margin");
  }

  if (totalPurchaseCount >= 5) {
    score += 7;
    factors.push("تعداد خرید واقعی مشتری بالا است.");
    positiveSignals.push("repeat_buyer_high");
  } else if (totalPurchaseCount >= 3) {
    score += 5;
    factors.push("چند خرید واقعی برای مشتری ثبت شده است.");
    positiveSignals.push("repeat_buyer_medium");
  } else if (totalPurchaseCount === 1 || totalPurchaseCount === 2) {
    score += 3;
    factors.push("حداقل یک یا دو خرید واقعی ثبت شده است.");
    positiveSignals.push("real_purchase_low_count");
  }

  if (customerRequests >= 10) {
    score += 4;
    factors.push("تعداد درخواست‌های مشتری بالاست و نشان‌دهنده تعامل مداوم است.");
    positiveSignals.push("high_request_volume");
  } else if (customerRequests >= 3) {
    score += 2;
    factors.push("مشتری چند درخواست ثبت‌شده دارد.");
    positiveSignals.push("medium_request_volume");
  }

  if (similarSuccessfulPurchasesCount > 0) {
    score += Math.min(14, 6 + similarSuccessfulPurchasesCount * 2);
    factors.push("برای برند/مدل/دسته مشابه سابقه خرید موفق یا فرصت فروش‌شده وجود دارد.");
    positiveSignals.push("similar_success_history");
  } else if (hasHistoricalDemand) {
    score += 7;
    factors.push("برند، مدل یا دسته مشابه در فایل‌ها تکرار شده و شناخت قبلی وجود دارد.");
    positiveSignals.push("historical_demand_signal");
  }

  if (similarSuccessfulPurchasesAmount > 0) {
    score += Math.min(8, Math.log10(similarSuccessfulPurchasesAmount + 1) * 2);
    factors.push("ارزش مالی سوابق مشابه در فایل‌ها قابل توجه است.");
    positiveSignals.push("similar_success_value");
  }

  if (urgencyDetected) {
    score += 5;
    factors.push("در متن درخواست نشانه فوریت دیده می‌شود.");
    positiveSignals.push("urgency_detected");
  }

  if (commercialSignalDetected) {
    score += 4;
    factors.push("در متن RFQ نشانه‌های تجاری مثل قیمت، تحویل یا شرایط پرداخت دیده می‌شود.");
    positiveSignals.push("commercial_signal_detected");
  }

  if (customerRequests === 0 && !hasRealPurchase) {
    score -= 8;
    factors.push("مشتری سابقه مشخصی در فایل‌ها ندارد.");
    riskFactors.push("new_or_unknown_customer");
  }

  if (!hasHistoricalDemand) {
    score -= 4;
    factors.push("برای برند/مدل/دسته مشابه در فایل‌ها تقاضای مشخصی دیده نشد.");
    riskFactors.push("low_historical_product_signal");
  }

  const exceptionalEvidence =
    highConfidenceMatches >= 3 &&
    totalPurchaseCount >= 3 &&
    rawConversionRate >= 10 &&
    similarSuccessfulPurchasesCount > 0;

  const maxScore = exceptionalEvidence ? 97 : 92;

  const finalScore = clamp(score, 0, maxScore);

  let level = "Low";
  if (finalScore >= 70) level = "High";
  else if (finalScore >= 45) level = "Medium";

  return {
    score: finalScore,
    level,
    factors,
    positiveSignals,
    riskFactors,
    formula: {
      baseScore: 32,
      rawConversionRate,
      effectiveConversionRate,
      customerRequests,
      soldRequests,
      totalPurchaseAmount,
      totalPurchaseCount,
      mentionedBrandCount,
      mentionedProductCount,
      mentionedCategoryCount,
      similarSuccessfulPurchasesCount,
      similarSuccessfulPurchasesAmount,
      matchedPurchaseRows,
      highConfidenceMatches,
      estimatedAverageMargin,
      maxScore,
      urgencyDetected,
      commercialSignalDetected,
      hasRealPurchase,
      hasHistoricalDemand,
    },
    explanation:
      "این امتیاز داخل برنامه و بر اساس نرخ تبدیل ثبت‌شده، سابقه خرید واقعی، ارتباط‌های شناسایی‌شده بین Request و Purchase، تعداد درخواست‌ها، سوابق برند/مدل/دسته، margin تاریخی، فوریت متن RFQ و سیگنال‌های تجاری محاسبه شده است. برای جلوگیری از خوش‌بینی غیرواقعی، امتیاز به‌صورت پیش‌فرض روی 92% سقف دارد و فقط در شرایط شواهد تجاری استثنایی می‌تواند تا 97% افزایش یابد.",
  };
}