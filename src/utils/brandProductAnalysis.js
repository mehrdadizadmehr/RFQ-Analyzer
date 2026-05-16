import { findColumn } from "./excel";
import { normalizeText, parseNumber } from "./numbers";

const VALUE_WITH_UNIT_RE = /^>?\s*\d+(\.\d+)?\s*(v|vac|vdc|a|ma|w|kw|hz|khz|mhz|bar|psi|pa|kpa|mpa|rpm|mm|cm|m|kg|g|pcs|pc|ea|set|sets|lot|lots|aed|usd|rmb|cny|eur|%|°c|c)$/i;
const NUMERIC_OPERATOR_RE = /^[<>≤≥=~]\s*\d+(\.\d+)?$/;

const MOSTLY_NUMERIC_RE = /^[<>≤≥=~\s\d.,/%+-]+$/;

const BRAND_NOISE_PATTERNS = [
  "multibrand",
  "multi brand",
  "website",
  "ltd",
  "co ltd",
  "company",
  "group",
  "general",
  "trading",
  "industrial",
  "automation",
  "technik",
  "technologies",
];

const CANONICAL_BRAND_ALIASES = {
  siemens: [
    "siemens",
    "iemens",
    "siemens ag",
    "siemens ltd",
    "siemens website",
  ],
  abb: ["abb", "a b b"],
  honeywell: ["honeywell", "enraf"],
  schneider: ["schneider", "schneider electric"],
  emerson: ["emerson", "fisher"],
};

function normalizeCanonicalBrand(value) {
  const normalized = normalizeText(value || "");

  if (!normalized) return "";

  for (const [canonical, aliases] of Object.entries(
    CANONICAL_BRAND_ALIASES
  )) {
    if (
      aliases.some(
        alias =>
          normalized.includes(alias) ||
          alias.includes(normalized)
      )
    ) {
      return canonical.toUpperCase();
    }
  }

  return String(value || "").trim().toUpperCase();
}


function isBrandNoise(value) {
  const normalized = normalizeText(value || "");

  if (!normalized) return true;

  if (normalized.length <= 2) return true;

  if (
    BRAND_NOISE_PATTERNS.some(pattern =>
      normalized.includes(pattern)
    )
  ) {
    return true;
  }

  if (
    normalized.includes("/") ||
    normalized.includes("http")
  ) {
    return true;
  }

  const tokenCount = normalized
    .split(/\s+/)
    .filter(Boolean).length;

  if (tokenCount >= 6) return true;

  return false;
}

function textContainsPhrase(text = "", phrase = "") {
  const normalizedText = ` ${normalizeText(text || "")} `;
  const normalizedPhrase = normalizeText(phrase || "");

  if (!normalizedPhrase || normalizedPhrase.length < 4) {
    return false;
  }

  return normalizedText.includes(` ${normalizedPhrase} `);
}

function isBrandExplicitlyMentionedInRfq(requestText = "", rawBrand = "") {
  const canonicalBrand = normalizeCanonicalBrand(rawBrand);
  const normalizedRawBrand = normalizeText(rawBrand || "");

  if (!canonicalBrand || isBrandNoise(canonicalBrand)) {
    return false;
  }

  const canonicalKey = normalizeText(canonicalBrand);
  const knownAliases = CANONICAL_BRAND_ALIASES[canonicalKey] || [];

  if (
    knownAliases.some(alias =>
      textContainsPhrase(requestText, alias)
    )
  ) {
    return true;
  }

  if (isBrandNoise(rawBrand)) {
    return false;
  }

  // For unknown brands, require the full brand phrase to be explicitly present in RFQ text.
  return textContainsPhrase(requestText, normalizedRawBrand);
}

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

  const genericIndustrialWords = [
    "motor",
    "sensor",
    "module",
    "cable",
    "relay",
    "switch",
    "valve",
    "pump",
    "bearing",
    "filter",
    "controller",
    "transmitter",
    "transducer",
    "gauge",
    "connector",
    "terminal",
    "fuse",
    "breaker",
    "contact",
    "contactor",
    "wire",
    "panel",
    "display",
    "meter",
    "encoder",
    "fan",
    "drive",
    "inverter",
    "power supply",
    "plc",
  ];

  if (garbageWords.includes(normalized)) return true;
  if (genericIndustrialWords.includes(normalized)) return true;

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

