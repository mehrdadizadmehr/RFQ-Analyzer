import { card, secTitle, bar, textBox } from "../../styles/theme";
import { AI_PROVIDERS } from "../../constants/providers";

export default function ErrorsCard({ errors }) {
  if (!errors || Object.keys(errors).length === 0) return null;

  return (
    <div style={{ ...card, borderRight: "4px solid #ef4444" }}>
      <div style={{ ...secTitle, marginBottom: 10 }}>
        <div style={bar} />
        خطاهای مدل‌ها
      </div>

      <div style={textBox}>
        {Object.entries(errors).map(([key, msg]) => (
          <div key={key}>
            {AI_PROVIDERS[key]?.label || key}: {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
