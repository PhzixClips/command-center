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
        <HeroCard netWorth={netWorth} netWorthHistory={data.netWorthHistory} dailyDelta={(() => {
          const h = data.netWorthHistory || [];
          if (h.length < 2) return 0;
          return h[h.length - 1].value - h[h.length - 2].value;
        })()} />

        <MoneyVelocity
          monthShiftIncome={monthShiftIncome} monthFlipIncome={monthFlipIncome}
          monthExpensesTotal={monthExpensesTotal} savings={data.savings}
        />

        <DailyCard data={data} netWorth={netWorth} avgTips={avgTips} stockValue={stockValue} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
          <StatCard label="Checking"    value={`$${data.bankBalance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`} sub="Desert Financial CU" accent="#00ff88" />
          <StatCard label="Savings"     value={`$${(data.savings||0).toFixed(2)}`} sub="Membership Savings" accent="#34d399" />
          <StatCard label="Portfolio"   value={`$${stockValue.toLocaleString(undefined,{maximumFractionDigits:0})}`} sub="CHPY · GDXY · TDAX" accent="#60a5fa" />
          <StatCard label="Flip Income" value={`$${Math.round(flipProfit)}`} sub="Realized net of fees" accent="#ff8c00" />
          <StatCard label="Shift Income" value={`$${Math.round(totalShiftEarnings).toLocaleString()}`} sub={`Avg $${Math.round(avgPerShift)}/shift · $${Math.round(avgTips)} tips`} accent="#a78bfa" />
        </div>

        {showBackupPrompt && (
          <div style={{ background: "rgba(255,215,0,0.04)", border: "1px solid rgba(255,215,0,0.12)", borderRadius: 16, padding: "16px 20px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ color: "#ffd700", fontSize: 12, fontWeight: 600, marginBottom: 3 }}>Backup Reminder</div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>Export your data so you never lose it.</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn onClick={() => { exportJSON(); dismissBackupPrompt(); }} color="#ffd700" style={{ fontSize: 11 }}>Export Now</Btn>
              <button onClick={dismissBackupPrompt} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", fontSize: 11, padding: "8px 14px", borderRadius: 16, cursor: "pointer" }}>Dismiss</button>
            </div>
          </div>
        )}

        {overspendWarnings.length > 0 && (
          <div style={{ background: "rgba(255,59,59,0.04)", border: "1px solid rgba(255,59,59,0.12)", borderRadius: 16, padding: "16px 20px", marginBottom: 20 }}>
            <div style={{ color: "#ff3b3b", fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Budget Warnings · {daysLeft} days left</div>
            {overspendWarnings.map(({ cat, spent, limit, pct }) => (
              <div key={cat} style={{ color: +pct >= 100 ? "#ff3b3b" : "#ff8c00", fontSize: 13, marginBottom: 4 }}>
                {cat}: ${spent.toFixed(0)} / ${limit} ({pct}%){+pct >= 100 ? " — over budget" : " — approaching limit"}
              </div>
            ))}
          </div>
        )}

        {/* Monthly P&L */}
        <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "20px 22px", marginBottom: 20 }}>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 500, marginBottom: 16 }}>
            Monthly P&L · {now.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16 }}>
            {[
              { label: "Shift Income", value: `+$${Math.round(monthShiftIncome).toLocaleString()}`, color: "#a78bfa" },
              { label: "Flip Income",  value: `+$${Math.round(monthFlipIncome).toLocaleString()}`,  color: "#ff8c00", sub: monthFlipIncome === 0 ? "no sales yet" : null },
              { label: "Expenses",     value: `-$${Math.round(monthExpensesTotal).toLocaleString()}`, color: "#ff3b3b" },
              { label: "Net",          value: `${monthNetPL >= 0 ? "+" : ""}$${Math.round(monthNetPL).toLocaleString()}`, color: monthNetPL >= 0 ? "#00e676" : "#ff3b3b" },
            ].map((c, i) => (
              <div key={i}>
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: 500, marginBottom: 6 }}>{c.label}</div>
                <div style={{ color: c.color, fontSize: 20, fontWeight: 700 }}>{c.value}</div>
                {c.sub && <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 3 }}>{c.sub}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* EOD cash projection */}
        <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "20px 22px", marginBottom: 20, display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 500, marginBottom: 8 }}>
              End-of-Month Forecast · {daysLeft} days left
            </div>
            <div style={{ color: "#60a5fa", fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>
              ${Math.round(projectedEODBalance).toLocaleString()}
            </div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 4 }}>projected checking balance</div>
          </div>
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", paddingLeft: 24, fontSize: 13, lineHeight: 2, color: "rgba(255,255,255,0.35)" }}>
            <div>${data.bankBalance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} current</div>
            <div style={{ color: "#a78bfa" }}>+${Math.round(projectedShiftIncome)} from {remainingMonthShifts.length} shifts (${Math.round(avgPerShift)} avg)</div>
            <div style={{ color: "#ff3b3b" }}>−${Math.round(projectedRemainingExpenses)} est. remaining spend</div>
          </div>
        </div>
      </ErrorBoundary>

      <ErrorBoundary>
        <ChartPanel data={data} stockValue={stockValue} totalShiftEarnings={totalShiftEarnings} netWorth={netWorth} />
      </ErrorBoundary>
      <ErrorBoundary>
        <DollarDeployer data={data} netWorth={netWorth} avgTips={avgTips} />
      </ErrorBoundary>
      <ErrorBoundary>
        <AlertsFeed liquid={data.liquidCash || data.bankBalance} onStartFlip={startFlipFromOpp} />
      </ErrorBoundary>

      {/* AI Brief */}
      <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 22, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ color: "#ffd700", fontSize: 13, fontWeight: 600 }}>AI Money Brief</div>
          <Btn onClick={() => fetchAIInsight(data)} color="#ffd700" style={{ fontSize: 11 }} disabled={aiLoading || aiCooldown > 0} ariaLabel="Get AI money brief">{aiLoading ? "Thinking..." : aiCooldown > 0 ? `Wait ${aiCooldown}s` : "Get Brief"}</Btn>
        </div>
        {aiInsight
          ? <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.8, fontSize: 14, margin: 0 }}>{aiInsight}</p>
          : <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 13, margin: 0, fontStyle: "italic" }}>Tap "Get Brief" for your personalized AI money coach insight.</p>
        }
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Btn onClick={() => { setModal("balance"); setForm({ bank: data.bankBalance, liquid: data.liquidCash, savings: data.savings }); }}>Update Balances</Btn>
        <Btn onClick={exportJSON} color="#60a5fa">Export JSON</Btn>
        <Btn onClick={exportCSV}  color="#a78bfa">Shifts CSV</Btn>
        <Btn onClick={() => importRef.current?.click()} color="#ffd700">Import JSON</Btn>
      </div>
      <input ref={importRef} type="file" accept=".json" onChange={importJSON} style={{ display: "none" }} />
    </div>
  );
}
