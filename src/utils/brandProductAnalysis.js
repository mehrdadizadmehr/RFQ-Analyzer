import { findColumn } from "./excel";
import { normalizeText, parseNumber } from "./numbers";

const VALUE_WITH_UNIT_RE = /^>?\s*\d+(\.\d+)?\s*(v|vac|vdc|a|ma|w|kw|hz|khz|mhz|bar|psi|pa|kpa|mpa|rpm|mm|cm|m|kg|g|pcs|pc|ea|set|sets|lot|lots|aed|usd|rmb|cny|eur|%|°c|c)$/i;
const NUMERIC_OPERATOR_RE = /^[<>≤≥=~]\s*\d+(\.\d+)?$/;
const MOSTLY_NUMERIC_RE = /^[<>≤≥=~\s\d.,/%+-]+$/;

function looksLikeEngineeringGarbage(value) {
  const v = String(value || "").trim();
  const normalized = normalizeText(v);

  if (!normalized) return true;

  if (NUMERIC_OPERATOR_RE.test(v)) return true;
  if (VALUE_WITH_UNIT_RE.test(v)) return true;
  if (MOSTLY_NUMERIC_RE.test(v)) return true;

  const garbageWords = [
    "qty",
    "quantity",
    "pcs",
    "pc",
    "piece",
    "pieces",
    "price",
    "amount",
    "total",
    "delivery",
    "lead time",
    "stock",
    "available",
    "brand",
    "model",
    "item",
    "description",
    "request",
    "quote",
    "quotation",
  ];

  if (garbageWords.includes(normalized)) return true;

  return false;
}

function looksLikeIndustrialPartNumber(value) {
  const v = String(value || "").trim();

  if (!v) return false;

  // Industrial part numbers are usually alphanumeric and often contain dashes, slashes, dots or mixed letters/numbers.
  const hasLetter = /[a-z]/i.test(v);
  const hasDigit = /\d/.test(v);
  const hasPartSeparators = /[-_/\.]/.test(v);

  if (hasLetter && hasDigit && v.length >= 4) return true;
  if (hasLetter && hasPartSeparators && v.length >= 5) return true;

  return false;
}

function isValidProductValue(value) {
  const v = String(value || "").trim();

  if (!v) return false;

  const normalized = normalizeText(v);

  if (!normalized) return false;

  // remove garbage numeric-only values like 1,2,3,4
  if (/^\d+$/.test(normalized)) return false;

  // remove values like >3900, >80, 24V, 50Hz, 10bar, etc.
  if (looksLikeEngineeringGarbage(v)) return false;

  // remove extremely short meaningless values
  if (normalized.length <= 2) return false;

  // ignore generic placeholders
  if (
    normalized === "na" ||
    normalized === "n/a" ||
    normalized === "none" ||
    normalized === "null" ||
    normalized === "unknown" ||
    normalized === "-"
  ) {
    return false;
  }

  // Keep known industrial part/model shapes.
  if (looksLikeIndustrialPartNumber(v)) return true;

  // Keep meaningful brand/category-like words, but reject very short generic fragments.
  if (/^[a-z][a-z0-9\s&.+-]{3,}$/i.test(v)) return true;

  return false;
}

