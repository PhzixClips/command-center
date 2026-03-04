import { useState } from "react";

const RISK_COLOR = { LOW: "#00ff88", MED: "#ffd700", "MED-HIGH": "#ff8c00", HIGH: "#ff3b3b" };

export default function OpportunityCard({ opp, onStartFlip }) {
  const [open, setOpen] = useState(false);
  const accentColor = "#ffd700";
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: open ? `1px solid ${accentColor}33` : "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "14px 18px", cursor: "pointer", transition: "border-color 0.2s" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>{opp.type}</span>
          <div style={{ color: "#e8e8e8", fontWeight: 600, fontSize: 14, marginTop: 2 }}>{opp.title}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#00ff88", fontWeight: 700, fontSize: 16 }}>{opp.roi}</div>
          <div style={{ fontSize: 10, color: RISK_COLOR[opp.risk] || "#ffd700" }}>⚡ {opp.risk}</div>
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
          <p style={{ color: "#aaa", fontSize: 12, lineHeight: 1.6, margin: "0 0 10px" }}>{opp.detail}</p>
          <div style={{ display: "flex", gap: 24, marginBottom: 12 }}>
            <div><div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 500 }}>CAPITAL NEEDED</div><div style={{ color: "#ffd700" }}>${opp.capital.toLocaleString()}</div></div>
            <div><div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 500 }}>TIMEFRAME</div><div style={{ color: "#ffd700" }}>{opp.timeframe}</div></div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 14px", marginBottom: 12 }}>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 500, marginBottom: 4 }}>▶ ACTION PLAN</div>
            <div style={{ color: "#00ff88", fontSize: 12, lineHeight: 1.6 }}>{opp.action}</div>
          </div>
          {onStartFlip && (
            <button
              onClick={(e) => { e.stopPropagation(); onStartFlip(opp); }}
              style={{ background: "#ff8c0012", border: "1px solid #ff8c0044", color: "#ff8c00", fontSize: 10, padding: "7px 16px", borderRadius: 12, cursor: "pointer", letterSpacing: 1, width: "100%" }}>
              📦 START THIS FLIP
            </button>
          )}
        </div>
      )}
    </div>
  );
}
