import Btn from "../Btn.jsx";
import { parseDateLabel } from "../hooks/useAppState.js";
import { SHORT_TO_FULL_DAY } from "../constants.js";

export default function ShiftsTab({
  data, thisYear, now, totalShiftEarnings, avgPerShift, avgTips,
  dayEntries, maxDayAvg, filterDay, setFilterDay,
  openWeeks, setOpenWeeks,
  openEditShift, deleteShift, setModal, setForm,
}) {
  const selStyle = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", color: "#e8e8e8", fontSize: 14, outline: "none" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ color: "#a78bfa", fontSize: 14, fontWeight: 600 }}>Serving Shifts</div>
        <Btn onClick={() => { setModal("shift"); setForm({}); }} color="#a78bfa">+ Log Shift</Btn>
      </div>

      {/* Shift pattern insights */}
      {dayEntries.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 500, marginBottom: 14 }}>
            Earnings by Day · {filterDay ? <span style={{ color: "#a78bfa" }}>tap again to clear</span> : "tap a day to filter"}
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
                    <div style={{ color: active ? "#fff" : "#a78bfa", fontSize: 11, fontWeight: active ? 700 : 400 }}>
                      {active ? "▶ " : ""}{day}
                    </div>
                    <div style={{ color: "#e8e8e8", fontSize: 11 }}>${Math.round(avg)} avg · {count} shift{count !== 1 ? "s" : ""}</div>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, height: active ? 8 : 6, transition: "height 0.2s" }}>
                    <div style={{ background: active ? "linear-gradient(90deg, #fff, #a78bfa)" : "linear-gradient(90deg, #a78bfa, #7c3aed)", width: `${pct}%`, height: "100%", borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
          {dayEntries.length > 0 && (
            <div style={{ marginTop: 12, color: "rgba(255,255,255,0.25)", fontSize: 10 }}>
              Best day: <span style={{ color: "#a78bfa" }}>{dayEntries[0].day}</span> averaging ${Math.round(dayEntries[0].avg)}/shift
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

      {data.shifts.length === 0 && (
        <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 12, textAlign: "center", padding: "32px 0" }}>No shifts yet. Log your first one above.</div>
      )}

      {/* Shift log */}
      {(() => {
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
          const fullName = SHORT_TO_FULL_DAY[filterDay] || filterDay;
          const filtered = sorted.filter(({ s }) => getDOW(s.date) === fullName);
          return (
            <div>
              <div style={{ textAlign: "center", padding: "16px 0 20px", borderBottom: "1px solid #1a1a1a", marginBottom: 16 }}>
                <div style={{ color: "#a78bfa", fontSize: 32, fontWeight: 900, letterSpacing: 4 }}>{fullName.toUpperCase()}</div>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 4 }}>{filtered.length} shift{filtered.length !== 1 ? "s" : ""} logged</div>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {filtered.map(({ s, origIdx }) => {
                  const total  = s.tips + s.hours * s.wage;
                  const hourly = total / s.hours;
                  const scheduled = (data.schedule || []).find(sc => sc.date === s.date);
                  return (
                    <div key={origIdx} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #a78bfa22", borderRadius: 14, padding: "12px 16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ color: "#e8e8e8", fontWeight: 600, fontSize: 14 }}>{s.date}</div>
                          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>{s.hours}hrs · ${s.wage}/hr · <span style={{ color: "rgba(255,255,255,0.35)" }}>${hourly.toFixed(2)}/hr eff.</span></div>
                          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 1 }}>tips: ${s.tips}</div>
                          {scheduled?.time && <div style={{ color: "#38bdf8", fontSize: 10, marginTop: 2 }}>shift: {scheduled.time}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{ color: "#a78bfa", fontSize: 20, fontWeight: 700 }}>${Math.round(total)}</div>
                          <button onClick={() => openEditShift(origIdx)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 9, padding: "4px 8px", borderRadius: 8, cursor: "pointer" }}>Edit</button>
                          <button onClick={() => deleteShift(origIdx)} style={{ background: "none", border: "1px solid #ff3b3b44", color: "#ff3b3b", fontSize: 11, padding: "3px 8px", borderRadius: 8, cursor: "pointer" }}>✕</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }

        // Default mode: grouped by calendar week
        const getWeekStart = (dateStr) => {
          const d = parseDateLabel(dateStr, thisYear);
          if (!d) return null;
          const day = d.getDay();
          const sun = new Date(d);
          sun.setDate(d.getDate() - day);
          sun.setHours(0, 0, 0, 0);
          return sun;
        };

        const weekMap = new Map();
        sorted.forEach(({ s, origIdx }) => {
          const ws = getWeekStart(s.date);
          if (!ws) return;
          const key = ws.toISOString();
          if (!weekMap.has(key)) weekMap.set(key, { weekStart: ws, shifts: [] });
          weekMap.get(key).shifts.push({ s, origIdx });
        });

        const weeks = [...weekMap.entries()]
          .sort((a, b) => new Date(b[0]) - new Date(a[0]))
          .map(([key, val]) => ({ key, ...val }));

        const toggleWeek = (key) => {
          setOpenWeeks(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
          });
        };

        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {weeks.map(({ key, weekStart, shifts: wShifts }, wi) => {
              const weekKey   = wi === 0 ? "__latest__" : key;
              const isOpen    = openWeeks.has(weekKey);
              const label     = weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" });
              const weekTotal = wShifts.reduce((a, { s }) => a + s.tips + s.hours * s.wage, 0);
              const weekHours = wShifts.reduce((a, { s }) => a + s.hours, 0);
              const weekTips  = wShifts.reduce((a, { s }) => a + s.tips, 0);
              const weekAvg   = wShifts.length ? weekTotal / wShifts.length : 0;

              return (
                <div key={weekKey} style={{ border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
                  <div onClick={() => toggleWeek(weekKey)}
                    style={{ background: "rgba(255,255,255,0.03)", padding: "14px 18px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", userSelect: "none" }}>
                    <div>
                      <div style={{ color: "#a78bfa", fontSize: 13, fontWeight: 600 }}>{isOpen ? "▼" : "▶"} Week of {label}</div>
                      <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 3 }}>
                        {wShifts.length} shift{wShifts.length !== 1 ? "s" : ""} · {weekHours}hrs · ${Math.round(weekTips)} tips
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#a78bfa", fontSize: 22, fontWeight: 700 }}>${Math.round(weekTotal)}</div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>${Math.round(weekAvg)}/shift avg</div>
                    </div>
                  </div>

                  {isOpen && (
                    <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 8, background: "#0a0a10" }}>
                      {wShifts.map(({ s, origIdx }) => {
                        const total  = s.tips + s.hours * s.wage;
                        const hourly = total / s.hours;
                        const scheduled = (data.schedule || []).find(sc => sc.date === s.date);
                        return (
                          <div key={origIdx} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 16px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <div style={{ color: "#e8e8e8", fontWeight: 600, fontSize: 14 }}>{s.date}</div>
                                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>{s.hours}hrs · ${s.wage}/hr · <span style={{ color: "rgba(255,255,255,0.35)" }}>${hourly.toFixed(2)}/hr eff.</span></div>
                                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 1 }}>tips: ${s.tips}</div>
                                {scheduled?.time && <div style={{ color: "#38bdf8", fontSize: 10, marginTop: 2 }}>shift: {scheduled.time}</div>}
                              </div>
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <div style={{ color: "#a78bfa", fontSize: 20, fontWeight: 700 }}>${Math.round(total)}</div>
                                <button onClick={(e) => { e.stopPropagation(); openEditShift(origIdx); }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 9, padding: "4px 8px", borderRadius: 8, cursor: "pointer" }}>Edit</button>
                                <button onClick={(e) => { e.stopPropagation(); deleteShift(origIdx); }} style={{ background: "none", border: "1px solid #ff3b3b44", color: "#ff3b3b", fontSize: 11, padding: "3px 8px", borderRadius: 8, cursor: "pointer" }}>✕</button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 4 }}>
                        {[
                          { label: "WEEK TOTAL", value: `$${Math.round(weekTotal)}`, color: "#a78bfa" },
                          { label: "AVG/SHIFT",  value: `$${Math.round(weekAvg)}`,  color: "#ffd700" },
                          { label: "HOURS",      value: `${weekHours}h`,             color: "#60a5fa" },
                          { label: "TIPS",       value: `$${Math.round(weekTips)}`,  color: "#00ff88" },
                        ].map((st, i) => (
                          <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "8px 10px" }}>
                            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 8, letterSpacing: 1 }}>{st.label}</div>
                            <div style={{ color: st.color, fontSize: 14, fontWeight: 700, marginTop: 2 }}>{st.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 16px" }}>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 500, marginBottom: 4 }}>{stat.label}</div>
            <div style={{ color: stat.color, fontSize: 18, fontWeight: 700 }}>{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
