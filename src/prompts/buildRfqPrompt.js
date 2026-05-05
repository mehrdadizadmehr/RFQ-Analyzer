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
}) {
  return `
Role: B2B RFQ analyst for industrial automation parts.
Return only valid JSON. No markdown.

Important:
- Extract RFQ items from email.
- Estimate China and UAE prices only.
- Company background must be AI-estimated from customer name/RFQ text only. Do not claim verified online search.
- Analyze customer quality, product attractiveness, and win chance.
- Keep answers concise.

Input:
customer=${customer || "unknown"}
rfq=${rfqNum || "unknown"}
notes=${notes || "none"}
manual_note=${extraCustomerInfo || "none"}
manual_new_purchase_count=${manualPurchaseCount || 0}
manual_new_purchase_amount=${manualPurchaseAmount || 0}

request_history:
total_all_requests=${requestStats.totalAllRequests}
customer_requests=${requestStats.customerRequests}
sold_requests=${requestStats.soldRequests}
customer_request_amount=${requestStats.requestAmount}
conversion_rate=${requestStats.conversionRate}
quality=${requestStats.quality}
top_brands=${(requestStats.topBrands || []).join(", ") || "unknown"}

purchase_history:
file_purchase_count=${purchaseStats.filePurchaseCount}
file_purchase_amount=${purchaseStats.filePurchaseAmount}
manual_purchase_count=${purchaseStats.manualPurchaseCount}
manual_purchase_amount=${purchaseStats.manualPurchaseAmount}
total_purchase_count=${purchaseStats.totalPurchaseCount}
total_purchase_amount=${purchaseStats.totalPurchaseAmount}

brand_product_stats:
top_brands_all=${(brandStats.topBrandsAll || []).map(x => `${x.name}:${x.count}`).join(", ") || "unknown"}
top_products_all=${(brandStats.topPartsAll || []).map(x => `${x.name}:${x.count}`).join(", ") || "unknown"}
mentioned_brand_count=${brandStats.mentionedBrandCount}
mentioned_product_count=${brandStats.mentionedProductCount}
mentioned_brand_amount=${brandStats.mentionedBrandAmount}
mentioned_product_amount=${brandStats.mentionedProductAmount}

rfq_text:
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
    "valueComment": ""
  },
  "winChance": {
    "score": 0,
    "level": "High|Medium|Low",
    "reasons": "",
    "riskFactors": "",
    "howToIncreaseChance": ""
  },
  "parts": [
    {
      "partNumber": "",
      "qty": "",
      "manufacturer": "",
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
