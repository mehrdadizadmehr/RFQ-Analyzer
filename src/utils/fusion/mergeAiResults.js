export function mergeAiResults({
  claude,
  openai,
  requestStats,
  purchaseStats,
  brandStats,
  winChance,
}) {
  const primary = claude || openai;
  const secondary = openai || claude;

  const merged = {
    customerScore: averageNumbers(
      claude?.customerScore,
      openai?.customerScore
    ),

    customerLevel:
      strongerValue(
        claude?.customerLevel,
        openai?.customerLevel,
        ["VIP", "High Potential", "Regular", "Low"]
      ) || primary?.customerLevel,

    dealValue:
      strongerValue(
        claude?.dealValue,
        openai?.dealValue,
        ["Very High", "High", "Medium", "Low"]
      ) || primary?.dealValue,

    priority:
      strongerValue(
        claude?.priority,
        openai?.priority,
        ["Critical", "High", "Medium", "Low"]
      ) || primary?.priority,

    summary: longestText(
      claude?.summary,
      openai?.summary
    ),

    recommendation: mergeTexts(
      claude?.recommendation,
      openai?.recommendation
    ),

    risks: mergeTexts(
      claude?.risks,
      openai?.risks
    ),

    nextStep: mergeTexts(
      claude?.nextStep,
      openai?.nextStep
    ),

    customerBackgroundCheck: mergeTexts(
      claude?.customerBackgroundCheck,
      openai?.customerBackgroundCheck
    ),

    parts: mergeParts(
      claude?.parts || [],
      openai?.parts || []
    ),

    winChance: {
      score: winChance?.score || 0,
      level: winChance?.level || "Medium",
      factors: winChance?.factors || [],
      explanation: buildWinChanceExplanation(
        requestStats,
        purchaseStats,
        brandStats,
        winChance
      ),
    },

    confidence: calculateConfidence({
      claude,
      openai,
      purchaseStats,
      requestStats,
    }),

    consensus: buildConsensus({
      claude,
      openai,
      purchaseStats,
      requestStats,
      brandStats,
    }),

    conflicts: detectConflicts({
      claude,
      openai,
    }),
  };

  return merged;
}

function averageNumbers(a, b) {
  const nums = [a, b].filter(v => typeof v === "number");

  if (!nums.length) return 0;

  return Math.round(
    nums.reduce((s, v) => s + v, 0) / nums.length
  );
}

function strongerValue(a, b, order = []) {
  const ia = order.indexOf(a);
  const ib = order.indexOf(b);

  if (ia === -1) return b;
  if (ib === -1) return a;

  return ia < ib ? a : b;
}

function longestText(a, b) {
  return [a, b]
    .filter(Boolean)
    .sort((x, y) => y.length - x.length)[0] || "";
}

function mergeTexts(a, b) {
  const texts = [a, b]
    .filter(Boolean)
    .map(t => t.trim());

  return [...new Set(texts)].join("\n\n");
}

function mergeParts(partsA, partsB) {
  const map = {};

  [...partsA, ...partsB].forEach(p => {
    const key = (p.partNumber || "").toUpperCase();

    if (!key) return;

    if (!map[key]) {
      map[key] = p;
      return;
    }

    map[key] = {
      ...map[key],
      ...p,
    };
  });

  return Object.values(map);
}

function buildWinChanceExplanation(
  requestStats,
  purchaseStats,
  brandStats,
  winChance
) {
  return `
Customer conversion rate: ${requestStats?.conversionRate || 0}%

Real purchase history:
${purchaseStats?.totalPurchaseCount || 0} orders

Brand demand:
${brandStats?.topBrandsAll?.length || 0} active brands

Final score:
${winChance?.score || 0}%
`.trim();
}

function calculateConfidence({
  claude,
  openai,
  purchaseStats,
  requestStats,
}) {
  let score = 50;

  if (claude && openai) score += 20;

  if (purchaseStats?.totalPurchaseAmount > 0)
    score += 15;

  if (requestStats?.conversionRate > 30)
    score += 10;

  if (
    claude?.parts?.length &&
    openai?.parts?.length
  ) {
    score += 5;
  }

  if (score >= 90) return "Very High";
  if (score >= 75) return "High";
  if (score >= 60) return "Medium";

  return "Low";
}

function buildConsensus({
  claude,
  openai,
  purchaseStats,
  requestStats,
  brandStats,
}) {
  const items = [];

  if (purchaseStats?.totalPurchaseAmount > 0) {
    items.push("Customer has verified real purchase history");
  }

  if (requestStats?.conversionRate > 40) {
    items.push("Customer conversion rate is strong");
  }

  if ((brandStats?.topBrandsAll || []).length > 0) {
    items.push("Requested brands have active market demand");
  }

  if (claude?.priority === openai?.priority) {
    items.push(`Both AIs agree on priority level: ${claude?.priority}`);
  }

  return items;
}

function detectConflicts({ claude, openai }) {
  const conflicts = [];

  if (!claude || !openai) return conflicts;

  if (claude.priority !== openai.priority) {
    conflicts.push(
      `Priority mismatch: Claude=${claude.priority} | OpenAI=${openai.priority}`
    );
  }

  if (claude.dealValue !== openai.dealValue) {
    conflicts.push(
      `Deal value mismatch: Claude=${claude.dealValue} | OpenAI=${openai.dealValue}`
    );
  }

  return conflicts;
}