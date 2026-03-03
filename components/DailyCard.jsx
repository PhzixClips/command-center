import { useState, useEffect } from "react";
import { gemini } from "./gemini.js";

export default function DailyCard({ data, netWorth, avgTips, stockValue }) {
  const [card, setCard] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCard = async () => {
    setLoading(true);
    setError(null);
    const liquid = data.liquidCash || data.bankBalance;
    const upcoming = (data.schedule || []).filter(s => !s.logged);
    const nextShift = upcoming[0];
    const flipsPending = (data.flips || []).filter(f => f.status === "listed").length;
    const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    try {
      const text = await gemini(
        'You are a razor-sharp daily financial coach. Return ONLY a JSON object with these exact fields: {"priority":"single most important action today in 8 words or less","reason":"one punchy sentence WHY","category":"HUSTLE or INVEST or FLIP or SAVE or REST","urgency":"NOW or TODAY or THIS WEEK","bonus":"one extra edge tip in 10 words or less"}. Return ONLY the JSON.',
        `Today: ${today}. Liquid: $${liquid}. Net worth: $${Math.round(netWorth)}. Portfolio: $${Math.round(stockValue)}. Next shift: ${nextShift ? nextShift.date + " " + nextShift.time : "none"}. Active flips: ${flipsPending}. Avg tips/shift: $${Math.round(avgTips)}. Shifts logged: ${data.shifts.length}. Emergency fund: $${data.goals?.[0]?.current || 0}/$${data.goals?.[0]?.target || 5000}. Risk: AGGRESSIVE.`,
        400
      );
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setCard(parsed);
    } catch (err) {
      setError(err.message || "AI unavailable");
    }
    setLoading(false);
  };

  useEffect(() => { fetchCard(); }, []);

  const CAT_COLOR = { HUSTLE: "#a78bfa", INVEST: "#60a5fa", FLIP: "#ff8c00", SAVE: "#34d399", REST: "#555" };
  const URG_COLOR = { NOW: "#ff3b3b", TODAY: "#ffd700", "THIS WEEK": "#00ff88" };
  const color = card ? (CAT_COLOR[card.category] || "#00ff88") : "#00ff88";

  return (
    <div style={{ background: "#0a0a0a", border: `1px solid ${color}44`, borderRadius: 12, padding: "20px 22px", marginBottom: 20, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, fontFamily: "monospace" }}>
          ⚡ TODAY'S MOVE · {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {card && <span style={{ color: URG_COLOR[card.urgency] || "#ffd700", fontSize: 9, fontFamily: "monospace", border: `1px solid ${URG_COLOR[card.urgency] || "#ffd700"}44`, padding: "2px 8px", borderRadius: 3 }}>{card.urgency}</span>}
          {card && <span style={{ color, fontSize: 9, fontFamily: "monospace", border: `1px solid ${color}44`, padding: "2px 8px", borderRadius: 3 }}>{card.category}</span>}
        </div>
      </div>
      {loading ? (
        <div style={{ color: "#333", fontFamily: "monospace", fontSize: 13, letterSpacing: 2 }}>CALCULATING YOUR EDGE...</div>
      ) : error ? (
        <div style={{ color: "#ff3b3b", fontFamily: "monospace", fontSize: 11 }}>⚠ {error}</div>
      ) : card ? (
        <>
          <div style={{ color: color, fontSize: 20, fontWeight: 700, fontFamily: "monospace", lineHeight: 1.3, marginBottom: 10 }}>{card.priority}</div>
          <div style={{ color: "#aaa", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{card.reason}</div>
          <div style={{ background: "#111", borderRadius: 6, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: "#ffd700", fontSize: 11 }}>💡</span>
            <span style={{ color: "#777", fontSize: 11, fontFamily: "monospace" }}>{card.bonus}</span>
          </div>
        </>
      ) : null}
      <button onClick={fetchCard} style={{ position: "absolute", bottom: 14, right: 18, background: "none", border: "none", color: "#333", fontSize: 10, fontFamily: "monospace", cursor: "pointer", letterSpacing: 1 }}>REFRESH ↻</button>
    </div>
  );
}
