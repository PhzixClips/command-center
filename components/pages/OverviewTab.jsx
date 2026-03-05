import { useMemo } from "react";
import ErrorBoundary from "../ErrorBoundary.jsx";
import HeroCard      from "../HeroCard.jsx";
import MoneyVelocity from "../MoneyVelocity.jsx";
import StatCard      from "../StatCard.jsx";
import DailyCard     from "../DailyCard.jsx";
import DollarDeployer from "../DollarDeployer.jsx";
import AlertsFeed    from "../AlertsFeed.jsx";
import ChartPanel    from "../ChartPanel.jsx";
import Btn           from "../Btn.jsx";

/* ── App deep-link configs ──────────────────────────────────────────── */
const DESERT_FINANCIAL = {
  iosScheme: "desertfinancial://",
  androidPackage: "com.desertschools.mobilebanking",
  iosAppId: "530666695",
  fallbackUrl: "https://www.desertfinancial.com/access-my-account",
};
const DAILYPAY = {
  iosScheme: "dailypay://",
  androidPackage: "com.DailyPay.DailyPay",
  iosAppId: "1399085077",
  fallbackUrl: "https://www.dailypay.com",
};
const FIDELITY = {
  iosScheme: "fidelity://",
  androidPackage: "com.fidelity.android",
  iosAppId: "348177453",
  fallbackUrl: "https://digital.fidelity.com/prgw/digital/login/full-page",
};

/* Section header used to group cards */
function SectionLabel({ children }) {
  return (
    <div style={{
      color: "rgba(255,255,255,0.22)", fontSize: 10, fontWeight: 600,
      letterSpacing: 2.5, textTransform: "uppercase",
      marginBottom: 14, paddingLeft: 2,
    }}>{children}</div>
  );
}

