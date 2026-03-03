import { useState } from "react";

const RISK_COLOR = { LOW: "#00ff88", MED: "#ffd700", "MED-HIGH": "#ff8c00", HIGH: "#ff3b3b" };

export default function OpportunityCard({ opp, onStartFlip }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "14px 18px", cursor: "pointer", transition: "border-color 0.2s", borderColor: open ? "#ffd700" : "#1a1a1a" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
          <p style={{ color: "#aaa", fontSize: 12, lineHeight: 1.6, fontFamily: "monospace", margin: "0 0 10px" }}>{opp.detail}</p>
          <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
            <div><div style={{ color: "#555", fontSize: 10, fontFamily: "monospace" }}>CAPITAL NEEDED</div><div style={{ color: "#ffd700", fontFamily: "monospace" }}>${opp.capital.toLocaleString()}</div></div>
            <div><div style={{ color: "#555", fontSize: 10, fontFamily: "monospace" }}>TIMEFRAME</div><div style={{ color: "#ffd700", fontFamily: "monospace" }}>{opp.timeframe}</div></div>
          </div>
          <div style={{ background: "#111", borderRadius: 6, padding: "10px 14px", marginBottom: 12 }}>
            <div style={{ color: "#555", fontSize: 10, fontFamily: "monospace", marginBottom: 4 }}>▶ ACTION PLAN</div>
            <div style={{ color: "#00ff88", fontSize: 12, fontFamily: "monospace", lineHeight: 1.6 }}>{opp.action}</div>
          </div>
          {onStartFlip && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartFlip(opp); }}
              style={{ background: "#ff8c0018", border: "1px solid #ff8c00", color: "#ff8c00", fontFamily: "monospace", fontSize: 10, padding: "7px 16px", borderRadius: 5, cursor: "pointer", letterSpacing: 1, width: "100%" }}>
              📦 START THIS FLIP
            </button>
          )}
        </div>
      )}
    </div>
  );
}
