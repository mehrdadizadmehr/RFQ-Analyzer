export default function SBadge({ status }) {
  const m = {
    active: {
      bg: "rgba(16,185,129,0.15)",
      color: "#34d399",
      label: "Active",
    },
    eol: {
      bg: "rgba(239,68,68,0.15)",
      color: "#f87171",
      label: "EOL",
    },
    warning: {
      bg: "rgba(245,158,11,0.15)",
      color: "#fbbf24",
      label: "Check",
    },
    unknown: {
      bg: "rgba(148,163,184,0.15)",
      color: "#94a3b8",
      label: "Unknown",
    },
  };

  const s = m[status] || m.unknown;

  return (
    <span style={{
      fontSize: 10,
      padding: "2px 8px",
      borderRadius: 20,
      fontWeight: 600,
      background: s.bg,
      color: s.color,
    }}>
      {s.label}
    </span>
  );
}
