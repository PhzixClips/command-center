import Btn from "../Btn.jsx";
import { resolveGoalCurrent } from "../hooks/useAppState.js";
import { GOAL_AUTO_LABELS } from "../constants.js";

export default function GoalsTab({
  data, stockValue, flipProfit, nwDailyGain,
  openEditGoal, deleteGoal, setModal, setForm,
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ color: "#e879f9", fontSize: 14, fontWeight: 600 }}>Financial Goals</div>
        <Btn onClick={() => { setForm({ autoKey: "none" }); setModal("goal"); }} color="#e879f9">+ Add Goal</Btn>
      </div>
      <div style={{ display: "grid", gap: 14 }}>
        {data.goals.map((g, i) => {
          const current = resolveGoalCurrent(g, data.bankBalance, stockValue, flipProfit);
          const pct     = Math.min(100, (current / g.target) * 100);
          return (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "18px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ color: "#e8e8e8", fontWeight: 600 }}>{g.name}</div>
                  {g.autoKey && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, marginTop: 2 }}>{GOAL_AUTO_LABELS[g.autoKey] || ""}</div>}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>${current.toLocaleString(undefined,{maximumFractionDigits:0})} / ${g.target.toLocaleString()}</div>
                  <button onClick={() => openEditGoal(i)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 9, padding: "3px 8px", borderRadius: 8, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => deleteGoal(i)} style={{ background: "none", border: "1px solid #ff3b3b44", color: "#ff3b3b", fontSize: 11, padding: "2px 7px", borderRadius: 8, cursor: "pointer" }}>✕</button>
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, height: 8, overflow: "hidden" }}>
                <div style={{ background: pct >= 100 ? "#00ff88" : "#e879f9", width: `${pct}%`, height: "100%", borderRadius: 4, transition: "width 0.5s" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>{pct.toFixed(0)}% complete · ${Math.max(0, g.target - current).toLocaleString(undefined,{maximumFractionDigits:0})} to go</div>
                {(() => {
                  const remaining = Math.max(0, g.target - current);
                  if (pct >= 100) return <span style={{ color: "#00ff88", fontSize: 10 }}>REACHED</span>;
                  if (nwDailyGain <= 0 || remaining === 0) return null;
                  const days = remaining / nwDailyGain;
                  if (days > 365 * 3) return null;
                  const label = days < 7 ? `< 1 week` : days < 60 ? `~${Math.round(days / 7)}wk` : `~${Math.round(days / 30)}mo`;
                  return <span style={{ color: "#38bdf8", fontSize: 10 }}>ETA {label}</span>;
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
