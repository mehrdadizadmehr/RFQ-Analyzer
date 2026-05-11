import ErrorsCard from "./ErrorsCard";
import ReportHeader from "./ReportHeader";
import RequestStatsCard from "./RequestStatsCard";
import PurchaseStatsCard from "./PurchaseStatsCard";
import BrandStatsCard from "./BrandStatsCard";
import WinChanceCard from "./WinChanceCard";
import SummaryCard from "./SummaryCard";
import BackgroundCheckCard from "./BackgroundCheckCard";
import PartsTable from "./PartsTable";
import SalesRecommendationCard from "./SalesRecommendationCard";

export default function ResultsSection({ result }) {
  const { ai, requestStats, purchaseStats, brandStats, winChance, errors } = result;
  const parts = ai.parts || [];

  return (
    <>
      <ErrorsCard errors={errors} />
      <ReportHeader result={result} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <RequestStatsCard requestStats={requestStats} />
        <PurchaseStatsCard purchaseStats={purchaseStats} />
      </div>

      <BrandStatsCard brandStats={brandStats} ai={ai} />
      <WinChanceCard winChance={winChance} ai={ai} />
      <SummaryCard summary={ai.summary} />
      <BackgroundCheckCard ai={ai} />
      <PartsTable parts={parts} ai={ai} />
      <SalesRecommendationCard ai={ai} />
    </>
  );
}
