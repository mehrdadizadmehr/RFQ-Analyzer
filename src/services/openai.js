function extractTextFromOpenAIResponse(data) {
  if (data.output_text) return data.output_text;

  if (Array.isArray(data.output)) {
    return data.output
      .flatMap(item => item.content || [])
      .map(content => content.text || "")
      .join("");
  }

  return "";
}

function extractJsonObject(text) {
  if (!text) throw new Error("پاسخ ChatGPT خالی است.");

  let cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("در پاسخ ChatGPT خروجی JSON پیدا نشد.");
  }

  cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
  cleaned = cleaned.replace(/[\u0000-\u001F]+/g, " ");

  return cleaned;
}

function parseOpenAIJson(text) {
  const jsonText = extractJsonObject(text);

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("Raw ChatGPT JSON:", jsonText);
    throw new Error("ChatGPT خروجی JSON نامعتبر داد: " + err.message);
  }
}

export async function callOpenAI(prompt, maxTokens = 3200) {
  const response = await fetch("/api/openai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      max_output_tokens: maxTokens,
    }),
  });

  const raw = await response.text();

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI API Route پاسخ JSON نداد.");
  }

  if (!response.ok) {
    throw new Error(data.error?.message || data.error || "HTTP " + response.status);
  }

  const text = extractTextFromOpenAIResponse(data);

  return parseOpenAIJson(text);
}


export async function extractRfqWithOpenAI(prompt) {
  return callOpenAI(prompt, 1600);
}

export async function buildBaseRfqAnalysisWithOpenAI({
  customer,
  rfqNum,
  requestText,
  requestStats,
  purchaseStats,
  brandStats,
  companySearch,
}) {
  const prompt = `
You are an industrial RFQ AI assistant.

Generate ONLY valid JSON.
Do not use markdown.
Do not wrap in triple backticks.

Language rules:
- All narrative text MUST be Persian.
- Technical terms, brands, models and part numbers can remain English.
- Never leave important fields empty.

Customer:
${customer || "Unknown"}

RFQ Number:
${rfqNum || "N/A"}

RFQ Text:
${requestText || ""}

Customer request statistics:
${JSON.stringify(requestStats || {}, null, 2)}

Purchase statistics:
${JSON.stringify(purchaseStats || {}, null, 2)}

Brand analysis:
${JSON.stringify(brandStats || {}, null, 2)}

Online company enrichment:
${JSON.stringify(companySearch || {}, null, 2)}

Return ONLY this JSON schema:
{
  "summary": "",
  "backgroundSummary": "",
  "onlineDataStatus": "",
  "estimatedTotalChina": "",
  "estimatedTotalUAE": "",
  "pricingNotes": "",
  "parts": [
    {
      "partNumber": "",
      "qty": "",
      "manufacturer": "",
      "description": "",
      "application": "",
      "status": "Normal|Critical|OEM|Obsolete",
      "priceChina": "",
      "priceUAE": "",
      "alternatives": ""
    }
  ]
}
`;

  return callOpenAI(prompt, 4500);
}

export async function testOpenAIConnection() {
  const response = await fetch("/api/openai", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: "Return only JSON: {\"ok\":true}",
      max_output_tokens: 50,
    }),
  });

  const raw = await response.text();

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("OpenAI API Route پاسخ JSON نداد.");
  }

  if (!response.ok) {
    throw new Error(data.error?.message || data.error || response.status);
  }

  return data;
}