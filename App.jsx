import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// ── Gemini API helper ─────────────────────────────────────────────────────────
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

const gemini = async (system, userContent, maxTokens = 400, useSearch = false) => {
  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: userContent }] }],
    generationConfig: { maxOutputTokens: maxTokens },
  };
  if (useSearch) body.tools = [{ google_search: {} }];
  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

// ── Persistent storage helpers ────────────────────────────────────────────────
const S = {
  get: async (k) => {
    try {
      if (window.storage) { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : null; }
    } catch {}
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; }
  },
  set: async (k, v) => {
    try {
      if (window.storage) { await window.storage.set(k, JSON.stringify(v)); return; }
    } catch {}
    try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
  },
};

// ── Seed / defaults ───────────────────────────────────────────────────────────
const seedNetWorthHistory = () => {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: 4800 + Math.round(Math.sin(i * 0.4) * 300 + i * 40 + Math.random() * 150),
    };
  });
};

const defaultState = {
  bankBalance: 3256.03,
  liquidCash: 3256.03,
  savings: 25.69,
  stocks: [
    { ticker: "CHPY", name: "Tidal Trust",    shares: 26.09,  buyPrice: 59.48, currentPrice: 59.54 },
    { ticker: "CHPY", name: "Tidal Trust II", shares: 4.987,  buyPrice: 59.48, currentPrice: 59.54 },
    { ticker: "GDXY", name: "Tidal Trust",    shares: 0.165,  buyPrice: 18.24, currentPrice: 18.075 },
    { ticker: "TDAX", name: "ETF Opport.",    shares: 15.486, buyPrice: 22.348, currentPrice: 22.5031 },
  ],
  shifts: [
    { date: "Feb 20", hours: 6, tips: 321.66, wage: 0 },
    { date: "Feb 22", hours: 6, tips: 207.84, wage: 0 },
    { date: "Feb 23", hours: 6, tips: 160.71, wage: 0 },
    { date: "Feb 24", hours: 6, tips: 333.90, wage: 0 },
    { date: "Feb 25", hours: 6, tips: 285.06, wage: 0 },
    { date: "Feb 27", hours: 6, tips: 342.57, wage: 0 },
  ],
  flips: [],
  netWorthHistory: seedNetWorthHistory(),
  schedule: [
    { date: "Mar 2",  day: "Mon", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 3",  day: "Tue", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 4",  day: "Wed", time: "4:30 PM",  role: "Patio Server", logged: false },
    { date: "Mar 6",  day: "Fri", time: "4:45 PM",  role: "Server",       logged: false },
    { date: "Mar 9",  day: "Mon", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 10", day: "Tue", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 11", day: "Wed", time: "4:30 PM",  role: "Patio Server", logged: false },
    { date: "Mar 13", day: "Fri", time: "4:45 PM",  role: "Server",       logged: false },
    { date: "Mar 15", day: "Sun", time: "5:00 PM",  role: "Server",       logged: false },
    { date: "Mar 16", day: "Mon", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 17", day: "Tue", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 18", day: "Wed", time: "4:30 PM",  role: "Patio Server", logged: false },
    { date: "Mar 20", day: "Fri", time: "4:45 PM",  role: "Server",       logged: false },
    { date: "Mar 23", day: "Mon", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 24", day: "Tue", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 25", day: "Wed", time: "4:30 PM",  role: "Patio Server", logged: false },
    { date: "Mar 27", day: "Fri", time: "4:45 PM",  role: "Server",       logged: false },
    { date: "Mar 30", day: "Mon", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 31", day: "Tue", time: "3:00 PM",  role: "Server",       logged: false },
  ],
  goals: [
    { name: "Emergency Fund",    target: 5000,  current: 3256.03 },
    { name: "Flip Capital Pool", target: 2000,  current: 500 },
    { name: "Stock Portfolio",   target: 10000, current: 2165.23 },
  ],
};

// ── AI Opportunity Engine ─────────────────────────────────────────────────────
const generateOpportunities = (liquid) => {
  const opps = [
    {
      type: "🎟️ Ticket Flip",
      title: "Kendrick Lamar – Grand National Tour",
      detail: "Face value ~$180. Resale avg $420 on StubHub. Buy 2-4 tickets for ~$360-720 and flip within 2 weeks of show.",
      roi: "+133%",
      capital: Math.min(liquid, 720),
      risk: "MED",
      timeframe: "2–3 weeks",
      action: "Hit Ticketmaster drops on Tues 10am local. Use multiple accounts.",
    },
    {
      type: "📦 Item Flip",
      title: "RTX 5080 GPU Arbitrage",
      detail: "MSRP $999, selling $1,400–1,600 on eBay. Scalp from Best Buy / Newegg restocks.",
      roi: "+40–60%",
      capital: 999,
      risk: "MED",
      timeframe: "1–2 weeks",
      action: "Set restock alerts on NowInStock.net and r/buildapcsales.",
    },
    {
      type: "📦 Item Flip",
      title: "Jordan Retro Releases (April Drop)",
      detail: "Jordan 1 'Bred Reimagined' releasing April 12. Cop at $180, resell ~$380-500 based on comps.",
      roi: "+111–178%",
      capital: 180,
      risk: "MED-HIGH",
      timeframe: "1 week",
      action: "Enter SNKRS raffles, use Kick Game / Sole Supplier as backup. Bot optional.",
    },
    {
      type: "📈 Stocks & ETFs",
      title: "MSTR Leveraged Play",
      detail: "MicroStrategy is a leveraged Bitcoin proxy. With $400 you could buy 0.3 shares. High volatility = high upside.",
      roi: "Varies wildly",
      capital: 400,
      risk: "HIGH",
      timeframe: "Open-ended",
      action: "Buy on Robinhood/Webull. Set a stop-loss at -20% to cap downside.",
    },
    {
      type: "💡 Side Hustle",
      title: "Sell Serving Shift Insights / Catering Gigs",
      detail: "Private catering pays $25-40/hr cash. One 5-hr gig = $125-200 vs ~$86 on a typical restaurant shift.",
      roi: "+45-130% per hour",
      capital: 0,
      risk: "LOW",
      timeframe: "This weekend",
      action: "Post on Thumbtack, Bark.com, and local Facebook groups offering bartending/serving.",
    },
    {
      type: "🎟️ Ticket Flip",
      title: "UFC Pay-Per-View Premium Seats",
      detail: "PPV cards in Vegas have consistent 2–3x resale. $300 floor seats flip for $700-900.",
      roi: "+133–200%",
      capital: 300,
      risk: "MED",
      timeframe: "3–6 weeks",
      action: "Buy on Ticketmaster day-of-sale. Sell on Vivid Seats 1 week pre-fight.",
    },
  ].filter(o => o.capital <= liquid * 2);
  return opps.sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi));
};

