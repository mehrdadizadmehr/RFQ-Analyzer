function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[®™©]/g, "")
    .replace(/[()]/g, " ")
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

function extractPotentialBrandsFromRow(row) {
  if (!row || typeof row !== "object") return [];

  const collected = [];

  Object.entries(row).forEach(([key, value]) => {
    const normalizedKey = normalizeText(key);

    const looksLikeBrandColumn = [
      "brand",
      "brands",
      "manufacturer",
      "manufacturers",
      "maker",
      "vendors",
      "supported brands",
      "main brand",
      "product brand",
      "oem",
      "line card",
      "authorized brand",
      "brand name",
      "product manufacturer",
      "manufacture",
      "manufacturers list",
    ].some(k => normalizedKey.includes(k));

    if (!looksLikeBrandColumn) return;

    splitBrands(value).forEach(b => {
      if (b && !collected.includes(b)) {
        collected.push(b);
      }
    });
  });

  return collected;
}

function extractBrandTokens(value) {
  const normalized = cachedNormalizeText(value)
    .replace(/[()]/g, " ")
    .replace(/&/g, " and ");

  return normalized
    .split(/[,/|؛;\-\s]+/)
    .map(x => x.trim())
    .filter(x => x && x.length > 1);
}


function buildBrandAliasSet(brands = []) {
  const set = new Set();

  brands.forEach(brand => {
    const normalized = cachedNormalizeText(brand);

    if (normalized) {
      set.add(normalized);
    }

    extractBrandTokens(brand).forEach(token => {
      set.add(token);
    });
  });

  return Array.from(set);
}

const brandAliasCache = new Map();

const normalizedTextCache = new Map();

function cachedNormalizeText(value) {
  const key = String(value || "");

  if (normalizedTextCache.has(key)) {
    return normalizedTextCache.get(key);
  }

  const normalized = normalizeText(key);

  normalizedTextCache.set(key, normalized);

  return normalized;
}

function getCachedBrandAliases(brands = []) {
  const cacheKey = JSON.stringify(brands || []);

  if (brandAliasCache.has(cacheKey)) {
    return brandAliasCache.get(cacheKey);
  }

  const aliases = buildBrandAliasSet(brands);

  brandAliasCache.set(cacheKey, aliases);

  return aliases;
}

function calculateBrandMatchScore(targetBrands = [], supplierBrands = []) {
  const targetAliases = getCachedBrandAliases(targetBrands);
  const supplierAliases = getCachedBrandAliases(supplierBrands);

  if (!targetAliases.length || !supplierAliases.length) {
    return {
      matched: false,
      score: 0,
      matchedAliases: [],
    };
  }

  const supplierSet = new Set(supplierAliases);
  const compactSupplierSet = new Set(
    supplierAliases.map(x => x.replace(/\s+/g, ""))
  );

  const supplierAliasJoined = ` ${supplierAliases.join(" ")} `;

  const matchedAliases = [];

  for (const target of targetAliases) {
    const compactTarget = target.replace(/\s+/g, "");

    // exact match
    if (supplierSet.has(target)) {
      matchedAliases.push(target);
      continue;
    }

    // whitespace-insensitive match
    if (compactSupplierSet.has(compactTarget)) {
      matchedAliases.push(target);
      continue;
    }

    // lightweight partial match only for meaningful aliases
    if (target.length >= 4) {
      const compactTarget = ` ${target} `;

      if (supplierAliasJoined.includes(compactTarget)) {
        matchedAliases.push(target);
      }
    }
  }

  const uniqueMatches = Array.from(new Set(matchedAliases));

  return {
    matched: uniqueMatches.length > 0,
    score: uniqueMatches.length,
    matchedAliases: uniqueMatches,
  };
}

function splitSupplierCodes(value) {
  return String(value || "")
    .split(/[-,\s/|؛;]+/)
    .map(normalizeCode)
    .filter(code => code.startsWith("S") || code.startsWith("KAMA"));
}

