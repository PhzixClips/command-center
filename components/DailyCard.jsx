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
        'You are a razor-sharp daily financial coach. Return a JSON object with these exact fields: {"priority":"single most important action today in 8 words or less","reason":"one punchy sentence WHY this matters for their financial trajectory","category":"HUSTLE or INVEST or FLIP or SAVE or REST","urgency":"NOW or TODAY or THIS WEEK","confidence":"percentage 0-100 of how confident you are this is the right move","bonus":"one extra edge tip in 10 words or less"}',
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

  const CAT_COLOR = { HUSTLE: "#00e676", INVEST: "#60a5fa", FLIP: "#00e676", SAVE: "#00e676", REST: "#60a5fa" };
  const color = card ? (CAT_COLOR[card.category] || "#00e676") : "#00e676";
  const confidence = card?.confidence ? String(card.confidence).replace("%", "") : null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 20,
      padding: "22px 24px",
      marginBottom: 28,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}55, transparent 60%)` }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>⚡</span>
          <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Today's Move</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {card && <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: 8 }}>{card.category}</span>}
        </div>
      </div>

      {loading ? (
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, letterSpacing: 2, padding: "8px 0" }}>CALCULATING YOUR EDGE...</div>
      ) : error ? (
        <div style={{ color: "#ff3b3b", fontSize: 11 }}>{error}</div>
      ) : card ? (
        <>
          <div style={{ color: color, fontSize: 22, fontWeight: 700, lineHeight: 1.3, marginBottom: 12 }}>{card.priority}</div>
          <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>
            {card.reason}
          </div>

          {/* Confidence + Bonus row */}
          <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
            {confidence && (
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12, padding: "10px 16px",
                minWidth: 72, textAlign: "center",
              }}>
                <div style={{ color: color, fontSize: 20, fontWeight: 800 }}>{confidence}%</div>
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, marginTop: 2 }}>confidence</div>
              </div>
            )}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, padding: "10px 14px",
              flex: 1, display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, lineHeight: 1.5 }}>{card.bonus}</span>
            </div>
          </div>
        </>
      ) : null}

      <button onClick={fetchCard} disabled={loading || onCooldown} aria-label="Refresh daily card" style={{
        position: "absolute", bottom: 16, right: 20,
        background: "none", border: "none",
        color: (loading || onCooldown) ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)",
        fontSize: 10, cursor: (loading || onCooldown) ? "not-allowed" : "pointer",
        letterSpacing: 1, transition: "color 0.2s",
      }} onMouseEnter={e => { if (!loading && !onCooldown) e.target.style.color = "rgba(255,255,255,0.35)"; }} onMouseLeave={e => e.target.style.color = (loading || onCooldown) ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.12)"}>
        {loading ? "..." : onCooldown ? `${cooldownLeft}s` : "REFRESH"}
      </button>
    </div>
  );
}
