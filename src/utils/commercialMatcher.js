function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_\-\/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePi(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .trim();
}

function cleanNumber(value) {
  const n = Number(String(value || "").replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

function similarity(a, b) {
  const aa = normalizeText(a);
  const bb = normalizeText(b);

  if (!aa || !bb) return 0;
  if (aa === bb) return 1;

  if (aa.includes(bb) || bb.includes(aa)) {
    return 0.85;
  }

  const aaWords = aa.split(" ");
  const bbWords = bb.split(" ");

  const common = aaWords.filter(w => bbWords.includes(w));

  return common.length / Math.max(aaWords.length, bbWords.length, 1);
}

function extractRequestNumbers(value) {
  const text = String(value || "");

  const matches = [];

  const patterns = [
    /(20\d{2})[-\/\s]?(\d{1,6})/gi,
    /TDR[-\/\s]?(\d{1,6})/gi,
    /REQ[-\/\s]?(\d{1,6})/gi,
    /(?:^|\D)(\d{2,6})(?:\D|$)/g,
  ];

  patterns.forEach(regex => {
    let m;

    while ((m = regex.exec(text)) !== null) {
      const value = m[2] || m[1];

      if (!value) continue;

      matches.push(String(value).replace(/^0+/, "") || "0");
    }
  });

  return [...new Set(matches)];
}

function buildRequestLookup(rows) {
  const map = new Map();

  rows.forEach(row => {
    const possibleValues = [
      row?.REQ,
      row?.req,
      row?.Request,
      row?.RequestCode,
      row?.["Request Code"],
      row?.motive,
      row?.MOTIVE,
    ];

    possibleValues.forEach(v => {
      extractRequestNumbers(v).forEach(num => {
        if (!map.has(num)) {
          map.set(num, []);
        }

        map.get(num).push(row);
      });
    });
  });

  return map;
}

function getRequestCustomer(row) {
  return (
    row?.Customer ||
    row?.customer ||
    row?.["Customer Name"] ||
    row?.Company ||
    row?.company ||
    ""
  );
}

function getRequestBrand(row) {
  return (
    row?.Brand ||
    row?.brand ||
    row?.Manufacturer ||
    row?.manufacturer ||
    ""
  );
}

function getRequestPi(row) {
  return (
    row?.["PI Number"] ||
    row?.PINumber ||
    row?.pi ||
    row?.PI ||
    ""
  );
}

function getRequestAmount(row) {
  return (
    cleanNumber(row?.["PI Amount"]) ||
    cleanNumber(row?.["PI Amount AED"]) ||
    cleanNumber(row?.Amount)
  );
}

function getPurchaseCustomer(row) {
  return (
    row?.Customer ||
    row?.customer ||
    row?.["Customer Name"] ||
    row?.Company ||
    ""
  );
}

function getPurchaseBrand(row) {
  return (
    row?.Brand ||
    row?.brand ||
    row?.Manufacturer ||
    row?.manufacturer ||
    ""
  );
}

function getPurchasePi(row) {
  return (
    row?.["PI Number"] ||
    row?.PINumber ||
    row?.PI ||
    row?.pi ||
    ""
  );
}

function getPurchaseAmount(row) {
  return (
    cleanNumber(row?.["Invoice Amount AED"]) ||
    cleanNumber(row?.["PI Amount"]) ||
    cleanNumber(row?.Amount)
  );
}

function classifyConfidence(score) {
  if (score >= 120) return "high";
  if (score >= 75) return "medium";
  return "low";
}

function extractRelevantBrandsFromRequest(requestRows = []) {
  const brands = new Set();

  requestRows.forEach(r => {
    const brand = normalizeText(getRequestBrand(r));

    if (!brand || brand.length < 2) return;

    brands.add(brand);
  });

  return [...brands];
}

function buildCommercialInsights(purchaseRow, requestRow) {
  const revenue =
    cleanNumber(purchaseRow?.["Invoice Amount AED"]) ||
    cleanNumber(purchaseRow?.["Invoice Amount"]);

  const cost =
    cleanNumber(purchaseRow?.["Final Purchase Cost AED"]) ||
    cleanNumber(purchaseRow?.["Final Purchase Cost"]);

  const grossProfit = revenue - cost;

  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

  return {
    revenue,
    cost,
    grossProfit,
    marginPercent: Number(margin.toFixed(2)),

    supplier:
      purchaseRow?.["Supplier Code"] ||
      purchaseRow?.Supplier ||
      purchaseRow?.supplier ||
      "",

    brand: getPurchaseBrand(purchaseRow) || getRequestBrand(requestRow),

    purchaseCustomer: getPurchaseCustomer(purchaseRow),
    requestCustomer: getRequestCustomer(requestRow),

    purchasePi: getPurchasePi(purchaseRow),
    requestPi: getRequestPi(requestRow),

    requestCode:
      purchaseRow?.["Request Code"] ||
      purchaseRow?.RequestCode ||
      purchaseRow?.requestCode ||
      "",
  };
}

export function buildCommercialMatcher({
  requestRows = [],
  purchaseRows = [],
  currentCustomer = "",
}) {
  const requestLookup = buildRequestLookup(requestRows);

  const normalizedCurrentCustomer = normalizeText(currentCustomer);

  const relevantBrands = extractRelevantBrandsFromRequest(requestRows);

  const matches = [];

  purchaseRows.forEach((purchaseRow, purchaseIndex) => {
    const candidateMap = new Map();

    const requestCodeCandidates = extractRequestNumbers(
      purchaseRow?.["Request Code"] ||
        purchaseRow?.RequestCode ||
        purchaseRow?.requestCode ||
        ""
    );

    requestCodeCandidates.forEach(code => {
      const matchedRows = requestLookup.get(code) || [];

      matchedRows.forEach(r => {
        candidateMap.set(r, {
          row: r,
          score: 100,
          reasons: [`request_code:${code}`],
        });
      });
    });

    requestRows.forEach(requestRow => {
      const existing = candidateMap.get(requestRow) || {
        row: requestRow,
        score: 0,
        reasons: [],
      };

      const purchasePi = normalizePi(getPurchasePi(purchaseRow));
      const requestPi = normalizePi(getRequestPi(requestRow));

      if (purchasePi && requestPi && purchasePi === requestPi) {
        existing.score += 90;
        existing.reasons.push("pi_number_match");
      }

      const customerSimilarity = similarity(
        getPurchaseCustomer(purchaseRow),
        getRequestCustomer(requestRow)
      );

      if (customerSimilarity >= 0.85) {
        existing.score += 40;
        existing.reasons.push("customer_match");
      }

      const brandSimilarity = similarity(
        getPurchaseBrand(purchaseRow),
        getRequestBrand(requestRow)
      );

      if (brandSimilarity >= 0.85) {
        existing.score += 25;
        existing.reasons.push("brand_match");
      }

      const purchaseAmount = getPurchaseAmount(purchaseRow);
      const requestAmount = getRequestAmount(requestRow);

      if (purchaseAmount > 0 && requestAmount > 0) {
        const diff = Math.abs(purchaseAmount - requestAmount);
        const ratio = diff / Math.max(purchaseAmount, requestAmount);

        if (ratio <= 0.05) {
          existing.score += 20;
          existing.reasons.push("amount_match_5pct");
        } else if (ratio <= 0.15) {
          existing.score += 10;
          existing.reasons.push("amount_match_15pct");
        }
      }

      candidateMap.set(requestRow, existing);
    });

    const candidates = [...candidateMap.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const best = candidates[0];

    matches.push({
      purchaseIndex,
      purchaseRow,
      matchedRequest: best?.row || null,
      confidence: classifyConfidence(best?.score || 0),
      score: best?.score || 0,
      matchReasons: best?.reasons || [],
      candidateCount: candidates.length,
      alternativeCandidates: candidates.slice(1, 5).map(c => ({
        score: c.score,
        reasons: c.reasons,
        customer: getRequestCustomer(c.row),
        brand: getRequestBrand(c.row),
      })),
      commercialInsights: best?.row
        ? buildCommercialInsights(purchaseRow, best.row)
        : null,
    });
  });

  const matched = matches.filter(m => m.matchedRequest);

  const relevantMatches = matched.filter(m => {
    const purchaseCustomer = normalizeText(
      m?.commercialInsights?.purchaseCustomer
    );

    const requestCustomer = normalizeText(
      m?.commercialInsights?.requestCustomer
    );

    const brand = normalizeText(m?.commercialInsights?.brand);

    const customerMatch =
      normalizedCurrentCustomer &&
      (
        purchaseCustomer.includes(normalizedCurrentCustomer) ||
        normalizedCurrentCustomer.includes(purchaseCustomer) ||
        requestCustomer.includes(normalizedCurrentCustomer) ||
        normalizedCurrentCustomer.includes(requestCustomer)
      );

    const brandMatch = relevantBrands.includes(brand);

    return customerMatch || brandMatch;
  });

  const relevantRevenue = relevantMatches.reduce(
    (s, m) => s + (m.commercialInsights?.revenue || 0),
    0
  );

  const relevantGrossProfit = relevantMatches.reduce(
    (s, m) => s + (m.commercialInsights?.grossProfit || 0),
    0
  );

  const relevantAverageMargin =
    relevantRevenue > 0
      ? Number(((relevantGrossProfit / relevantRevenue) * 100).toFixed(2))
      : 0;

  const topRelevantSuppliers = [
    ...new Set(
      relevantMatches
        .map(m => m?.commercialInsights?.supplier)
        .filter(Boolean)
    ),
  ].slice(0, 5);

  const topRelevantBrands = [
    ...new Set(
      relevantMatches
        .map(m => m?.commercialInsights?.brand)
        .filter(Boolean)
    ),
  ].slice(0, 5);

  const totalRevenue = matched.reduce(
    (s, m) => s + (m.commercialInsights?.revenue || 0),
    0
  );

  const totalCost = matched.reduce(
    (s, m) => s + (m.commercialInsights?.cost || 0),
    0
  );

  const totalGrossProfit = matched.reduce(
    (s, m) => s + (m.commercialInsights?.grossProfit || 0),
    0
  );

  return {
    matches,
    matchedCount: matched.length,
    unmatchedCount: matches.length - matched.length,
    highConfidenceCount: matches.filter(m => m.confidence === "high")
      .length,
    mediumConfidenceCount: matches.filter(m => m.confidence === "medium")
      .length,
    lowConfidenceCount: matches.filter(m => m.confidence === "low")
      .length,
    relevantMatches,
    relevantMatchCount: relevantMatches.length,
    relevantRevenue,
    relevantGrossProfit,
    relevantAverageMargin,
    topRelevantSuppliers,
    topRelevantBrands,
    totalRevenue,
    totalCost,
    totalGrossProfit,
    averageMargin:
      totalRevenue > 0
        ? Number(((totalGrossProfit / totalRevenue) * 100).toFixed(2))
        : 0,
  };
}