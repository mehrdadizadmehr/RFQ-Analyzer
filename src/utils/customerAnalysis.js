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
    quality: "نامشخص",
    topBrands: [],
    background: "فایل درخواست‌ها بارگذاری نشده یا نام مشتری وارد نشده است.",
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
    quality,
    topBrands,
    background: matched.length
      ? `این مشتری ${matched.length} درخواست ثبت‌شده دارد، ${sold.length} مورد فروش/تبدیل شده و نرخ تبدیل ${conversionRate}% است.`
      : "برای این مشتری در فایل‌های درخواست، سابقه‌ای پیدا نشد.",
  };
}

export function analyzeCustomerPurchases(rows, customer, manualPurchaseCount, manualPurchaseAmount) {
  const manualCount = parseNumber(manualPurchaseCount);
  const manualAmount = parseNumber(manualPurchaseAmount);

  const base = {
    loaded: !!rows,
    found: manualCount > 0,
    filePurchaseCount: 0,
    filePurchaseAmount: 0,
    manualPurchaseCount: manualCount,
    manualPurchaseAmount: manualAmount,
    totalPurchaseCount: manualCount,
    totalPurchaseAmount: manualAmount,
    purchaseCount: manualCount,
    purchaseAmount: manualAmount,
    background: "فایل خرید بارگذاری نشده یا نام مشتری وارد نشده است.",
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
      background: "ستون نام مشتری در فایل خرید پیدا نشد.",
    };
  }

  const matched = rows.filter(r => isSameCustomer(r[nameCol], customer));

  const fileAmount = matched.reduce(
    (sum, r) => sum + parseNumber(r[amountCol]),
    0
  );

  return {
    loaded: true,
    found: matched.length + manualCount > 0,
    filePurchaseCount: matched.length,
    filePurchaseAmount: fileAmount,
    manualPurchaseCount: manualCount,
    manualPurchaseAmount: manualAmount,
    totalPurchaseCount: matched.length + manualCount,
    totalPurchaseAmount: fileAmount + manualAmount,
    purchaseCount: matched.length + manualCount,
    purchaseAmount: fileAmount + manualAmount,
    background: matched.length
      ? `برای این مشتری ${matched.length} رکورد خرید در فایل Purchase پیدا شد.`
      : manualCount
        ? "در فایل Purchase رکوردی پیدا نشد، اما خریدهای دستی جدید وارد شده‌اند."
        : "برای این مشتری در فایل خرید، رکوردی پیدا نشد.",
  };
}
