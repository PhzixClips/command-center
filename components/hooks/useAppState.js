import { useState, useEffect, useCallback, useRef } from "react";
import { gemini } from "../gemini.js";
import { S } from "../storage.js";
import { defaultState, generateOpportunities } from "../defaults.js";
import {
  DEFAULT_HOURLY_WAGE, DEFAULT_AVG_PER_SHIFT, AI_COOLDOWN_SECONDS,
  AI_INSIGHT_MAX_TOKENS, STOCK_STALE_THRESHOLD, BACKUP_REMINDER_DAYS,
  MS_PER_DAY, BUDGET_WARN_THRESHOLD, HISTORY_WINDOW,
} from "../constants.js";

const getHourlyWage = () => {
  const stored = localStorage.getItem("cc-hourly-wage");
  return stored ? parseFloat(stored) : DEFAULT_HOURLY_WAGE;
};

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

export const resolveGoalCurrent = (g, bankBalance, stockValue, flipProfit) => {
  if (g.autoKey === "bank")   return bankBalance;
  if (g.autoKey === "stocks") return stockValue;
  if (g.autoKey === "flips")  return flipProfit;
  return g.current;
};

export const parseDateLabel = (label, year) => {
  const d = new Date(`${label} ${year}`);
  return isNaN(d.getTime()) ? null : d;
};

