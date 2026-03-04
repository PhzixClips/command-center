import { useState, useEffect, useCallback } from "react";
import { gemini } from "./gemini.js";
import parseJSON from "./parseJSON.js";
import useGeminiCooldown from "./useGeminiCooldown.js";

export default function DailyCard({ data, netWorth, avgTips, stockValue }) {
  const [card, setCard] = useState(null);
  const [error, setError] = useState(null);

  const doFetch = useCallback(async () => {
    setError(null);
    const liquid = data.liquidCash || data.bankBalance;
    const upcoming = (data.schedule || []).filter(s => !s.logged);
    const nextShift = upcoming[0];
    const flipsPending = (data.flips || []).filter(f => f.status === "listed").length;
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    try {
      const text = await gemini(
        'You are a razor-sharp daily financial coach. Return a JSON object with these exact fields: {"priority":"single most important action today in 8 words or less","reason":"one punchy sentence WHY","category":"HUSTLE or INVEST or FLIP or SAVE or REST","urgency":"NOW or TODAY or THIS WEEK","bonus":"one extra edge tip in 10 words or less"}',
        `Today: ${today}. Liquid: $${liquid}. Net worth: $${Math.round(netWorth)}. Portfolio: $${Math.round(stockValue)}. Next shift: ${nextShift ? nextShift.date + " " + nextShift.time : "none"}. Active flips: ${flipsPending}. Avg tips/shift: $${Math.round(avgTips)}. Shifts logged: ${data.shifts.length}. Emergency fund: $${data.goals?.[0]?.current || 0}/$${data.goals?.[0]?.target || 5000}. Risk: AGGRESSIVE.`,
        800, false, true
      );
      const parsed = parseJSON(text, "object");
      if (!parsed || !parsed.priority) throw new Error(`Model returned unusable data: ${(text || "").slice(0, 80) || "(empty)"}`);
      setCard(parsed);
    } catch (err) {
      setError(err.message || "AI unavailable");
    }
  }, [data, netWorth, avgTips, stockValue]);

  const { execute: fetchCard, loading, onCooldown, cooldownLeft } = useGeminiCooldown(doFetch, 15000);

  useEffect(() => { fetchCard(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const CAT_COLOR = { HUSTLE: "#a78bfa", INVEST: "#60a5fa", FLIP: "#ff8c00", SAVE: "#34d399", REST: "#555" };
  const URG_COLOR = { NOW: "#ff3b3b", TODAY: "#ffd700", "THIS WEEK": "#00ff88" };
  const color = card ? (CAT_COLOR[card.category] || "#00ff88") : "#00ff88";

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "20px 22px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}66, transparent 70%)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9, letterSpacing: 2, fontWeight: 500 }}>
          TODAY'S MOVE · {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {card && <span style={{ color: URG_COLOR[card.urgency] || "#ffd700", fontSize: 9, background: `${(URG_COLOR[card.urgency] || "#ffd700")}15`, border: `1px solid ${(URG_COLOR[card.urgency] || "#ffd700")}33`, padding: "2px 8px", borderRadius: 8 }}>{card.urgency}</span>}
          {card && <span style={{ color, fontSize: 9, background: `${color}15`, border: `1px solid ${color}33`, padding: "2px 8px", borderRadius: 8 }}>{card.category}</span>}
        </div>
      </div>
      {loading ? (
        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, letterSpacing: 2 }}>CALCULATING YOUR EDGE...</div>
      ) : error ? (
        <div style={{ color: "#ff3b3b", fontSize: 11 }}>⚠ {error}</div>
      ) : card ? (
        <>
          <div style={{ color: color, fontSize: 20, fontWeight: 700, lineHeight: 1.3, marginBottom: 10 }}>{card.priority}</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{card.reason}</div>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start", border: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ color: "#ffd700", fontSize: 11 }}>💡</span>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{card.bonus}</span>
          </div>
        </>
      ) : null}
      <button onClick={fetchCard} disabled={loading || onCooldown} aria-label="Refresh daily card" style={{ position: "absolute", bottom: 14, right: 18, background: "none", border: "none", color: (loading || onCooldown) ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)", fontSize: 10, cursor: (loading || onCooldown) ? "not-allowed" : "pointer", letterSpacing: 1, transition: "color 0.2s" }} onMouseEnter={e => { if (!loading && !onCooldown) e.target.style.color = "rgba(255,255,255,0.4)"; }} onMouseLeave={e => e.target.style.color = (loading || onCooldown) ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.15)"}>{loading ? "..." : onCooldown ? `${cooldownLeft}s` : "REFRESH ↻"}</button>
    </div>
  );
}
