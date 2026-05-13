import { useState, useCallback, useEffect } from "react";
import { AUTO_EXCEL_FILES } from "../constants/rfq";
import { readExcelFile, readExcelFromUrl } from "../utils/excel";

export function useFileLoader(showToast) {
  const [files, setFiles] = useState({
    purchase: null,
    req25: null,
    req26: null,
    suppliers: null,
    supplierWinners: null,
  });
  const [fileLabels, setFileLabels] = useState({
    purchase: "",
    req25: "",
    req26: "",
    suppliers: "",
    supplierWinners: "",
  });

  useEffect(() => {
    let cancelled = false;

    async function loadDefaultFiles() {
      for (const item of AUTO_EXCEL_FILES) {
        try {
          const rows = await readExcelFromUrl(item.path);
          if (cancelled) return;
          setFiles(prev => ({ ...prev, [item.key]: rows }));
          setFileLabels(prev => ({ ...prev, [item.key]: `✓ ${rows.length} ردیف - Auto` }));
        } catch (err) {
          console.warn(`${item.label} auto-load failed:`, err.message);
          setFileLabels(prev => ({ ...prev, [item.key]: "⚠️ Auto-load failed" }));
        }
      }
    }

    loadDefaultFiles();
    return () => { cancelled = true; };
  }, []);

  const loadFile = useCallback(async (e, key) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const rows = await readExcelFile(file);
      setFiles(f => ({ ...f, [key]: rows }));
      setFileLabels(l => ({ ...l, [key]: `✓ ${rows.length} ردیف` }));
      showToast(`${file.name} بارگذاری شد`);
    } catch (err) {
      showToast("خطا: " + err.message);
    }
  }, [showToast]);

  useEffect(() => {
    console.log("Loaded file keys:", Object.keys(files || {}));

    console.log("Supplier rows:", files?.suppliers?.length || 0);
    console.log("Supplier winner rows:", files?.supplierWinners?.length || 0);
  }, [files]);

  return { files, fileLabels, loadFile };
}
