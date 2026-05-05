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

export function analyzeBrandProductStats(rows25, rows26, purchaseRows, requestText) {
  const requestRows = [...(rows25 || []), ...(rows26 || [])];
  const allRows = [...requestRows, ...(purchaseRows || [])];

  const brandCol = findColumn(allRows, [
    "brand", "برند", "manufacturer", "maker", "سازنده",
  ]);

  const partCol = findColumn(allRows, [
    "part number", "part", "pn", "model", "item", "کد", "قطعه",
  ]);

  const amountCol = findColumn(allRows, [
    "amount", "estimate price", "pi amount", "buy amount", "total",
    "price", "مبلغ", "قیمت", "جمع", "aed", "rmb",
  ]);

  const txt = normalizeText(requestText);

  const topBrandsAll = getTopCounts(allRows, brandCol, 7);
  const topPartsAll = getTopCounts(allRows, partCol, 7);

  const mentionedBrandRows = brandCol
    ? allRows.filter(r => {
        const b = normalizeText(r[brandCol]);
        return b && txt.includes(b);
      })
    : [];

  const mentionedPartRows = partCol
    ? allRows.filter(r => {
        const p = normalizeText(r[partCol]);
        return p && txt.includes(p);
      })
    : [];

  return {
    topBrandsAll,
    topPartsAll,
    mentionedBrandCount: mentionedBrandRows.length,
    mentionedProductCount: mentionedPartRows.length,
    mentionedBrandAmount: mentionedBrandRows.reduce((s, r) => s + parseNumber(r[amountCol]), 0),
    mentionedProductAmount: mentionedPartRows.reduce((s, r) => s + parseNumber(r[amountCol]), 0),
    summary:
      mentionedBrandRows.length || mentionedPartRows.length
        ? `در فایل‌ها برای برند/محصولات مشابه این درخواست ${mentionedBrandRows.length + mentionedPartRows.length} تکرار پیدا شد.`
        : "برای برند/محصولات این RFQ تکرار مشخصی در فایل‌ها پیدا نشد یا ستون‌های برند/پارت‌نامبر شناسایی نشد.",
  };
}
