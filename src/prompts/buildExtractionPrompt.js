export function buildExtractionPrompt({ requestText }) {
  return `
You are an RFQ extraction engine for industrial automation parts.

Return ONLY valid JSON.
No markdown.
No explanation.

Rules:
- Keep all technical names in English.
- Never translate part numbers.
- Never translate brand names.
- Extract quantity if available.
- If brand is not explicit, infer only when obvious from part number.
- Keep category in English.
- Be conservative. Do not invent parts.

RFQ text:
"""
${requestText}
"""

JSON schema:
{
  "items": [
    {
      "partNumber": "",
      "qty": "",
      "manufacturer": "",
      "category": "",
      "description": "",
      "application": ""
    }
  ],
  "brands": [],
  "categories": [],
  "extractionNotes": ""
}
`;
}