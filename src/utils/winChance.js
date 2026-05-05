import { parseNumber } from "./numbers";

function clamp(n, min = 0, max = 100) {
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

export function calculateWinChance({
  requestStats,
  purchaseStats,
  brandStats,
  requestText,
}) {
  const conversionRate = parseNumber(requestStats?.conversionRate);
  const customerRequests = parseNumber(requestStats?.customerRequests);
  const soldRequests = parseNumber(requestStats?.soldRequests);
  const totalPurchaseAmount = parseNumber(purchaseStats?.totalPurchaseAmount);
  const totalPurchaseCount = parseNumber(purchaseStats?.totalPurchaseCount);
  const mentionedBrandCount = parseNumber(brandStats?.mentionedBrandCount);
  const mentionedProductCount = parseNumber(brandStats?.mentionedProductCount);

  let score = 35;

  const factors = [];

  if (conversionRate >= 40) {
    score += 18;
    factors.push("نرخ تبدیل مشتری بالاست.");
  } else if (conversionRate >= 20) {
    score += 10;
    factors.push("نرخ تبدیل مشتری قابل قبول است.");
  } else if (customerRequests > 3 && soldRequests === 0) {
    score -= 10;
    factors.push("مشتری درخواست‌های متعدد داشته اما فروش ثبت‌شده ندارد.");
  }

  if (totalPurchaseAmount > 0) {
    score += Math.min(20, 8 + Math.log10(totalPurchaseAmount + 1) * 3);
    factors.push("سابقه خرید واقعی وجود دارد.");
  }

  if (totalPurchaseCount >= 3) {
    score += 8;
    factors.push("تعداد خرید واقعی مشتری قابل توجه است.");
  } else if (totalPurchaseCount === 1 || totalPurchaseCount === 2) {
    score += 4;
    factors.push("حداقل یک یا دو خرید واقعی ثبت شده است.");
  }

  if (customerRequests >= 10) {
    score += 6;
    factors.push("تعداد درخواست‌های مشتری بالاست.");
  } else if (customerRequests >= 3) {
    score += 3;
    factors.push("مشتری چند درخواست ثبت‌شده دارد.");
  }

  if (mentionedBrandCount > 0 || mentionedProductCount > 0) {
    score += 10;
    factors.push("برند یا محصول مشابه در فایل‌ها تکرار شده و شناخت قبلی وجود دارد.");
  }

  if (hasUrgency(requestText)) {
    score += 8;
    factors.push("در متن درخواست نشانه فوریت دیده می‌شود.");
  }

  if (customerRequests === 0 && totalPurchaseCount === 0) {
    score -= 8;
    factors.push("مشتری سابقه مشخصی در فایل‌ها ندارد.");
  }

  const finalScore = clamp(score);

  let level = "Low";
  if (finalScore >= 70) level = "High";
  else if (finalScore >= 45) level = "Medium";

  return {
    score: finalScore,
    level,
    factors,
    formula: {
      baseScore: 35,
      conversionRate,
      customerRequests,
      soldRequests,
      totalPurchaseAmount,
      totalPurchaseCount,
      mentionedBrandCount,
      mentionedProductCount,
      urgencyDetected: hasUrgency(requestText),
    },
    explanation:
      "این امتیاز داخل برنامه و بر اساس نرخ تبدیل، سابقه خرید واقعی، تعداد درخواست‌ها، تکرار برند/محصول در فایل‌ها و فوریت متن RFQ محاسبه شده است؛ عدد توسط AI حدس زده نشده است.",
  };
}