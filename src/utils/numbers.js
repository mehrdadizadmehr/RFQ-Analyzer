export function normalizeText(v) {
  return String(v || "").trim().toLowerCase();
}

export function parseNumber(v) {
  if (v === null || v === undefined) return 0;

  const cleaned = String(v)
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  return parseFloat(cleaned) || 0;
}

export function formatMoney(v) {
  const n = parseNumber(v);
  return n ? n.toLocaleString() : "—";
}
