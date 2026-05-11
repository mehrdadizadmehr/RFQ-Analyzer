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
  brandStats,
  winChance,
  extractedRfq,
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
- Company background should be estimated intelligently from customer name, RFQ content, industry clues, geography clues, email signatures and industrial terminology.
- Never claim guaranteed or verified web search.
- If there are recognizable industrial/company signals, estimate probable industry, company type, geography and approximate company size.
- Mention confidence level honestly.
- background check explanations must be written in Persian.

Similar purchase rule:
- If similar brand, part number, or product category appears in uploaded files and has ended in Purchase or sold opportunity, mention it clearly.
- Mention that the purchase/sold history may belong to other customers, not necessarily this customer.
- Keep all brand, part, category names in English.

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
    "companyType": "",
    "industry": "",
    "geography": "",
    "estimatedSize": "",
    "confidence": "low|medium|high",
    "onlineSignals": []
  },
  "backgroundSummary": "",
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
  "recommendation": "",
  "risks": "",
  "nextStep": ""
}
`;
}