export default function useAppState() {
  const [data,        setData]        = useState(null);
  const [tab,         setTab]         = useState("overview");
  const [modal,       setModal]       = useState(null);
  const [form,        setForm]        = useState({});
  const [loading,     setLoading]     = useState(true);
  const [aiLoading,   setAiLoading]   = useState(false);
  const [aiInsight,   setAiInsight]   = useState("");
  const [syncLoading,      setSyncLoading]      = useState(false);
  const [lastSynced,       setLastSynced]       = useState(null);
  const [showSettings,     setShowSettings]     = useState(false);
  const [apiKeyDraft,      setApiKeyDraft]      = useState("");
  const [modelDraft,       setModelDraft]       = useState("");
  const [filterDay,        setFilterDay]        = useState(null);
  const [openWeeks,        setOpenWeeks]        = useState(() => new Set(["__latest__"]));
  const [priceAlerts,      setPriceAlerts]      = useState([]);
  const [showBackupPrompt, setShowBackupPrompt] = useState(false);
  const [hourlyWage,       setHourlyWage]       = useState(getHourlyWage);
  const [wageDraft,        setWageDraft]        = useState("");
  const [aiCooldown,       setAiCooldown]       = useState(0);
  const importRef       = useRef(null);
  const lastSyncedMsRef = useRef(null);
  const aiCooldownRef   = useRef(null);

  // ── Initial data load ─────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      let d = await S.get("fcc-data") || defaultState;

      if (d.shifts.some(s => s.wage === 0)) {
        d = { ...d, shifts: d.shifts.map(s => s.wage === 0 ? { ...s, wage: getHourlyWage() } : s) };
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
        d = { ...d, netWorthHistory: [...history.slice(-(HISTORY_WINDOW - 1)), { date: todayLabel, value: Math.round(currentNW) }] };
      } else {
        d = { ...d, netWorthHistory: [...history.slice(0, -1), { date: todayLabel, value: Math.round(currentNW) }] };
      }

      const currentBal = Math.round(d.bankBalance + (d.savings || 0));
      const balHistory = d.balanceHistory || [];
      const lastBal    = balHistory[balHistory.length - 1];
      if (!lastBal || lastBal.date !== todayLabel) {
        d = { ...d, balanceHistory: [...balHistory.slice(-(HISTORY_WINDOW - 1)), { date: todayLabel, value: currentBal }] };
      } else {
        d = { ...d, balanceHistory: [...balHistory.slice(0, -1), { date: todayLabel, value: currentBal }] };
      }

      const currentStk = Math.round(d.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0));
      const stkHistory = d.stockHistory || [];
      const lastStk    = stkHistory[stkHistory.length - 1];
      if (!lastStk || lastStk.date !== todayLabel) {
        d = { ...d, stockHistory: [...stkHistory.slice(-(HISTORY_WINDOW - 1)), { date: todayLabel, value: currentStk }] };
      } else {
        d = { ...d, stockHistory: [...stkHistory.slice(0, -1), { date: todayLabel, value: currentStk }] };
      }

      await S.set("fcc-data", d);
      setData(d);
      setLoading(false);
    })();
  }, []);

  // Backup prompt
  useEffect(() => {
    const last = localStorage.getItem("cc-last-backup");
    if (!last) { setShowBackupPrompt(true); return; }
    const daysSince = (Date.now() - new Date(last).getTime()) / MS_PER_DAY;
    if (daysSince >= BACKUP_REMINDER_DAYS) setShowBackupPrompt(true);
  }, []);

  // Auto-sync stocks
  useEffect(() => {
    if (tab !== "stocks" || !data || syncLoading) return;
    const isStale = !lastSyncedMsRef.current || (Date.now() - lastSyncedMsRef.current > STOCK_STALE_THRESHOLD);
    if (isStale) syncStockPrices();
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = useCallback(async (newData) => {
    const lbl    = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const curNW  = Math.round(newData.bankBalance + (newData.savings || 0) + newData.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0));
    const curBal = Math.round(newData.bankBalance + (newData.savings || 0));
    const curStk = Math.round(newData.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0));

    const nwH = [...(newData.netWorthHistory || [])];
    if (nwH[nwH.length - 1]?.date === lbl) nwH[nwH.length - 1] = { date: lbl, value: curNW };
    else { nwH.push({ date: lbl, value: curNW }); if (nwH.length > HISTORY_WINDOW) nwH.shift(); }

    const balH = [...(newData.balanceHistory || [])];
    if (balH[balH.length - 1]?.date === lbl) balH[balH.length - 1] = { date: lbl, value: curBal };
    else { balH.push({ date: lbl, value: curBal }); if (balH.length > HISTORY_WINDOW) balH.shift(); }

    const stkH = [...(newData.stockHistory || [])];
    if (stkH[stkH.length - 1]?.date === lbl) stkH[stkH.length - 1] = { date: lbl, value: curStk };
    else { stkH.push({ date: lbl, value: curStk }); if (stkH.length > HISTORY_WINDOW) stkH.shift(); }

    const d = { ...newData, netWorthHistory: nwH, balanceHistory: balH, stockHistory: stkH };
    setData(d);
    await S.set("fcc-data", d);
  }, []);

  const fetchAIInsight = useCallback(async (d) => {
    if (aiCooldown > 0) return;
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
        "You are a direct, numbers-driven financial coach for a server who flips items and trades stocks. Give balanced feedback: call out what is working well AND what to improve. Always pair a problem with a specific, actionable fix using real dollar amounts. Write 4-5 complete sentences in flowing prose — no bullet points. Never cut off mid-sentence; always finish your last thought.",
        `Financial snapshot: Checking $${d.bankBalance} (Desert Financial CU), Savings $${d.savings||0}, Stock portfolio $${Math.round(sv)}, Net worth ~$${Math.round(nw)}, All-time shift income $${Math.round(te)}, Flip profit $${Math.round(fp)} after fees. Risk appetite: AGGRESSIVE. Give my weekly money brief: (1) what I'm doing right, (2) the single biggest gap holding me back with a specific fix and dollar target, (3) the one move to make this week.`,
        AI_INSIGHT_MAX_TOKENS
      );
      setAiInsight(text || "Unable to generate insight.");
    } catch (err) { setAiInsight(`Error: ${err.message || "check connection"}`); }
    setAiLoading(false);
    setAiCooldown(AI_COOLDOWN_SECONDS);
    if (aiCooldownRef.current) clearInterval(aiCooldownRef.current);
    aiCooldownRef.current = setInterval(() => {
      setAiCooldown(prev => {
        if (prev <= 1) { clearInterval(aiCooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [aiCooldown]);

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
        if (match) {
          try { Object.assign(prices, JSON.parse(match[0])); }
          catch { /* Gemini returned malformed JSON — skip */ }
        }
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
    const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    setLastSynced(Object.keys(prices).length ? timeStr : `${timeStr} (no prices found)`);
    setSyncLoading(false);
  }, [data, save]);

  // ── Export / Import ────────────────────────────────────────────────────────
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

  // ── Computed values ────────────────────────────────────────────────────────
  const now            = new Date();
  const thisYear       = now.getFullYear();
  const thisMonth      = now.getMonth();
  const currentMonthKey = `${thisYear}-${String(thisMonth + 1).padStart(2, "0")}`;
  const daysInMonth    = new Date(thisYear, thisMonth + 1, 0).getDate();
  const dayOfMonth     = now.getDate();
  const daysLeft       = daysInMonth - dayOfMonth;

  const stockValue         = data ? data.stocks.reduce((s, st) => s + st.shares * st.currentPrice, 0) : 0;
  const stockCost          = data ? data.stocks.reduce((s, st) => s + st.shares * st.buyPrice, 0) : 0;
  const netWorth           = data ? data.bankBalance + (data.savings || 0) + stockValue : 0;
  const totalShiftEarnings = data ? data.shifts.reduce((s, sh) => s + sh.tips + sh.hours * (sh.wage || 0), 0) : 0;
  const avgTips            = data && data.shifts.length ? data.shifts.reduce((s, sh) => s + sh.tips, 0) / data.shifts.length : 0;
  const avgPerShift        = data && data.shifts.length ? totalShiftEarnings / data.shifts.length : DEFAULT_AVG_PER_SHIFT;

  const flipProfit = data ? data.flips.filter(f => f.status === "sold" && f.sold).reduce((a, f) => {
    const gross = f.sold - f.bought;
    return a + (gross - gross * (f.fees || 0) / 100);
  }, 0) : 0;

  const opportunities = data ? generateOpportunities(data.liquidCash) : [];

  // Monthly P&L
  const monthShifts = data ? data.shifts.filter(s => {
    const d = parseDateLabel(s.date, thisYear);
    return d && d.getMonth() === thisMonth;
  }) : [];
  const monthShiftIncome = monthShifts.reduce((a, s) => a + s.tips + s.hours * s.wage, 0);

  const monthFlipIncome = data ? data.flips.filter(f => {
    if (f.status !== "sold" || !f.sold || !f.soldDate) return false;
    const d = parseDateLabel(f.soldDate, thisYear);
    return d && d.getMonth() === thisMonth;
  }).reduce((a, f) => {
    const gross = f.sold - f.bought;
    return a + (gross - gross * (f.fees || 0) / 100);
  }, 0) : 0;

  const monthExpensesTotal = data ? (data.expenses || [])
    .filter(e => e.month === currentMonthKey)
    .reduce((a, e) => a + e.amount, 0) : 0;

  const monthNetPL = monthShiftIncome + monthFlipIncome - monthExpensesTotal;

  // EOD cash projection
  const totalBudgetLimit = data ? Object.values(data.budget || {}).reduce((a, v) => a + v, 0) : 0;
  const projectedRemainingExpenses = totalBudgetLimit > 0
    ? Math.max(0, totalBudgetLimit - monthExpensesTotal)
    : dayOfMonth > 1 ? (monthExpensesTotal / dayOfMonth) * daysLeft : 0;
  const remainingMonthShifts = data ? (data.schedule || []).filter(s => {
    if (s.logged) return false;
    const d = parseDateLabel(s.date, thisYear);
    return d && d.getMonth() === thisMonth && d >= now;
  }) : [];
  const projectedShiftIncome    = remainingMonthShifts.length * avgPerShift;
  const projectedEODBalance     = data ? data.bankBalance + projectedShiftIncome - projectedRemainingExpenses : 0;

  // Shift patterns by day of week
  const shiftByDay = {};
  if (data) {
    data.shifts.forEach(s => {
      const d = parseDateLabel(s.date, thisYear);
      if (!d) return;
      const day = d.toLocaleDateString("en-US", { weekday: "short" });
      if (!shiftByDay[day]) shiftByDay[day] = { total: 0, count: 0 };
      shiftByDay[day].total += s.tips + s.hours * s.wage;
      shiftByDay[day].count++;
    });
  }
  const dayEntries = Object.entries(shiftByDay)
    .map(([day, v]) => ({ day, avg: v.total / v.count, count: v.count, total: v.total }))
    .sort((a, b) => b.avg - a.avg);
  const maxDayAvg = dayEntries.length ? dayEntries[0].avg : 1;

  // Net worth velocity
  const nwDailyGain = (() => {
    if (!data) return 0;
    const hist = data.netWorthHistory || [];
    if (hist.length < 2) return 0;
    const window = hist.slice(-14);
    const days   = window.length - 1;
    return days > 0 ? (window[window.length - 1].value - window[0].value) / days : 0;
  })();

  // Budget overspend warnings
  const overspendWarnings = (data && daysLeft > 0)
    ? Object.entries(data.budget || {}).reduce((acc, [cat, limit]) => {
        if (!limit) return acc;
        const spent = (data.expenses || [])
          .filter(e => e.month === currentMonthKey && e.category === cat)
          .reduce((a, e) => a + e.amount, 0);
        const pct = spent / limit;
        if (pct >= BUDGET_WARN_THRESHOLD) acc.push({ cat, spent, limit, pct: (pct * 100).toFixed(0) });
        return acc;
      }, [])
    : [];

  // Flip analytics
  const soldFlips  = data ? data.flips.filter(f => f.status === "sold" && f.sold) : [];
  const avgFlipROI = soldFlips.length
    ? (soldFlips.reduce((a, f) => a + (f.sold - f.bought) / f.bought, 0) / soldFlips.length * 100).toFixed(0)
    : null;
  const bestFlip = soldFlips.length
    ? soldFlips.reduce((best, f) => (f.sold - f.bought) > (best.sold - best.bought) ? f : best, soldFlips[0])
    : null;
  const avgDaysToSell = (() => {
    const timed = soldFlips.filter(f => f.listedDate && f.soldDate);
    if (!timed.length) return null;
    const total = timed.reduce((a, f) => {
      const d1 = new Date(`${f.listedDate} ${thisYear}`);
      const d2 = new Date(`${f.soldDate} ${thisYear}`);
      return a + Math.max(0, Math.round((d2 - d1) / MS_PER_DAY));
    }, 0);
    return Math.round(total / timed.length);
  })();
  const flipsByCategory = soldFlips.reduce((acc, f) => {
    const cat = f.category || "Uncategorized";
    if (!acc[cat]) acc[cat] = { profit: 0, count: 0, roiSum: 0 };
    const gross = f.sold - f.bought;
    acc[cat].profit  += gross - gross * (f.fees || 0) / 100;
    acc[cat].count++;
    acc[cat].roiSum  += (gross / f.bought) * 100;
    return acc;
  }, {});

  // ── Handlers ───────────────────────────────────────────────────────────────
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
    const tips     = Math.max(0, +total - +hours * hourlyWage);
    const newShift = { date, hours: +hours, tips: +tips.toFixed(2), wage: hourlyWage };
    const newShifts = _editIdx !== undefined
      ? data.shifts.map((s, i) => i === _editIdx ? newShift : s)
      : [...data.shifts, newShift];
    const newHistory = [...data.netWorthHistory];
    if (_editIdx === undefined) {
      const today = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const last  = newHistory[newHistory.length - 1];
      if (last) newHistory[newHistory.length - 1] = { ...last, date: today, value: last.value + +total };
    }
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

  return {
    // State
    data, tab, setTab, modal, setModal, form, setForm, loading,
    aiLoading, aiInsight, syncLoading, lastSynced,
    showSettings, setShowSettings, apiKeyDraft, setApiKeyDraft,
    modelDraft, setModelDraft, filterDay, setFilterDay,
    openWeeks, setOpenWeeks, priceAlerts, showBackupPrompt,
    hourlyWage, setHourlyWage, wageDraft, setWageDraft,
    aiCooldown, importRef,

    // Computed
    now, thisYear, thisMonth, currentMonthKey, daysInMonth, dayOfMonth, daysLeft,
    stockValue, stockCost, netWorth, totalShiftEarnings, avgTips, avgPerShift,
    flipProfit, opportunities, monthShiftIncome, monthFlipIncome,
    monthExpensesTotal, monthNetPL, projectedRemainingExpenses,
    remainingMonthShifts, projectedShiftIncome, projectedEODBalance,
    dayEntries, maxDayAvg, nwDailyGain, overspendWarnings,
    soldFlips, avgFlipROI, bestFlip, avgDaysToSell, flipsByCategory,

    // Actions
    save, fetchAIInsight, syncStockPrices,
    exportJSON, exportCSV, importJSON, dismissBackupPrompt,
    openEditShift, deleteShift, addShift,
    openEditFlip, deleteFlip, saveFlip,
    openEditStock, deleteStock, saveStock,
    openEditGoal, deleteGoal, saveGoal,
    updateBalance, handleFAB, startFlipFromOpp, logShiftFromSchedule,
  };
}
