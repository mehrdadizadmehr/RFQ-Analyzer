import { MODEL_NAME } from "../constants/rfq";

function extractJsonObject(text) {
  if (!text) throw new Error("پاسخ Claude خالی است.");

  let cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("در پاسخ Claude خروجی JSON پیدا نشد.");
  }

  cleaned = cleaned.slice(firstBrace, lastBrace + 1);

  // حذف commaهای اضافه قبل از } یا ]
  cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");

  // حذف کاراکترهای کنترل نامعتبر
  cleaned = cleaned.replace(/[\u0000-\u001F]+/g, " ");

  return cleaned;
}

function parseClaudeJson(text) {
  const jsonText = extractJsonObject(text);

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("Raw Claude JSON:", jsonText);
    throw new Error("Claude خروجی JSON نامعتبر داد: " + err.message);
  }
}

export async function callClaude(prompt, maxTokens = 3000) {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const raw = await response.text();

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("API پاسخ JSON معتبر نداد.");
  }

  if (!response.ok) {
    throw new Error(data.error?.message || data.error || "HTTP " + response.status);
  }

  const text = data.content?.map(c => c.text || "").join("") || "";

  return parseClaudeJson(text);
}

export async function testClaudeConnection() {
  const response = await fetch("/api/claude", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      max_tokens: 20,
      messages: [{ role: "user", content: "Return only JSON: {\"ok\":true}" }],
    }),
  });

  const raw = await response.text();

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error("API Route پاسخ JSON نداد");
  }

  if (!response.ok) {
    throw new Error(data.error?.message || data.error || response.status);
  }

  return data;
}