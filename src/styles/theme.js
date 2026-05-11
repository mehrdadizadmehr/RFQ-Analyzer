export const bg = "#0f1117";
export const bg2 = "#161b27";
export const bg3 = "#1e2538";
export const bdr = "#2a3148";

export const card = {
  background: bg2,
  border: `1px solid ${bdr}`,
  borderRadius: 14,
  padding: 20,
  marginBottom: 16,
};

export const inp = {
  width: "100%",
  background: bg3,
  border: `1px solid ${bdr}`,
  borderRadius: 8,
  padding: "9px 12px",
  color: "#e2e8f0",
  fontFamily: "inherit",
  fontSize: 13,
  outline: "none",
  direction: "ltr",
};

export const lbl = {
  fontSize: 12,
  color: "#64748b",
  marginBottom: 5,
  display: "block",
};

export const bar = {
  width: 3,
  height: 14,
  background: "#3b82f6",
  borderRadius: 2,
  flexShrink: 0,
};

export const secTitle = {
  fontSize: 12,
  fontWeight: 700,
  color: "#94a3b8",
  letterSpacing: "0.08em",
  marginBottom: 14,
  display: "flex",
  alignItems: "center",
  gap: 8,
};

export const btn = v => ({
  padding: "9px 18px",
  borderRadius: 8,
  border: v === "primary" ? "none" : `1px solid ${bdr}`,
  background: v === "primary" ? "#3b82f6" : bg3,
  color: v === "primary" ? "#fff" : "#94a3b8",
  fontFamily: "inherit",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
});

export const mRow = {
  display: "flex",
  justifyContent: "space-between",
  padding: "7px 0",
  borderBottom: `1px solid ${bdr}`,
  fontSize: 13,
  gap: 12,
};

export const th = {
  background: bg3,
  padding: "9px 10px",
  textAlign: "right",
  fontWeight: 600,
  fontSize: 11,
  color: "#64748b",
  borderBottom: `1px solid ${bdr}`,
};

export const td = {
  padding: "9px 10px",
  borderBottom: `1px solid ${bg3}`,
  color: "#e2e8f0",
  verticalAlign: "top",
  lineHeight: 1.5,
  fontSize: 12,
};

export const textBox = {
  background: bg3,
  border: `1px solid ${bdr}`,
  borderRadius: 10,
  padding: 14,
  fontSize: 13,
  lineHeight: 1.9,
  color: "#94a3b8",
  textAlign: "right",
  direction: "rtl",
  unicodeBidi: "plaintext",
};

export const divider = {
  borderTop: `1px solid ${bdr}`,
  margin: "10px 0",
};