function buildSupplierCodeAliases(supplier) {
  const aliases = new Set();

  if (supplier.code) {
    aliases.add(normalizeCode(supplier.code));
  }

  (supplier.purchaseCodes || []).forEach(code => {
    const normalized = normalizeCode(code);

    if (normalized) {
      aliases.add(normalized);
    }
  });

  const companyNormalized = normalizeCode(supplier.companyName);

  if (companyNormalized) {
    aliases.add(companyNormalized);
  }

  return Array.from(aliases);
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

  const brandRaw = getValue(row, [
    "Brand",
    "Brands",
    "برند",
    "Manufacturer",
    "Manufacturers",
    "Maker",
    "Supported Brands",
    "Main Brand",
    "OEM",
  ]);

  const detectedBrands = [
    ...splitBrands(brandRaw),
    ...extractPotentialBrandsFromRow(row),
  ].filter(Boolean);

  return {
    code,
    companyName,
    brands: Array.from(new Set(detectedBrands)),
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
  const collectedCodes = [];
  let totalAmount = 0;

  const pushCodes = value => {
    splitSupplierCodes(value).forEach(code => {
      if (code && !collectedCodes.includes(code)) {
        collectedCodes.push(code);
      }
    });
  };

  // Generic/fallback columns
  pushCodes(
    getValue(row, [
      "Supplier Code",
      "Supplier Winner",
      "Winner",
      "Supplier",
      "Winner Supplier",
      "Supplier ID",
      "Vendor Code",
      "Vendor",
    ])
  );

  totalAmount += cleanNumber(
    getValue(row, [
      "Amount",
      "Total",
      "Purchase Amount",
    ])
  );

  // HTML logic parity:
  // 2025 => amount: Unnamed:1 | supplier: Unnamed:2
  // 2026 => amount: Unnamed:6 | supplier: Unnamed:7

  const yearMappings = [
    {
      amountKeys: ["Unnamed: 1", "2025 Amount"],
      supplierKeys: [
        "Unnamed: 2",
        "2025 Supplier",
      ],
    },
    {
      amountKeys: ["Unnamed: 6", "2026 Amount"],
      supplierKeys: [
        "Unnamed: 7",
        "2026 Supplier",
      ],
    },
  ];

  yearMappings.forEach(mapping => {
    const amount = cleanNumber(
      getValue(row, mapping.amountKeys)
    );

    const supplierValue = getValue(
      row,
      mapping.supplierKeys
    );

    const yearCodes = splitSupplierCodes(supplierValue);

    yearCodes.forEach(code => {
      if (code && !collectedCodes.includes(code)) {
        collectedCodes.push(code);
      }
    });

    if (yearCodes.length > 0 && amount > 0) {
      totalAmount += amount;
    }
  });

  return {
    supplierCodes: collectedCodes,
    amount: totalAmount,
    raw: row,
  };
}

export function buildSupplierIntelligence({
  supplierRows = [],
  winnerRows = [],
  currentBrands = [],
}) {
  const targetBrands = splitBrands(currentBrands.join(","));
  const targetBrandAliases = buildBrandAliasSet(targetBrands);

  const suppliers = supplierRows
    .map(parseSupplierMasterRow)
    .filter(s => s.code || s.companyName);

  const winners = winnerRows.map(parseWinnerRow);
  console.log("Winner parsing sample:",
    winners.slice(0, 3).map(w => ({
      supplierCodes: w.supplierCodes,
      amount: w.amount,
    }))
  );

  const filteredSuppliers = suppliers.filter(s => {
    if (!targetBrands.length) return true;

    return s.brands.some(brand => {
      const normalizedBrand = cachedNormalizeText(brand);

      return targetBrandAliases.some(alias =>
        normalizedBrand.includes(alias) ||
        alias.includes(normalizedBrand)
      );
    });
  });

  const normalizedSupplierMap = {};

  suppliers.forEach(supplier => {
    buildSupplierCodeAliases(supplier).forEach(alias => {
      if (!alias) return;

      normalizedSupplierMap[alias] = supplier.code;
    });
  });

  console.log(
    "Supplier alias sample:",
    Object.entries(normalizedSupplierMap).slice(0, 10)
  );

  const winnerStats = {};

  winners.forEach(w => {
    w.supplierCodes.forEach(rawCode => {
      const normalizedCode = normalizeCode(rawCode);

      const mappedSupplierCode =
        normalizedSupplierMap[normalizedCode] ||
        normalizedSupplierMap[
          normalizedCode.replace(/^(KAMA)/, "S")
        ] ||
        normalizedCode;

      if (!mappedSupplierCode) return;

      if (!winnerStats[mappedSupplierCode]) {
        winnerStats[mappedSupplierCode] = {
          successfulPurchaseCount: 0,
          successfulPurchaseAmount: 0,
        };
      }

      winnerStats[mappedSupplierCode].successfulPurchaseCount += 1;
      winnerStats[mappedSupplierCode].successfulPurchaseAmount +=
        w.amount;
    });
  });

  console.log(
    "Winner stats sample:",
    Object.entries(winnerStats).slice(0, 10)
  );

  const rankedSuppliers = filteredSuppliers
    .map(s => {
      const brandMatch = calculateBrandMatchScore(
        targetBrands,
        s.brands
      );

      const brandMatched = brandMatch.matched;

      const stats = winnerStats[s.code] || {
        successfulPurchaseCount: 0,
        successfulPurchaseAmount: 0,
      };

      const purchaseCodeStats = (s.purchaseCodes || [])
        .map(code => winnerStats[normalizeCode(code)])
        .filter(Boolean);

      purchaseCodeStats.forEach(extraStats => {
        stats.successfulPurchaseCount +=
          extraStats.successfulPurchaseCount || 0;

        stats.successfulPurchaseAmount +=
          extraStats.successfulPurchaseAmount || 0;
      });

      const exactBrandPurchaseStrength =
        stats.successfulPurchaseCount * 12 +
        Math.log10(stats.successfulPurchaseAmount + 1) * 8;

      let score = 0;

      // Exact / fuzzy RFQ brand match is the highest priority
      if (brandMatched) {
        score += 120 + brandMatch.score * 15;
      }

      // Historical successful purchases are the second highest priority
      score += Math.min(120, exactBrandPurchaseStrength);

      // Supplier completeness bonus
      if (s.website) score += 8;
      if (s.store) score += 5;
      if (s.country) score += 3;

      return {
        ...s,
        brandMatched,
        brandMatchScore: brandMatch.score,
        matchedBrandAliases: brandMatch.matchedAliases,
        successfulPurchaseCount: stats.successfulPurchaseCount,
        successfulPurchaseAmount: stats.successfulPurchaseAmount,
        procurementEvidenceLevel:
          stats.successfulPurchaseCount > 0
            ? "Historical Proven Supplier"
            : brandMatched
              ? "Brand Compatible Supplier"
              : "Potential Supplier",
        score: Math.round(score),
        exactBrandPurchaseStrength: Math.round(
          exactBrandPurchaseStrength
        ),
        priority:
          score >= 70 ? "High" : score >= 40 ? "Medium" : "Low",
      };
    })
    .filter(
      s =>
        s.brandMatched ||
        s.successfulPurchaseCount > 0
    )
    .sort((a, b) => {
      // First priority: exact RFQ brand suppliers
      if (a.brandMatched !== b.brandMatched) {
        return a.brandMatched ? -1 : 1;
      }

      // Second priority: suppliers with more successful purchases
      if (
        a.successfulPurchaseCount !==
        b.successfulPurchaseCount
      ) {
        return (
          b.successfulPurchaseCount -
          a.successfulPurchaseCount
        );
      }

      // Third priority: suppliers with larger historical purchase amounts
      if (
        a.successfulPurchaseAmount !==
        b.successfulPurchaseAmount
      ) {
        return (
          b.successfulPurchaseAmount -
          a.successfulPurchaseAmount
        );
      }

      // Final fallback: overall score
      return b.score - a.score;
    });

  const topBrandSuppliers = rankedSuppliers.filter(
    s => s.brandMatched
  );

  return {
    targetBrands,
    targetBrandAliases,
    totalSuppliers: suppliers.length,
    totalWinnerRows: winners.length,
    rankedSuppliers,
    topBrandSuppliers,
    topSuppliers: topBrandSuppliers.slice(0, 8),
    brandMatchedSuppliers: rankedSuppliers.filter(s => s.brandMatched),
    purchasedSuppliers: rankedSuppliers.filter(
      s => s.successfulPurchaseCount > 0
    ),
  };
}