function getTopCounts(rows, col, limit = 7) {
  const map = {};
  if (!rows || !rows.length || !col) return [];

  rows.forEach(r => {
    const rawValue = String(r[col] || "").trim();

    if (!isValidProductValue(rawValue)) {
      return;
    }

    const value = rawValue.toUpperCase();

    map[value] = (map[value] || 0) + 1;
  });

  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function isSoldRow(row, statusCol) {
  const s = normalizeText(row?.[statusCol]);

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
}

function extractTextMatches(rows, col, requestText) {
  if (!rows || !rows.length || !col) return [];

  const txt = normalizeText(requestText);

  return rows.filter(r => {
    const rawValue = r[col];

    if (!isValidProductValue(rawValue)) {
      return false;
    }

    const value = normalizeText(rawValue);

    return value && txt.includes(value);
  });
}

export function analyzeBrandProductStats(
  rows25,
  rows26,
  purchaseRows,
  requestText,
  customerName = ""
) {
  const requestRows = [...(rows25 || []), ...(rows26 || [])];
  const purchaseOnlyRows = [...(purchaseRows || [])];
  const allRows = [...requestRows, ...purchaseOnlyRows];

  const brandCol = findColumn(allRows, [
    "brand",
    "برند",
    "manufacturer",
    "maker",
    "سازنده",
  ]);

  const partCol = findColumn(allRows, [
    "part number",
    "part no",
    "part_no",
    "partnumber",
    "part",
    "pn",
    "p/n",
    "model",
    "model no",
    "model number",
    "item code",
    "کد کالا",
    "کد قطعه",
    "قطعه",
  ]);

  const categoryCol = findColumn(allRows, [
    "category",
    "cat",
    "product category",
    "type",
    "family",
    "گروه",
    "دسته",
    "نوع",
  ]);

  const amountCol = findColumn(allRows, [
    "amount",
    "estimate price",
    "pi amount",
    "buy amount",
    "total",
    "price",
    "مبلغ",
    "قیمت",
    "جمع",
    "aed",
    "rmb",
  ]);

  const statusCol = findColumn(requestRows, [
    "status",
    "commercial status",
    "result",
    "وضعیت",
    "نتیجه",
  ]);

  const normalizedRequestText = normalizeText(requestText || "");
  const normalizedCustomerName = normalizeText(customerName || "");

  const customerCol = findColumn(allRows, [
    "customer",
    "customer name",
    "client",
    "company",
    "account",
    "مشتری",
    "نام مشتری",
    "شرکت",
  ]);

  const extractMentionedBrands = () => {
    if (!brandCol) return [];

    const map = {};

    allRows.forEach(r => {
      const rawBrand = String(r?.[brandCol] || "").trim();

      if (!isValidProductValue(rawBrand)) return;

      const normalizedBrand = normalizeText(rawBrand);

      if (!normalizedBrand) return;

      if (!normalizedRequestText.includes(normalizedBrand)) return;

      const key = rawBrand.toUpperCase();

      map[key] = (map[key] || 0) + 1;
    });

    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([brand, count]) => ({
        brand,
        count,
      }));
  };

  const mentionedBrands = extractMentionedBrands();

  const buildBrandDemandStats = () => {
    if (!brandCol || !mentionedBrands.length) return [];

    return mentionedBrands.map(item => {
      const brandNormalized = normalizeText(item.brand);

      const currentCustomerRows = allRows.filter(r => {
        const brandValue = normalizeText(r?.[brandCol]);
        const customerValue = normalizeText(r?.[customerCol]);

        return (
          brandValue === brandNormalized &&
          normalizedCustomerName &&
          customerValue.includes(normalizedCustomerName)
        );
      });

      const otherCustomerRows = allRows.filter(r => {
        const brandValue = normalizeText(r?.[brandCol]);
        const customerValue = normalizeText(r?.[customerCol]);

        return (
          brandValue === brandNormalized &&
          (!normalizedCustomerName ||
            !customerValue.includes(normalizedCustomerName))
        );
      });

      const currentCustomerSuccessfulRows = currentCustomerRows.filter(r =>
        isSoldRow(r, statusCol)
      );

      const otherCustomerSuccessfulRows = otherCustomerRows.filter(r =>
        isSoldRow(r, statusCol)
      );

      const purchaseMatches = purchaseOnlyRows.filter(r => {
        const brandValue = normalizeText(r?.[brandCol]);
        return brandValue === brandNormalized;
      });

      return {
        brand: item.brand,

        currentCustomerRequestCount: currentCustomerRows.length,
        currentCustomerSuccessfulCount:
          currentCustomerSuccessfulRows.length,

        otherCustomersRequestCount: otherCustomerRows.length,
        otherCustomersSuccessfulCount:
          otherCustomerSuccessfulRows.length,

        totalRequestCount:
          currentCustomerRows.length + otherCustomerRows.length,

        totalSuccessfulCount:
          currentCustomerSuccessfulRows.length +
          otherCustomerSuccessfulRows.length +
          purchaseMatches.length,
      };
    });
  };

  const brandDemandStats = buildBrandDemandStats();

  const topBrandsAll = getTopCounts(allRows, brandCol, 7);
  const topPartsAll = getTopCounts(allRows, partCol, 7);
  const topCategoriesAll = getTopCounts(allRows, categoryCol, 7);

  const mentionedBrandRows = extractTextMatches(allRows, brandCol, requestText);
  const mentionedPartRows = extractTextMatches(allRows, partCol, requestText);
  const mentionedCategoryRows = extractTextMatches(allRows, categoryCol, requestText);

  const mentionedBrandPurchaseRows = extractTextMatches(purchaseOnlyRows, brandCol, requestText);
  const mentionedPartPurchaseRows = extractTextMatches(purchaseOnlyRows, partCol, requestText);
  const mentionedCategoryPurchaseRows = extractTextMatches(purchaseOnlyRows, categoryCol, requestText);

  const mentionedBrandSoldRows = brandCol
    ? requestRows.filter(r => {
        const b = normalizeText(r[brandCol]);
        return b && normalizeText(requestText).includes(b) && isSoldRow(r, statusCol);
      })
    : [];

  const mentionedPartSoldRows = partCol
    ? requestRows.filter(r => {
        const p = normalizeText(r[partCol]);
        return p && normalizeText(requestText).includes(p) && isSoldRow(r, statusCol);
      })
    : [];

  const mentionedCategorySoldRows = categoryCol
    ? requestRows.filter(r => {
        const c = normalizeText(r[categoryCol]);
        return c && normalizeText(requestText).includes(c) && isSoldRow(r, statusCol);
      })
    : [];

  const similarSuccessfulPurchasesCount =
    mentionedBrandPurchaseRows.length +
    mentionedPartPurchaseRows.length +
    mentionedCategoryPurchaseRows.length +
    mentionedBrandSoldRows.length +
    mentionedPartSoldRows.length +
    mentionedCategorySoldRows.length;

  const similarSuccessfulPurchasesAmount = [
    ...mentionedBrandPurchaseRows,
    ...mentionedPartPurchaseRows,
    ...mentionedCategoryPurchaseRows,
    ...mentionedBrandSoldRows,
    ...mentionedPartSoldRows,
    ...mentionedCategorySoldRows,
  ].reduce((s, r) => s + parseNumber(r[amountCol]), 0);

  const topBrandNames = brandDemandStats
    .slice(0, 5)
    .map(
      x =>
        `${x.brand} (این مشتری: ${x.currentCustomerRequestCount} | سایر مشتریان: ${x.otherCustomersRequestCount})`
    )
    .join("، ");

  const topPartNames = topPartsAll
    .slice(0, 5)
    .map(x => `${x.name} (${x.count})`)
    .join(", ");

  const topCategoryNames = topCategoriesAll
    .slice(0, 5)
    .map(x => `${x.name} (${x.count})`)
    .join(", ");

  return {
    topBrandsAll,
    brandDemandStats,
    topPartsAll,
    topCategoriesAll,

    mentionedBrandCount: brandDemandStats.reduce(
      (s, x) => s + x.totalRequestCount,
      0
    ),

    mentionedProductCount: mentionedPartRows.length,

    mentionedCategoryCount: mentionedCategoryRows.length,

    mentionedBrandAmount: mentionedBrandRows.reduce((s, r) => s + parseNumber(r[amountCol]), 0),
    mentionedProductAmount: mentionedPartRows.reduce((s, r) => s + parseNumber(r[amountCol]), 0),
    mentionedCategoryAmount: mentionedCategoryRows.reduce((s, r) => s + parseNumber(r[amountCol]), 0),

    similarSuccessfulPurchasesCount,
    similarSuccessfulPurchasesAmount,

    similarPurchaseEvidence: {
      brandPurchaseCount: mentionedBrandPurchaseRows.length,
      partPurchaseCount: mentionedPartPurchaseRows.length,
      categoryPurchaseCount: mentionedCategoryPurchaseRows.length,
      brandSoldOpportunityCount: mentionedBrandSoldRows.length,
      partSoldOpportunityCount: mentionedPartSoldRows.length,
      categorySoldOpportunityCount: mentionedCategorySoldRows.length,
    },

    summary:
      brandDemandStats.length > 0
        ? `برندهای موجود در RFQ فعلی قبلاً در تاریخچه سیستم دیده شده‌اند. ${topBrandNames || ""}`
        : similarSuccessfulPurchasesCount > 0
          ? `سوابق خرید و RFQ مشابه در فایل‌های قبلی پیدا شد.`
          : "هیچ سابقه معناداری از برندها یا محصولات این RFQ در فایل‌های قبلی پیدا نشد.",
  };
}