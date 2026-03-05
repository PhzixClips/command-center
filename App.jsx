import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

import useAppState       from "./components/hooks/useAppState.js";
import useNotifications  from "./components/hooks/useNotifications.js";
import useSwipe          from "./components/hooks/useSwipe.js";
import ErrorBoundary     from "./components/ErrorBoundary.jsx";
import Modal             from "./components/Modal.jsx";
import Btn               from "./components/Btn.jsx";
import FAB               from "./components/FAB.jsx";
import AppModals         from "./components/pages/AppModals.jsx";
import { TABS, TAB_LABELS } from "./components/constants.js";

// ── SVG icons for bottom tab bar ────────────────────────────────────────────
const TAB_ICONS = {
  overview: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  income: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  investments: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  ),
  opportunities: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  planning: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  budget: (c) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 10h20" />
      <path d="M6 16h4" />
    </svg>
  ),
};

// ── Lazy-loaded tab pages (code-split) ──────────────────────────────────────
const OverviewTab      = lazy(() => import("./components/pages/OverviewTab.jsx"));
const ShiftsTab        = lazy(() => import("./components/pages/ShiftsTab.jsx"));
const FlipsTab         = lazy(() => import("./components/pages/FlipsTab.jsx"));
const StocksTab        = lazy(() => import("./components/pages/StocksTab.jsx"));
const GoalsTab         = lazy(() => import("./components/pages/GoalsTab.jsx"));
const ScheduleTab      = lazy(() => import("./components/ScheduleTab.jsx"));
const BudgetTab        = lazy(() => import("./components/BudgetTab.jsx"));
const OpportunitiesTab = lazy(() => import("./components/OpportunitiesTab.jsx"));

const TabFallback = () => (
  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center", padding: "40px 0" }}>
    Loading...
  </div>
);

// Income tab: combines Schedule, Shifts, and Flips into one view
function IncomeTab(props) {
  const [sub, setSub] = useState("shifts");
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {[{ key: "shifts", label: "Shifts" }, { key: "schedule", label: "Schedule" }, { key: "flips", label: "Flips" }].map(s => (
          <button key={s.key} onClick={() => setSub(s.key)} style={{
            background: sub === s.key ? "rgba(0,230,118,0.08)" : "rgba(255,255,255,0.03)",
            border: sub === s.key ? "1px solid rgba(0,230,118,0.2)" : "1px solid rgba(255,255,255,0.06)",
            color: sub === s.key ? "#00e676" : "rgba(255,255,255,0.3)",
            padding: "8px 18px", borderRadius: 14, cursor: "pointer",
            fontSize: 12, fontWeight: sub === s.key ? 600 : 400, transition: "all 0.15s",
          }}>{s.label}</button>
        ))}
      </div>
      <Suspense fallback={<TabFallback />}>
        {sub === "shifts" && <ShiftsTab {...props.shiftsProps} />}
        {sub === "schedule" && <ErrorBoundary><ScheduleTab data={props.data} save={props.save} onLogShift={props.logShiftFromSchedule} /></ErrorBoundary>}
        {sub === "flips" && <FlipsTab {...props.flipsProps} />}
      </Suspense>
    </div>
  );
}

// Planning tab: Goals
function PlanningTab(props) {
  return (
    <Suspense fallback={<TabFallback />}>
      <GoalsTab {...props} />
    </Suspense>
  );
}

