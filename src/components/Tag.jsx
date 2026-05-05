export default function Tag({ color, children }) {
  const c = {
    blue: { background: "rgba(59,130,246,0.15)", color: "#60a5fa" },
    green: { background: "rgba(16,185,129,0.15)", color: "#34d399" },
    yellow: { background: "rgba(245,158,11,0.15)", color: "#fbbf24" },
    red: { background: "rgba(239,68,68,0.15)", color: "#f87171" },
  };

  return (
    <span style={{
      fontSize: 11,
      padding: "3px 10px",
      borderRadius: 20,
      fontWeight: 600,
      ...(c[color] || c.blue),
    }}>
      {children}
    </span>
  );
}
