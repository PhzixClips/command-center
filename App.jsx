import { useState, useEffect, useCallback, useRef } from "react";

import { gemini }              from "./components/gemini.js";
import { S }                   from "./components/storage.js";
import { defaultState, generateOpportunities } from "./components/defaults.js";

import StatCard        from "./components/StatCard.jsx";
import OpportunityCard from "./components/OpportunityCard.jsx";
import Modal           from "./components/Modal.jsx";
import Input           from "./components/Input.jsx";
import Btn             from "./components/Btn.jsx";
import DailyCard       from "./components/DailyCard.jsx";
import DollarDeployer  from "./components/DollarDeployer.jsx";
import AlertsFeed      from "./components/AlertsFeed.jsx";
import ChartPanel      from "./components/ChartPanel.jsx";
import ScheduleTab     from "./components/ScheduleTab.jsx";
import BudgetTab       from "./components/BudgetTab.jsx";
import FAB             from "./components/FAB.jsx";

// ── Real stock price fetch (Yahoo Finance → Gemini fallback) ──────────────────
const fetchYahooPrice = async (ticker) => {
  try {
    const proxy = `https://corsproxy.io/?https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
    const res   = await fetch(proxy, { headers: { Accept: "application/json" } });
    const json  = await res.json();
    const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (price && price > 0) return price;
  } catch {}
  return null;
};

const HOURLY_WAGE = 12.15;
const TABS = ["overview", "schedule", "shifts", "flips", "stocks", "opportunities", "goals", "budget"];

// ── Resolve auto-synced goal current value ────────────────────────────────────
const resolveGoalCurrent = (g, bankBalance, stockValue, flipProfit) => {
  if (g.autoKey === "bank")   return bankBalance;
  if (g.autoKey === "stocks") return stockValue;
  if (g.autoKey === "flips")  return flipProfit;
  return g.current;
};

export default function App() {
  const [data,        setData]        = useState(null);
  const [tab,         setTab]         = useState("overview");
  const [modal,       setModal]       = useState(null);
  const [form,        setForm]        = useState({});
  const [loading,     setLoading]     = useState(true);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiInsight,   setAiInsight]   = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [lastSynced,  setLastSynced]  = useState(null);
  const importRef = useRef(null);

  useEffect(() => {
    (async () => {
      let d = await S.get("fcc-data") || defaultState;

      // Migrate old wage: 0 shifts
      if (d.shifts.some(s => s.wage === 0)) {
        d = { ...d, shifts: d.shifts.map(s => s.wage === 0 ? { ...s, wage: HOURLY_WAGE } : s) };
      }

      // Migrate old goals without autoKey
      d = {
        ...d,
        goals: (d.goals || []).map(g => {
          if (g.autoKey !== undefined) return g;
          if (g.name === "Emergency Fund")    return { ...g, autoKey: "bank" };
          if (g.name === "Stock Portfolio")   return { ...g, autoKey: "stocks" };
          if (g.name === "Flip Capital Pool") return { ...g, autoKey: "flips" };
          return { ...g, autoKey: null };
        }),
      };

      // Record today's real net worth snapshot
      const todayLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const currentNW  = d.bankBalance + (d.savings || 0) + d.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0);
      const history    = d.netWorthHistory || [];
      const lastEntry  = history[history.length - 1];
      if (!lastEntry || lastEntry.date !== todayLabel) {
        d = { ...d, netWorthHistory: [...history.slice(-29), { date: todayLabel, value: Math.round(currentNW) }] };
      }

      await S.set("fcc-data", d);
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
    const sv = d.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0);
    const nw = d.bankBalance + sv;
    const te = d.shifts.reduce((s, sh) => s + sh.tips + sh.hours * sh.wage, 0);
    const fp = d.flips.filter(f => f.status === "sold").reduce((s, f) => s + (f.sold - f.bought), 0);
    try {
      const text = await gemini(
        "You are an aggressive, street-smart financial advisor for a server who flips items, trades stocks, and hustles. Be direct, specific, and bold. No generic advice. Short punchy paragraphs. Use numbers. No bullet points — write in flowing punchy prose like a financial coach text message. 3-4 sentences max.",
        `My financial snapshot: Checking $${d.bankBalance} (Desert Financial CU), Savings $${d.savings||0}, Portfolio $${Math.round(sv)}, Net worth ~$${Math.round(nw)}, Shift income $${Math.round(te)}, Flip profits $${fp}. Risk: AGGRESSIVE. Give me my weekly money brief and the single highest-leverage move I should make right now.`,
        1000
      );
      setAiInsight(text || "Unable to generate insight.");
    } catch { setAiInsight("AI insight unavailable — check connection."); }
    setAiLoading(false);
  }, []);

  // ── Stock price sync ─────────────────────────────────────────────────────────
  const syncStockPrices = useCallback(async () => {
    setSyncLoading(true);
    const tickers = [...new Set(data.stocks.map(s => s.ticker))];
    const prices  = {};
    await Promise.all(tickers.map(async (ticker) => {
      const price = await fetchYahooPrice(ticker);
      if (price) prices[ticker] = price;
    }));
    const missing = tickers.filter(t => !prices[t]);
    if (missing.length) {
      try {
        const text = await gemini(
          "Return ONLY a valid JSON object mapping ticker symbols to current market prices as numbers. No markdown.",
          `Current live prices for: ${missing.join(", ")}. Format: {"TICKER": price}. Today is ${new Date().toLocaleDateString()}.`,
          200, true
        );
        const match = text.match(/\{[\s\S]*?\}/);
        if (match) Object.assign(prices, JSON.parse(match[0]));
      } catch {}
    }
    if (Object.keys(prices).length) {
      const updatedStocks = data.stocks.map(s => ({
        ...s, currentPrice: prices[s.ticker] !== undefined ? prices[s.ticker] : s.currentPrice,
      }));
      await save({ ...data, stocks: updatedStocks });
    }
    setLastSynced(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }));
    setSyncLoading(false);
  }, [data, save]);

  // ── Export ───────────────────────────────────────────────────────────────────
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `capital-command-${new Date().toISOString().split("T")[0]}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows = [["Date","Hours","Tips","Wage","Total"]];
    data.shifts.forEach(s => rows.push([s.date, s.hours, s.tips, s.wage, (s.tips + s.hours * s.wage).toFixed(2)]));
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `shifts-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Import JSON ──────────────────────────────────────────────────────────────
  const importJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.bankBalance !== undefined && parsed.shifts !== undefined) {
          await save(parsed);
          alert("Backup restored successfully.");
        } else {
          alert("Invalid backup file.");
        }
      } catch { alert("Could not parse file."); }
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  if (loading || !data) return (
    <div style={{ background: "#080808", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#00ff88", fontFamily: "monospace", fontSize: 14, letterSpacing: 2 }}>
      LOADING COMMAND CENTER...
    </div>
  );

  const stockValue         = data.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0);
  const stockCost          = data.stocks.reduce((s, st) => s + st.shares * st.buyPrice, 0);
  const netWorth           = data.bankBalance + (data.savings || 0) + stockValue;
  const totalShiftEarnings = data.shifts.reduce((s, sh) => s + sh.tips + sh.hours * (sh.wage || 0), 0);
  const avgTips            = data.shifts.length ? data.shifts.reduce((s, sh) => s + sh.tips, 0) / data.shifts.length : 0;
  const flipProfit         = data.flips.filter(f => f.status === "sold").reduce((s, f) => s + (f.sold - f.bought), 0);
  const opportunities      = generateOpportunities(data.liquidCash);

  // ── Date parse helper ────────────────────────────────────────────────────────
  const parseDateLabel = (label) => {
    const year = new Date().getFullYear();
    const d = new Date(`${label} ${year}`);
    if (isNaN(d.getTime())) return "";
    return `${year}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  // ── Shift handlers ───────────────────────────────────────────────────────────
  const openEditShift = (origIdx) => {
    const s     = data.shifts[origIdx];
    const total = (s.tips + s.hours * s.wage).toFixed(2);
    setForm({ rawDate: parseDateLabel(s.date), date: s.date, hours: String(s.hours), total, _editIdx: origIdx });
    setModal("shift");
  };
  const deleteShift = (origIdx) => save({ ...data, shifts: data.shifts.filter((_, i) => i !== origIdx) });
  const addShift = () => {
    const { date, hours, total, _editIdx } = form;
    if (!date || !hours || !total) { setForm({ ...form, _error: `Missing: ${!date ? "date" : !hours ? "hours worked" : "total made today"}` }); return; }
    const tips      = Math.max(0, +total - +hours * HOURLY_WAGE);
    const newShift  = { date, hours: +hours, tips: +tips.toFixed(2), wage: HOURLY_WAGE };
    const newShifts = _editIdx !== undefined
      ? data.shifts.map((s, i) => i === _editIdx ? newShift : s)
      : [...data.shifts, newShift];
    const newHistory = [...data.netWorthHistory];
    if (_editIdx === undefined) {
      const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const last  = newHistory[newHistory.length - 1];
      if (last) newHistory[newHistory.length - 1] = { ...last, date: today, value: last.value + +total };
    }
    save({ ...data, shifts: newShifts, netWorthHistory: newHistory });
    setModal(null); setForm({});
  };

  // ── Flip handlers ────────────────────────────────────────────────────────────
  const openEditFlip = (idx) => {
    const f = data.flips[idx];
    setForm({ item: f.item, bought: String(f.bought), sold: f.sold ? String(f.sold) : "", status: f.status, _editIdx: idx });
    setModal("flip");
  };
  const deleteFlip = (idx) => save({ ...data, flips: data.flips.filter((_, i) => i !== idx) });
  const saveFlip = () => {
    const { item, bought, sold, status, _editIdx } = form;
    if (!item || !bought) return;
    const flip     = { item, bought: +bought, sold: sold ? +sold : null, status: status || "listed" };
    const newFlips = _editIdx !== undefined
      ? data.flips.map((f, i) => i === _editIdx ? flip : f)
      : [...data.flips, flip];
    save({ ...data, flips: newFlips });
    setModal(null); setForm({});
  };

  // ── Stock handlers ───────────────────────────────────────────────────────────
  const openEditStock = (idx) => {
    const s = data.stocks[idx];
    setForm({ ticker: s.ticker, name: s.name || "", shares: String(s.shares), buyPrice: String(s.buyPrice), currentPrice: String(s.currentPrice), _editIdx: idx });
    setModal("stock");
  };
  const deleteStock = (idx) => save({ ...data, stocks: data.stocks.filter((_, i) => i !== idx) });
  const saveStock = () => {
    const { ticker, name, shares, buyPrice, currentPrice, _editIdx } = form;
    if (!ticker || !shares || !buyPrice || !currentPrice) return;
    const stock      = { ticker: ticker.toUpperCase(), name: name || ticker.toUpperCase(), shares: +shares, buyPrice: +buyPrice, currentPrice: +currentPrice };
    const newStocks  = _editIdx !== undefined
      ? data.stocks.map((s, i) => i === _editIdx ? stock : s)
      : [...data.stocks, stock];
    save({ ...data, stocks: newStocks });
    setModal(null); setForm({});
  };

  // ── Goal handlers ────────────────────────────────────────────────────────────
  const openEditGoal = (idx) => {
    const g = data.goals[idx];
    setForm({ name: g.name, target: String(g.target), current: String(g.current), autoKey: g.autoKey || "none", _editIdx: idx });
    setModal("goal");
  };
  const deleteGoal = (idx) => save({ ...data, goals: data.goals.filter((_, i) => i !== idx) });
  const saveGoal = () => {
    const { name, target, current, autoKey, _editIdx } = form;
    if (!name || !target) return;
    const goal     = { name, target: +target, current: +(current || 0), autoKey: autoKey === "none" ? null : autoKey };
    const newGoals = _editIdx !== undefined
      ? data.goals.map((g, i) => i === _editIdx ? goal : g)
      : [...data.goals, goal];
    save({ ...data, goals: newGoals });
    setModal(null); setForm({});
  };

  // ── Balance handler ──────────────────────────────────────────────────────────
  const updateBalance = () => {
    const { bank, liquid, savings } = form;
    save({ ...data, bankBalance: +(bank || data.bankBalance), liquidCash: +(liquid || data.liquidCash), savings: +(savings || data.savings || 0) });
    setModal(null); setForm({});
  };

  // ── FAB handler ──────────────────────────────────────────────────────────────
  const handleFAB = (key) => {
    if (key === "shift")   { setTab("shifts");  setModal("shift");   setForm({}); }
    if (key === "flip")    { setTab("flips");   setModal("flip");    setForm({ status: "listed" }); }
    if (key === "expense") { setTab("budget");  setModal("expense"); setForm({ category: "Food & Dining" }); }
  };

  // ── Flip analytics helpers ───────────────────────────────────────────────────
  const soldFlips = data.flips.filter(f => f.status === "sold" && f.sold);
  const avgFlipROI = soldFlips.length
    ? (soldFlips.reduce((a, f) => a + (f.sold - f.bought) / f.bought, 0) / soldFlips.length * 100).toFixed(0)
    : null;
  const bestFlip = soldFlips.length
    ? soldFlips.reduce((best, f) => (f.sold - f.bought) > (best.sold - best.bought) ? f : best, soldFlips[0])
    : null;

  return (
    <div style={{ background: "#080808", minHeight: "100vh", color: "#e8e8e8", fontFamily: "'Courier New', monospace", padding: "0 0 80px" }}>
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

        {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div>
            <DailyCard data={data} netWorth={netWorth} avgTips={avgTips} stockValue={stockValue} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
              <StatCard label="Checking"    value={`$${data.bankBalance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`} sub="Desert Financial CU" accent="#00ff88" />
              <StatCard label="Savings"     value={`$${(data.savings||0).toFixed(2)}`} sub="Membership Savings" accent="#34d399" />
              <StatCard label="Portfolio"   value={`$${stockValue.toLocaleString(undefined,{maximumFractionDigits:0})}`} sub="CHPY · GDXY · TDAX" accent="#60a5fa" />
              <StatCard label="Flip Income" value={`$${flipProfit}`} sub="Realized profit" accent="#ff8c00" />
              <StatCard label="Shift Income" value={`$${Math.round(totalShiftEarnings).toLocaleString()}`} sub={`Avg $${Math.round(avgTips)}/shift · 6hr`} accent="#a78bfa" />
            </div>
            <ChartPanel data={data} stockValue={stockValue} totalShiftEarnings={totalShiftEarnings} netWorth={netWorth} />
            <DollarDeployer data={data} netWorth={netWorth} avgTips={avgTips} />
            <AlertsFeed liquid={data.liquidCash || data.bankBalance} />
            <div style={{ background: "#0d0d0d", border: "1px solid #ffd70033", borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ color: "#ffd700", fontSize: 11, letterSpacing: 2 }}>⚡ AI MONEY BRIEF</div>
                <Btn onClick={() => fetchAIInsight(data)} color="#ffd700" style={{ fontSize: 10 }}>{aiLoading ? "THINKING..." : "GET BRIEF"}</Btn>
              </div>
              {aiInsight
                ? <p style={{ color: "#ccc", lineHeight: 1.8, fontSize: 13, margin: 0 }}>{aiInsight}</p>
                : <p style={{ color: "#444", fontSize: 12, margin: 0, fontStyle: "italic" }}>Hit "GET BRIEF" for your personalized AI money coach insight.</p>
              }
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Btn onClick={() => { setModal("balance"); setForm({ bank: data.bankBalance, liquid: data.liquidCash, savings: data.savings }); }}>UPDATE BALANCES</Btn>
              <Btn onClick={exportJSON} color="#60a5fa">⬇ EXPORT JSON</Btn>
              <Btn onClick={exportCSV}  color="#a78bfa">⬇ SHIFTS CSV</Btn>
              <Btn onClick={() => importRef.current?.click()} color="#ffd700">⬆ IMPORT JSON</Btn>
            </div>
            <input ref={importRef} type="file" accept=".json" onChange={importJSON} style={{ display: "none" }} />
          </div>
        )}

        {/* ── SCHEDULE ──────────────────────────────────────────────────────── */}
        {tab === "schedule" && <ScheduleTab data={data} save={save} />}

        {/* ── SHIFTS ────────────────────────────────────────────────────────── */}
        {tab === "shifts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ color: "#a78bfa", fontSize: 11, letterSpacing: 2 }}>SERVING SHIFTS</div>
              <Btn onClick={() => { setModal("shift"); setForm({}); }} color="#a78bfa">+ LOG SHIFT</Btn>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {[...data.shifts].map((s, origIdx) => ({ s, origIdx })).reverse().map(({ s, origIdx }) => {
                const total  = s.tips + s.hours * s.wage;
                const hourly = total / s.hours;
                return (
                  <div key={origIdx} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ color: "#e8e8e8", fontWeight: 600, fontSize: 14 }}>{s.date}</div>
                        <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>{s.hours}hrs · ${s.wage}/hr · <span style={{ color: "#666" }}>${hourly.toFixed(2)}/hr eff.</span></div>
                        <div style={{ color: "#444", fontSize: 10, marginTop: 1 }}>tips: ${s.tips}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ color: "#a78bfa", fontSize: 20, fontWeight: 700, fontFamily: "monospace" }}>${Math.round(total)}</div>
                        <button onClick={() => openEditShift(origIdx)} style={{ background: "none", border: "1px solid #333", color: "#888", fontSize: 9, fontFamily: "monospace", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>EDIT</button>
                        <button onClick={() => deleteShift(origIdx)} style={{ background: "none", border: "1px solid #ff3b3b44", color: "#ff3b3b", fontSize: 11, fontFamily: "monospace", padding: "3px 8px", borderRadius: 4, cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
              {[
                { label: "TOTAL EARNED",  value: `$${Math.round(totalShiftEarnings).toLocaleString()}`, color: "#a78bfa" },
                { label: "AVG / SHIFT",   value: `$${data.shifts.length ? Math.round(totalShiftEarnings/data.shifts.length) : 0}`, color: "#ffd700" },
                { label: "BEST SHIFT",    value: data.shifts.length ? `$${Math.round(Math.max(...data.shifts.map(s=>s.tips+s.hours*s.wage)))}` : "$0", color: "#00ff88" },
                { label: "AVG $/HR",      value: data.shifts.length ? `$${(data.shifts.reduce((a,s)=>a+(s.tips+s.hours*s.wage)/s.hours,0)/data.shifts.length).toFixed(2)}` : "$0", color: "#60a5fa" },
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

        {/* ── FLIPS ─────────────────────────────────────────────────────────── */}
        {tab === "flips" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ color: "#ff8c00", fontSize: 11, letterSpacing: 2 }}>FLIP TRACKER</div>
              <Btn onClick={() => { setModal("flip"); setForm({ status: "listed" }); }} color="#ff8c00">+ ADD FLIP</Btn>
            </div>

            {/* Analytics panel */}
            {soldFlips.length > 0 && (
              <div style={{ background: "#0d0d0d", border: "1px solid #ff8c0022", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, marginBottom: 14 }}>FLIP ANALYTICS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
                  {[
                    { label: "TOTAL PROFIT",  value: `$${flipProfit}`,                          color: "#00ff88" },
                    { label: "FLIPS SOLD",    value: soldFlips.length,                          color: "#ff8c00" },
                    { label: "AVG ROI",       value: avgFlipROI ? `+${avgFlipROI}%` : "—",     color: "#ffd700" },
                    { label: "BEST FLIP",     value: bestFlip ? `+$${bestFlip.sold-bestFlip.bought}` : "—", color: "#a78bfa" },
                    { label: "ACTIVE",        value: data.flips.filter(f=>f.status!=="sold").length, color: "#38bdf8" },
                    { label: "TOTAL INVESTED",value: `$${data.flips.reduce((a,f)=>a+f.bought,0).toLocaleString()}`, color: "#555" },
                  ].map((s, i) => (
                    <div key={i}>
                      <div style={{ color: "#444", fontSize: 9, fontFamily: "monospace", letterSpacing: 1 }}>{s.label}</div>
                      <div style={{ color: s.color, fontSize: 18, fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                {bestFlip && (
                  <div style={{ marginTop: 14, borderTop: "1px solid #1a1a1a", paddingTop: 12, color: "#555", fontSize: 11, fontFamily: "monospace" }}>
                    🏆 Best flip: <span style={{ color: "#a78bfa" }}>{bestFlip.item}</span> — bought ${bestFlip.bought} sold ${bestFlip.sold} (+{((bestFlip.sold-bestFlip.bought)/bestFlip.bought*100).toFixed(0)}% ROI)
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "grid", gap: 10 }}>
              {data.flips.map((f, i) => {
                const profit = f.sold ? f.sold - f.bought : null;
                const roi    = profit ? ((profit / f.bought) * 100).toFixed(0) : null;
                return (
                  <div key={i} style={{ background: "#0d0d0d", border: `1px solid ${f.status==="sold" ? "#00ff8822" : "#1a1a1a"}`, borderRadius: 8, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ color: "#e8e8e8", fontWeight: 600 }}>{f.item}</div>
                      <div style={{ color: "#555", fontSize: 11, marginTop: 3 }}>Bought ${f.bought.toLocaleString()} {f.sold ? `→ Sold $${f.sold.toLocaleString()}` : "· Listed"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {profit !== null
                        ? <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#00ff88", fontSize: 18, fontWeight: 700 }}>+${profit}</div>
                            <div style={{ color: "#555", fontSize: 10 }}>+{roi}% ROI</div>
                          </div>
                        : <div style={{ color: "#ffd700", fontSize: 12, border: "1px solid #ffd70055", padding: "4px 10px", borderRadius: 4 }}>ACTIVE</div>
                      }
                      <button onClick={() => openEditFlip(i)} style={{ background: "none", border: "1px solid #333", color: "#888", fontSize: 9, fontFamily: "monospace", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>EDIT</button>
                      <button onClick={() => deleteFlip(i)} style={{ background: "none", border: "1px solid #ff3b3b44", color: "#ff3b3b", fontSize: 11, fontFamily: "monospace", padding: "3px 8px", borderRadius: 4, cursor: "pointer" }}>✕</button>
                    </div>
                  </div>
                );
              })}
              {data.flips.length === 0 && (
                <div style={{ color: "#333", fontFamily: "monospace", fontSize: 12, textAlign: "center", padding: "32px 0" }}>No flips yet. Add your first one above.</div>
              )}
            </div>
          </div>
        )}

        {/* ── STOCKS ────────────────────────────────────────────────────────── */}
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
                  <div key={i} style={{ background: "#0d0d0d", border: `1px solid ${pl>=0?"#00ff8822":"#ff3b3b22"}`, borderRadius: 8, padding: "14px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 18 }}>{s.ticker}</div>
                        <div style={{ color: "#555", fontSize: 11 }}>{s.name} · {s.shares} sh · avg ${s.buyPrice} → <span style={{ color: "#60a5fa" }}>${s.currentPrice}</span></div>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: "#e8e8e8", fontSize: 16, fontWeight: 700 }}>${value.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
                          <div style={{ color: pl>=0?"#00ff88":"#ff3b3b", fontSize: 12 }}>{pl>=0?"+":""}${Math.round(pl)} ({plPct}%)</div>
                        </div>
                        <button onClick={() => openEditStock(i)} style={{ background: "none", border: "1px solid #333", color: "#888", fontSize: 9, fontFamily: "monospace", padding: "4px 8px", borderRadius: 4, cursor: "pointer" }}>EDIT</button>
                        <button onClick={() => deleteStock(i)} style={{ background: "none", border: "1px solid #ff3b3b44", color: "#ff3b3b", fontSize: 11, fontFamily: "monospace", padding: "3px 8px", borderRadius: 4, cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 20, background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "14px 18px", display: "flex", gap: 32 }}>
              <div><div style={{ color: "#555", fontSize: 10 }}>PORTFOLIO VALUE</div><div style={{ color: "#60a5fa", fontSize: 18, fontWeight: 700 }}>${Math.round(stockValue).toLocaleString()}</div></div>
              <div><div style={{ color: "#555", fontSize: 10 }}>TOTAL P&L</div><div style={{ color: stockValue>=stockCost?"#00ff88":"#ff3b3b", fontSize: 18, fontWeight: 700 }}>{stockValue>=stockCost?"+":""}${Math.round(stockValue-stockCost).toLocaleString()}</div></div>
            </div>
          </div>
        )}

        {/* ── OPPORTUNITIES ─────────────────────────────────────────────────── */}
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

        {/* ── GOALS ─────────────────────────────────────────────────────────── */}
        {tab === "goals" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ color: "#e879f9", fontSize: 11, letterSpacing: 2 }}>FINANCIAL GOALS</div>
              <Btn onClick={() => { setForm({ autoKey: "none" }); setModal("goal"); }} color="#e879f9">+ ADD GOAL</Btn>
            </div>
            <div style={{ display: "grid", gap: 14 }}>
              {data.goals.map((g, i) => {
                const current = resolveGoalCurrent(g, data.bankBalance, stockValue, flipProfit);
                const pct     = Math.min(100, (current / g.target) * 100);
                const autoLabel = { bank: "auto · checking", stocks: "auto · portfolio", flips: "auto · flip profit" };
                return (
                  <div key={i} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "18px 22px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ color: "#e8e8e8", fontWeight: 600 }}>{g.name}</div>
                        {g.autoKey && <div style={{ color: "#444", fontSize: 9, fontFamily: "monospace", marginTop: 2 }}>{autoLabel[g.autoKey] || ""}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ color: "#555", fontSize: 12 }}>${current.toLocaleString(undefined,{maximumFractionDigits:0})} / ${g.target.toLocaleString()}</div>
                        <button onClick={() => openEditGoal(i)} style={{ background: "none", border: "1px solid #333", color: "#888", fontSize: 9, fontFamily: "monospace", padding: "3px 8px", borderRadius: 4, cursor: "pointer" }}>EDIT</button>
                        <button onClick={() => deleteGoal(i)} style={{ background: "none", border: "1px solid #ff3b3b44", color: "#ff3b3b", fontSize: 11, fontFamily: "monospace", padding: "2px 7px", borderRadius: 4, cursor: "pointer" }}>✕</button>
                      </div>
                    </div>
                    <div style={{ background: "#1a1a1a", borderRadius: 4, height: 8, overflow: "hidden" }}>
                      <div style={{ background: pct >= 100 ? "#00ff88" : "#e879f9", width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.5s" }} />
                    </div>
                    <div style={{ color: "#555", fontSize: 10, marginTop: 6 }}>{pct.toFixed(0)}% complete · ${Math.max(0, g.target - current).toLocaleString(undefined,{maximumFractionDigits:0})} to go</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── BUDGET ────────────────────────────────────────────────────────── */}
        {tab === "budget" && <BudgetTab data={data} save={save} />}

      </div>

      {/* ── FAB ─────────────────────────────────────────────────────────────── */}
      <FAB onAction={handleFAB} />

      {/* ── MODALS ──────────────────────────────────────────────────────────── */}

      {modal === "shift" && (
        <Modal title={form._editIdx !== undefined ? "EDIT SHIFT" : "LOG SHIFT"} onClose={() => setModal(null)}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: "#666", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Date</label>
            <input type="date" value={form.rawDate || ""}
              onChange={e => {
                const raw = e.target.value;
                if (!raw) { setForm({ ...form, rawDate: "", date: "" }); return; }
                const [y, m, d] = raw.split("-");
                const label = new Date(+y, +m-1, +d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
                setForm({ ...form, rawDate: raw, date: label });
              }}
              style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, padding: "9px 12px", color: "#e8e8e8", fontFamily: "monospace", fontSize: 13, outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
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
                <span style={{ color: "#a78bfa", fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}>${Math.max(0, +form.total - +form.hours * HOURLY_WAGE).toFixed(2)}</span>
              </div>
            </div>
          )}
          {form._error && <div style={{ color: "#ff3b3b", fontSize: 11, fontFamily: "monospace", textAlign: "center", marginBottom: 10, padding: "8px", background: "#ff3b3b11", borderRadius: 6, border: "1px solid #ff3b3b33" }}>⚠ {form._error}</div>}
          <Btn onClick={addShift} style={{ width: "100%", marginTop: 4, opacity: (form.date && form.hours && form.total) ? 1 : 0.5 }}>
            {form._editIdx !== undefined ? "SAVE CHANGES" : "LOG SHIFT"}
          </Btn>
        </Modal>
      )}

      {modal === "flip" && (
        <Modal title={form._editIdx !== undefined ? "EDIT FLIP" : "ADD FLIP"} onClose={() => setModal(null)}>
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
          <Btn onClick={saveFlip} color="#ff8c00" style={{ width: "100%", marginTop: 8 }}>{form._editIdx !== undefined ? "SAVE CHANGES" : "ADD FLIP"}</Btn>
        </Modal>
      )}

      {modal === "stock" && (
        <Modal title={form._editIdx !== undefined ? "EDIT POSITION" : "ADD POSITION"} onClose={() => setModal(null)}>
          <Input label="Ticker" value={form.ticker || ""} onChange={v => setForm({ ...form, ticker: v })} placeholder="NVDA" />
          <Input label="Name / Description" value={form.name || ""} onChange={v => setForm({ ...form, name: v })} placeholder="Nvidia Corp" />
          <Input label="Shares" type="number" value={form.shares || ""} onChange={v => setForm({ ...form, shares: v })} placeholder="2" />
          <Input label="Avg Buy Price ($)" type="number" value={form.buyPrice || ""} onChange={v => setForm({ ...form, buyPrice: v })} placeholder="480" />
          <Input label="Current Price ($)" type="number" value={form.currentPrice || ""} onChange={v => setForm({ ...form, currentPrice: v })} placeholder="875" />
          <Btn onClick={saveStock} color="#60a5fa" style={{ width: "100%", marginTop: 8 }}>{form._editIdx !== undefined ? "SAVE CHANGES" : "ADD POSITION"}</Btn>
        </Modal>
      )}

      {modal === "goal" && (
        <Modal title={form._editIdx !== undefined ? "EDIT GOAL" : "ADD GOAL"} onClose={() => setModal(null)}>
          <Input label="Goal Name" value={form.name || ""} onChange={v => setForm({ ...form, name: v })} placeholder="New Car Fund" />
          <Input label="Target Amount ($)" type="number" value={form.target || ""} onChange={v => setForm({ ...form, target: v })} placeholder="5000" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: "#666", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Auto-sync Progress From</label>
            <select value={form.autoKey || "none"} onChange={e => setForm({ ...form, autoKey: e.target.value })}
              style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, padding: "9px 12px", color: "#e8e8e8", fontFamily: "monospace", fontSize: 13, outline: "none" }}>
              <option value="none">Manual (enter below)</option>
              <option value="bank">Checking Balance</option>
              <option value="stocks">Stock Portfolio Value</option>
              <option value="flips">Total Flip Profit</option>
            </select>
          </div>
          {(!form.autoKey || form.autoKey === "none") && (
            <Input label="Current Amount ($)" type="number" value={form.current || ""} onChange={v => setForm({ ...form, current: v })} placeholder="0" />
          )}
          <Btn onClick={saveGoal} color="#e879f9" style={{ width: "100%", marginTop: 8 }}>{form._editIdx !== undefined ? "SAVE CHANGES" : "ADD GOAL"}</Btn>
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

      {/* Budget expense quick-add from FAB */}
      {modal === "expense" && (
        <Modal title="ADD EXPENSE" onClose={() => setModal(null)}>
          <Input label="Description" value={form.desc || ""} onChange={v => setForm({ ...form, desc: v })} placeholder="Groceries at Fry's" />
          <Input label="Amount ($)" type="number" value={form.amount || ""} onChange={v => setForm({ ...form, amount: v })} placeholder="47.50" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: "#666", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Category</label>
            <select value={form.category || "Food & Dining"} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, padding: "9px 12px", color: "#e8e8e8", fontFamily: "monospace", fontSize: 13, outline: "none" }}>
              {["Food & Dining","Transportation","Entertainment","Shopping","Bills & Utilities","Other"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Btn onClick={() => {
            const { desc, amount, category } = form;
            if (!desc || !amount) return;
            const now = new Date();
            const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
            const exp = { id: Date.now(), desc, amount: +amount, category: category || "Other", date: now.toLocaleDateString("en-US",{month:"short",day:"numeric"}), month: monthKey };
            save({ ...data, expenses: [...(data.expenses||[]), exp] });
            setModal(null); setForm({});
          }} color="#34d399" style={{ width: "100%", marginTop: 8 }}>ADD EXPENSE</Btn>
        </Modal>
      )}
    </div>
  );
}
