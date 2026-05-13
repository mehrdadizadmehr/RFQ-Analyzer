import { useEffect, useState } from "react";

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
import CommercialMatcherCard from "./CommercialMatcherCard";

const sections = [
  {
    id: "summary",
    label: "خلاصه",
    icon: "📝",
  },
  {
    id: "sales",
    label: "توصیه فروش",
    icon: "💡",
  },
  {
    id: "winchance",
    label: "شانس برد",
    icon: "🎯",
  },
  {
    id: "brands",
    label: "تحلیل برند",
    icon: "🏷️",
  },
  {
    id: "commercial-matcher",
    label: "اتصال خریدها",
    icon: "🔗",
  },
  {
    id: "background",
    label: "بک‌گراند",
    icon: "🔎",
  },
  {
    id: "parts",
    label: "قطعات",
    icon: "⚙️",
  },
  {
    id: "stats",
    label: "سوابق مشتری",
    icon: "📊",
  },
];

export default function ResultsSection({ result }) {
  const {
    ai,
    requestStats,
    purchaseStats,
    brandStats,
    winChance,
    errors,
    commercialMatcher,
  } = result;
  const parts = ai.parts || [];

  const [activeSection, setActiveSection] = useState("summary");

  useEffect(() => {
    const onScroll = () => {
      let current = "summary";

      sections.forEach(section => {
        const el = document.getElementById(section.id);

        if (!el) return;

        const rect = el.getBoundingClientRect();

        if (rect.top <= 140) {
          current = section.id;
        }
      });

      setActiveSection(current);
    };

    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const scrollToSection = id => {
    const el = document.getElementById(id);

    if (!el) return;

    window.scrollTo({
      top: el.offsetTop - 90,
      behavior: "smooth",
    });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px minmax(0,1fr)",
        gap: 18,
        alignItems: "start",
      }}
    >
      <div
        style={{
          position: "sticky",
          top: 20,
          alignSelf: "start",
        }}
      >
        <div
          style={{
            background: "#161b27",
            border: "1px solid #2a3148",
            borderRadius: 14,
            padding: 14,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              marginBottom: 14,
              color: "#94a3b8",
            }}
          >
            منوی تحلیل RFQ
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sections.map(section => {
              const active = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: active
                      ? "1px solid rgba(59,130,246,0.4)"
                      : "1px solid rgba(255,255,255,0.04)",
                    background: active
                      ? "rgba(59,130,246,0.12)"
                      : "rgba(255,255,255,0.02)",
                    color: active ? "#60a5fa" : "#cbd5e1",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                    textAlign: "right",
                  }}
                >
                  <span>{section.icon}</span>
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div>
        <ErrorsCard errors={errors} />
        <ReportHeader result={result} />

        <div id="summary">
          <SummaryCard summary={ai.summary} />
        </div>

        <div id="sales">
          <SalesRecommendationCard ai={ai} />
        </div>

        <div id="winchance">
          <WinChanceCard winChance={winChance} ai={ai} />
        </div>

        <div id="brands">
          <BrandStatsCard brandStats={brandStats} ai={ai} />
        </div>

        <div id="commercial-matcher">
          <CommercialMatcherCard commercialMatcher={commercialMatcher} />
        </div>

        <div id="background">
          <BackgroundCheckCard ai={ai} />
        </div>

        <div id="parts">
          <PartsTable parts={parts} ai={ai} />
        </div>

        <div id="stats">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 14,
              marginBottom: 14,
            }}
          >
            <RequestStatsCard requestStats={requestStats} />
            <PurchaseStatsCard purchaseStats={purchaseStats} />
          </div>
        </div>
      </div>
    </div>
  );
}
