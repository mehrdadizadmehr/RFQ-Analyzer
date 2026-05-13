export function buildRfqPrompt({
  customer,
  rfqNum,
  requestText,
  notes,
  extraCustomerInfo,
  manualPurchaseCount,
  manualPurchaseAmount,
  requestStats,
  purchaseStats,
  commercialMatcher,
  brandStats,
  winChance,
  extractedRfq,
  companySearch,
  baseAi,
}) {
  const extractedItems = extractedRfq?.items || [];

  return `
Role: Senior B2B commercial analyst for industrial automation RFQs.
Return only valid JSON. No markdown.

Language rules:
- JSON keys must stay English.
- All business explanations, summaries, recommendations, risk explanations, pricing notes and background checks must be written in Persian/Farsi.
- NEVER translate technical terms, industrial terminology, protocols, electrical standards, PLC/DCS terminology, manufacturer names, or brand names into Persian.
- Part numbers must never be translated.
- Brand names must never be translated.
- Product categories must stay English.
- Product descriptions, part applications, alternatives, technical statuses, technical table values and sourcing terminology must remain in English.
- Examples that must stay English: Siemens, Schneider, ABB, PLC, DCS, HMI, Servo Motor, VFD, Relay Module, RTD, MCC.
- Write in a mixed commercial-engineering style readable for an Iranian industrial sales engineer.

Critical architecture rule:
- RFQ extraction has already been done by ChatGPT.
- Do NOT re-extract from scratch unless the extracted list is clearly empty.
- Use extractedRfq as the primary technical item source.
- Your job is commercial analysis, risk analysis, sourcing strategy, pricing logic, and final recommendation.

Multi-model orchestration rule:
- OpenAI has already generated a base RFQ analysis.
- Do NOT regenerate everything from scratch.
- Improve, validate and enrich the existing base analysis.
- Focus mostly on commercial intelligence, strategic insight, procurement reasoning, sales recommendation and risk analysis.
- Reuse valid base analysis fields when they already look reasonable.
- Avoid excessively long narrative explanations.
- Keep JSON compact and stable.

Win chance rules:
- Do NOT calculate win chance score.
- Use the app-calculated win chance only.
- Explain the win chance briefly in Persian.

Pricing rules:
- Estimate China and UAE prices only.
- Do not include generic marketPrice.
- For each item, provide priceChina and priceUAE as realistic rough ranges when exact market data is unknown.
- Calculate an estimated total RFQ value for China and UAE using qty × estimated unit price/range.
- Always return estimatedTotalChina and estimatedTotalUAE.
- Never leave estimatedTotalChina or estimatedTotalUAE empty.
- If pricing is uncertain, return a cautious range and mention uncertainty inside pricingNotes.

Company background rules:
- If online company enrichment exists, use it as the PRIMARY source for backgroundCheckOnline.
- If online enrichment is unavailable, clearly mention that online information could not be retrieved.
- When online data is unavailable, fall back to intelligent estimation using RFQ text, industrial terminology, email signatures, geography clues and company naming patterns.
- Never pretend that online information exists when it does not.
- Mention confidence level honestly.
- background check explanations must be written in Persian.
- onlineSignals should contain short meaningful business/industry/company signals.
- If official_website_candidates or linkedin_candidates are available, include the most relevant ones in backgroundCheckOnline.officialWebsiteCandidates and backgroundCheckOnline.linkedinCandidates.
- Do not invent URLs. Only use URLs provided in online company enrichment.
- If multiple companies are similar but not clearly the same, mention uncertainty in onlineSignals and confidence should be low or medium.

Similar purchase rule:
- If similar brand, part number, or product category appears in uploaded files and has ended in Purchase or sold opportunity, mention it clearly.
- Mention that the purchase/sold history may belong to other customers, not necessarily this customer.
- Keep all brand, part, category names in English.

Commercial matcher rules:
- commercialMatcher is the most reliable source for real purchase execution, revenue, cost, gross profit, margin, and supplier evidence.
- Treat matched purchase rows as stronger evidence than Request status alone.
- If Commercial Status or WIN status conflicts with matched purchases, mention that actual purchase execution is stronger evidence.
- Use matcher confidence carefully: high confidence can be treated as real purchase linkage; medium confidence should be mentioned as likely linkage; low confidence should be treated cautiously.
- Use matched_average_margin and matched_gross_profit to improve customer quality, brand attractiveness, and sales recommendation.
- Do not invent matched deals that are not present in commercialMatcher.

Customer:
name=${customer || "unknown"}
rfq=${rfqNum || "unknown"}
notes=${notes || "none"}
manual_note=${extraCustomerInfo || "none"}
manual_new_purchase_count=${manualPurchaseCount || 0}
manual_new_purchase_amount=${manualPurchaseAmount || 0}

Extracted RFQ by ChatGPT:
items=${JSON.stringify(extractedItems)}
brands=${JSON.stringify(extractedRfq?.brands || [])}
categories=${JSON.stringify(extractedRfq?.categories || [])}
extraction_notes=${extractedRfq?.extractionNotes || "none"}

Opportunity history from Request files:
total_all_opportunities=${requestStats.totalAllRequests}
customer_opportunities=${requestStats.customerRequests}
sold_opportunities=${requestStats.soldRequests}
customer_opportunity_value=${requestStats.requestAmount}
conversion_rate=${requestStats.conversionRate}
customer_quality=${requestStats.quality}
top_customer_brands=${(requestStats.topBrands || []).join(", ") || "unknown"}

Actual purchase history:
file_purchase_count=${purchaseStats.filePurchaseCount}
file_purchase_amount=${purchaseStats.filePurchaseAmount}
manual_purchase_count=${purchaseStats.manualPurchaseCount}
manual_purchase_amount=${purchaseStats.manualPurchaseAmount}
total_actual_purchase_count=${purchaseStats.totalPurchaseCount}
total_actual_purchase_amount=${purchaseStats.totalPurchaseAmount}

Commercial matcher intelligence:
matched_purchase_rows=${commercialMatcher?.matchedCount || 0}
unmatched_purchase_rows=${commercialMatcher?.unmatchedCount || 0}
high_confidence_matches=${commercialMatcher?.highConfidenceCount || 0}
medium_confidence_matches=${commercialMatcher?.mediumConfidenceCount || 0}
low_confidence_matches=${commercialMatcher?.lowConfidenceCount || 0}
matched_revenue=${commercialMatcher?.totalRevenue || 0}
matched_cost=${commercialMatcher?.totalCost || 0}
matched_gross_profit=${commercialMatcher?.totalGrossProfit || 0}
matched_average_margin=${commercialMatcher?.averageMargin || 0}
matcher_sample=${JSON.stringify((commercialMatcher?.matches || []).slice(0, 8).map(m => ({
  confidence: m.confidence,
  score: m.score,
  reasons: m.matchReasons,
  revenue: m.commercialInsights?.revenue,
  cost: m.commercialInsights?.cost,
  grossProfit: m.commercialInsights?.grossProfit,
  marginPercent: m.commercialInsights?.marginPercent,
  supplier: m.commercialInsights?.supplier,
  brand: m.commercialInsights?.brand,
})), null, 2)}

Brand/Product stats from uploaded files:
top_brands_all=${(brandStats.topBrandsAll || []).map(x => `${x.name}:${x.count}`).join(", ") || "unknown"}
top_products_all=${(brandStats.topPartsAll || []).map(x => `${x.name}:${x.count}`).join(", ") || "unknown"}
top_categories_all=${(brandStats.topCategoriesAll || []).map(x => `${x.name}:${x.count}`).join(", ") || "unknown"}

similar_successful_purchase_records=${brandStats.similarSuccessfulPurchasesCount}
similar_successful_purchase_amount=${brandStats.similarSuccessfulPurchasesAmount}

Pricing expectation:
- extracted_item_count=${extractedItems.length}
- You must estimate total RFQ value based on extracted items and quantities.
- Use AED as the reporting currency if possible.
- If China price is naturally in RMB/USD, still provide an approximate AED equivalent or clearly mention the currency.

App-calculated win chance:
score=${winChance.score}
level=${winChance.level}
factors=${(winChance.factors || []).join(" | ")}
explanation=${winChance.explanation}

Online company enrichment:
online_available=${companySearch?.onlineAvailable ? "yes" : "no"}
cache_hit=${companySearch?.cacheHit ? "yes" : "no"}
search_summary=${companySearch?.answer || "اطلاعات آنلاین قابل دریافت نیست"}
official_website_candidates=${JSON.stringify(companySearch?.officialWebsiteCandidates || [])}
linkedin_candidates=${JSON.stringify(companySearch?.linkedinCandidates || [])}
other_source_candidates=${JSON.stringify(companySearch?.otherSourceCandidates || [])}
search_results=${JSON.stringify(companySearch?.results || [])}
search_error=${companySearch?.error || "none"}
searched_at=${companySearch?.searchedAt || "unknown"}

Base RFQ analysis already generated by OpenAI:
${JSON.stringify(baseAi || {}, null, 2)}

Important pricing and sourcing output requirement:
- estimatedTotalChina must summarize the full RFQ estimated total for China sourcing.
- estimatedTotalUAE must summarize the full RFQ estimated total for UAE market pricing.
- pricingNotes must explain assumptions briefly in Persian.
- Each part must include estimatedLineTotalChina and estimatedLineTotalUAE.
- If recognizable suppliers, sourcing channels or market patterns exist, mention possible sourcing direction briefly.
- Supplier suggestions must stay realistic and concise.

Original RFQ/email text for context only:
"""
${requestText}
"""

JSON schema:
{
  "reuseBaseAi": true,
  "customerScore": 0,
  "customerLevel": "VIP|Regular|New|Low",
  "dealValue": "High|Medium|Low",
  "priority": "Urgent|High|Normal|Low",
  "summary": "",
  "summaryLanguage": "Persian with English technical terms",
  "estimatedTotalChina": "",
  "estimatedTotalUAE": "",
  "pricingNotes": "",
  "backgroundCheckOnline": {
    "onlineAvailable": true,
    "companyType": "",
    "industry": "",
    "geography": "",
    "estimatedSize": "",
    "confidence": "low|medium|high",
    "officialWebsiteCandidates": [
      {
        "title": "",
        "url": "",
        "reason": ""
      }
    ],
    "linkedinCandidates": [
      {
        "title": "",
        "url": "",
        "reason": ""
      }
    ],
    "otherSourceCandidates": [
      {
        "title": "",
        "url": "",
        "reason": ""
      }
    ],
    "onlineSignals": []
  },
  "backgroundSummary": "",
  "onlineDataStatus": "",
  "customerBackgroundCheck": "",
  "brandProductReview": {
    "brandAttractiveness": "",
    "productDemandSignal": "",
    "repeatCountComment": "",
    "valueComment": "",
    "similarPurchaseEvidence": ""
  },
  "winChanceCommentary": {
    "scoreComment": "",
    "businessReasons": "",
    "riskFactors": "",
    "howToIncreaseChance": ""
  },
  "parts": [
    {
      "partNumber": "",
      "qty": "",
      "manufacturer": "",
      "category": "",
      "description": "",
      "application": "",
      "status": "active|eol|warning|unknown",
      "statusLabel": "",
      "priceChina": "",
      "priceUAE": "",
      "estimatedLineTotalChina": "",
      "estimatedLineTotalUAE": "",
      "alternatives": "",
      "eolNote": ""
    }
  ],
  "supplierSuggestions": [
    {
      "supplierName": "",
      "region": "China|UAE|Global",
      "reason": ""
    }
  ],
  "commercialInsights": {
    "procurementComplexity": "",
    "pricingPressure": "",
    "supplierRisk": "",
    "urgencySignal": "",
    "realPurchaseLinkage": "",
    "marginInsight": "",
    "supplierEvidence": "",
    "conversionQuality": ""
  },
  "recommendation": "",
  "risks": "",
  "nextStep": ""
}

Critical response optimization rules:
- recommendation, risks and nextStep must NEVER be empty.
- Keep recommendation concise and practical.
- Keep risks concise and business-focused.
- Keep nextStep actionable.
- Avoid repeating the same information multiple times.
- Do not generate unnecessary long paragraphs.
- Reuse and improve the base analysis instead of rewriting everything.
- When giving sales recommendation, use commercialMatcher evidence if available: revenue, margin, supplier, match confidence, and real purchase linkage.
- Prioritize stability and valid JSON structure over creativity.
`;
}