export default function App() {
  const state = useAppState();
  const { requestPermission, notifyPriceAlert } = useNotifications();

  // ── Swipe navigation (iOS-style dual-panel) ────────────────────────────
  const tabIdx = TABS.indexOf(state.tab);
  const {
    dragX, swipeDirection, phase, committed, settle, transitionMs,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  } = useSwipe(tabIdx, TABS.length);

  useEffect(() => {
    if (phase === "settling" && committed) {
      const timer = setTimeout(() => {
        const nextIdx = committed === "left" ? tabIdx + 1 : tabIdx - 1;
        if (nextIdx >= 0 && nextIdx < TABS.length) {
          state.setTab(TABS[nextIdx]);
        }
        settle();
      }, transitionMs);
      return () => clearTimeout(timer);
    }
  }, [phase, committed, tabIdx, state.setTab, settle, transitionMs]);

  const [clickAnim, setClickAnim] = useState(null);
  const handleTabClick = useCallback((t) => {
    const fromIdx = TABS.indexOf(state.tab);
    const toIdx   = TABS.indexOf(t);
    if (fromIdx === toIdx) return;
    setClickAnim(toIdx > fromIdx ? "left" : "right");
    state.setTab(t);
    setTimeout(() => setClickAnim(null), 280);
  }, [state.tab, state.setTab]);

  const adjacentTab = (swipeDirection === "right" && tabIdx > 0)
    ? TABS[tabIdx - 1]
    : (swipeDirection === "left" && tabIdx < TABS.length - 1)
      ? TABS[tabIdx + 1]
      : null;
  const showDual = (phase === "dragging" || phase === "settling") && adjacentTab;

  const isAnimating  = phase === "settling";
  const transition   = isAnimating ? `transform ${transitionMs}ms cubic-bezier(0.2, 0.9, 0.3, 1)` : "none";
  const currentStyle = {
    transform: `translate3d(${dragX}px, 0, 0)`,
    transition,
  };
  const adjacentStyle = {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    transform: swipeDirection === "left"
      ? `translate3d(calc(100% + ${dragX}px), 0, 0)`
      : `translate3d(calc(-100% + ${dragX}px), 0, 0)`,
    transition,
  };

  const {
    data, tab, setTab, modal, setModal, form, setForm, loading,
    aiLoading, aiInsight, syncLoading, lastSynced,
    showSettings, setShowSettings, apiKeyDraft, setApiKeyDraft,
    modelDraft, setModelDraft, hourlyWage, setHourlyWage,
    wageDraft, setWageDraft, aiCooldown, importRef,
    filterDay, setFilterDay, openWeeks, setOpenWeeks,
    priceAlerts, showBackupPrompt, now, thisYear, daysLeft,
    stockValue, stockCost, netWorth, totalShiftEarnings, avgTips, avgPerShift,
    flipProfit, monthShiftIncome, monthFlipIncome,
    monthExpensesTotal, monthNetPL, projectedRemainingExpenses,
    remainingMonthShifts, projectedShiftIncome, projectedEODBalance,
    dayEntries, maxDayAvg, nwDailyGain, overspendWarnings,
    soldFlips, avgFlipROI, bestFlip, avgDaysToSell, flipsByCategory,
    save, fetchAIInsight, syncStockPrices,
    exportJSON, exportCSV, importJSON, dismissBackupPrompt,
    openEditShift, deleteShift, addShift,
    openEditFlip, deleteFlip, saveFlip,
    openEditStock, deleteStock, saveStock,
    openEditGoal, deleteGoal, saveGoal,
    updateBalance, handleFAB, startFlipFromOpp, logShiftFromSchedule,
  } = state;

  // ── Tab renderer ──────────────────────────────────────────────────────
  const renderTab = (t) => {
    switch (t) {
      case "overview": return (
        <OverviewTab
          data={data} netWorth={netWorth} avgTips={avgTips} stockValue={stockValue}
          totalShiftEarnings={totalShiftEarnings} flipProfit={flipProfit}
          showBackupPrompt={showBackupPrompt} overspendWarnings={overspendWarnings}
          daysLeft={daysLeft} monthShiftIncome={monthShiftIncome}
          monthFlipIncome={monthFlipIncome} monthExpensesTotal={monthExpensesTotal}
          monthNetPL={monthNetPL} projectedEODBalance={projectedEODBalance}
          projectedShiftIncome={projectedShiftIncome}
          projectedRemainingExpenses={projectedRemainingExpenses}
          remainingMonthShifts={remainingMonthShifts} avgPerShift={avgPerShift} now={now}
          aiLoading={aiLoading} aiInsight={aiInsight} aiCooldown={aiCooldown}
          fetchAIInsight={fetchAIInsight} exportJSON={exportJSON} exportCSV={exportCSV}
          importJSON={importJSON} importRef={importRef} dismissBackupPrompt={dismissBackupPrompt}
          setModal={setModal} setForm={setForm} startFlipFromOpp={startFlipFromOpp}
        />
      );
      case "income": return (
        <IncomeTab
          data={data} save={save} logShiftFromSchedule={logShiftFromSchedule}
          shiftsProps={{
            data, thisYear, now,
            totalShiftEarnings, avgPerShift, avgTips,
            dayEntries, maxDayAvg,
            filterDay, setFilterDay,
            openWeeks, setOpenWeeks,
            openEditShift, deleteShift,
            setModal, setForm,
          }}
          flipsProps={{
            data, thisYear, setTab,
            flipProfit, soldFlips, avgFlipROI,
            bestFlip, avgDaysToSell, flipsByCategory,
            openEditFlip, deleteFlip,
            setModal, setForm,
          }}
        />
      );
      case "investments": return (
        <ErrorBoundary>
          <StocksTab
            data={data} stockValue={stockValue} stockCost={stockCost}
            priceAlerts={priceAlerts} syncLoading={syncLoading} lastSynced={lastSynced}
            syncStockPrices={syncStockPrices} openEditStock={openEditStock}
            deleteStock={deleteStock} setModal={setModal} setForm={setForm}
          />
        </ErrorBoundary>
      );
      case "opportunities": return <ErrorBoundary><OpportunitiesTab data={data} save={save} onStartFlip={startFlipFromOpp} /></ErrorBoundary>;
      case "planning": return (
        <PlanningTab
          data={data} stockValue={stockValue} flipProfit={flipProfit}
          nwDailyGain={nwDailyGain} openEditGoal={openEditGoal}
          deleteGoal={deleteGoal} setModal={setModal} setForm={setForm}
        />
      );
      case "budget": return <ErrorBoundary><BudgetTab data={data} save={save} /></ErrorBoundary>;
      default: return null;
    }
  };

  // Fire browser notifications only when price alerts actually change
  const prevAlertsRef = useRef([]);
  useEffect(() => {
    if (priceAlerts.length > 0 && priceAlerts !== prevAlertsRef.current) {
      notifyPriceAlert(priceAlerts);
    }
    prevAlertsRef.current = priceAlerts;
  }, [priceAlerts, notifyPriceAlert]);

  if (loading || !data) return (
    <div style={{ background: "#0a0a10", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#00e676", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif", fontSize: 15, fontWeight: 500, letterSpacing: 0.5 }}>
      Loading Capital Command...
    </div>
  );

  return (
    <div style={{ background: "#0a0a10", minHeight: "100vh", color: "#e8e8e8", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif", padding: "0 0 100px" }}>

      {/* Settings modal */}
      {showSettings && (
        <Modal title="Settings" onClose={() => setShowSettings(false)}>
          <div style={{ marginBottom: 8, color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 500, letterSpacing: 0.8 }}>GEMINI API KEY</div>
          <input
            type="password"
            value={apiKeyDraft}
            onChange={e => setApiKeyDraft(e.target.value)}
            placeholder="AIza..."
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", color: "#e8e8e8", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
          />
          <div style={{ marginBottom: 8, color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 500, letterSpacing: 0.8 }}>GEMINI MODEL</div>
          <input
            type="text"
            value={modelDraft}
            onChange={e => setModelDraft(e.target.value)}
            placeholder="gemini-3-flash"
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", color: "#e8e8e8", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
          />
          <div style={{ marginBottom: 8, color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 500, letterSpacing: 0.8 }}>HOURLY WAGE ($)</div>
          <input
            type="number"
            value={wageDraft}
            onChange={e => setWageDraft(e.target.value)}
            placeholder={String(hourlyWage)}
            min="0" step="0.01"
            aria-label="Hourly wage"
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", color: "#e8e8e8", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
          />
          <div style={{ marginBottom: 12 }}>
            <Btn onClick={requestPermission} color="#60a5fa" style={{ fontSize: 11, width: "100%" }}>
              Enable Notifications
            </Btn>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 4, textAlign: "center" }}>
              Get alerts for price drops and shift reminders
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <Btn onClick={() => { exportJSON(); }} color="#60a5fa" style={{ fontSize: 11, width: "100%" }}>
              Export Backup
            </Btn>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 4, textAlign: "center" }}>
              Download a JSON backup of all your data
            </div>
          </div>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginBottom: 20 }}>
            All settings stored in your browser only — never sent to any server.<br />
            Get an API key at <span style={{ color: "#60a5fa" }}>aistudio.google.com/apikey</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => {
              localStorage.setItem("cc-gemini-key", apiKeyDraft.trim());
              localStorage.setItem("cc-gemini-model", modelDraft.trim());
              const newWage = parseFloat(wageDraft);
              if (!isNaN(newWage) && newWage > 0) { localStorage.setItem("cc-hourly-wage", String(newWage)); setHourlyWage(newWage); }
              setShowSettings(false);
            }}>Save</Btn>
            {localStorage.getItem("cc-gemini-key") && (
              <Btn onClick={() => { localStorage.removeItem("cc-gemini-key"); setApiKeyDraft(""); setShowSettings(false); }} color="#ff3b3b">Remove Key</Btn>
            )}
          </div>
        </Modal>
      )}

      {/* Header */}
      <header style={{
        padding: "16px 24px",
        background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)",
        position: "relative",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, #00e676, #00b0ff)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#0a0a10",
              boxShadow: "0 4px 16px rgba(0,230,118,0.2)",
            }}>CC</div>
            <div>
              <h1 style={{ color: "#fff", fontSize: 16, fontWeight: 700, letterSpacing: -0.3, margin: 0, lineHeight: 1.2 }}>Capital Command</h1>
              <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 9, fontWeight: 500, letterSpacing: 1.5, textTransform: "uppercase" }}>Personal Finance</div>
            </div>
          </div>
          <button
            onClick={() => { setApiKeyDraft(localStorage.getItem("cc-gemini-key") || ""); setModelDraft(localStorage.getItem("cc-gemini-model") || "gemini-3-flash"); setWageDraft(String(hourlyWage)); setShowSettings(true); }}
            title="Settings"
            style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 12, color: "rgba(255,255,255,0.3)", cursor: "pointer",
              fontSize: 15, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >⚙</button>
        </div>
        <div style={{ position: "absolute", bottom: 0, left: 24, right: 24, height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }} />
      </header>

      {/* ── Swipe viewport ──────────────────────────────────────────────── */}
      <div
        style={{ position: "relative", overflow: "hidden", minHeight: "calc(100vh - 140px)" }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Current tab */}
        <main
          className={!showDual && clickAnim === "left" ? "slide-in-left" : !showDual && clickAnim === "right" ? "slide-in-right" : ""}
          style={{ padding: "28px 24px", minHeight: "calc(100vh - 140px)", willChange: showDual ? "transform" : "auto", ...(showDual ? currentStyle : {}) }}
          role="tabpanel"
          id={`panel-${tab}`}
        >
          <Suspense fallback={<TabFallback />}>
            {renderTab(tab)}
          </Suspense>
        </main>

        {/* Adjacent tab (only rendered during swipe) */}
        {showDual && (
          <div
            style={{ ...adjacentStyle, padding: "28px 24px", minHeight: "calc(100vh - 140px)", willChange: "transform" }}
            aria-hidden
          >
            <Suspense fallback={<TabFallback />}>
              {renderTab(adjacentTab)}
            </Suspense>
          </div>
        )}
      </div>

      <FAB onAction={handleFAB} bottomOffset={88} />

      {/* ── Floating bottom tab bar (iOS-style) ────────────────────── */}
      <nav
        aria-label="Main navigation"
        role="tablist"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 400,
          padding: "0 0 env(safe-area-inset-bottom, 0px)",
          background: "rgba(10,10,16,0.82)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "8px 8px 10px",
          maxWidth: 480,
          margin: "0 auto",
        }}>
          {TABS.map(t => {
            const active = tab === t;
            const color = active ? "#00e676" : "rgba(255,255,255,0.25)";
            const renderIcon = TAB_ICONS[t];
            return (
              <button
                key={t}
                onClick={() => handleTabClick(t)}
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${t}`}
                style={{
                  background: "none",
                  border: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  cursor: "pointer",
                  padding: "4px 10px",
                  minWidth: 0,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ opacity: active ? 1 : 0.7, transition: "opacity 0.2s" }}>
                  {renderIcon ? renderIcon(color) : null}
                </div>
                <span style={{
                  color,
                  fontSize: 9,
                  fontWeight: active ? 600 : 400,
                  letterSpacing: 0.3,
                  transition: "color 0.2s",
                }}>{TAB_LABELS[t]}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <AppModals
        modal={modal} setModal={setModal} form={form} setForm={setForm}
        hourlyWage={hourlyWage} data={data} save={save}
        addShift={addShift} saveFlip={saveFlip} saveStock={saveStock}
        saveGoal={saveGoal} updateBalance={updateBalance}
      />
    </div>
  );
}
