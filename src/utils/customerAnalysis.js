import { findColumn } from "./excel";
import { normalizeText, parseNumber } from "./numbers";

export function isSameCustomer(rowValue, customer) {
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

export function enrichCustomerRequestStatsWithPurchases(requestStats, purchaseStats) {
  const totalPurchaseCount = parseNumber(purchaseStats?.totalPurchaseCount);
  const totalPurchaseAmount = parseNumber(purchaseStats?.totalPurchaseAmount);
  const conversionRate = parseNumber(requestStats?.conversionRate);

  const hasRealPurchase = totalPurchaseCount > 0 || totalPurchaseAmount > 0;

  const effectiveConversionRate = hasRealPurchase
    ? Math.max(conversionRate, 65)
    : conversionRate;

  let effectiveQuality = requestStats?.quality || "نامشخص";

  if (hasRealPurchase && effectiveConversionRate >= 65) {
    effectiveQuality = "مشتری خریددار / با سابقه واقعی";
  } else if (hasRealPurchase) {
    effectiveQuality = "مشتری با خرید واقعی ثبت‌شده";
  }

  const effectiveBackground = hasRealPurchase
    ? `${requestStats?.background || ""} علاوه بر سوابق درخواست، برای این مشتری خرید واقعی ثبت شده است؛ بنابراین نرخ تبدیل فرصت‌ها ممکن است صفر باشد، اما مشتری از نظر خرید واقعی فعال محسوب می‌شود.`
    : requestStats?.background;

  return {
    ...requestStats,
    effectiveConversionRate,
    effectiveQuality,
    effectiveBackground,
    hasRealPurchase,
  };
}

export function analyzeCustomerRequests(rows25, rows26, customer) {
  const allRows = [...(rows25 || []), ...(rows26 || [])];

  const empty = {
    loaded: allRows.length > 0,
    found: false,
    totalAllRequests: allRows.length,
    customerRequests: 0,
    soldRequests: 0,
    requestAmount: 0,
    conversionRate: 0,
    effectiveConversionRate: 0,
    quality: "نامشخص",
    effectiveQuality: "نامشخص",
    topBrands: [],
    background: "فایل درخواست‌ها بارگذاری نشده یا نام مشتری وارد نشده است.",
    effectiveBackground: "فایل درخواست‌ها بارگذاری نشده یا نام مشتری وارد نشده است.",
  };

  if (!allRows.length || !customer) return empty;

  const nameCol = findColumn(allRows, [
    "customer", "مشتری", "customer name", "نام مشتری", "company", "شرکت",
  ]);

  const statusCol = findColumn(allRows, [
    "status", "وضعیت", "commercial status", "نتیجه", "result",
  ]);

  const amountCol = findColumn(allRows, [
    "estimate price", "estimate", "pi amount", "amount", "مبلغ",
    "قیمت", "total", "جمع", "aed",
  ]);

  const brandCol = findColumn(allRows, ["brand", "برند", "manufacturer", "سازنده"]);

  if (!nameCol) {
    return {
      ...empty,
      loaded: true,
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
      s.includes("won") ||
      s.includes("تایید") ||
      s.includes("فروش") ||
      s.includes("خرید") ||
      s.includes("موفق")
    );
  });

  const requestAmount = matched.reduce(
    (sum, r) => sum + parseNumber(r[amountCol]),
    0
  );

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
    effectiveConversionRate: conversionRate,
    quality,
    effectiveQuality: quality,
    topBrands,
    background: matched.length
      ? `این مشتری ${matched.length} فرصت/درخواست ثبت‌شده دارد، ${sold.length} مورد فروش/تبدیل‌شده در فایل Request دارد و نرخ تبدیل فرصت‌ها ${conversionRate}% است.`
      : "برای این مشتری در فایل‌های درخواست، سابقه‌ای پیدا نشد.",
    effectiveBackground: matched.length
      ? `این مشتری ${matched.length} فرصت/درخواست ثبت‌شده دارد، ${sold.length} مورد فروش/تبدیل‌شده در فایل Request دارد و نرخ تبدیل فرصت‌ها ${conversionRate}% است.`
      : "برای این مشتری در فایل‌های درخواست، سابقه‌ای پیدا نشد.",
  };
}

export function analyzeCustomerPurchases(rows, customer, manualPurchaseCount, manualPurchaseAmount) {
  const manualCount = parseNumber(manualPurchaseCount);
  const manualAmount = parseNumber(manualPurchaseAmount);

  const base = {
    loaded: !!rows,
    found: manualCount > 0 || manualAmount > 0,
    filePurchaseCount: 0,
    filePurchaseAmount: 0,
    manualPurchaseCount: manualCount,
    manualPurchaseAmount: manualAmount,
    totalPurchaseCount: manualCount,
    totalPurchaseAmount: manualAmount,
    purchaseCount: manualCount,
    purchaseAmount: manualAmount,
    background:
      manualCount > 0 || manualAmount > 0
        ? "در فایل Purchase خریدی پیدا نشد یا فایل بارگذاری نشده، اما خرید دستی جدید وارد شده و در جمع خرید واقعی لحاظ شده است."
        : "فایل خرید بارگذاری نشده یا نام مشتری وارد نشده است.",
  };

  if (!rows || !customer) return base;

  const nameCol = findColumn(rows, [
    "customer", "مشتری", "customer name", "نام مشتری", "company", "شرکت",
  ]);

  const amountCol = findColumn(rows, [
    "amount", "buy amount", "purchase amount", "pi amount", "مبلغ",
    "قیمت", "total", "جمع", "aed", "rmb",
  ]);

  if (!nameCol) {
    return {
      ...base,
      loaded: true,
      background:
        manualCount > 0 || manualAmount > 0
          ? "ستون نام مشتری در فایل Purchase پیدا نشد، اما خرید دستی جدید وارد شده و در جمع خرید واقعی لحاظ شده است."
          : "ستون نام مشتری در فایل Purchase پیدا نشد.",
    };
  }

  const matched = rows.filter(r => isSameCustomer(r[nameCol], customer));

  const fileAmount = matched.reduce(
    (sum, r) => sum + parseNumber(r[amountCol]),
    0
  );

  const totalCount = matched.length + manualCount;
  const totalAmount = fileAmount + manualAmount;

  return {
    loaded: true,
    found: totalCount > 0 || totalAmount > 0,
    filePurchaseCount: matched.length,
    filePurchaseAmount: fileAmount,
    manualPurchaseCount: manualCount,
    manualPurchaseAmount: manualAmount,
    totalPurchaseCount: totalCount,
    totalPurchaseAmount: totalAmount,
    purchaseCount: totalCount,
    purchaseAmount: totalAmount,
    background:
      matched.length > 0 && (manualCount > 0 || manualAmount > 0)
        ? `برای این مشتری ${matched.length} خرید در فایل Purchase پیدا شد و خرید دستی جدید هم به جمع خرید واقعی اضافه شد.`
        : matched.length > 0
          ? `برای این مشتری ${matched.length} رکورد خرید در فایل Purchase پیدا شد.`
          : manualCount > 0 || manualAmount > 0
            ? "در فایل Purchase خریدی برای این مشتری پیدا نشد، اما خرید دستی جدید وارد شده و در جمع خرید واقعی لحاظ شده است."
            : "برای این مشتری در فایل Purchase خریدی پیدا نشد.",
  };
}