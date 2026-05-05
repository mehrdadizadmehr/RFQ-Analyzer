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
}) {
  return `
Role: B2B RFQ analyst for industrial automation parts.
Return only valid JSON. No markdown.

Language rules:
- JSON keys must stay English.
- General business explanations must be in Persian/Farsi.
- Technical names must stay English.
- Part numbers must never be translated.
- Brand names must never be translated.
- Product categories must stay English.
- Product descriptions, part applications, alternatives, and technical table values must be in English.
- Do not translate technical words such as PLC, HMI, CPU, I/O Module, Contactor, Relay, Sensor, Power Supply, Terminal Block, Circuit Breaker, Drive, Servo, Encoder, Switchgear.

Win chance rules:
- Do NOT calculate win chance score.
- Use the app-calculated win chance only.
- Explain the win chance briefly in Persian.

Pricing rules:
- Estimate China and UAE prices only.
- Do not include generic marketPrice.

Company background rules:
- Company background must be AI-estimated from customer name/RFQ text only.
- Do not claim verified online search.

Similar purchase rule:
- If similar brand, part number, or product category appears in uploaded files and has ended in Purchase or sold opportunity, mention it clearly.
- Mention that the purchase/sold history may belong to other customers, not necessarily this customer.
- Explain how many similar brand/part/category successful records exist.
- Use this evidence in brandProductReview and winChanceCommentary.
- Keep all brand, part, category names in English.

Customer:
name=${customer || "unknown"}
rfq=${rfqNum || "unknown"}
notes=${notes || "none"}
manual_note=${extraCustomerInfo || "none"}
manual_new_purchase_count=${manualPurchaseCount || 0}
manual_new_purchase_amount=${manualPurchaseAmount || 0}

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

mentioned_brand_count=${brandStats.mentionedBrandCount}
mentioned_product_count=${brandStats.mentionedProductCount}
mentioned_category_count=${brandStats.mentionedCategoryCount}

mentioned_brand_amount=${brandStats.mentionedBrandAmount}
mentioned_product_amount=${brandStats.mentionedProductAmount}
mentioned_category_amount=${brandStats.mentionedCategoryAmount}

similar_successful_purchase_records=${brandStats.similarSuccessfulPurchasesCount}
similar_successful_purchase_amount=${brandStats.similarSuccessfulPurchasesAmount}

similar_purchase_evidence:
brand_purchase_count=${brandStats.similarPurchaseEvidence?.brandPurchaseCount || 0}
part_purchase_count=${brandStats.similarPurchaseEvidence?.partPurchaseCount || 0}
category_purchase_count=${brandStats.similarPurchaseEvidence?.categoryPurchaseCount || 0}
brand_sold_opportunity_count=${brandStats.similarPurchaseEvidence?.brandSoldOpportunityCount || 0}
part_sold_opportunity_count=${brandStats.similarPurchaseEvidence?.partSoldOpportunityCount || 0}
category_sold_opportunity_count=${brandStats.similarPurchaseEvidence?.categorySoldOpportunityCount || 0}

App-calculated win chance:
score=${winChance.score}
level=${winChance.level}
factors=${(winChance.factors || []).join(" | ")}
explanation=${winChance.explanation}

RFQ/email text:
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
  "extractedItemsCount": 0,
  "companyBackground": {
    "companySize": "",
    "industry": "",
    "geography": "",
    "companyType": "",
    "confidence": "low|medium|high",
    "note": ""
  },
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
      "alternatives": "",
      "eolNote": ""
    }
  ],
  "recommendation": "",
  "risks": "",
  "nextStep": ""
}
`;
}