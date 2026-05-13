function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_\-\/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeCode(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

function cleanNumber(value) {
  const n = Number(String(value || "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function getValue(row, keys = []) {
  if (!row) return "";

  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }

  const normalizedMap = Object.keys(row).reduce((acc, key) => {
    acc[normalizeText(key).replace(/[^a-z0-9]/g, "")] = row[key];
    return acc;
  }, {});

  for (const key of keys) {
    const normalized = normalizeText(key).replace(/[^a-z0-9]/g, "");
    if (normalizedMap[normalized] !== undefined) {
      return normalizedMap[normalized];
    }
  }

  return "";
}

function splitBrands(value) {
  return String(value || "")
    .split(/[,/|؛;]+/)
    .map(x => normalizeText(x))
    .filter(Boolean);
}

function splitSupplierCodes(value) {
  return String(value || "")
    .split(/[-,\s/|؛;]+/)
    .map(normalizeCode)
    .filter(code => code.startsWith("S") || code.startsWith("KAMA"));
}

function parseSupplierMasterRow(row) {
  const code = normalizeCode(
    getValue(row, ["Supplier Code", "Code", "کد", "supplier code"])
  );

  const companyName = getValue(row, [
    "Company Name",
    "Company",
    "Supplier Name",
    "Name",
    "نام شرکت",
  ]);

  const brandRaw = getValue(row, ["Brand", "Brands", "برند"]);

  return {
    code,
    companyName,
    brands: splitBrands(brandRaw),
    rawBrand: brandRaw,
    country: getValue(row, ["Country", "کشور"]),
    website: getValue(row, ["Website", "web site", "وبسایت"]),
    store: getValue(row, ["store link", "Store", "Shop", "فروشگاه"]),
    contact: getValue(row, ["Contact", "Wechat", "WhatsApp", "تماس"]),
    purchaseCodes: splitSupplierCodes(
      getValue(row, ["Purchase Code", "Purchase Codes"])
    ),
    raw: row,
  };
}

function parseWinnerRow(row) {
  const supplierCodes = splitSupplierCodes(
    getValue(row, [
      "Supplier Code",
      "Supplier Winner",
      "Winner",
      "Supplier",
      "2025 Supplier",
      "2026 Supplier",
    ])
  );

  const amount =
    cleanNumber(getValue(row, ["Amount", "Total", "Purchase Amount"])) ||
    cleanNumber(getValue(row, ["2025 Amount", "2026 Amount"]));

  return {
    supplierCodes,
    amount,
    raw: row,
  };
}

export function buildSupplierIntelligence({
  supplierRows = [],
  winnerRows = [],
  currentBrands = [],
}) {
  const targetBrands = splitBrands(currentBrands.join(","));

  const suppliers = supplierRows
    .map(parseSupplierMasterRow)
    .filter(s => s.code || s.companyName);

  const winners = winnerRows.map(parseWinnerRow);

  const winnerStats = {};

  winners.forEach(w => {
    w.supplierCodes.forEach(code => {
      if (!winnerStats[code]) {
        winnerStats[code] = {
          successfulPurchaseCount: 0,
          successfulPurchaseAmount: 0,
        };
      }

      winnerStats[code].successfulPurchaseCount += 1;
      winnerStats[code].successfulPurchaseAmount += w.amount;
    });
  });

  const rankedSuppliers = suppliers
    .map(s => {
      const brandMatched = s.brands.some(b => targetBrands.includes(b));
      const stats = winnerStats[s.code] || {
        successfulPurchaseCount: 0,
        successfulPurchaseAmount: 0,
      };

      let score = 0;

      if (brandMatched) score += 50;
      score += Math.min(25, stats.successfulPurchaseCount * 5);
      score += Math.min(
        20,
        Math.log10(stats.successfulPurchaseAmount + 1) * 4
      );
      if (s.website || s.store) score += 5;

      return {
        ...s,
        brandMatched,
        successfulPurchaseCount: stats.successfulPurchaseCount,
        successfulPurchaseAmount: stats.successfulPurchaseAmount,
        score: Math.round(score),
        priority:
          score >= 70 ? "High" : score >= 40 ? "Medium" : "Low",
      };
    })
    .filter(s => s.brandMatched || s.successfulPurchaseCount > 0)
    .sort((a, b) => b.score - a.score);

  return {
    targetBrands,
    totalSuppliers: suppliers.length,
    totalWinnerRows: winners.length,
    rankedSuppliers,
    topSuppliers: rankedSuppliers.slice(0, 10),
    brandMatchedSuppliers: rankedSuppliers.filter(s => s.brandMatched),
    purchasedSuppliers: rankedSuppliers.filter(
      s => s.successfulPurchaseCount > 0
    ),
  };
}