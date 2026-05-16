import { card, secTitle, bar, textBox, divider } from "../../styles/theme";

export default function SalesRecommendationCard({ ai }) {
  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        💡 توصیه تیم فروش
      </div>

      <div
        style={{
          ...textBox,
          textAlign: "right",
          direction: "rtl",
          unicodeBidi: "plaintext",
          lineHeight: 2,
          whiteSpace: "pre-line",
        }}
      >
        <div>
          <strong>توصیه:</strong>
          <br />
          {ai?.recommendation || "—"}
        </div>

        {(ai?.recommendedMarginRange ||
          ai?.recommendedMarginReason ||
          ai?.recommendedMarginStrategy) && (
          <>
            <div style={divider} />

            <div>
              <strong>حاشیه سود پیشنهادی:</strong>
              <br />
              {ai?.recommendedMarginRange || "—"}
            </div>

            <div style={{ marginTop: 10 }}>
              <strong>دلیل پیشنهاد Margin:</strong>
              <br />
              {ai?.recommendedMarginReason || "—"}
            </div>

            {!!ai?.recommendedMarginStrategy && (
              <>
                <div style={{ marginTop: 14 }}>
                  <strong>استراتژی Margin:</strong>
                </div>

                <div style={{ marginTop: 10 }}>
                  <strong>حداقل Margin قابل قبول:</strong>
                  <br />
                  {
                    ai?.recommendedMarginStrategy
                      ?.minimumAcceptableMargin || "—"
                  }
                </div>

                <div style={{ marginTop: 10 }}>
                  <strong>Target Margin:</strong>
                  <br />
                  {
                    ai?.recommendedMarginStrategy
                      ?.targetMargin || "—"
                  }
                </div>

                <div style={{ marginTop: 10 }}>
                  <strong>Stretch Margin:</strong>
                  <br />
                  {
                    ai?.recommendedMarginStrategy
                      ?.stretchMargin || "—"
                  }
                </div>

                <div style={{ marginTop: 10 }}>
                  <strong>منطق تجاری Margin:</strong>
                  <br />
                  {
                    ai?.recommendedMarginStrategy
                      ?.reasoning || "—"
                  }
                </div>

                <div style={{ marginTop: 10 }}>
                  <strong>نکته مذاکره:</strong>
                  <br />
                  {
                    ai?.recommendedMarginStrategy
                      ?.negotiationNote || "—"
                  }
                </div>
              </>
            )}
          </>
        )}

        <div style={divider} />

        <div>
          <strong>ریسک‌ها:</strong>
          <br />
          {ai?.risks || "—"}
        </div>

        <div style={divider} />

        <div>
          <strong>اقدام بعدی:</strong>
          <br />
          {ai?.nextStep || "—"}
        </div>
      </div>
    </div>
  );
}