function extractBrandTokens(value) {
  const normalized = normalizeText(value)
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
    const normalized = normalizeText(brand);

    if (normalized) {
      set.add(normalized);
    }

    extractBrandTokens(brand).forEach(token => {
      set.add(token);
    });
  });

  return Array.from(set);
}

function calculateBrandOverlap(a = "", b = "") {
  const aliasesA = buildBrandAliasSet([a]);
  const aliasesB = buildBrandAliasSet([b]);

  const matched = [];

  aliasesA.forEach(x => {
    aliasesB.forEach(y => {
      if (x === y) {
        matched.push(x);
        return;
      }

      if (x.includes(y) || y.includes(x)) {
        matched.push(`${x}~${y}`);
      }
    });
  });

  return {
    matched: matched.length > 0,
    aliases: Array.from(new Set(matched)),
  };
}

function isStrongBrandOverlap(a = "", b = "") {
  const overlap = calculateBrandOverlap(a, b);

  if (!overlap.matched) return false;

  const aliasesA = buildBrandAliasSet([a]);
  const aliasesB = buildBrandAliasSet([b]);

  return aliasesA.some(x =>
    aliasesB.some(y => {
      if (x === y) return true;

      if (x.length < 4 || y.length < 4) return false;

      return x.includes(y) || y.includes(x);
    })
  );
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
  customerName = "",
  commercialMatcher = null
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

      const requestBrandMatch = isBrandExplicitlyMentionedInRfq(
        requestText,
        rawBrand
      );

      if (!requestBrandMatch) return;

      const key = normalizeCanonicalBrand(rawBrand);

      if (
        isBrandNoise(key) ||
        key === "MULTIBRAND" ||
        key === "MULTI BRAND"
      ) {
        return;
      }

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

  const matcherRelevantMatches =
    commercialMatcher?.relevantMatches || [];

  const buildBrandDemandStats = () => {
    if (!brandCol || !mentionedBrands.length) return [];

    return mentionedBrands.map(item => {
      const canonicalBrand = normalizeCanonicalBrand(item.brand);
      const brandNormalized = normalizeText(canonicalBrand);
      const brandAliases = buildBrandAliasSet([item.brand]);

      const currentCustomerRows = allRows.filter(r => {
        const brandValue = normalizeText(r?.[brandCol]);
        const customerValue = normalizeText(r?.[customerCol]);

        return (
          isStrongBrandOverlap(brandValue, brandNormalized) &&
          normalizedCustomerName &&
          customerValue.includes(normalizedCustomerName)
        );
      });

      const otherCustomerRows = allRows.filter(r => {
        const brandValue = normalizeText(r?.[brandCol]);
        const customerValue = normalizeText(r?.[customerCol]);

        return (
          isStrongBrandOverlap(brandValue, brandNormalized) &&
          (!normalizedCustomerName ||
            !customerValue.includes(normalizedCustomerName))
        );
      });

      const relevantCommercialMatches = matcherRelevantMatches.filter(m => {
        const matchBrand = normalizeText(
          m?.commercialInsights?.brand
        );

        return isStrongBrandOverlap(
          matchBrand,
          brandNormalized
        );
      });

      const currentCustomerPurchaseMatches =
        relevantCommercialMatches.filter(m => {
          const customerValue = normalizeText(
            m?.commercialInsights?.purchaseCustomer
          );

          return (
            normalizedCustomerName &&
            customerValue.includes(normalizedCustomerName)
          );
        });

      const otherCustomerPurchaseMatches =
        relevantCommercialMatches.filter(m => {
          const customerValue = normalizeText(
            m?.commercialInsights?.purchaseCustomer
          );

          return (
            !normalizedCustomerName ||
            !customerValue.includes(normalizedCustomerName)
          );
        });

      const totalRevenue = relevantCommercialMatches.reduce(
        (s, m) => s + (m?.commercialInsights?.revenue || 0),
        0
      );

      return {
        brand: item.brand,
        canonicalBrand,
        brandAliases,

        currentCustomerRequestCount: currentCustomerRows.length,
        currentCustomerSuccessfulCount:
          currentCustomerPurchaseMatches.length,

        otherCustomersRequestCount: otherCustomerRows.length,
        otherCustomersSuccessfulCount:
          otherCustomerPurchaseMatches.length,

        totalRequestCount:
          currentCustomerRows.length + otherCustomerRows.length,

        totalSuccessfulCount: relevantCommercialMatches.length,

        totalRevenue,

        currentCustomerRevenue: currentCustomerPurchaseMatches.reduce(
          (s, m) => s + (m?.commercialInsights?.revenue || 0),
          0
        ),

        otherCustomersRevenue: otherCustomerPurchaseMatches.reduce(
          (s, m) => s + (m?.commercialInsights?.revenue || 0),
          0
        ),

        hasRealCommercialHistory:
          relevantCommercialMatches.length > 0,
      };
    });
  };

  const brandDemandStats = buildBrandDemandStats();

  const customerSpecificBrandPurchaseCount = brandDemandStats.reduce(
    (s, x) => s + (x.currentCustomerSuccessfulCount || 0),
    0
  );

  const marketSimilarBrandPurchaseCount = brandDemandStats.reduce(
    (s, x) => s + (x.otherCustomersSuccessfulCount || 0),
    0
  );

  const customerSpecificBrandPurchaseAmount = brandDemandStats.reduce(
    (s, x) => s + (x.currentCustomerRevenue || 0),
    0
  );

  const marketSimilarBrandPurchaseAmount = brandDemandStats.reduce(
    (s, x) => s + (x.otherCustomersRevenue || 0),
    0
  );

  const rfqOnlyTopBrands = brandDemandStats.map(x => ({
    name: x.canonicalBrand || x.brand,
    count: x.totalRequestCount,
  }));

  const historicalTopBrandsAll = getTopCounts(allRows, brandCol, 7);
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
    .filter(x => !isBrandNoise(x.brand))
    .slice(0, 3)
    .map(
      x =>
        `${x.canonicalBrand || x.brand} | خرید همین مشتری: ${x.currentCustomerSuccessfulCount} | خرید بازار: ${x.otherCustomersSuccessfulCount}`
    )
    .join("، ");


  return {
    topBrandsAll: rfqOnlyTopBrands,
    historicalTopBrandsAll,
    brandDemandStats,
    topCategoriesAll,

    mentionedBrandCount: brandDemandStats.reduce(
      (s, x) => s + x.totalRequestCount,
      0
    ),

    mentionedCategoryCount: mentionedCategoryRows.length,

    mentionedBrandAmount: mentionedBrandRows.reduce((s, r) => s + parseNumber(r[amountCol]), 0),
    mentionedProductAmount: mentionedPartRows.reduce((s, r) => s + parseNumber(r[amountCol]), 0),
    mentionedCategoryAmount: mentionedCategoryRows.reduce((s, r) => s + parseNumber(r[amountCol]), 0),

    similarSuccessfulPurchasesCount,
    similarSuccessfulPurchasesAmount,

    customerSpecificBrandPurchaseCount,
    customerSpecificBrandPurchaseAmount,
    marketSimilarBrandPurchaseCount,
    marketSimilarBrandPurchaseAmount,

    similarPurchaseEvidence: {
      brandPurchaseCount: mentionedBrandPurchaseRows.length,
      partPurchaseCount: mentionedPartPurchaseRows.length,
      categoryPurchaseCount: mentionedCategoryPurchaseRows.length,
      brandSoldOpportunityCount: mentionedBrandSoldRows.length,
      partSoldOpportunityCount: mentionedPartSoldRows.length,
      categorySoldOpportunityCount: mentionedCategorySoldRows.length,

      customerSpecificBrandPurchaseCount,
      customerSpecificBrandPurchaseAmount,
      marketSimilarBrandPurchaseCount,
      marketSimilarBrandPurchaseAmount,
    },

    summary:
      brandDemandStats.length > 0
        ? `تحلیل برند فقط بر اساس برندهای واقعی و canonical شناسایی‌شده در RFQ انجام شده است. ${topBrandNames || ""}`
        : similarSuccessfulPurchasesCount > 0
          ? `سوابق خرید و RFQ مشابه برای برند/مدل همین درخواست در فایل‌های قبلی پیدا شد.`
          : "هیچ سابقه تجاری معناداری از برندهای همین RFQ در فایل‌های قبلی پیدا نشد.",
  };
}