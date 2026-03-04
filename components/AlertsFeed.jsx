import { useState, useCallback } from "react";
import { gemini } from "./gemini.js";
import parseJSON from "./parseJSON.js";
import useGeminiCooldown from "./useGeminiCooldown.js";

const TYPE_COLOR = { SNEAKER: "#ff8c00", TICKET: "#a78bfa", FLIP: "#ffd700", INVEST: "#60a5fa" };
const URG_COLOR  = { HOT: "#ff6b6b", WARM: "#ffd700", WATCH: "rgba(255,255,255,0.35)" };

const SYSTEM = 'You are a real-time opportunity scout. Return ONLY a raw JSON array of 4 objects — no markdown, no code fences, no explanation before or after: [{"type":"SNEAKER or TICKET or FLIP or INVEST","title":"specific name","action":"exact next step in 10 words or less","window":"time window","est_roi":"+XX%","capital":number,"urgency":"HOT or WARM or WATCH"}]';

export default function AlertsFeed({ liquid, onStartFlip }) {
  const [alerts,    setAlerts]    = useState(null);
  const [error,     setError]     = useState(null);
  const [open,      setOpen]      = useState(false);
  const [scannedAt, setScannedAt] = useState(null);

  const doFetch = useCallback(async () => {
    setError(null);
    setOpen(true);
    const userMsg = `Top 4 money opportunities RIGHT NOW for ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. I have $${Math.round(liquid)} liquid. I flip sneakers, event tickets, and electronics on eBay/StubHub. Find real specific current drops, restocks, and events happening this week.`;
    try {
      // First attempt: live web search
      let text = await gemini(SYSTEM, userMsg, 1200, true);
      let parsed = parseJSON(text, "array");

      // If search response didn't parse (citation text can corrupt JSON), retry without search
      if (!parsed || !Array.isArray(parsed) || !parsed.length) {
        text   = await gemini(SYSTEM, userMsg, 1200, false);
        parsed = parseJSON(text, "array");
      }

      if (parsed && Array.isArray(parsed) && parsed.length) {
        setAlerts(parsed.slice(0, 4));
        setScannedAt(new Date());
        setError(null);
      } else {
        setAlerts(null);
        setError("Could not parse opportunities — try again.");
      }
    } catch (err) {
      setError(err.message || "API error — check key or billing.");
      setAlerts(null);
    }
  }, [liquid]);

  const { execute: fetchAlerts, loading, onCooldown, cooldownLeft } = useGeminiCooldown(doFetch, 20000);
  const isDisabled = loading || onCooldown;

  const accentColor = "#ff6b6b";

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, marginBottom: 20, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: accentColor, fontSize: 11, letterSpacing: 2, fontWeight: 600 }}>LIVE OPPORTUNITY ALERTS</div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 500, marginTop: 4 }}>
            {scannedAt
              ? `Last scanned ${scannedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
              : "Web-searched drops, flips & plays — updated live"}
          </div>
        </div>
        <button onClick={fetchAlerts} disabled={isDisabled}
          aria-label="Scan for opportunities"
          style={{ background: isDisabled ? "rgba(255,255,255,0.04)" : `${accentColor}12`, border: `1px solid ${accentColor}44`, color: isDisabled ? "rgba(255,255,255,0.2)" : accentColor, fontSize: 10, fontWeight: 500, padding: "7px 14px", borderRadius: 12, cursor: isDisabled ? "not-allowed" : "pointer", letterSpacing: 1, opacity: isDisabled ? 0.6 : 1 }}>
          {loading ? "SCANNING WEB..." : onCooldown ? `WAIT ${cooldownLeft}s` : "SCAN NOW"}
        </button>
      </div>
      {open && error && (
        <div style={{ padding: "0 20px 16px", color: accentColor, fontSize: 11 }}>{error}</div>
      )}
      {open && !alerts && !error && !loading && (
        <div style={{ padding: "0 20px 20px", color: "rgba(255,255,255,0.35)", fontSize: 12 }}>No results yet — hit SCAN NOW.</div>
      )}
      {open && alerts && (
        <div style={{ padding: "0 20px 20px", display: "grid", gap: 10 }}>
          {alerts.map((a, i) => {
            const tc = TYPE_COLOR[a.type] || "#00ff88";
            const uc = URG_COLOR[a.urgency] || "rgba(255,255,255,0.35)";
            return (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ color: tc, fontSize: 9, fontWeight: 500, background: `${tc}15`, border: `1px solid ${tc}33`, padding: "2px 7px", borderRadius: 8 }}>{a.type}</span>
                    <span style={{ color: uc, fontSize: 9, fontWeight: 500 }}>{a.urgency}</span>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ color: "#00ff88", fontSize: 12, fontWeight: 700 }}>{a.est_roi}</span>
                    <span style={{ color: "rgba(255,255,255,0.35)", fontWeight: 500, fontSize: 11 }}>${(a.capital || 0).toLocaleString()}</span>
                  </div>
                </div>
                <div style={{ color: "#e8e8e8", fontWeight: 600, fontSize: 13, marginBottom: 5 }}>{a.title}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ color: "#00ff88", fontSize: 11 }}>{a.action}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 500 }}>{a.window}</div>
                </div>
                {onStartFlip && (a.type === "FLIP" || a.type === "SNEAKER" || a.type === "TICKET") && (
                  <button
                    onClick={() => onStartFlip({ title: a.title, capital: a.capital || 0 })}
                    style={{ marginTop: 10, background: `${tc}12`, border: `1px solid ${tc}44`, color: tc, fontSize: 9, fontWeight: 500, padding: "5px 12px", borderRadius: 12, cursor: "pointer", letterSpacing: 1, width: "100%" }}>
                    START THIS FLIP
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
