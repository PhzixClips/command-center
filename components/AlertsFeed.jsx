import { useState } from "react";
import { gemini } from "./gemini.js";

const FALLBACK_ALERTS = [
  { type: "SNEAKER", title: "Nike SNKRS Weekly Drop",        action: "Check SNKRS app 10am ET daily",        window: "Daily",        est_roi: "+80%",  capital: 180, urgency: "HOT"   },
  { type: "TICKET",  title: "Spring Concert Season",         action: "Buy floor tickets day-of-sale on TM", window: "This weekend", est_roi: "+120%", capital: 300, urgency: "WARM"  },
  { type: "FLIP",    title: "RTX 5080 GPU Restock",          action: "Set NowInStock alerts immediately",    window: "3 days",       est_roi: "+45%",  capital: 999, urgency: "WATCH" },
  { type: "FLIP",    title: "Spring eBay Electronics Surge", action: "List used electronics & headphones now", window: "This week", est_roi: "+60%",  capital: 50,  urgency: "WARM"  },
];

const TYPE_COLOR = { SNEAKER: "#ff8c00", TICKET: "#a78bfa", FLIP: "#ffd700", INVEST: "#60a5fa" };
const URG_COLOR  = { HOT: "#ff3b3b", WARM: "#ffd700", WATCH: "#555" };

export default function AlertsFeed({ liquid, onStartFlip }) {
  const [alerts,  setAlerts]  = useState(null);
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    setOpen(true);
    try {
      const text = await gemini(
        'You are a real-time opportunity scout. Return ONLY a JSON array of 4 objects: [{"type":"SNEAKER or TICKET or FLIP or INVEST","title":"specific name","action":"exact step in 10 words","window":"time window","est_roi":"+XX%","capital":number,"urgency":"HOT or WARM or WATCH"}]. Return ONLY the JSON array, no markdown.',
        `Top 4 money opportunities RIGHT NOW ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}. I have $${Math.round(liquid)} liquid. I flip sneakers, event tickets, electronics on eBay/StubHub. Find real current drops and events this week.`,
        900,
        true
      );
      const match  = text.match(/\[[\s\S]*?\]/);
      const parsed = match ? JSON.parse(match[0]) : [];
      setAlerts(parsed.length ? parsed.slice(0, 4) : null);
      if (!parsed.length) setError("No results parsed — try again.");
    } catch (err) {
      setError(err.message || "API error — check key or billing.");
      setAlerts(null);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "#0d0d0d", border: "1px solid #ff3b3b22", borderRadius: 10, marginBottom: 20, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#ff3b3b", fontSize: 11, letterSpacing: 2, fontFamily: "monospace" }}>🚨 LIVE OPPORTUNITY ALERTS</div>
          <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>Web-searched drops, flips & plays — updated live</div>
        </div>
        <button onClick={fetchAlerts} disabled={loading} style={{ background: loading ? "#111" : "#ff3b3b18", border: "1px solid #ff3b3b", color: "#ff3b3b", fontFamily: "monospace", fontSize: 10, padding: "7px 14px", borderRadius: 5, cursor: "pointer", letterSpacing: 1 }}>
          {loading ? "SCANNING WEB..." : "SCAN NOW"}
        </button>
      </div>
      {open && error && (
        <div style={{ padding: "0 20px 20px", color: "#ff3b3b", fontFamily: "monospace", fontSize: 11 }}>
          ⚠ {error}
        </div>
      )}
      {open && alerts && (
        <div style={{ padding: "0 20px 20px", display: "grid", gap: 10 }}>
          {alerts.map((a, i) => {
            const tc = TYPE_COLOR[a.type] || "#00ff88";
            const uc = URG_COLOR[a.urgency] || "#555";
            return (
              <div key={i} style={{ background: "#111", border: `1px solid ${tc}22`, borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: tc, fontSize: 9, fontFamily: "monospace", border: `1px solid ${tc}44`, padding: "2px 7px", borderRadius: 3 }}>{a.type}</span>
                    <span style={{ color: uc, fontSize: 9, fontFamily: "monospace" }}>● {a.urgency}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ color: "#00ff88", fontFamily: "monospace", fontSize: 12, fontWeight: 700 }}>{a.est_roi}</span>
                    <span style={{ color: "#555", fontFamily: "monospace", fontSize: 11 }}>${(a.capital || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ color: "#e8e8e8", fontWeight: 600, fontSize: 13, marginBottom: 5 }}>{a.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ color: "#00ff88", fontSize: 11, fontFamily: "monospace" }}>▶ {a.action}</div>
                  <div style={{ color: "#444", fontSize: 10, fontFamily: "monospace" }}>{a.window}</div>
                </div>
                {onStartFlip && (a.type === "FLIP" || a.type === "SNEAKER" || a.type === "TICKET") && (
                  <button
                    onClick={() => onStartFlip({ title: a.title, capital: a.capital || 0 })}
                    style={{ marginTop: 10, background: "#ff8c0018", border: "1px solid #ff8c0055", color: "#ff8c00", fontFamily: "monospace", fontSize: 9, padding: "5px 12px", borderRadius: 4, cursor: "pointer", letterSpacing: 1, width: "100%" }}>
                    📦 START THIS FLIP
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
