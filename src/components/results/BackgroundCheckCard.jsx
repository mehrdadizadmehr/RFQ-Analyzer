import { card, secTitle, bar, textBox, divider, bdr } from "../../styles/theme";

export default function BackgroundCheckCard({ ai }) {
  const online = ai?.backgroundCheckOnline;
  const onlineAvailable = online?.onlineAvailable === true;
  const onlineStatusText = ai?.onlineDataStatus ||
    (onlineAvailable
      ? "اطلاعات آنلاین دریافت و در تحلیل لحاظ شده است."
      : "اطلاعات آنلاین قابل دریافت نیست؛ تحلیل بر اساس متن RFQ و سیگنال‌های موجود انجام شده است.");

  const renderSourceLinks = (title, items) => {
    if (!Array.isArray(items) || items.length === 0) return null;

    return (
      <>
        <div style={divider} />

        <div>
          <strong>{title}</strong>

          <div style={{ marginTop: 10 }}>
            {items.map((item, i) => (
              <div
                key={`${item.url || item.title || title}-${i}`}
                style={{
                  marginBottom: 10,
                  padding: 10,
                  border: `1px solid ${bdr}`,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#60a5fa", textDecoration: "none" }}
                  >
                    {item.title || item.url || "لینک"}
                  </a>
                </div>

                {!!item.reason && (
                  <div style={{ marginTop: 6, color: "#94a3b8" }}>
                    {item.reason}
                  </div>
                )}

                {!!item.url && (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: "#64748b",
                      direction: "ltr",
                      textAlign: "left",
                      wordBreak: "break-all",
                    }}
                  >
                    {item.url}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  };

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

        {!!online && (
          <>
            <div style={divider} />

            <div>
              <strong>{onlineAvailable ? "اطلاعات آنلاین شرکت:" : "اطلاعات تخمینی شرکت:"}</strong>

              <div
                style={{
                  marginTop: 8,
                  marginBottom: 10,
                  display: "inline-block",
                  padding: "3px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  background: onlineAvailable
                    ? "rgba(16,185,129,0.15)"
                    : "rgba(245,158,11,0.15)",
                  color: onlineAvailable ? "#34d399" : "#fbbf24",
                }}
              >
                {onlineAvailable ? "Online data available" : "Online data unavailable"}
              </div>

              <div style={{ color: "#94a3b8", marginBottom: 8 }}>
                {onlineStatusText}
              </div>

              <div style={{ marginTop: 10 }}>
                <div>
                  نوع شرکت:
                  <strong style={{ marginRight: 6 }}>
                    {online.companyType || "نامشخص"}
                  </strong>
                </div>

                <div>
                  حوزه فعالیت:
                  <strong style={{ marginRight: 6 }}>
                    {online.industry || "نامشخص"}
                  </strong>
                </div>

                <div>
                  منطقه جغرافیایی:
                  <strong style={{ marginRight: 6 }}>
                    {online.geography || "نامشخص"}
                  </strong>
                </div>

                <div>
                  اندازه تقریبی شرکت:
                  <strong style={{ marginRight: 6 }}>
                    {online.estimatedSize || "نامشخص"}
                  </strong>
                </div>

                <div>
                  سطح اطمینان:
                  <strong style={{ marginRight: 6 }}>
                    {online.confidence || "low"}
                  </strong>
                </div>
              </div>

              {renderSourceLinks(
                "وب‌سایت‌های احتمالی:",
                online?.officialWebsiteCandidates
              )}

              {renderSourceLinks(
                "LinkedIn احتمالی:",
                online?.linkedinCandidates
              )}

              {renderSourceLinks(
                "سایر منابع آنلاین:",
                online?.otherSourceCandidates
              )}

              {!!online?.onlineSignals?.length && (
                <>
                  <div style={divider} />

                  <div>
                    <strong>{onlineAvailable ? "سیگنال‌های آنلاین شناسایی‌شده:" : "سیگنال‌های استخراج‌شده از متن RFQ:"}</strong>

                    <div style={{ marginTop: 10 }}>
                      {online.onlineSignals.map((signal, i) => (
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