// ── Sub-components ────────────────────────────────────────────────────────────
const RISK_COLOR = { LOW: "#00ff88", MED: "#ffd700", "MED-HIGH": "#ff8c00", HIGH: "#ff3b3b" };

function StatCard({ label, value, sub, accent = "#00ff88" }) {
  return (
    <div style={{ background: "#0d0d0d", border: `1px solid ${accent}22`, borderRadius: 8, padding: "18px 22px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: accent }} />
      <div style={{ color: "#666", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, fontFamily: "monospace" }}>{label}</div>
      <div style={{ color: accent, fontSize: 26, fontWeight: 700, fontFamily: "'Courier New', monospace", letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ color: "#555", fontSize: 11, marginTop: 4, fontFamily: "monospace" }}>{sub}</div>}
    </div>
  );
}

function OpportunityCard({ opp }) {
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

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div style={{ background: "#0d0d0d", border: "1px solid #333", borderRadius: 12, padding: 28, minWidth: 340, maxWidth: 480, width: "90%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ color: "#e8e8e8", fontWeight: 700, fontFamily: "monospace" }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: "#666", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, padding: "9px 12px", color: "#e8e8e8", fontFamily: "monospace", fontSize: 13, outline: "none", boxSizing: "border-box" }}
      />
    </div>
  );
}

function Btn({ children, onClick, color = "#00ff88", style = {} }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: `1px solid ${color}`, color, fontFamily: "monospace", fontSize: 12, padding: "9px 18px", borderRadius: 6, cursor: "pointer", letterSpacing: 1, ...style }}>
      {children}
    </button>
  );
}

