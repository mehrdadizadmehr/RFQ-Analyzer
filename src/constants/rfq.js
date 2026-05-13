export const MODEL_NAME = "claude-haiku-4-5-20251001";

export const STEPS = [
  { id: "s1", icon: "📋", text: "بررسی سوابق فرصت‌های این مشتری" },
  { id: "s2", icon: "💰", text: "بررسی خرید واقعی از Purchase و ورودی دستی" },
  { id: "s3", icon: "🏷️", text: "تحلیل برند و محصول در فایل‌ها" },
  { id: "s4", icon: "🤖", text: "تحلیل هوشمند با Claude AI" },
  { id: "s5", icon: "📊", text: "آماده‌سازی گزارش نهایی" },
];

export const AUTO_EXCEL_FILES = [
  {
    key: "purchase",
    label: "Purchase 2025",
    path: "/data/purchase_2025.xlsx",
  },
  {
    key: "req25",
    label: "Request 2025",
    path: "/data/request_2025.xlsx",
  },
  {
    key: "req26",
    label: "Request 2026",
    path: "/data/request_2026.xlsx",
  },
  {
    key: "suppliers",
    label: "Supplier List",
    path: "/data/supplier-list.csv",
  },
  {
    key: "supplierWinners",
    label: "Supplier Winners",
    path: "/data/supplier-winners-2025.csv",
  },
];

export function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}