import { card, secTitle, bar, textBox, divider, bdr } from "../../styles/theme";

export default function BackgroundCheckCard({ ai }) {
  return (
    <div style={{ ...card, marginBottom: 14 }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        🔎 بک‌گراند چک شرکت
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
          {ai?.backgroundSummary || ai?.customerBackgroundCheck || "—"}
        </div>

        {!!ai?.customerBackgroundCheck && (
          <>
            <div style={divider} />

            <div>
              <strong>تحلیل تکمیلی:</strong>
              <br />
              {ai.customerBackgroundCheck}
            </div>
          </>
        )}

        {!!ai?.backgroundCheckOnline && (
          <>
            <div style={divider} />

            <div>
              <strong>اطلاعات تخمینی آنلاین شرکت:</strong>

              <div style={{ marginTop: 10 }}>
                <div>
                  نوع شرکت:
                  <strong style={{ marginRight: 6 }}>
                    {ai.backgroundCheckOnline.companyType || "نامشخص"}
                  </strong>
                </div>

                <div>
                  حوزه فعالیت:
                  <strong style={{ marginRight: 6 }}>
                    {ai.backgroundCheckOnline.industry || "نامشخص"}
                  </strong>
                </div>

                <div>
                  منطقه جغرافیایی:
                  <strong style={{ marginRight: 6 }}>
                    {ai.backgroundCheckOnline.geography || "نامشخص"}
                  </strong>
                </div>

                <div>
                  اندازه تقریبی شرکت:
                  <strong style={{ marginRight: 6 }}>
                    {ai.backgroundCheckOnline.estimatedSize || "نامشخص"}
                  </strong>
                </div>

                <div>
                  سطح اطمینان:
                  <strong style={{ marginRight: 6 }}>
                    {ai.backgroundCheckOnline.confidence || "low"}
                  </strong>
                </div>
              </div>
            </div>

            {!!ai?.backgroundCheckOnline?.onlineSignals?.length && (
              <>
                <div style={divider} />

                <div>
                  <strong>سیگنال‌های شناسایی‌شده:</strong>

                  <div style={{ marginTop: 10 }}>
                    {ai.backgroundCheckOnline.onlineSignals.map((signal, i) => (
                      <div
                        key={i}
                        style={{
                          marginBottom: 8,
                          padding: 10,
                          border: `1px solid ${bdr}`,
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.02)",
                        }}
                      >
                        {signal}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