// ── Daily What-To-Do Card ─────────────────────────────────────────────────────
function DailyCard({ data, netWorth, avgTips, stockValue }) {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCard = async () => {
    setLoading(true);
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
    } catch {
      setCard({ priority: "Log last shift & scan flip margins", reason: "Data discipline = better decisions every week.", category: "HUSTLE", urgency: "TODAY", bonus: "Consistency beats intensity every time" });
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

// ── Dollar Deployment System ──────────────────────────────────────────────────
function DollarDeployer({ data, netWorth, avgTips }) {
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

// ── Live Opportunity Alerts ───────────────────────────────────────────────────
function AlertsFeed({ liquid }) {
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const FALLBACK_ALERTS = [
    { type: "SNEAKER", title: "Nike SNKRS Weekly Drop",     action: "Check SNKRS app 10am ET daily",        window: "Daily",         est_roi: "+80%",  capital: 180, urgency: "HOT"   },
    { type: "TICKET",  title: "Spring Concert Season",      action: "Buy floor tickets day-of-sale on TM", window: "This weekend",  est_roi: "+120%", capital: 300, urgency: "WARM"  },
    { type: "FLIP",    title: "RTX 5080 GPU Restock",       action: "Set NowInStock alerts immediately",    window: "3 days",        est_roi: "+45%",  capital: 999, urgency: "WATCH" },
    { type: "FLIP",    title: "Spring eBay Electronics Surge", action: "List used electronics & headphones now", window: "This week", est_roi: "+60%", capital: 50,  urgency: "WARM"  },
  ];

  const fetchAlerts = async () => {
    setLoading(true);
    setOpen(true);
    try {
      const text = await gemini(
        'You are a real-time opportunity scout. Return ONLY a JSON array of 4 objects: [{"type":"SNEAKER or TICKET or FLIP or INVEST","title":"specific name","action":"exact step in 10 words","window":"time window","est_roi":"+XX%","capital":number,"urgency":"HOT or WARM or WATCH"}]. Return ONLY the JSON array, no markdown.',
        `Top 4 money opportunities RIGHT NOW March 2026. I have $${Math.round(liquid)} liquid. I flip sneakers, event tickets, electronics on eBay/StubHub. Find real current drops and events this week.`,
        900,
        true
      );
      const match = text.match(/\[[\s\S]*?\]/);
      const parsed = match ? JSON.parse(match[0]) : [];
      setAlerts(parsed.length ? parsed.slice(0, 4) : FALLBACK_ALERTS);
    } catch {
      setAlerts(FALLBACK_ALERTS);
    }
    setLoading(false);
  };

  const TYPE_COLOR = { SNEAKER: "#ff8c00", TICKET: "#a78bfa", FLIP: "#ffd700", INVEST: "#60a5fa" };
  const URG_COLOR  = { HOT: "#ff3b3b", WARM: "#ffd700", WATCH: "#555" };

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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ color: "#00ff88", fontSize: 11, fontFamily: "monospace" }}>▶ {a.action}</div>
                  <div style={{ color: "#444", fontSize: 10, fontFamily: "monospace" }}>{a.window}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Multi-view Chart Panel ────────────────────────────────────────────────────
const CHART_VIEWS = [
  { key: "networth",  label: "NET WORTH",    color: "#00ff88" },
  { key: "liquid",    label: "LIQUID",       color: "#ffd700" },
  { key: "shifts",    label: "SHIFT INCOME", color: "#a78bfa" },
  { key: "stocks",    label: "PORTFOLIO",    color: "#60a5fa" },
  { key: "projected", label: "PROJECTED",    color: "#fb923c" },
];

function buildChartData(data, stockValue, totalShiftEarnings, netWorth) {
  const today = new Date();
  const base = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
  const nwMap = {};
  (data.netWorthHistory || []).forEach(p => { nwMap[p.date] = p.value; });
  const shiftMap = {};
  let runningShift = 0;
  data.shifts.forEach(s => { shiftMap[s.date] = s.tips; });
  const stockBase = 1800;
  const stockEnd = stockValue;
  const avgShift = data.shifts.length ? totalShiftEarnings / data.shifts.length : 275;
  const projectedMonthly = avgShift * 6;
  return base.map((date, i) => {
    const progress = i / 29;
    const noise = Math.sin(i * 0.7) * 80 + Math.cos(i * 1.3) * 40;
    const nw = nwMap[date] || Math.round(netWorth * 0.88 + netWorth * 0.12 * progress + noise * 0.5);
    const liquid = Math.max(800, Math.round(data.bankBalance * (0.75 + 0.25 * Math.sin(i * 0.5)) + (shiftMap[date] || 0)));
    runningShift += (shiftMap[date] || (i > 20 ? avgShift / 5 : avgShift / 8));
    const shifts = Math.round(runningShift);
    const stocks = Math.round(stockBase + (stockEnd - stockBase) * progress + noise * 0.3);
    const projected = Math.round((projectedMonthly / 29) * (i + 1));
    return { date, networth: nw, liquid, shifts, stocks, projected };
  });
}

function ChartPanel({ data, stockValue, totalShiftEarnings, netWorth }) {
  const [view, setView] = useState("networth");
  const chartData = buildChartData(data, stockValue, totalShiftEarnings, netWorth);
  const current = CHART_VIEWS.find(v => v.key === view);
  const first = chartData[0]?.[view] || 0;
  const last  = chartData[chartData.length - 1]?.[view] || 0;
  const delta = last - first;
  const deltaPct = first > 0 ? ((delta / first) * 100).toFixed(1) : "0.0";
  const labels = {
    networth:  { title: "30-DAY NET WORTH",         suffix: "" },
    liquid:    { title: "LIQUID CAPITAL FLOW",       suffix: "" },
    shifts:    { title: "CUMULATIVE SHIFT INCOME",   suffix: "" },
    stocks:    { title: "PORTFOLIO VALUE",           suffix: "" },
    projected: { title: "PROJECTED MONTHLY INCOME",  suffix: "/mo" },
  };
  return (
    <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, padding: "20px", marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {CHART_VIEWS.map(v => (
          <button key={v.key} onClick={() => setView(v.key)} style={{
            background: view === v.key ? `${v.color}18` : "none",
            border: `1px solid ${view === v.key ? v.color : "#222"}`,
            color: view === v.key ? v.color : "#444",
            fontFamily: "monospace", fontSize: 9, letterSpacing: 1,
            padding: "5px 10px", borderRadius: 4, cursor: "pointer", transition: "all 0.15s"
          }}>{v.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
        <div>
          <div style={{ color: "#444", fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>{labels[view].title}</div>
          <div style={{ color: current.color, fontSize: 22, fontWeight: 700, fontFamily: "monospace" }}>
            ${last.toLocaleString()}{labels[view].suffix}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: delta >= 0 ? "#00ff88" : "#ff3b3b", fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>
            {delta >= 0 ? "▲" : "▼"} ${Math.abs(Math.round(delta)).toLocaleString()}
          </div>
          <div style={{ color: "#444", fontSize: 10, fontFamily: "monospace" }}>{delta >= 0 ? "+" : ""}{deltaPct}% · 30d</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" tick={{ fill: "#333", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={6} />
          <YAxis tick={{ fill: "#333", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+"k" : v}`} width={44} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div style={{ background: "#111", border: `1px solid ${current.color}44`, padding: "8px 14px", fontFamily: "monospace", fontSize: 11, borderRadius: 6 }}>
                <div style={{ color: "#555", marginBottom: 2 }}>{label}</div>
                <div style={{ color: current.color, fontWeight: 700 }}>${payload[0].value.toLocaleString()}</div>
              </div>
            );
          }} />
          <Line type="monotone" dataKey={view} stroke={current.color} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: current.color }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Schedule Tab ──────────────────────────────────────────────────────────────
function ScheduleTab({ data, save }) {
  const avgEarned = data.shifts.length
    ? data.shifts.reduce((s, sh) => s + sh.tips + sh.hours * (sh.wage || 0), 0) / data.shifts.length
    : 275;
  const upcoming = (data.schedule || []).filter(s => !s.logged);
  const thisWeek = upcoming.slice(0, 4);
  const projectedWeek = thisWeek.length * avgEarned;
  const projectedMonth = upcoming.length * avgEarned;
  const hoursLeft = upcoming.length * 6;
  const WEEKS = [
    { label: "Week of Mar 2",  dates: ["Mar 2","Mar 3","Mar 4","Mar 6"] },
    { label: "Week of Mar 9",  dates: ["Mar 9","Mar 10","Mar 11","Mar 13"] },
    { label: "Week of Mar 16", dates: ["Mar 15","Mar 16","Mar 17","Mar 18"] },
    { label: "Week of Mar 23", dates: ["Mar 20","Mar 23","Mar 24","Mar 25","Mar 27"] },
    { label: "Week of Mar 30", dates: ["Mar 30","Mar 31"] },
  ];
  const logShift = (shift) => {
    const newSched = data.schedule.map(s =>
      s.date === shift.date && s.time === shift.time ? { ...s, logged: true } : s
    );
    save({ ...data, schedule: newSched });
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ color: "#38bdf8", fontSize: 11, letterSpacing: 2 }}>UPCOMING SCHEDULE</div>
        <div style={{ color: "#555", fontSize: 11, fontFamily: "monospace" }}>1059 · Surprise · CHW</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "SHIFTS LEFT",      value: upcoming.length,                              sub: hoursLeft + " hrs total",              color: "#38bdf8" },
          { label: "PROJ. THIS WEEK",  value: "$" + Math.round(projectedWeek).toLocaleString(), sub: "~$" + Math.round(avgEarned) + "/shift avg", color: "#a78bfa" },
          { label: "PROJ. MONTH",      value: "$" + Math.round(projectedMonth).toLocaleString(), sub: upcoming.length + " shifts total",       color: "#00ff88" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#0d0d0d", border: "1px solid " + c.color + "22", borderRadius: 8, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: c.color }} />
            <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, marginBottom: 6, fontFamily: "monospace" }}>{c.label}</div>
            <div style={{ color: c.color, fontSize: 24, fontWeight: 700, fontFamily: "monospace" }}>{c.value}</div>
            <div style={{ color: "#444", fontSize: 11, marginTop: 4, fontFamily: "monospace" }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, padding: "18px", marginBottom: 20 }}>
        <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, marginBottom: 14 }}>WEEKLY PROJECTION · avg ${Math.round(avgEarned)}/shift</div>
        {WEEKS.map((wk, wi) => {
          const weekShifts = upcoming.filter(s => wk.dates.includes(s.date));
          const proj = weekShifts.length * avgEarned;
          const pct = Math.min(100, (proj / (4 * avgEarned)) * 100);
          return (
            <div key={wi} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ color: "#666", fontSize: 10, fontFamily: "monospace" }}>{wk.label}</div>
                <div style={{ color: "#a78bfa", fontSize: 10, fontFamily: "monospace" }}>${Math.round(proj)} · {weekShifts.length} shifts</div>
              </div>
              <div style={{ background: "#1a1a1a", borderRadius: 3, height: 6 }}>
                <div style={{ background: "linear-gradient(90deg, #a78bfa, #7c3aed)", width: pct + "%", height: "100%", borderRadius: 3, transition: "width 0.4s" }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {upcoming.map((s, i) => {
          const isToday = s.date === "Mar 2";
          return (
            <div key={i} style={{
              background: isToday ? "#00ff8808" : "#0d0d0d",
              border: "1px solid " + (isToday ? "#00ff8844" : "#1a1a1a"),
              borderRadius: 8, padding: "12px 18px",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ textAlign: "center", minWidth: 36 }}>
                  <div style={{ color: "#555", fontSize: 9, fontFamily: "monospace" }}>{s.day}</div>
                  <div style={{ color: isToday ? "#00ff88" : "#e8e8e8", fontWeight: 700, fontSize: 16 }}>{s.date.split(" ")[1]}</div>
                </div>
                <div>
                  <div style={{ color: isToday ? "#00ff88" : "#e8e8e8", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    {s.date}
                    {isToday && <span style={{ color: "#00ff88", fontSize: 8, border: "1px solid #00ff88", padding: "1px 5px", borderRadius: 3 }}>TODAY</span>}
                  </div>
                  <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>{s.time} · {s.role}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ color: "#444", fontFamily: "monospace", fontSize: 12 }}>~${Math.round(avgEarned)}</div>
                <button onClick={() => logShift(s)} style={{
                  background: "none", border: "1px solid #333", color: "#555", fontSize: 9,
                  fontFamily: "monospace", padding: "4px 10px", borderRadius: 4, cursor: "pointer", letterSpacing: 1
                }}>LOG ✓</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("overview");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  useEffect(() => {
    (async () => {
      let d = await S.get("fcc-data") || defaultState;
      // Migrate old shifts that have wage: 0 → 12.15
      if (d.shifts.some(s => s.wage === 0)) {
        d = { ...d, shifts: d.shifts.map(s => s.wage === 0 ? { ...s, wage: 12.15 } : s) };
        await S.set("fcc-data", d);
      }
      setData(d);
      setLoading(false);
    })();
  }, []);

  const save = useCallback(async (newData) => {
    setData(newData);
    await S.set("fcc-data", newData);
  }, []);

  const fetchAIInsight = useCallback(async (d) => {
    setAiLoading(true);
    setAiInsight("");
    const stockValue = d.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0);
    const netWorth = d.bankBalance + stockValue;
    const totalShiftEarnings = d.shifts.reduce((s, sh) => s + sh.tips + sh.hours * sh.wage, 0);
    const flipProfit = d.flips.filter(f => f.status === "sold").reduce((s, f) => s + (f.sold - f.bought), 0);
    try {
      const text = await gemini(
        "You are an aggressive, street-smart financial advisor for a server who flips items, trades stocks, and hustles. Be direct, specific, and bold. No generic advice. Short punchy paragraphs. Use numbers. No bullet points — write in flowing punchy prose like a financial coach text message. 3-4 sentences max.",
        `My financial snapshot: Checking $${d.bankBalance} (Desert Financial CU), Savings $${d.savings||0}, Investment portfolio $${Math.round(stockValue)} (CHPY Tidal Trust x2, GDXY, TDAX ETF), Net worth ~$${Math.round(netWorth)}, Recent serving shift earnings (6hr avg shifts): ${d.shifts.map(s=>s.date+" $"+s.tips).join(", ")}, Total shift income $${Math.round(totalShiftEarnings)}, Flip profits $${flipProfit}. Risk appetite: AGGRESSIVE. I flip items, trade stocks, and work as a server. Give me my weekly money brief and the single highest-leverage move I should make right now with my liquid capital.`,
        1000
      );
      setAiInsight(text || "Unable to generate insight.");
    } catch {
      setAiInsight("AI insight unavailable — check connection.");
    }
    setAiLoading(false);
  }, []);

  const syncStockPrices = useCallback(async () => {
    setSyncLoading(true);
    const tickers = [...new Set(data.stocks.map(s => s.ticker))];
    try {
      const text = await gemini(
        "You are a stock price lookup tool. Return ONLY a valid JSON object mapping ticker symbols to their current market prices as numbers. No markdown, no explanation, just the JSON object.",
        `Search Google Finance for the CURRENT live market prices of these tickers: ${tickers.join(", ")}. Return ONLY this exact JSON format with real current prices: {"CHPY": 59.54, "GDXY": 18.07, "TDAX": 22.50}. Today is ${new Date().toLocaleDateString()}.`,
        200,
        true
      );
      const match = text.match(/\{[\s\S]*?\}/);
      if (!match) throw new Error("No JSON");
      const prices = JSON.parse(match[0]);
      const updatedStocks = data.stocks.map(s => ({
        ...s,
        currentPrice: prices[s.ticker] !== undefined ? prices[s.ticker] : s.currentPrice,
      }));
      await save({ ...data, stocks: updatedStocks });
      setLastSynced(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      // silently keep existing prices on failure
    }
    setSyncLoading(false);
  }, [data, save]);

  if (loading || !data) return (
    <div style={{ background: "#080808", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#00ff88", fontFamily: "monospace", fontSize: 14, letterSpacing: 2 }}>
      LOADING COMMAND CENTER...
    </div>
  );

  const stockValue = data.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0);
  const stockCost  = data.stocks.reduce((s, st) => s + st.shares * st.buyPrice, 0);
  const netWorth   = data.bankBalance + (data.savings || 0) + stockValue;
  const totalShiftEarnings = data.shifts.reduce((s, sh) => s + sh.tips + sh.hours * (sh.wage || 0), 0);
  const avgTips    = data.shifts.length ? data.shifts.reduce((s, sh) => s + sh.tips, 0) / data.shifts.length : 0;
  const flipProfit = data.flips.filter(f => f.status === "sold").reduce((s, f) => s + (f.sold - f.bought), 0);
  const opportunities = generateOpportunities(data.liquidCash);

  const HOURLY_WAGE = 12.15;

  const parseDateLabel = (label) => {
    const year = new Date().getFullYear();
    const d = new Date(`${label} ${year}`);
    if (isNaN(d.getTime())) return "";
    return `${year}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  const openEditShift = (origIdx) => {
    const s = data.shifts[origIdx];
    const total = (s.tips + s.hours * s.wage).toFixed(2);
    setForm({ rawDate: parseDateLabel(s.date), date: s.date, hours: String(s.hours), total, _editIdx: origIdx });
    setModal("shift");
  };

  const deleteShift = (origIdx) => {
    save({ ...data, shifts: data.shifts.filter((_, i) => i !== origIdx) });
  };

  const addShift = () => {
    const { date, hours, total, _editIdx } = form;
    if (!date || !hours || !total) {
      const missing = !date ? "date" : !hours ? "hours worked" : "total made today";
      setForm({ ...form, _error: `Missing: ${missing}` });
      return;
    }
    setForm({ ...form, _error: null });
    const tips = Math.max(0, +total - +hours * HOURLY_WAGE);
    const newShift = { date, hours: +hours, tips: +tips.toFixed(2), wage: HOURLY_WAGE };
    const newShifts = _editIdx !== undefined
      ? data.shifts.map((s, i) => i === _editIdx ? newShift : s)
      : [...data.shifts, newShift];
    const newHistory = [...data.netWorthHistory];
    if (_editIdx === undefined) {
      const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const last = newHistory[newHistory.length - 1];
      if (last) newHistory[newHistory.length - 1] = { ...last, date: today, value: last.value + +total };
    }
    save({ ...data, shifts: newShifts, netWorthHistory: newHistory });
    setModal(null); setForm({});
  };

  const addFlip = () => {
    const { item, bought, sold, status } = form;
    if (!item || !bought) return;
    save({ ...data, flips: [...data.flips, { item, bought: +bought, sold: sold ? +sold : null, status: status || "listed" }] });
    setModal(null); setForm({});
  };

  const addStock = () => {
    const { ticker, shares, buyPrice, currentPrice } = form;
    if (!ticker || !shares || !buyPrice || !currentPrice) return;
    save({ ...data, stocks: [...data.stocks, { ticker: ticker.toUpperCase(), shares: +shares, buyPrice: +buyPrice, currentPrice: +currentPrice }] });
    setModal(null); setForm({});
  };

  const updateBalance = () => {
    const { bank, liquid, savings } = form;
    save({ ...data, bankBalance: +(bank || data.bankBalance), liquidCash: +(liquid || data.liquidCash), savings: +(savings || data.savings || 0) });
    setModal(null); setForm({});
  };

  const TABS = ["overview", "schedule", "shifts", "flips", "stocks", "opportunities", "goals"];

  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#e8e8e8", fontFamily: "'Courier New', monospace", padding: "0 0 60px" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a1a", padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0a0a0a" }}>
        <div>
          <div style={{ color: "#00ff88", fontSize: 18, fontWeight: 700, letterSpacing: 3 }}>⚡ CAPITAL COMMAND</div>
          <div style={{ color: "#333", fontSize: 10, letterSpacing: 2, marginTop: 2 }}>PERSONAL FINANCIAL INTELLIGENCE CENTER</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#666", fontSize: 10, letterSpacing: 1 }}>NET WORTH</div>
          <div style={{ color: "#00ff88", fontSize: 22, fontWeight: 700 }}>${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      </div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, padding: "12px 24px", borderBottom: "1px solid #1a1a1a", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? "#00ff8822" : "none", border: `1px solid ${tab === t ? "#00ff88" : "#1a1a1a"}`,
            color: tab === t ? "#00ff88" : "#555", padding: "6px 16px", borderRadius: 4, cursor: "pointer",
            fontFamily: "monospace", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", whiteSpace: "nowrap"
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: "24px" }}>
        {/* OVERVIEW */}
        {tab === "overview" && (
          <div>
            <DailyCard data={data} netWorth={netWorth} avgTips={avgTips} stockValue={stockValue} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
              <StatCard label="Checking"    value={`$${data.bankBalance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`} sub="Desert Financial CU" accent="#00ff88" />
              <StatCard label="Savings"     value={`$${(data.savings||0).toFixed(2)}`} sub="Membership Savings" accent="#34d399" />
              <StatCard label="Portfolio"   value={`$${stockValue.toLocaleString(undefined,{maximumFractionDigits:0})}`} sub="CHPY · GDXY · TDAX" accent="#60a5fa" />
              <StatCard label="Flip Income" value={`$${flipProfit}`} sub="This month" accent="#ff8c00" />
              <StatCard label="Shift Income" value={`$${Math.round(totalShiftEarnings).toLocaleString()}`} sub={`Avg $${Math.round(avgTips)}/shift · 6hr`} accent="#a78bfa" />
            </div>
            <ChartPanel data={data} stockValue={stockValue} totalShiftEarnings={totalShiftEarnings} netWorth={netWorth} />
            <DollarDeployer data={data} netWorth={netWorth} avgTips={avgTips} />
            <AlertsFeed liquid={data.liquidCash || data.bankBalance} />
            <div style={{ background: "#0d0d0d", border: "1px solid #ffd70033", borderRadius: 10, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ color: "#ffd700", fontSize: 11, letterSpacing: 2 }}>⚡ AI MONEY BRIEF</div>
                <Btn onClick={() => fetchAIInsight(data)} color="#ffd700" style={{ fontSize: 10 }}>
                  {aiLoading ? "THINKING..." : "GET BRIEF"}
                </Btn>
              </div>
              {aiInsight ? (
                <p style={{ color: "#ccc", lineHeight: 1.8, fontSize: 13, margin: 0 }}>{aiInsight}</p>
              ) : (
                <p style={{ color: "#444", fontSize: 12, margin: 0, fontStyle: "italic" }}>Hit "GET BRIEF" for your personalized AI money coach insight based on your current numbers.</p>
              )}
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Btn onClick={() => { setModal("balance"); setForm({ bank: data.bankBalance, liquid: data.liquidCash }); }}>UPDATE BALANCES</Btn>
            </div>
          </div>
        )}

        {/* SHIFTS */}
        {tab === "shifts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ color: "#a78bfa", fontSize: 11, letterSpacing: 2 }}>SERVING SHIFTS</div>
              <Btn onClick={() => { setModal("shift"); setForm({}); }} color="#a78bfa">+ LOG SHIFT</Btn>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {[...data.shifts].map((s, origIdx) => ({ s, origIdx })).reverse().map(({ s, origIdx }) => {
                const total = s.tips + s.hours * s.wage;
                const hourly = total / s.hours;
                return (
                  <div key={origIdx} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ color: "#e8e8e8", fontWeight: 600, fontSize: 14 }}>{s.date}</div>
                        <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>
                          {s.hours}hrs · ${s.wage}/hr wage · <span style={{ color: "#666" }}>${hourly.toFixed(2)}/hr effective</span>
                        </div>
                        <div style={{ color: "#444", fontSize: 10, marginTop: 1 }}>tips: ${s.tips}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ color: "#a78bfa", fontSize: 20, fontWeight: 700, fontFamily: "monospace" }}>${Math.round(total)}</div>
                        <button onClick={() => openEditShift(origIdx)} style={{ background: "none", border: "1px solid #333", color: "#888", fontSize: 9, fontFamily: "monospace", padding: "4px 8px", borderRadius: 4, cursor: "pointer", letterSpacing: 1 }}>EDIT</button>
                        <button onClick={() => deleteShift(origIdx)} style={{ background: "none", border: "1px solid #ff3b3b44", color: "#ff3b3b", fontSize: 11, fontFamily: "monospace", padding: "3px 8px", borderRadius: 4, cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Stats grid */}
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
              {[
                { label: "TOTAL EARNED",  value: `$${Math.round(totalShiftEarnings).toLocaleString()}`, color: "#a78bfa" },
                { label: "AVG / SHIFT",   value: `$${data.shifts.length ? Math.round(totalShiftEarnings / data.shifts.length) : 0}`, color: "#ffd700" },
                { label: "BEST SHIFT",    value: data.shifts.length ? `$${Math.round(Math.max(...data.shifts.map(s => s.tips + s.hours * s.wage)))}` : "$0", color: "#00ff88" },
                { label: "AVG $/HR",      value: data.shifts.length ? `$${(data.shifts.reduce((a, s) => a + (s.tips + s.hours * s.wage) / s.hours, 0) / data.shifts.length).toFixed(2)}` : "$0", color: "#60a5fa" },
                { label: "SHIFTS LOGGED", value: data.shifts.length, color: "#e8e8e8" },
              ].map((stat, i) => (
                <div key={i} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 16px" }}>
                  <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, fontFamily: "monospace", marginBottom: 4 }}>{stat.label}</div>
                  <div style={{ color: stat.color, fontSize: 18, fontWeight: 700, fontFamily: "monospace" }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FLIPS */}
        {tab === "flips" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ color: "#ff8c00", fontSize: 11, letterSpacing: 2 }}>FLIP TRACKER</div>
              <Btn onClick={() => { setModal("flip"); setForm({ status: "listed" }); }} color="#ff8c00">+ ADD FLIP</Btn>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {data.flips.map((f, i) => {
                const profit = f.sold ? f.sold - f.bought : null;
                const roi = profit ? ((profit / f.bought) * 100).toFixed(0) : null;
                return (
                  <div key={i} style={{ background: "#0d0d0d", border: `1px solid ${f.status === "sold" ? "#00ff8822" : "#1a1a1a"}`, borderRadius: 8, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: "#e8e8e8", fontWeight: 600 }}>{f.item}</div>
                      <div style={{ color: "#555", fontSize: 11, marginTop: 3 }}>Bought ${f.bought.toLocaleString()} {f.sold ? `→ Sold $${f.sold.toLocaleString()}` : "· Listed"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {profit !== null ? (
                        <>
                          <div style={{ color: "#00ff88", fontSize: 18, fontWeight: 700 }}>+${profit}</div>
                          <div style={{ color: "#555", fontSize: 10 }}>+{roi}% ROI</div>
                        </>
                      ) : (
                        <div style={{ color: "#ffd700", fontSize: 12, border: "1px solid #ffd70055", padding: "4px 10px", borderRadius: 4 }}>ACTIVE</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 20, background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "14px 18px", display: "flex", gap: 32 }}>
              <div><div style={{ color: "#555", fontSize: 10 }}>TOTAL PROFIT</div><div style={{ color: "#00ff88", fontSize: 18, fontWeight: 700 }}>${flipProfit}</div></div>
              <div><div style={{ color: "#555", fontSize: 10 }}>ACTIVE FLIPS</div><div style={{ color: "#ffd700", fontSize: 18, fontWeight: 700 }}>{data.flips.filter(f => f.status !== "sold").length}</div></div>
              <div><div style={{ color: "#555", fontSize: 10 }}>COMPLETED</div><div style={{ color: "#e8e8e8", fontSize: 18, fontWeight: 700 }}>{data.flips.filter(f => f.status === "sold").length}</div></div>
            </div>
          </div>
        )}

        {/* STOCKS */}
        {tab === "stocks" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ color: "#60a5fa", fontSize: 11, letterSpacing: 2 }}>STOCK PORTFOLIO</div>
                {lastSynced && <div style={{ color: "#444", fontSize: 10, fontFamily: "monospace", marginTop: 3 }}>last synced {lastSynced}</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={syncStockPrices} disabled={syncLoading} style={{ background: syncLoading ? "#111" : "#60a5fa18", border: "1px solid #60a5fa", color: "#60a5fa", fontFamily: "monospace", fontSize: 10, padding: "7px 14px", borderRadius: 5, cursor: "pointer", letterSpacing: 1 }}>
                  {syncLoading ? "SYNCING..." : "⟳ SYNC PRICES"}
                </button>
                <Btn onClick={() => { setModal("stock"); setForm({}); }} color="#60a5fa">+ ADD</Btn>
              </div>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {data.stocks.map((s, i) => {
                const value = s.shares * s.currentPrice;
                const cost  = s.shares * s.buyPrice;
                const pl    = value - cost;
                const plPct = ((pl / cost) * 100).toFixed(1);
                return (
                  <div key={i} style={{ background: "#0d0d0d", border: `1px solid ${pl >= 0 ? "#00ff8822" : "#ff3b3b22"}`, borderRadius: 8, padding: "14px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 18 }}>{s.ticker}</div>
                        <div style={{ color: "#555", fontSize: 11 }}>{s.shares} shares · avg ${s.buyPrice} · <span style={{ color: "#60a5fa" }}>${s.currentPrice}</span></div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: "#e8e8e8", fontSize: 16, fontWeight: 700 }}>${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div style={{ color: pl >= 0 ? "#00ff88" : "#ff3b3b", fontSize: 12 }}>{pl >= 0 ? "+" : ""}${Math.round(pl)} ({plPct}%)</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 20, background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "14px 18px", display: "flex", gap: 32 }}>
              <div><div style={{ color: "#555", fontSize: 10 }}>PORTFOLIO VALUE</div><div style={{ color: "#60a5fa", fontSize: 18, fontWeight: 700 }}>${Math.round(stockValue).toLocaleString()}</div></div>
              <div><div style={{ color: "#555", fontSize: 10 }}>TOTAL P&L</div><div style={{ color: stockValue >= stockCost ? "#00ff88" : "#ff3b3b", fontSize: 18, fontWeight: 700 }}>{stockValue >= stockCost ? "+" : ""}${Math.round(stockValue - stockCost).toLocaleString()}</div></div>
            </div>
          </div>
        )}

        {/* OPPORTUNITIES */}
        {tab === "opportunities" && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#ffd700", fontSize: 11, letterSpacing: 2, marginBottom: 6 }}>OPPORTUNITY ENGINE</div>
              <div style={{ color: "#555", fontSize: 12 }}>Based on ${data.liquidCash} liquid · Aggressive risk profile · Click any card for full plan</div>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {opportunities.map((o, i) => <OpportunityCard key={i} opp={o} />)}
            </div>
          </div>
        )}

        {/* SCHEDULE */}
        {tab === "schedule" && <ScheduleTab data={data} save={save} />}

        {/* GOALS */}
        {tab === "goals" && (
          <div>
            <div style={{ color: "#e879f9", fontSize: 11, letterSpacing: 2, marginBottom: 20 }}>FINANCIAL GOALS</div>
            <div style={{ display: "grid", gap: 14 }}>
              {data.goals.map((g, i) => {
                const pct = Math.min(100, (g.current / g.target) * 100);
                return (
                  <div key={i} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "18px 22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ color: "#e8e8e8", fontWeight: 600 }}>{g.name}</div>
                      <div style={{ color: "#555", fontSize: 12 }}>${g.current.toLocaleString()} / ${g.target.toLocaleString()}</div>
                    </div>
                    <div style={{ background: "#1a1a1a", borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{ background: pct >= 100 ? "#00ff88" : "#e879f9", width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.5s" }} />
                    </div>
                    <div style={{ color: "#555", fontSize: 10, marginTop: 6 }}>{pct.toFixed(0)}% complete · ${(g.target - g.current).toLocaleString()} to go</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      {modal === "shift" && (
        <Modal title={form._editIdx !== undefined ? "EDIT SHIFT" : "LOG SHIFT"} onClose={() => setModal(null)}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: "#666", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Date</label>
            <input
              type="date"
              value={form.rawDate || ""}
              onChange={e => {
                const raw = e.target.value; // "2026-03-01"
                if (!raw) { setForm({ ...form, rawDate: "", date: "" }); return; }
                const [y, m, d] = raw.split("-");
                const label = new Date(+y, +m - 1, +d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                setForm({ ...form, rawDate: raw, date: label });
              }}
              style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, padding: "9px 12px", color: "#e8e8e8", fontFamily: "monospace", fontSize: 13, outline: "none", boxSizing: "border-box", colorScheme: "dark" }}
            />
            {form.date && <div style={{ color: "#555", fontSize: 10, fontFamily: "monospace", marginTop: 4 }}>→ will save as "{form.date}"</div>}
          </div>
          <Input label="Hours Worked" type="number" value={form.hours || ""} onChange={v => setForm({ ...form, hours: v })} placeholder="6" />
          <Input label="Total Made Today ($)" type="number" value={form.total || ""} onChange={v => setForm({ ...form, total: v })} placeholder="396.00" />
          {form.hours && form.total && (
            <div style={{ marginBottom: 14, background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#555", fontSize: 11, fontFamily: "monospace" }}>Wage ({form.hours}hr × ${HOURLY_WAGE})</span>
                <span style={{ color: "#555", fontFamily: "monospace", fontSize: 11 }}>${(+form.hours * HOURLY_WAGE).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#a78bfa", fontSize: 11, fontFamily: "monospace" }}>Tips (calculated)</span>
                <span style={{ color: "#a78bfa", fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}>
                  ${Math.max(0, +form.total - +form.hours * HOURLY_WAGE).toFixed(2)}
                </span>
              </div>
            </div>
          )}
          {form._error && (
            <div style={{ color: "#ff3b3b", fontSize: 11, fontFamily: "monospace", textAlign: "center", marginBottom: 10, padding: "8px", background: "#ff3b3b11", borderRadius: 6, border: "1px solid #ff3b3b33" }}>
              ⚠ {form._error}
            </div>
          )}
          <Btn
            onClick={addShift}
            style={{ width: "100%", marginTop: 4, opacity: (form.date && form.hours && form.total) ? 1 : 0.5 }}
          >{form._editIdx !== undefined ? "SAVE CHANGES" : "LOG SHIFT"}</Btn>
        </Modal>
      )}
      {modal === "flip" && (
        <Modal title="ADD FLIP" onClose={() => setModal(null)}>
          <Input label="Item Name" value={form.item || ""} onChange={v => setForm({ ...form, item: v })} placeholder="Jordan 1 Bred" />
          <Input label="Buy Price ($)" type="number" value={form.bought || ""} onChange={v => setForm({ ...form, bought: v })} placeholder="215" />
          <Input label="Sell Price ($) — leave blank if active" type="number" value={form.sold || ""} onChange={v => setForm({ ...form, sold: v })} placeholder="380" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: "#666", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Status</label>
            <select value={form.status || "listed"} onChange={e => setForm({ ...form, status: e.target.value })}
              style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, padding: "9px 12px", color: "#e8e8e8", fontFamily: "monospace", fontSize: 13, outline: "none" }}>
              <option value="listed">Listed / Active</option>
              <option value="sold">Sold</option>
            </select>
          </div>
          <Btn onClick={addFlip} color="#ff8c00" style={{ width: "100%", marginTop: 8 }}>ADD FLIP</Btn>
        </Modal>
      )}
      {modal === "stock" && (
        <Modal title="ADD POSITION" onClose={() => setModal(null)}>
          <Input label="Ticker" value={form.ticker || ""} onChange={v => setForm({ ...form, ticker: v })} placeholder="NVDA" />
          <Input label="Shares" type="number" value={form.shares || ""} onChange={v => setForm({ ...form, shares: v })} placeholder="2" />
          <Input label="Avg Buy Price ($)" type="number" value={form.buyPrice || ""} onChange={v => setForm({ ...form, buyPrice: v })} placeholder="480" />
          <Input label="Current Price ($)" type="number" value={form.currentPrice || ""} onChange={v => setForm({ ...form, currentPrice: v })} placeholder="875" />
          <Btn onClick={addStock} color="#60a5fa" style={{ width: "100%", marginTop: 8 }}>ADD POSITION</Btn>
        </Modal>
      )}
      {modal === "balance" && (
        <Modal title="UPDATE BALANCES" onClose={() => setModal(null)}>
          <Input label="Checking Balance ($)" type="number" value={form.bank || ""} onChange={v => setForm({ ...form, bank: v })} placeholder="3256.03" />
          <Input label="Savings Balance ($)" type="number" value={form.savings || ""} onChange={v => setForm({ ...form, savings: v })} placeholder="25.69" />
          <Input label="Liquid / Deploy Capital ($)" type="number" value={form.liquid || ""} onChange={v => setForm({ ...form, liquid: v })} placeholder="3256.03" />
          <Btn onClick={updateBalance} style={{ width: "100%", marginTop: 8 }}>UPDATE</Btn>
        </Modal>
      )}
    </div>
  );
}
