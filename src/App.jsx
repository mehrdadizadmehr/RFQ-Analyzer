import { useToast } from "./hooks/useToast";
import { useFileLoader } from "./hooks/useFileLoader";
import { useRfqForm } from "./hooks/useRfqForm";
import { useApiTest } from "./hooks/useApiTest";
import { useAnalysis } from "./hooks/useAnalysis";
import { formatMoney } from "./utils/numbers";

import AppHeader from "./components/AppHeader";
import FileUploadCard from "./components/FileUploadCard";
import RfqForm from "./components/RfqForm";
import ProgressSteps from "./components/ProgressSteps";
import Toast from "./components/Toast";
import ResultsSection from "./components/results/ResultsSection";

import { bg } from "./styles/theme";

export default function App() {
  const { toast, showToast } = useToast();
  const { files, fileLabels, loadFile } = useFileLoader(showToast);
  const form = useRfqForm();
  const { apiTested, testApi } = useApiTest(showToast);
  const { phase, steps, result, startAnalysis } = useAnalysis(showToast);

  const isReady = form.requestText.trim().length > 0;

  const handleStartAnalysis = () => {
    startAnalysis({ files, ...form });
  };

  const copyReport = () => {
    if (!result) return;

    const { customer: c, rfqNum: r, requestStats, purchaseStats, winChance, ai } = result;

    navigator.clipboard
      .writeText(
        `گزارش RFQ
مشتری: ${c || "نامشخص"} | RFQ: ${r || "—"}

سوابق فرصت‌های این مشتری:
تعداد فرصت‌های این مشتری: ${requestStats.customerRequests}
تعداد فرصت‌های فروش‌شده: ${requestStats.soldRequests}
ارزش فرصت‌های این مشتری: ${formatMoney(requestStats.requestAmount)}
نرخ تبدیل: ${requestStats.conversionRate}%
کیفیت مشتری: ${requestStats.quality}

سوابق خرید واقعی:
خریدهای فایل Purchase: ${purchaseStats.filePurchaseCount}
مبلغ خرید واقعی از فایل Purchase: ${formatMoney(purchaseStats.filePurchaseAmount)}
خریدهای جدید دستی: ${purchaseStats.manualPurchaseCount}
مبلغ خریدهای جدید دستی: ${formatMoney(purchaseStats.manualPurchaseAmount)}
جمع کل خرید واقعی ثبت‌شده: ${purchaseStats.totalPurchaseCount}
مبلغ کل خرید واقعی ثبت‌شده: ${formatMoney(purchaseStats.totalPurchaseAmount)}

شانس برنده شدن:
${winChance?.score || "—"}% | ${winChance?.level || "—"}
معیارها:
${(winChance?.factors || []).join("، ") || "—"}

امتیاز AI: ${ai.customerScore || "—"}
سطح مشتری: ${ai.customerLevel || "—"}
ارزش معامله: ${ai.dealValue || "—"}
اولویت: ${ai.priority || "—"}

خلاصه:
${ai.summary || "—"}

بک‌گراند چک مشتری:
${ai.customerBackgroundCheck || "—"}

توصیه:
${ai.recommendation || "—"}

ریسک‌ها:
${ai.risks || "—"}

قدم بعدی:
${ai.nextStep || "—"}`
      )
      .then(() => showToast("✅ کپی شد"));
  };

  return (
    <div
      style={{
        fontFamily: "'Vazirmatn','Tahoma',sans-serif",
        direction: "rtl",
        background: bg,
        minHeight: "100vh",
        color: "#e2e8f0",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        *{box-sizing:border-box}
      `}</style>

      <AppHeader isReady={isReady} />

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        <FileUploadCard
          fileLabels={fileLabels}
          loadFile={loadFile}
          apiTested={apiTested}
          testApi={testApi}
        />

        <RfqForm form={form} phase={phase} onSubmit={handleStartAnalysis} />

        {phase === "running" && <ProgressSteps steps={steps} />}

        {phase === "done" && result && <ResultsSection result={result} />}
      </div>

      <Toast message={toast} />
    </div>
  );
}
