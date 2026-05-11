import { MODEL_NAME } from "../constants/rfq";
import { jsonrepair } from "jsonrepair";

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
  cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]+/g, " ");

  return cleaned;
}

function parseClaudeJson(text) {
  const jsonText = extractJsonObject(text);

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("Raw Claude JSON:", jsonText);

    // تلاش برای repair پیشرفته JSON
    try {
      const repaired = jsonrepair(jsonText);
      return JSON.parse(repaired);
    } catch (repairErr) {
      console.error("Claude JSON repair failed:", repairErr);
      throw new Error("Claude خروجی JSON نامعتبر داد: " + err.message);
    }
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
      temperature: 0,
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

  if (!text.trim()) {
    throw new Error("Claude پاسخ متنی خالی برگرداند.");
  }

  try {
    return parseClaudeJson(text);
  } catch (err) {
    console.warn("Claude JSON parse failed. Retrying once...", err.message);

    // یک retry خودکار برای کاهش خطاهای random
    const retryResponse = await fetch("/api/claude", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        max_tokens: maxTokens,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const retryRaw = await retryResponse.text();

    let retryData;

    try {
      retryData = JSON.parse(retryRaw);
    } catch {
      throw err;
    }

    const retryText =
      retryData.content?.map(c => c.text || "").join("") || "";

    return parseClaudeJson(retryText);
  }
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
      temperature: 0,
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