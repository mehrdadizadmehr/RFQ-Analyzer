import { MODEL_NAME } from "../constants/rfq";

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
  const jsonMatch = text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("در پاسخ Claude خروجی JSON پیدا نشد.");
  }

  return JSON.parse(jsonMatch[0]);
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
