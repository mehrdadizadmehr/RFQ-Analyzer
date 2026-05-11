import { bg3, bdr } from "../styles/theme";

export default function Toast({ message }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: bg3,
        border: `1px solid ${bdr}`,
        borderRadius: 10,
        padding: "10px 20px",
        fontSize: 13,
        color: "#e2e8f0",
        zIndex: 9999,
        opacity: message ? 1 : 0,
        transition: "opacity 0.3s",
        pointerEvents: "none",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}
