import { useState } from "react";

const RISK_COLOR = { LOW: "#00ff88", MED: "#ffd700", "MED-HIGH": "#ff8c00", HIGH: "#ff3b3b" };

export default function OpportunityCard({ opp }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "14px 18px", cursor: "pointer", transition: "border-color 0.2s", borderColor: open ? "#ffd700" : "#1a1a1a" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#666" }}>{opp.type}</span>
          <div style={{ color: "#e8e8e8", fontWeight: 600, fontSize: 14, marginTop: 2 }}>{opp.title}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#00ff88", fontFamily: "monospace", fontWeight: 700, fontSize: 16 }}>{opp.roi}</div>
          <div style={{ fontSize: 10, color: RISK_COLOR[opp.risk] || "#ffd700", fontFamily: "monospace" }}>⚡ {opp.risk}</div>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 12, borderTop: "1px solid #1a1a1a", paddingTop: 12 }}>
          <p style={{ color: "#aaa", fontSize: 12, lineHeight: 1.6, fontFamily: "monospace" }}>{opp.detail}</p>
          <div style={{ display: "flex", gap: 24, marginTop: 10 }}>
            <div><div style={{ color: "#555", fontSize: 10, fontFamily: "monospace" }}>CAPITAL NEEDED</div><div style={{ color: "#ffd700", fontFamily: "monospace" }}>${opp.capital.toLocaleString()}</div></div>
            <div><div style={{ color: "#555", fontSize: 10, fontFamily: "monospace" }}>TIMEFRAME</div><div style={{ color: "#ffd700", fontFamily: "monospace" }}>{opp.timeframe}</div></div>
          </div>
          <div style={{ marginTop: 12, background: "#111", borderRadius: 6, padding: "10px 14px" }}>
            <div style={{ color: "#555", fontSize: 10, fontFamily: "monospace", marginBottom: 4 }}>▶ ACTION PLAN</div>
            <div style={{ color: "#00ff88", fontSize: 12, fontFamily: "monospace", lineHeight: 1.6 }}>{opp.action}</div>
          </div>
        </div>
      )}
    </div>
  );
}
