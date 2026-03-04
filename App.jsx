import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

import useAppState       from "./components/hooks/useAppState.js";
import useNotifications  from "./components/hooks/useNotifications.js";
import useSwipe          from "./components/hooks/useSwipe.js";
import ErrorBoundary     from "./components/ErrorBoundary.jsx";
import Modal             from "./components/Modal.jsx";
import Btn               from "./components/Btn.jsx";
import FAB               from "./components/FAB.jsx";
import AppModals         from "./components/pages/AppModals.jsx";
import { TABS }          from "./components/constants.js";

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

export default function App() {
  const state = useAppState();
  const { requestPermission, notifyPriceAlert } = useNotifications();

  // ── Swipe navigation (iOS-style dual-panel) ────────────────────────────
  const tabIdx = TABS.indexOf(state.tab);
  const {
    dragX, swipeDirection, phase, committed, settle, transitionMs,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  } = useSwipe(tabIdx, TABS.length);

  // When swipe commits and settle animation finishes, switch the actual tab
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

  // Tab-bar click: CSS animation (no swipe involved)
  const [clickAnim, setClickAnim] = useState(null);
  const handleTabClick = useCallback((t) => {
    const fromIdx = TABS.indexOf(state.tab);
    const toIdx   = TABS.indexOf(t);
    if (fromIdx === toIdx) return;
    setClickAnim(toIdx > fromIdx ? "left" : "right");
    state.setTab(t);
    setTimeout(() => setClickAnim(null), 280);
  }, [state.tab, state.setTab]);

  // Determine which adjacent tab to show during swipe
  const adjacentTab = (swipeDirection === "right" && tabIdx > 0)
    ? TABS[tabIdx - 1]
    : (swipeDirection === "left" && tabIdx < TABS.length - 1)
      ? TABS[tabIdx + 1]
      : null;
  const showDual = (phase === "dragging" || phase === "settling") && adjacentTab;

  // Swipe styles for current and adjacent panels
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
      case "schedule": return <ErrorBoundary><ScheduleTab data={data} save={save} onLogShift={logShiftFromSchedule} /></ErrorBoundary>;
      case "shifts": return (
        <ShiftsTab
          data={data} thisYear={thisYear} now={now}
          totalShiftEarnings={totalShiftEarnings} avgPerShift={avgPerShift} avgTips={avgTips}
          dayEntries={dayEntries} maxDayAvg={maxDayAvg}
          filterDay={filterDay} setFilterDay={setFilterDay}
          openWeeks={openWeeks} setOpenWeeks={setOpenWeeks}
          openEditShift={openEditShift} deleteShift={deleteShift}
          setModal={setModal} setForm={setForm}
        />
      );
      case "flips": return (
        <FlipsTab
          data={data} thisYear={thisYear} setTab={setTab}
          flipProfit={flipProfit} soldFlips={soldFlips} avgFlipROI={avgFlipROI}
          bestFlip={bestFlip} avgDaysToSell={avgDaysToSell} flipsByCategory={flipsByCategory}
          openEditFlip={openEditFlip} deleteFlip={deleteFlip}
          setModal={setModal} setForm={setForm}
        />
      );
      case "stocks": return (
        <StocksTab
          data={data} stockValue={stockValue} stockCost={stockCost}
          priceAlerts={priceAlerts} syncLoading={syncLoading} lastSynced={lastSynced}
          syncStockPrices={syncStockPrices} openEditStock={openEditStock}
          deleteStock={deleteStock} setModal={setModal} setForm={setForm}
        />
      );
      case "opportunities": return <ErrorBoundary><OpportunitiesTab data={data} save={save} onStartFlip={startFlipFromOpp} /></ErrorBoundary>;
      case "goals": return (
        <GoalsTab
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
    <div style={{ background: "#0a0a10", minHeight: "100vh", color: "#e8e8e8", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif", padding: "0 0 80px" }}>

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
            <Btn onClick={requestPermission} color="#38bdf8" style={{ fontSize: 11, width: "100%" }}>
              Enable Notifications
            </Btn>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 4, textAlign: "center" }}>
              Get alerts for price drops and shift reminders
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
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.02)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)" }}>
        <div>
          <h1 style={{ color: "#e8e8e8", fontSize: 20, fontWeight: 700, letterSpacing: -0.3, margin: 0 }}>Capital Command</h1>
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, fontWeight: 400, marginTop: 2 }}>Personal Finance Intelligence</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 500 }}>Net Worth</div>
            <div style={{ color: "#00e676", fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <button
            onClick={() => { setApiKeyDraft(localStorage.getItem("cc-gemini-key") || ""); setModelDraft(localStorage.getItem("cc-gemini-model") || "gemini-3-flash"); setWageDraft(String(hourlyWage)); setShowSettings(true); }}
            title="Settings"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, color: "rgba(255,255,255,0.35)", cursor: "pointer", fontSize: 16, padding: "8px 12px", lineHeight: 1 }}
          >⚙</button>
        </div>
      </header>

      {/* Tabs */}
      <nav aria-label="Main navigation" style={{ display: "flex", gap: 4, padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", overflowX: "auto", WebkitOverflowScrolling: "touch" }} role="tablist">
        {TABS.map(t => (
          <button key={t} onClick={() => handleTabClick(t)} role="tab" aria-selected={tab === t} aria-controls={`panel-${t}`} style={{
            background: tab === t ? "rgba(255,255,255,0.08)" : "transparent",
            border: "none",
            color: tab === t ? "#fff" : "rgba(255,255,255,0.3)",
            padding: "8px 16px", borderRadius: 16, cursor: "pointer",
            fontSize: 12, fontWeight: tab === t ? 600 : 400, letterSpacing: 0.3, textTransform: "capitalize", whiteSpace: "nowrap",
            transition: "all 0.2s ease",
          }}>{t}</button>
        ))}
      </nav>

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
          style={{ padding: "24px", minHeight: "calc(100vh - 140px)", willChange: showDual ? "transform" : "auto", ...(showDual ? currentStyle : {}) }}
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
            style={{ ...adjacentStyle, padding: "24px", minHeight: "calc(100vh - 140px)", willChange: "transform" }}
            aria-hidden
          >
            <Suspense fallback={<TabFallback />}>
              {renderTab(adjacentTab)}
            </Suspense>
          </div>
        )}
      </div>

      <FAB onAction={handleFAB} />

      <AppModals
        modal={modal} setModal={setModal} form={form} setForm={setForm}
        hourlyWage={hourlyWage} data={data} save={save}
        addShift={addShift} saveFlip={saveFlip} saveStock={saveStock}
        saveGoal={saveGoal} updateBalance={updateBalance}
      />
    </div>
  );
}
