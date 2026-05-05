import { findColumn } from "./excel";
import { normalizeText, parseNumber } from "./numbers";

function getTopCounts(rows, col, limit = 7) {
  const map = {};
  if (!rows || !rows.length || !col) return [];

  rows.forEach(r => {
    const value = String(r[col] || "").trim();
    if (!value) return;
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
    const value = normalizeText(r[col]);
    return value && txt.includes(value);
  });
}

export function analyzeBrandProductStats(rows25, rows26, purchaseRows, requestText) {
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
    "part",
    "pn",
    "model",
    "item",
    "کد",
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

  return {
    topBrandsAll,
    topPartsAll,
    topCategoriesAll,

    mentionedBrandCount: mentionedBrandRows.length,
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
      similarSuccessfulPurchasesCount > 0
        ? `Similar brand/part/category has successful purchase or sold opportunity history in uploaded files: ${similarSuccessfulPurchasesCount} records.`
        : mentionedBrandRows.length || mentionedPartRows.length || mentionedCategoryRows.length
          ? `Similar brand/part/category exists in uploaded files, but no clear successful purchase record was detected.`
          : "No clear similar brand/part/category history was detected in uploaded files.",
  };
}