export default function OverviewTab({
  data, netWorth, avgTips, stockValue, totalShiftEarnings, flipProfit,
  showBackupPrompt, overspendWarnings, daysLeft,
  monthShiftIncome, monthFlipIncome, monthExpensesTotal, monthNetPL,
  projectedEODBalance, projectedShiftIncome, projectedRemainingExpenses,
  remainingMonthShifts, avgPerShift, now,
  aiLoading, aiInsight, aiCooldown, fetchAIInsight,
  exportJSON, exportCSV, importJSON, importRef, dismissBackupPrompt,
  setModal, setForm, startFlipFromOpp,
}) {
  return (
    <div>
      <ErrorBoundary>
        {/* ── HERO: Net Worth ─────────────────────────────────────── */}
        <HeroCard netWorth={netWorth} netWorthHistory={data.netWorthHistory} dailyDelta={(() => {
          const h = data.netWorthHistory || [];
          if (h.length < 2) return 0;
          return h[h.length - 1].value - h[h.length - 2].value;
        })()} />

        {/* ── AI Daily Move ───────────────────────────────────────── */}
        <DailyCard data={data} netWorth={netWorth} avgTips={avgTips} stockValue={stockValue} />

        {/* ── Liquid Assets ───────────────────────────────────────── */}
        <SectionLabel>Liquid Assets</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 32 }}>
          <StatCard label="Checking"  value={`$${data.bankBalance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`} sub="Desert Financial CU" accent="#00e676" appLink={DESERT_FINANCIAL} />
          <StatCard label="Savings"   value={`$${(data.savings||0).toFixed(2)}`} sub="Membership Savings" accent="#00e676" appLink={DESERT_FINANCIAL} />
        </div>

        {/* ── Income Streams ──────────────────────────────────────── */}
        <SectionLabel>Income Streams</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 32 }}>
          <StatCard label="Shift Income" value={`$${Math.round(totalShiftEarnings).toLocaleString()}`} sub={`$${Math.round(avgPerShift)}/shift avg`} accent="#00e676" appLink={DAILYPAY} />
          <StatCard label="Flip Income"  value={`$${Math.round(flipProfit)}`} sub="Net of fees" accent="#00e676" />
        </div>

        {/* ── Investments ─────────────────────────────────────────── */}
        <SectionLabel>Investments</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 32 }}>
          <StatCard label="Portfolio" value={`$${stockValue.toLocaleString(undefined,{maximumFractionDigits:0})}`} sub="CHPY · GDXY · TDAX" accent="#60a5fa" appLink={FIDELITY} />
        </div>

        {/* ── Money Velocity ──────────────────────────────────────── */}
        <MoneyVelocity
          monthShiftIncome={monthShiftIncome} monthFlipIncome={monthFlipIncome}
          monthExpensesTotal={monthExpensesTotal} savings={data.savings}
        />

        {/* ── Budget Status (redesigned as insight cards) ─────────── */}
        {overspendWarnings.length > 0 && (
          <div style={{
            background: "rgba(255,59,59,0.03)",
            border: "1px solid rgba(255,59,59,0.08)",
            borderRadius: 20,
            padding: "20px 22px",
            marginBottom: 28,
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, height: 2,
              background: "linear-gradient(90deg, #ff3b3b44, transparent 60%)",
            }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ color: "#ff3b3b", fontSize: 12, fontWeight: 600 }}>Budget Status</div>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>{daysLeft} days left this month</div>
            </div>
            {overspendWarnings.map(({ cat, spent, limit, pct }) => {
              const over = +pct >= 100;
              const barWidth = Math.min(100, +pct);
              return (
                <div key={cat} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ color: over ? "#ff3b3b" : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 500 }}>{cat}</span>
                    <span style={{ color: over ? "#ff3b3b" : "rgba(255,255,255,0.35)", fontSize: 11 }}>
                      ${spent.toFixed(0)} / ${limit}
                    </span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 4, height: 5, overflow: "hidden" }}>
                    <div style={{
                      background: over ? "#ff3b3b" : "#ff3b3b88",
                      width: `${barWidth}%`, height: "100%", borderRadius: 4,
                      transition: "width 0.4s",
                    }} />
                  </div>
                  {over && (
                    <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 4 }}>
                      ${Math.round(spent - limit)} over budget
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Monthly P&L ─────────────────────────────────────────── */}
        <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "22px 24px", marginBottom: 28 }}>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, letterSpacing: 2, marginBottom: 18, textTransform: "uppercase" }}>
            Monthly P&L · {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 18 }}>
            {[
              { label: "Shift Income", value: `+$${Math.round(monthShiftIncome).toLocaleString()}`, color: "#00e676" },
              { label: "Flip Income",  value: `+$${Math.round(monthFlipIncome).toLocaleString()}`,  color: "#00e676", sub: monthFlipIncome === 0 ? "no sales yet" : null },
              { label: "Expenses",     value: `-$${Math.round(monthExpensesTotal).toLocaleString()}`, color: "#ff3b3b" },
              { label: "Net",          value: `${monthNetPL >= 0 ? "+" : ""}$${Math.round(monthNetPL).toLocaleString()}`, color: monthNetPL >= 0 ? "#00e676" : "#ff3b3b" },
            ].map((c, i) => (
              <div key={i}>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 500, marginBottom: 8 }}>{c.label}</div>
                <div style={{ color: c.color, fontSize: 22, fontWeight: 700 }}>{c.value}</div>
                {c.sub && <div style={{ color: "rgba(255,255,255,0.18)", fontSize: 10, marginTop: 4 }}>{c.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* ── EOD Forecast ────────────────────────────────────────── */}
        <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "22px 24px", marginBottom: 28, display: "flex", gap: 28, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, letterSpacing: 2, marginBottom: 10, textTransform: "uppercase" }}>
              End-of-Month Forecast · {daysLeft} days left
            </div>
            <div style={{ color: "#60a5fa", fontSize: 32, fontWeight: 700, letterSpacing: -0.5 }}>
              ${Math.round(projectedEODBalance).toLocaleString()}
            </div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 5 }}>projected checking balance</div>
          </div>
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: 28, fontSize: 12, lineHeight: 2.2, color: "rgba(255,255,255,0.3)" }}>
            <div>${data.bankBalance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} current</div>
            <div style={{ color: "#00e676" }}>+${Math.round(projectedShiftIncome)} from {remainingMonthShifts.length} shifts</div>
            <div style={{ color: "#ff3b3b" }}>-${Math.round(projectedRemainingExpenses)} est. remaining</div>
          </div>
        </div>
      </ErrorBoundary>

      {/* ── 30-Day Chart ────────────────────────────────────────── */}
      <ErrorBoundary>
        <ChartPanel data={data} stockValue={stockValue} totalShiftEarnings={totalShiftEarnings} netWorth={netWorth} />
      </ErrorBoundary>

      {/* ── Dollar Deployer ─────────────────────────────────────── */}
      <ErrorBoundary>
        <DollarDeployer data={data} netWorth={netWorth} avgTips={avgTips} />
      </ErrorBoundary>

      {/* ── Alerts Feed ─────────────────────────────────────────── */}
      <ErrorBoundary>
        <AlertsFeed liquid={data.liquidCash || data.bankBalance} onStartFlip={startFlipFromOpp} />
      </ErrorBoundary>

      {/* ── AI Brief ────────────────────────────────────────────── */}
      <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "22px 24px", marginBottom: 28 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ color: "#00e676", fontSize: 12, fontWeight: 600 }}>AI Money Brief</div>
          <Btn onClick={() => fetchAIInsight(data)} color="#00e676" style={{ fontSize: 11 }} disabled={aiLoading || aiCooldown > 0} ariaLabel="Get AI money brief">{aiLoading ? "Thinking..." : aiCooldown > 0 ? `Wait ${aiCooldown}s` : "Get Brief"}</Btn>
        </div>
        {aiInsight
          ? <p style={{ color: "rgba(255,255,255,0.65)", lineHeight: 1.8, fontSize: 13, margin: 0 }}>{aiInsight}</p>
          : <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, margin: 0, fontStyle: "italic" }}>Tap "Get Brief" for your personalized AI money coach insight.</p>
        }
      </div>

      {/* ── Actions ─────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Btn onClick={() => { setModal("balance"); setForm({ bank: data.bankBalance, liquid: data.liquidCash, savings: data.savings }); }}>Update Balances</Btn>
        <Btn onClick={exportJSON} color="#60a5fa">Export JSON</Btn>
        <Btn onClick={exportCSV}  color="#60a5fa">Shifts CSV</Btn>
        <Btn onClick={() => importRef.current?.click()} color="#60a5fa">Import JSON</Btn>
      </div>
      <input ref={importRef} type="file" accept=".json" onChange={importJSON} style={{ display: "none" }} />
    </div>
  );
}
