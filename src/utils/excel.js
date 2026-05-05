import * as XLSX from "xlsx";
import { normalizeText } from "./numbers";

function workbookToRows(wb) {
  const rows = [];

  wb.SheetNames.forEach(sheetName => {
    rows.push(
      ...XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" })
    );
  });

  return rows;
}

export function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "binary" });
        resolve(workbookToRows(wb));
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("خطا در خواندن فایل"));
    reader.readAsBinaryString(file);
  });
}

export async function readExcelFromUrl(url) {
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`فایل پیدا نشد: ${url}`);
  }

  const buffer = await res.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });

  return workbookToRows(wb);
}

export function findColumn(rows, candidates) {
  if (!rows || !rows.length) return null;

  const keys = Object.keys(rows[0]);

  for (const c of candidates) {
    const found = keys.find(k => normalizeText(k).includes(normalizeText(c)));
    if (found) return found;
  }

  return null;
}