import { useState } from "react";
import { gemini } from "./gemini.js";

export default function DollarDeployer({ data, netWorth, avgTips }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const liquid = data.liquidCash || data.bankBalance;
  const emergencyGap = Math.max(0, (data.goals?.[0]?.target || 5000) - (data.goals?.[0]?.current || data.bankBalance));
  const flipCapGap = Math.max(0, (data.goals?.[1]?.target || 2000) - (data.goals?.[1]?.current || 0));

  const quickDeploy = (amt) => {
    const a = +amt;
    if (!a || a <= 0) return;
    const buffer = Math.min(a * 0.30, 500);
    const emergency = Math.min(a * 0.20, emergencyGap);
    const flipFund = Math.min(a * 0.25, flipCapGap);
    const invest = a * 0.25;
    const spend = Math.max(0, a - buffer - emergency - flipFund - invest);
    setPlan({ total: a, buffer, emergency, flipFund, invest, spend, reasoning: "Aggressive 30/20/25/25 split: buffer, emergency, flip fuel, invest." });
  };

  const fetchAIPlan = async () => {
    const amt = +(amount || liquid);
    if (!amt) return;
    setLoading(true);
    try {
      const text = await gemini(
        'You are an aggressive financial allocator. Return ONLY a JSON object: {"buffer":number,"emergency":number,"flipFund":number,"invest":number,"spend":number,"reasoning":"one punchy sentence"}. All numbers must sum to the total amount. No markdown.',
        `Allocate $${amt}. Liquid: $${liquid}, net worth: $${Math.round(netWorth)}, emergency gap: $${emergencyGap}, flip capital gap: $${flipCapGap}, avg shift: $${Math.round(avgTips)}, active flips: ${(data.flips||[]).filter(f=>f.status==="listed").length}. Risk: AGGRESSIVE.`,
        500
      );
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setPlan({ total: amt, ...parsed });
    } catch { quickDeploy(amt); }
    setLoading(false);
  };

  const ALLOC = plan ? [
    { label: "LIQUID BUFFER",    value: plan.buffer,    color: "#00ff88", icon: "🏦" },
    { label: "EMERGENCY FUND",   value: plan.emergency, color: "#34d399", icon: "🛡️" },
    { label: "FLIP CAPITAL",     value: plan.flipFund,  color: "#ff8c00", icon: "📦" },
    { label: "INVEST",           value: plan.invest,    color: "#60a5fa", icon: "📈" },
    { label: "GUILT-FREE SPEND", value: plan.spend,     color: "#a78bfa", icon: "🎯" },
  ].filter(a => a.value > 0.5) : [];

  return (
    <div style={{ background: "#0d0d0d", border: "1px solid #ffd70022", borderRadius: 10, marginBottom: 20, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "16px 20px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "#ffd700", fontSize: 11, letterSpacing: 2, fontFamily: "monospace" }}>💰 DOLLAR DEPLOYMENT SYSTEM</div>
          <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>Every dollar gets a job — tap to deploy</div>
        </div>
        <div style={{ color: "#ffd700", fontSize: 16 }}>{open ? "▲" : "▼"}</div>
      </div>
      {open && (
        <div style={{ padding: "0 20px 20px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <button onClick={() => { setAmount(String(Math.round(liquid))); quickDeploy(liquid); }} style={{ background: "#111", border: "1px solid #ffd70044", color: "#ffd700", fontFamily: "monospace", fontSize: 11, padding: "7px 14px", borderRadius: 5, cursor: "pointer" }}>
              Current Liquid ${Math.round(liquid).toLocaleString()}
            </button>
            <button onClick={() => { setAmount(String(Math.round(avgTips))); quickDeploy(avgTips); }} style={{ background: "#111", border: "1px solid #a78bfa44", color: "#a78bfa", fontFamily: "monospace", fontSize: 11, padding: "7px 14px", borderRadius: 5, cursor: "pointer" }}>
              Avg Shift ${Math.round(avgTips)}
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <input type="number" placeholder="Custom amount..." value={amount} onChange={e => setAmount(e.target.value)}
              style={{ flex: 1, background: "#111", border: "1px solid #333", borderRadius: 6, padding: "9px 12px", color: "#e8e8e8", fontFamily: "monospace", fontSize: 13, outline: "none" }} />
            <button onClick={fetchAIPlan} disabled={loading} style={{ background: "none", border: "1px solid #ffd700", color: "#ffd700", fontFamily: "monospace", fontSize: 11, padding: "9px 16px", borderRadius: 6, cursor: "pointer" }}>
              {loading ? "..." : "AI SPLIT"}
            </button>
          </div>
          {plan && (
            <div>
              {plan.reasoning && <div style={{ color: "#555", fontSize: 11, fontFamily: "monospace", marginBottom: 14, fontStyle: "italic" }}>{plan.reasoning}</div>}
              {ALLOC.map((a, i) => {
                const pct = (a.value / plan.total) * 100;
                return (
                  <div key={i} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ color: "#666", fontSize: 10, fontFamily: "monospace" }}>{a.icon} {a.label}</div>
                      <div style={{ color: a.color, fontSize: 12, fontFamily: "monospace", fontWeight: 700 }}>${Math.round(a.value).toLocaleString()} <span style={{ color: "#444", fontWeight: 400 }}>({pct.toFixed(0)}%)</span></div>
                    </div>
                    <div style={{ background: "#1a1a1a", borderRadius: 4, height: 8 }}>
                      <div style={{ background: a.color, width: pct + "%", height: "100%", borderRadius: 4, transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
