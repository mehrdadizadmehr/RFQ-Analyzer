export const MODEL_NAME = "claude-haiku-4-5-20251001";

export const STEPS = [
  { id: "s1", icon: "📋", text: "بررسی سوابق درخواست این مشتری" },
  { id: "s2", icon: "💰", text: "بررسی سوابق خرید و اطلاعات تکمیلی" },
  { id: "s3", icon: "🏷️", text: "تحلیل برند و محصول در فایل‌ها" },
  { id: "s4", icon: "🤖", text: "تحلیل هوشمند با Claude AI" },
  { id: "s5", icon: "📊", text: "آماده‌سازی گزارش نهایی" },
];

export function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
