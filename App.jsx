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

const resolveGoalCurrent = (g, bankBalance, stockValue, flipProfit) => {
  if (g.autoKey === "bank")   return bankBalance;
  if (g.autoKey === "stocks") return stockValue;
  if (g.autoKey === "flips")  return flipProfit;
  return g.current;
};

// Parse "Mar 3" style date label into a Date object (current year)
const parseDateLabel = (label, year) => {
  const d = new Date(`${label} ${year}`);
  return isNaN(d.getTime()) ? null : d;
};

export default function App() {
  const [data,        setData]        = useState(null);
  const [tab,         setTab]         = useState("overview");
  const [modal,       setModal]       = useState(null);
  const [form,        setForm]        = useState({});
  const [loading,     setLoading]     = useState(true);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiInsight,   setAiInsight]   = useState("");
  const [syncLoading,      setSyncLoading]      = useState(false);
  const [lastSynced,       setLastSynced]       = useState(null);
  const [filterDay,        setFilterDay]        = useState(null);
  const [priceAlerts,      setPriceAlerts]      = useState([]);
  const [showBackupPrompt, setShowBackupPrompt] = useState(false);
  const importRef       = useRef(null);
  const lastSyncedMsRef = useRef(null);

  useEffect(() => {
    (async () => {
      let d = await S.get("fcc-data") || defaultState;

      if (d.shifts.some(s => s.wage === 0)) {
        d = { ...d, shifts: d.shifts.map(s => s.wage === 0 ? { ...s, wage: HOURLY_WAGE } : s) };
      }

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

      const todayLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const currentNW  = d.bankBalance + (d.savings || 0) + d.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0);
      const history    = d.netWorthHistory || [];
      const lastEntry  = history[history.length - 1];
      if (!lastEntry || lastEntry.date !== todayLabel) {
        d = { ...d, netWorthHistory: [...history.slice(-29), { date: todayLabel, value: Math.round(currentNW) }] };
      } else {
        d = { ...d, netWorthHistory: [...history.slice(0, -1), { date: todayLabel, value: Math.round(currentNW) }] };
      }

      const currentBal = Math.round(d.bankBalance + (d.savings || 0));
      const balHistory = d.balanceHistory || [];
      const lastBal    = balHistory[balHistory.length - 1];
      if (!lastBal || lastBal.date !== todayLabel) {
        d = { ...d, balanceHistory: [...balHistory.slice(-29), { date: todayLabel, value: currentBal }] };
      } else {
        d = { ...d, balanceHistory: [...balHistory.slice(0, -1), { date: todayLabel, value: currentBal }] };
      }

      const currentStk = Math.round(d.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0));
      const stkHistory = d.stockHistory || [];
      const lastStk    = stkHistory[stkHistory.length - 1];
      if (!lastStk || lastStk.date !== todayLabel) {
        d = { ...d, stockHistory: [...stkHistory.slice(-29), { date: todayLabel, value: currentStk }] };
      } else {
        d = { ...d, stockHistory: [...stkHistory.slice(0, -1), { date: todayLabel, value: currentStk }] };
      }

      await S.set("fcc-data", d);
      setData(d);
      setLoading(false);
    })();
  }, []);

  // Backup prompt: show if never backed up or >7 days ago
  useEffect(() => {
    const last = localStorage.getItem("cc-last-backup");
    if (!last) { setShowBackupPrompt(true); return; }
    const daysSince = (Date.now() - new Date(last).getTime()) / 86400000;
    if (daysSince >= 7) setShowBackupPrompt(true);
  }, []);

  // Auto-sync stocks when navigating to stocks tab if prices are stale (>1hr)
  useEffect(() => {
    if (tab !== "stocks" || !data || syncLoading) return;
    const isStale = !lastSyncedMsRef.current || (Date.now() - lastSyncedMsRef.current > 3600000);
    if (isStale) syncStockPrices();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(async (newData) => {
    const lbl    = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const curNW  = Math.round(newData.bankBalance + (newData.savings || 0) + newData.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0));
    const curBal = Math.round(newData.bankBalance + (newData.savings || 0));
    const curStk = Math.round(newData.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0));

    const nwH = [...(newData.netWorthHistory || [])];
    if (nwH[nwH.length - 1]?.date === lbl) nwH[nwH.length - 1] = { date: lbl, value: curNW };
    else { nwH.push({ date: lbl, value: curNW }); if (nwH.length > 30) nwH.shift(); }

    const balH = [...(newData.balanceHistory || [])];
    if (balH[balH.length - 1]?.date === lbl) balH[balH.length - 1] = { date: lbl, value: curBal };
    else { balH.push({ date: lbl, value: curBal }); if (balH.length > 30) balH.shift(); }

    const stkH = [...(newData.stockHistory || [])];
    if (stkH[stkH.length - 1]?.date === lbl) stkH[stkH.length - 1] = { date: lbl, value: curStk };
    else { stkH.push({ date: lbl, value: curStk }); if (stkH.length > 30) stkH.shift(); }

    const d = { ...newData, netWorthHistory: nwH, balanceHistory: balH, stockHistory: stkH };
    setData(d);
    await S.set("fcc-data", d);
  }, []);

  const fetchAIInsight = useCallback(async (d) => {
    setAiLoading(true);
    setAiInsight("");
    const sv = d.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0);
    const nw = d.bankBalance + sv;
    const te = d.shifts.reduce((s, sh) => s + sh.tips + sh.hours * sh.wage, 0);
    const fp = d.flips.filter(f => f.status === "sold").reduce((s, f) => {
      const gross = f.sold - f.bought;
      return s + (gross - gross * (f.fees || 0) / 100);
    }, 0);
    try {
      const text = await gemini(
        "You are an aggressive, street-smart financial advisor for a server who flips items, trades stocks, and hustles. Be direct, specific, and bold. No generic advice. Short punchy paragraphs. Use numbers. No bullet points — write in flowing punchy prose like a financial coach text message. 3-4 sentences max.",
        `My financial snapshot: Checking $${d.bankBalance} (Desert Financial CU), Savings $${d.savings||0}, Portfolio $${Math.round(sv)}, Net worth ~$${Math.round(nw)}, Shift income $${Math.round(te)}, Flip profits $${Math.round(fp)} (net of fees). Risk: AGGRESSIVE. Give me my weekly money brief and the single highest-leverage move I should make right now.`,
        1000
      );
      setAiInsight(text || "Unable to generate insight.");
    } catch { setAiInsight("AI insight unavailable — check connection."); }
    setAiLoading(false);
  }, []);

  // ── Stock price sync + alert check ──────────────────────────────────────────
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
      const triggered = updatedStocks.filter(s => s.alertBelow && s.currentPrice < s.alertBelow);
      setPriceAlerts(triggered);
      await save({ ...data, stocks: updatedStocks });
    }
    lastSyncedMsRef.current = Date.now();
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
        } else { alert("Invalid backup file."); }
      } catch { alert("Could not parse file."); }
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const dismissBackupPrompt = () => {
    localStorage.setItem("cc-last-backup", new Date().toISOString().split("T")[0]);
    setShowBackupPrompt(false);
  };

  if (loading || !data) return (
    <div style={{ background: "#080808", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#00ff88", fontFamily: "monospace", fontSize: 14, letterSpacing: 2 }}>
      LOADING COMMAND CENTER...
    </div>
  );

  // ── Core computed values ─────────────────────────────────────────────────────
  const now            = new Date();
  const thisYear       = now.getFullYear();
  const thisMonth      = now.getMonth();
  const currentMonthKey = `${thisYear}-${String(thisMonth + 1).padStart(2, "0")}`;
  const daysInMonth    = new Date(thisYear, thisMonth + 1, 0).getDate();
  const dayOfMonth     = now.getDate();
  const daysLeft       = daysInMonth - dayOfMonth;

  const stockValue         = data.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0);
  const stockCost          = data.stocks.reduce((s, st) => s + st.shares * st.buyPrice, 0);
  const netWorth           = data.bankBalance + (data.savings || 0) + stockValue;
  const totalShiftEarnings = data.shifts.reduce((s, sh) => s + sh.tips + sh.hours * (sh.wage || 0), 0);
  const avgTips            = data.shifts.length ? data.shifts.reduce((s, sh) => s + sh.tips, 0) / data.shifts.length : 0;
  const avgPerShift        = data.shifts.length ? totalShiftEarnings / data.shifts.length : 275;

  // Flip profit — net of platform fees
  const flipProfit = data.flips.filter(f => f.status === "sold" && f.sold).reduce((a, f) => {
    const gross = f.sold - f.bought;
    return a + (gross - gross * (f.fees || 0) / 100);
  }, 0);

  const opportunities = generateOpportunities(data.liquidCash);

  // ── Monthly P&L ─────────────────────────────────────────────────────────────
  const monthShifts = data.shifts.filter(s => {
    const d = parseDateLabel(s.date, thisYear);
    return d && d.getMonth() === thisMonth;
  });
  const monthShiftIncome = monthShifts.reduce((a, s) => a + s.tips + s.hours * s.wage, 0);

  const monthFlipIncome = data.flips.filter(f => {
    if (f.status !== "sold" || !f.sold || !f.soldDate) return false;
    const d = parseDateLabel(f.soldDate, thisYear);
    return d && d.getMonth() === thisMonth;
  }).reduce((a, f) => {
    const gross = f.sold - f.bought;
    return a + (gross - gross * (f.fees || 0) / 100);
  }, 0);

  const monthExpensesTotal = (data.expenses || [])
    .filter(e => e.month === currentMonthKey)
    .reduce((a, e) => a + e.amount, 0);

  const monthNetPL = monthShiftIncome + monthFlipIncome - monthExpensesTotal;

  // ── EOD cash projection ──────────────────────────────────────────────────────
  const totalBudgetLimit = Object.values(data.budget || {}).reduce((a, v) => a + v, 0);
  const projectedRemainingExpenses = totalBudgetLimit > 0
    ? Math.max(0, totalBudgetLimit - monthExpensesTotal)
    : dayOfMonth > 1 ? (monthExpensesTotal / dayOfMonth) * daysLeft : 0;
  const remainingMonthShifts = (data.schedule || []).filter(s => {
    if (s.logged) return false;
    const d = parseDateLabel(s.date, thisYear);
    return d && d.getMonth() === thisMonth && d >= now;
  });
  const projectedShiftIncome    = remainingMonthShifts.length * avgPerShift;
  const projectedEODBalance     = data.bankBalance + projectedShiftIncome - projectedRemainingExpenses;

  // ── Shift patterns by day of week ───────────────────────────────────────────
  const shiftByDay = {};
  data.shifts.forEach(s => {
    const d = parseDateLabel(s.date, thisYear);
    if (!d) return;
    const day = d.toLocaleDateString("en-US", { weekday: "short" });
    if (!shiftByDay[day]) shiftByDay[day] = { total: 0, count: 0 };
    shiftByDay[day].total += s.tips + s.hours * s.wage;
    shiftByDay[day].count++;
  });
  const dayEntries = Object.entries(shiftByDay)
    .map(([day, v]) => ({ day, avg: v.total / v.count, count: v.count, total: v.total }))
    .sort((a, b) => b.avg - a.avg);
  const maxDayAvg = dayEntries.length ? dayEntries[0].avg : 1;

  // ── Net worth velocity (daily gain over last 14 history points) ──────────────
  const nwDailyGain = (() => {
    const hist = data.netWorthHistory || [];
    if (hist.length < 2) return 0;
    const window = hist.slice(-14);
    const days   = window.length - 1;
    return days > 0 ? (window[window.length - 1].value - window[0].value) / days : 0;
  })();

  // ── Budget overspend warnings ─────────────────────────────────────────────────
  const overspendWarnings = daysLeft > 0
    ? Object.entries(data.budget || {}).reduce((acc, [cat, limit]) => {
        if (!limit) return acc;
        const spent = (data.expenses || [])
          .filter(e => e.month === currentMonthKey && e.category === cat)
          .reduce((a, e) => a + e.amount, 0);
        const pct = spent / limit;
        if (pct >= 0.8) acc.push({ cat, spent, limit, pct: (pct * 100).toFixed(0) });
        return acc;
      }, [])
    : [];

  // ── Flip analytics ───────────────────────────────────────────────────────────
  const soldFlips  = data.flips.filter(f => f.status === "sold" && f.sold);
  const avgFlipROI = soldFlips.length
    ? (soldFlips.reduce((a, f) => a + (f.sold - f.bought) / f.bought, 0) / soldFlips.length * 100).toFixed(0)
    : null;
  const bestFlip = soldFlips.length
    ? soldFlips.reduce((best, f) => (f.sold - f.bought) > (best.sold - best.bought) ? f : best, soldFlips[0])
    : null;

  // Avg days to sell (for flips that have both listedDate and soldDate)
  const avgDaysToSell = (() => {
    const timed = soldFlips.filter(f => f.listedDate && f.soldDate);
    if (!timed.length) return null;
    const total = timed.reduce((a, f) => {
      const d1 = new Date(`${f.listedDate} ${thisYear}`);
      const d2 = new Date(`${f.soldDate} ${thisYear}`);
      return a + Math.max(0, Math.round((d2 - d1) / 86400000));
    }, 0);
    return Math.round(total / timed.length);
  })();

  // ROI by flip category
  const flipsByCategory = soldFlips.reduce((acc, f) => {
    const cat = f.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = { profit: 0, count: 0, roiSum: 0 };
    const gross = f.sold - f.bought;
    acc[cat].profit  += gross - gross * (f.fees || 0) / 100;
    acc[cat].count++;
    acc[cat].roiSum  += (gross / f.bought) * 100;
    return acc;
  }, {});

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const toDateInput = (label) => {
    const d = parseDateLabel(label, thisYear);
    if (!d) return "";
    return `${thisYear}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  };

  const openEditShift = (idx) => {
    const s = data.shifts[idx];
    setForm({ rawDate: toDateInput(s.date), date: s.date, hours: String(s.hours), total: (s.tips + s.hours * s.wage).toFixed(2), _editIdx: idx });
    setModal("shift");
  };
  const deleteShift = (idx) => save({ ...data, shifts: data.shifts.filter((_, i) => i !== idx) });
  const addShift = () => {
    const { date, hours, total, _editIdx, _scheduleEntry } = form;
    if (!date || !hours || !total) { setForm({ ...form, _error: `Missing: ${!date ? "date" : !hours ? "hours worked" : "total made today"}` }); return; }
    const tips     = Math.max(0, +total - +hours * HOURLY_WAGE);
    const newShift = { date, hours: +hours, tips: +tips.toFixed(2), wage: HOURLY_WAGE };
    const newShifts = _editIdx !== undefined
      ? data.shifts.map((s, i) => i === _editIdx ? newShift : s)
      : [...data.shifts, newShift];
    const newHistory = [...data.netWorthHistory];
    if (_editIdx === undefined) {
      const today = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const last  = newHistory[newHistory.length - 1];
      if (last) newHistory[newHistory.length - 1] = { ...last, date: today, value: last.value + +total };
    }
    // If launched from schedule LOG button, mark that schedule entry as logged
    const newSchedule = (_scheduleEntry && _editIdx === undefined)
      ? data.schedule.map(s =>
          s.date === _scheduleEntry.date && s.time === _scheduleEntry.time ? { ...s, logged: true } : s
        )
      : data.schedule;
    save({ ...data, shifts: newShifts, netWorthHistory: newHistory, schedule: newSchedule });
    setModal(null); setForm({});
  };

  const openEditFlip = (idx) => {
    const f = data.flips[idx];
    setForm({ item: f.item, bought: String(f.bought), sold: f.sold ? String(f.sold) : "", status: f.status, fees: f.fees ? String(f.fees) : "", category: f.category || "", listedDate: f.listedDate || "", _editIdx: idx });
    setModal("flip");
  };
  const deleteFlip = (idx) => save({ ...data, flips: data.flips.filter((_, i) => i !== idx) });
  const saveFlip = () => {
    const { item, bought, sold, status, fees, category, _editIdx } = form;
    if (!item || !bought) return;
    const existing   = _editIdx !== undefined ? data.flips[_editIdx] : null;
    const soldDate   = (status === "sold" && (!existing || existing.status !== "sold"))
      ? now.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : (existing?.soldDate || null);
    const listedDate = existing?.listedDate
      || now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const flip     = { item, bought: +bought, sold: sold ? +sold : null, status: status || "listed", fees: fees ? +fees : 0, soldDate, listedDate, category: category || null };
    const newFlips = _editIdx !== undefined
      ? data.flips.map((f, i) => i === _editIdx ? flip : f)
      : [...data.flips, flip];
    save({ ...data, flips: newFlips });
    setModal(null); setForm({});
  };

  const openEditStock = (idx) => {
    const s = data.stocks[idx];
    setForm({ ticker: s.ticker, name: s.name || "", shares: String(s.shares), buyPrice: String(s.buyPrice), currentPrice: String(s.currentPrice), alertBelow: s.alertBelow ? String(s.alertBelow) : "", _editIdx: idx });
    setModal("stock");
  };
  const deleteStock = (idx) => save({ ...data, stocks: data.stocks.filter((_, i) => i !== idx) });
  const saveStock = () => {
    const { ticker, name, shares, buyPrice, currentPrice, alertBelow, _editIdx } = form;
    if (!ticker || !shares || !buyPrice || !currentPrice) return;
    const stock     = { ticker: ticker.toUpperCase(), name: name || ticker.toUpperCase(), shares: +shares, buyPrice: +buyPrice, currentPrice: +currentPrice, alertBelow: alertBelow ? +alertBelow : null };
    const newStocks = _editIdx !== undefined
      ? data.stocks.map((s, i) => i === _editIdx ? stock : s)
      : [...data.stocks, stock];
    save({ ...data, stocks: newStocks });
    setModal(null); setForm({});
  };

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

  const updateBalance = () => {
    const { bank, liquid, savings } = form;
    save({ ...data, bankBalance: +(bank || data.bankBalance), liquidCash: +(liquid || data.liquidCash), savings: +(savings || data.savings || 0) });
    setModal(null); setForm({});
  };

  const handleFAB = (key) => {
    if (key === "shift")   { setTab("shifts");  setModal("shift");   setForm({}); }
    if (key === "flip")    { setTab("flips");   setModal("flip");    setForm({ status: "listed" }); }
    if (key === "expense") { setTab("budget");  setModal("expense"); setForm({ category: "Food & Dining" }); }
  };

  const startFlipFromOpp = (opp) => {
    setTab("flips");
    setForm({ item: opp.title, bought: opp.capital ? String(opp.capital) : "", status: "listed" });
    setModal("flip");
  };

  const logShiftFromSchedule = (schedShift) => {
    const rawDate = toDateInput(schedShift.date);
    setForm({ rawDate, date: schedShift.date, hours: "6", _scheduleEntry: { date: schedShift.date, time: schedShift.time } });
    setTab("shifts");
    setModal("shift");
  };

  // ── Select styles helper ─────────────────────────────────────────────────────
  const selStyle = { width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, padding: "9px 12px", color: "#e8e8e8", fontFamily: "monospace", fontSize: 13, outline: "none" };

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

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
              <StatCard label="Checking"    value={`$${data.bankBalance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`} sub="Desert Financial CU" accent="#00ff88" />
              <StatCard label="Savings"     value={`$${(data.savings||0).toFixed(2)}`} sub="Membership Savings" accent="#34d399" />
              <StatCard label="Portfolio"   value={`$${stockValue.toLocaleString(undefined,{maximumFractionDigits:0})}`} sub="CHPY · GDXY · TDAX" accent="#60a5fa" />
              <StatCard label="Flip Income" value={`$${Math.round(flipProfit)}`} sub="Realized net of fees" accent="#ff8c00" />
              <StatCard label="Shift Income" value={`$${Math.round(totalShiftEarnings).toLocaleString()}`} sub={`Avg $${Math.round(avgPerShift)}/shift · $${Math.round(avgTips)} tips`} accent="#a78bfa" />
            </div>

            {/* Backup prompt */}
            {showBackupPrompt && (
              <div style={{ background: "#ffd70010", border: "1px solid #ffd70044", borderRadius: 10, padding: "14px 18px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ color: "#ffd700", fontSize: 10, letterSpacing: 2, fontFamily: "monospace", marginBottom: 3 }}>⚠ WEEKLY BACKUP REMINDER</div>
                  <div style={{ color: "#666", fontSize: 11, fontFamily: "monospace" }}>Export your data so you never lose it.</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn onClick={() => { exportJSON(); dismissBackupPrompt(); }} color="#ffd700" style={{ fontSize: 10 }}>⬇ EXPORT NOW</Btn>
                  <button onClick={dismissBackupPrompt} style={{ background: "none", border: "1px solid #333", color: "#555", fontSize: 10, fontFamily: "monospace", padding: "6px 12px", borderRadius: 4, cursor: "pointer" }}>DISMISS 7d</button>
                </div>
              </div>
            )}

            {/* Overspend warnings */}
            {overspendWarnings.length > 0 && (
              <div style={{ background: "#ff3b3b08", border: "1px solid #ff3b3b33", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
                <div style={{ color: "#ff3b3b", fontSize: 10, letterSpacing: 2, fontFamily: "monospace", marginBottom: 10 }}>⚠ BUDGET WARNINGS · {daysLeft} DAYS LEFT IN MONTH</div>
                {overspendWarnings.map(({ cat, spent, limit, pct }) => (
                  <div key={cat} style={{ color: +pct >= 100 ? "#ff3b3b" : "#ff8c00", fontFamily: "monospace", fontSize: 12, marginBottom: 4 }}>
                    {cat}: ${spent.toFixed(0)} / ${limit} ({pct}%){+pct >= 100 ? " — OVER BUDGET" : " — approaching limit"}
                  </div>
                ))}
              </div>
            )}

            {/* Monthly P&L */}
            <div style={{ background: "#0d0d0d", border: "1px solid #00ff8818", borderRadius: 10, padding: "18px 20px", marginBottom: 20 }}>
              <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, marginBottom: 14 }}>
                MONTHLY P&L · {now.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase()}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                {[
                  { label: "SHIFT INCOME", value: `+$${Math.round(monthShiftIncome).toLocaleString()}`, color: "#a78bfa" },
                  { label: "FLIP INCOME",  value: `+$${Math.round(monthFlipIncome).toLocaleString()}`,  color: "#ff8c00", sub: monthFlipIncome === 0 ? "no sales w/ date yet" : null },
                  { label: "EXPENSES",     value: `-$${Math.round(monthExpensesTotal).toLocaleString()}`, color: "#ff3b3b" },
                  { label: "NET",          value: `${monthNetPL >= 0 ? "+" : ""}$${Math.round(monthNetPL).toLocaleString()}`, color: monthNetPL >= 0 ? "#00ff88" : "#ff3b3b" },
                ].map((c, i) => (
                  <div key={i}>
                    <div style={{ color: "#444", fontSize: 9, fontFamily: "monospace", letterSpacing: 1, marginBottom: 6 }}>{c.label}</div>
                    <div style={{ color: c.color, fontSize: 20, fontWeight: 700, fontFamily: "monospace" }}>{c.value}</div>
                    {c.sub && <div style={{ color: "#333", fontSize: 9, fontFamily: "monospace", marginTop: 3 }}>{c.sub}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* EOD cash projection */}
            <div style={{ background: "#0d0d0d", border: "1px solid #60a5fa18", borderRadius: 10, padding: "18px 20px", marginBottom: 20, display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
              <div>
                <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, marginBottom: 8 }}>
                  END-OF-MONTH FORECAST · {daysLeft} DAYS LEFT
                </div>
                <div style={{ color: "#60a5fa", fontSize: 28, fontWeight: 700, fontFamily: "monospace" }}>
                  ${Math.round(projectedEODBalance).toLocaleString()}
                </div>
                <div style={{ color: "#444", fontSize: 10, fontFamily: "monospace", marginTop: 4 }}>projected checking balance</div>
              </div>
              <div style={{ borderLeft: "1px solid #1a1a1a", paddingLeft: 24, fontSize: 11, fontFamily: "monospace", lineHeight: 2, color: "#555" }}>
                <div>${data.bankBalance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} current</div>
                <div style={{ color: "#a78bfa" }}>+${Math.round(projectedShiftIncome)} from {remainingMonthShifts.length} shifts (${Math.round(avgPerShift)} avg)</div>
                <div style={{ color: "#ff3b3b" }}>−${Math.round(projectedRemainingExpenses)} est. remaining spend</div>
              </div>
            </div>

            <ChartPanel data={data} stockValue={stockValue} totalShiftEarnings={totalShiftEarnings} netWorth={netWorth} />
            <DollarDeployer data={data} netWorth={netWorth} avgTips={avgTips} />
            <AlertsFeed liquid={data.liquidCash || data.bankBalance} onStartFlip={startFlipFromOpp} />

            {/* AI Brief */}
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
        {tab === "schedule" && <ScheduleTab data={data} save={save} onLogShift={logShiftFromSchedule} />}

        {/* ── SHIFTS ────────────────────────────────────────────────────────── */}
        {tab === "shifts" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ color: "#a78bfa", fontSize: 11, letterSpacing: 2 }}>SERVING SHIFTS</div>
              <Btn onClick={() => { setModal("shift"); setForm({}); }} color="#a78bfa">+ LOG SHIFT</Btn>
            </div>

            {/* Shift pattern insights — days are clickable to filter */}
            {dayEntries.length > 0 && (
              <div style={{ background: "#0d0d0d", border: "1px solid #a78bfa22", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, marginBottom: 14 }}>
                  EARNINGS BY DAY · avg per shift · {filterDay ? <span style={{ color: "#a78bfa" }}>tap again to clear</span> : "tap a day to filter"}
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {dayEntries.map(({ day, avg, count }) => {
                    const pct      = (avg / maxDayAvg) * 100;
                    const active   = filterDay === day;
                    const dimmed   = filterDay && !active;
                    return (
                      <div key={day} onClick={() => setFilterDay(active ? null : day)}
                        style={{ cursor: "pointer", opacity: dimmed ? 0.35 : 1, transition: "opacity 0.2s" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <div style={{ color: active ? "#fff" : "#a78bfa", fontSize: 11, fontFamily: "monospace", fontWeight: active ? 700 : 400 }}>
                            {active ? "▶ " : ""}{day}
                          </div>
                          <div style={{ color: "#e8e8e8", fontSize: 11, fontFamily: "monospace" }}>${Math.round(avg)} avg · {count} shift{count !== 1 ? "s" : ""}</div>
                        </div>
                        <div style={{ background: "#1a1a1a", borderRadius: 3, height: active ? 8 : 6, transition: "height 0.2s" }}>
                          <div style={{ background: active ? "linear-gradient(90deg, #fff, #a78bfa)" : "linear-gradient(90deg, #a78bfa, #7c3aed)", width: `${pct}%`, height: "100%", borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {dayEntries.length > 0 && (
                  <div style={{ marginTop: 12, color: "#444", fontSize: 10, fontFamily: "monospace" }}>
                    🏆 Best day: <span style={{ color: "#a78bfa" }}>{dayEntries[0].day}</span> averaging ${Math.round(dayEntries[0].avg)}/shift
                    {data.shifts.length >= 4 && (() => {
                      const last4  = data.shifts.slice(-4).reduce((a, s) => a + s.tips + s.hours * s.wage, 0) / 4;
                      const prior4 = data.shifts.slice(-8, -4).reduce((a, s) => a + s.tips + s.hours * s.wage, 0) / Math.max(1, data.shifts.slice(-8,-4).length);
                      const delta  = last4 - prior4;
                      return (
                        <span style={{ color: delta >= 0 ? "#00ff88" : "#ff3b3b", marginLeft: 12 }}>
                          {delta >= 0 ? "▲" : "▼"} ${Math.abs(Math.round(delta))} vs prior 4
                        </span>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Shift log — sorted chronologically, grouped by day-of-week */}
            {(() => {
              // Sort by date, newest first
              const sorted = [...data.shifts]
                .map((s, origIdx) => ({ s, origIdx }))
                .sort((a, b) => {
                  const da = parseDateLabel(a.s.date, thisYear) || new Date(0);
                  const db = parseDateLabel(b.s.date, thisYear) || new Date(0);
                  return db - da;
                });

              const getDOW = (dateStr) => {
                const d = parseDateLabel(dateStr, thisYear);
                return d ? d.toLocaleDateString("en-US", { weekday: "long" }) : null;
              };

              if (filterDay) {
                // Filter mode: show only shifts matching the selected day, grouped under a big header
                const fullDay = { Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday" };
                const fullName = fullDay[filterDay] || filterDay;
                const filtered = sorted.filter(({ s }) => getDOW(s.date) === fullName);
                return (
                  <div>
                    <div style={{ textAlign: "center", padding: "16px 0 20px", borderBottom: "1px solid #1a1a1a", marginBottom: 16 }}>
                      <div style={{ color: "#a78bfa", fontSize: 32, fontWeight: 900, fontFamily: "monospace", letterSpacing: 4 }}>{fullName.toUpperCase()}</div>
                      <div style={{ color: "#444", fontSize: 10, fontFamily: "monospace", marginTop: 4 }}>{filtered.length} shift{filtered.length !== 1 ? "s" : ""} logged</div>
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {filtered.map(({ s, origIdx }) => {
                        const total     = s.tips + s.hours * s.wage;
                        const hourly    = total / s.hours;
                        const scheduled = (data.schedule || []).find(sc => sc.date === s.date);
                        return (
                          <div key={origIdx} style={{ background: "#0d0d0d", border: "1px solid #a78bfa22", borderRadius: 8, padding: "12px 16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ color: "#e8e8e8", fontWeight: 600, fontSize: 14 }}>{s.date}</div>
                                <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>{s.hours}hrs · ${s.wage}/hr · <span style={{ color: "#666" }}>${hourly.toFixed(2)}/hr eff.</span></div>
                                <div style={{ color: "#444", fontSize: 10, marginTop: 1 }}>tips: ${s.tips}</div>
                                {scheduled?.time && <div style={{ color: "#38bdf8", fontSize: 10, fontFamily: "monospace", marginTop: 2 }}>shift: {scheduled.time}</div>}
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
                  </div>
                );
              }

              // Default mode: chronological with day-of-week dividers
              const items = [];
              let lastDOW = null;
              sorted.forEach(({ s, origIdx }) => {
                const dow = getDOW(s.date);
                if (dow && dow !== lastDOW) {
                  items.push({ type: "divider", dow });
                  lastDOW = dow;
                }
                items.push({ type: "shift", s, origIdx });
              });

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {items.map((item, i) => {
                    if (item.type === "divider") {
                      return (
                        <div key={`div-${i}`} style={{ textAlign: "center", padding: "12px 0 4px" }}>
                          <div style={{ color: "#a78bfa", fontSize: 22, fontWeight: 900, fontFamily: "monospace", letterSpacing: 3, opacity: 0.7 }}>
                            {item.dow.toUpperCase()}
                          </div>
                          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #a78bfa44, transparent)", marginTop: 6 }} />
                        </div>
                      );
                    }
                    const { s, origIdx } = item;
                    const total     = s.tips + s.hours * s.wage;
                    const hourly    = total / s.hours;
                    const scheduled = (data.schedule || []).find(sc => sc.date === s.date);
                    return (
                      <div key={origIdx} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ color: "#e8e8e8", fontWeight: 600, fontSize: 14 }}>{s.date}</div>
                            <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>{s.hours}hrs · ${s.wage}/hr · <span style={{ color: "#666" }}>${hourly.toFixed(2)}/hr eff.</span></div>
                            <div style={{ color: "#444", fontSize: 10, marginTop: 1 }}>tips: ${s.tips}</div>
                            {scheduled?.time && <div style={{ color: "#38bdf8", fontSize: 10, fontFamily: "monospace", marginTop: 2 }}>shift: {scheduled.time}</div>}
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
              );
            })()}

            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
              {[
                { label: "TOTAL EARNED",  value: `$${Math.round(totalShiftEarnings).toLocaleString()}`, color: "#a78bfa" },
                { label: "AVG / SHIFT",   value: `$${data.shifts.length ? Math.round(avgPerShift) : 0}`, color: "#ffd700" },
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

            {soldFlips.length > 0 && (
              <div style={{ background: "#0d0d0d", border: "1px solid #ff8c0022", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
                <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, marginBottom: 14 }}>FLIP ANALYTICS · NET OF FEES</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
                  {[
                    { label: "NET PROFIT",      value: `$${Math.round(flipProfit)}`,                          color: "#00ff88" },
                    { label: "FLIPS SOLD",      value: soldFlips.length,                                      color: "#ff8c00" },
                    { label: "AVG ROI",         value: avgFlipROI ? `+${avgFlipROI}%` : "—",                 color: "#ffd700" },
                    { label: "BEST FLIP",       value: bestFlip ? `+$${bestFlip.sold-bestFlip.bought}` : "—", color: "#a78bfa" },
                    { label: "AVG DAYS TO SELL",value: avgDaysToSell !== null ? `${avgDaysToSell}d` : "—",    color: "#38bdf8" },
                    { label: "ACTIVE",          value: data.flips.filter(f=>f.status!=="sold").length,        color: "#60a5fa" },
                  ].map((s, i) => (
                    <div key={i}>
                      <div style={{ color: "#444", fontSize: 9, fontFamily: "monospace", letterSpacing: 1 }}>{s.label}</div>
                      <div style={{ color: s.color, fontSize: 18, fontWeight: 700, fontFamily: "monospace", marginTop: 4 }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                {bestFlip && (
                  <div style={{ marginTop: 14, borderTop: "1px solid #1a1a1a", paddingTop: 12, color: "#555", fontSize: 11, fontFamily: "monospace" }}>
                    🏆 Best: <span style={{ color: "#a78bfa" }}>{bestFlip.item}</span> — ${bestFlip.bought} → ${bestFlip.sold} (+{((bestFlip.sold-bestFlip.bought)/bestFlip.bought*100).toFixed(0)}% ROI{bestFlip.fees ? `, ${bestFlip.fees}% fee` : ""})
                  </div>
                )}
                {Object.keys(flipsByCategory).length > 0 && (
                  <div style={{ marginTop: 14, borderTop: "1px solid #1a1a1a", paddingTop: 12 }}>
                    <div style={{ color: "#333", fontSize: 9, letterSpacing: 2, fontFamily: "monospace", marginBottom: 8 }}>ROI BY CATEGORY</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {Object.entries(flipsByCategory).map(([cat, v]) => (
                        <div key={cat} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 5, padding: "6px 10px" }}>
                          <div style={{ color: "#ff8c00", fontSize: 9, fontFamily: "monospace" }}>{cat}</div>
                          <div style={{ color: "#e8e8e8", fontSize: 13, fontWeight: 700, fontFamily: "monospace" }}>${Math.round(v.profit)}</div>
                          <div style={{ color: "#555", fontSize: 9, fontFamily: "monospace" }}>+{(v.roiSum/v.count).toFixed(0)}% avg · {v.count} sold</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "grid", gap: 10 }}>
              {data.flips.map((f, i) => {
                const gross      = f.sold ? f.sold - f.bought : null;
                const net        = gross !== null ? gross - gross * (f.fees || 0) / 100 : null;
                const roi        = gross !== null ? ((gross / f.bought) * 100).toFixed(0) : null;
                const hasFee     = f.fees && f.fees > 0;
                const daysListed = (f.listedDate && f.status !== "sold") ? (() => {
                  const d = new Date(`${f.listedDate} ${thisYear}`);
                  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
                })() : null;
                const isStale = daysListed !== null && daysListed > 30;
                return (
                  <div key={i} style={{ background: "#0d0d0d", border: `1px solid ${isStale ? "#ff3b3b44" : f.status==="sold" ? "#00ff8822" : "#1a1a1a"}`, borderRadius: 8, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <div style={{ color: "#e8e8e8", fontWeight: 600 }}>{f.item}</div>
                        {f.category && <span style={{ color: "#38bdf8", fontSize: 9, fontFamily: "monospace", border: "1px solid #38bdf844", padding: "1px 6px", borderRadius: 3 }}>{f.category}</span>}
                        {daysListed !== null && <span style={{ color: isStale ? "#ff3b3b" : "#444", fontSize: 9, fontFamily: "monospace", border: `1px solid ${isStale ? "#ff3b3b44" : "#33333344"}`, padding: "1px 6px", borderRadius: 3 }}>{daysListed}d{isStale ? " STALE" : ""}</span>}
                      </div>
                      <div style={{ color: "#555", fontSize: 11, marginTop: 3 }}>
                        Bought ${f.bought.toLocaleString()} {f.sold ? `→ Sold $${f.sold.toLocaleString()}` : "· Listed"}
                        {hasFee && <span style={{ color: "#444" }}> · {f.fees}% fee</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {net !== null
                        ? <div style={{ textAlign: "right" }}>
                            <div style={{ color: "#00ff88", fontSize: 18, fontWeight: 700 }}>+${Math.round(net)}</div>
                            <div style={{ color: "#555", fontSize: 10 }}>+{roi}% ROI{hasFee ? <span style={{ color: "#444" }}> (gross +${Math.round(gross)})</span> : ""}</div>
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
            {/* Price alert banner */}
            {priceAlerts.length > 0 && (
              <div style={{ background: "#ff3b3b11", border: "1px solid #ff3b3b44", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
                <div style={{ color: "#ff3b3b", fontSize: 10, letterSpacing: 2, fontFamily: "monospace", marginBottom: 6 }}>⚠ PRICE ALERT</div>
                {priceAlerts.map((s, i) => (
                  <div key={i} style={{ color: "#ff8c00", fontFamily: "monospace", fontSize: 12 }}>
                    {s.ticker} is ${s.currentPrice.toFixed(2)} — below your alert of ${s.alertBelow}
                  </div>
                ))}
              </div>
            )}

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
                const value     = s.shares * s.currentPrice;
                const cost      = s.shares * s.buyPrice;
                const pl        = value - cost;
                const plPct     = ((pl / cost) * 100).toFixed(1);
                const isAlerted = s.alertBelow && s.currentPrice < s.alertBelow;
                return (
                  <div key={i} style={{ background: "#0d0d0d", border: `1px solid ${isAlerted ? "#ff3b3b55" : pl>=0?"#00ff8822":"#ff3b3b22"}`, borderRadius: 8, padding: "14px 18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 18 }}>{s.ticker}</div>
                          {isAlerted && <span style={{ color: "#ff3b3b", fontSize: 9, fontFamily: "monospace", border: "1px solid #ff3b3b44", padding: "1px 6px", borderRadius: 3 }}>⚠ ALERT</span>}
                          {s.alertBelow && !isAlerted && <span style={{ color: "#444", fontSize: 9, fontFamily: "monospace" }}>alert ↓${s.alertBelow}</span>}
                        </div>
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
              {opportunities.map((o, i) => <OpportunityCard key={i} opp={o} onStartFlip={startFlipFromOpp} />)}
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
                const current   = resolveGoalCurrent(g, data.bankBalance, stockValue, flipProfit);
                const pct       = Math.min(100, (current / g.target) * 100);
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
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                      <div style={{ color: "#555", fontSize: 10 }}>{pct.toFixed(0)}% complete · ${Math.max(0, g.target - current).toLocaleString(undefined,{maximumFractionDigits:0})} to go</div>
                      {(() => {
                        const remaining = Math.max(0, g.target - current);
                        if (pct >= 100) return <span style={{ color: "#00ff88", fontSize: 10, fontFamily: "monospace" }}>✓ REACHED</span>;
                        if (nwDailyGain <= 0 || remaining === 0) return null;
                        const days = remaining / nwDailyGain;
                        if (days > 365 * 3) return null;
                        const label = days < 7 ? `< 1 week` : days < 60 ? `~${Math.round(days / 7)}wk` : `~${Math.round(days / 30)}mo`;
                        return <span style={{ color: "#38bdf8", fontSize: 10, fontFamily: "monospace" }}>ETA {label}</span>;
                      })()}
                    </div>
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
          <Input label="Platform Fee % (e.g. 12.9 for eBay)" type="number" value={form.fees || ""} onChange={v => setForm({ ...form, fees: v })} placeholder="0" />
          {form.bought && form.sold && form.fees && (
            <div style={{ marginBottom: 14, background: "#0a0a0a", border: "1px solid #1a1a1a", borderRadius: 6, padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#555", fontSize: 11, fontFamily: "monospace" }}>Gross profit</span>
                <span style={{ color: "#555", fontFamily: "monospace", fontSize: 11 }}>${(+form.sold - +form.bought).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: "#555", fontSize: 11, fontFamily: "monospace" }}>Platform fee ({form.fees}%)</span>
                <span style={{ color: "#ff3b3b", fontFamily: "monospace", fontSize: 11 }}>-${((+form.sold - +form.bought) * +form.fees / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#00ff88", fontSize: 11, fontFamily: "monospace" }}>Net profit</span>
                <span style={{ color: "#00ff88", fontFamily: "monospace", fontSize: 11, fontWeight: 700 }}>${((+form.sold - +form.bought) * (1 - +form.fees / 100)).toFixed(2)}</span>
              </div>
            </div>
          )}
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: "#666", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Category</label>
            <select value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })} style={selStyle}>
              <option value="">— Select Category —</option>
              {["Shoes", "Electronics", "Clothing", "Collectibles", "Tickets", "Other"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: "#666", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Status</label>
            <select value={form.status || "listed"} onChange={e => setForm({ ...form, status: e.target.value })} style={selStyle}>
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
          <Input label="Alert Below Price ($) — optional" type="number" value={form.alertBelow || ""} onChange={v => setForm({ ...form, alertBelow: v })} placeholder="55.00" />
          <Btn onClick={saveStock} color="#60a5fa" style={{ width: "100%", marginTop: 8 }}>{form._editIdx !== undefined ? "SAVE CHANGES" : "ADD POSITION"}</Btn>
        </Modal>
      )}

      {modal === "goal" && (
        <Modal title={form._editIdx !== undefined ? "EDIT GOAL" : "ADD GOAL"} onClose={() => setModal(null)}>
          <Input label="Goal Name" value={form.name || ""} onChange={v => setForm({ ...form, name: v })} placeholder="New Car Fund" />
          <Input label="Target Amount ($)" type="number" value={form.target || ""} onChange={v => setForm({ ...form, target: v })} placeholder="5000" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: "#666", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Auto-sync Progress From</label>
            <select value={form.autoKey || "none"} onChange={e => setForm({ ...form, autoKey: e.target.value })} style={selStyle}>
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

      {modal === "expense" && (
        <Modal title="ADD EXPENSE" onClose={() => setModal(null)}>
          <Input label="Description" value={form.desc || ""} onChange={v => setForm({ ...form, desc: v })} placeholder="Groceries at Fry's" />
          <Input label="Amount ($)" type="number" value={form.amount || ""} onChange={v => setForm({ ...form, amount: v })} placeholder="47.50" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: "#666", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Category</label>
            <select value={form.category || "Food & Dining"} onChange={e => setForm({ ...form, category: e.target.value })} style={selStyle}>
              {["Food & Dining","Transportation","Entertainment","Shopping","Bills & Utilities","Other"].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Btn onClick={() => {
            const { desc, amount, category } = form;
            if (!desc || !amount) return;
            const n = new Date();
            const mk = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;
            const exp = { id: Date.now(), desc, amount: +amount, category: category || "Other", date: n.toLocaleDateString("en-US",{month:"short",day:"numeric"}), month: mk };
            save({ ...data, expenses: [...(data.expenses||[]), exp] });
            setModal(null); setForm({});
          }} color="#34d399" style={{ width: "100%", marginTop: 8 }}>ADD EXPENSE</Btn>
        </Modal>
      )}
    </div>
  );
}
