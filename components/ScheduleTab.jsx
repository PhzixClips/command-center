import { useState } from "react";

export default function ScheduleTab({ data, save, onLogShift }) {
  const [openWeek, setOpenWeek] = useState(null); // index of expanded week, or null
  const year = new Date().getFullYear();

  // Build per-day-of-week avg from actual shift history
  const avgByDay = data.shifts.reduce((acc, sh) => {
    const d = new Date(`${sh.date} ${year}`);
    if (isNaN(d.getTime())) return acc;
    const day = d.toLocaleDateString("en-US", { weekday: "short" }); // "Mon","Tue"…
    if (!acc[day]) acc[day] = { total: 0, count: 0 };
    acc[day].total += sh.tips + sh.hours * (sh.wage || 0);
    acc[day].count++;
    return acc;
  }, {});
  Object.keys(avgByDay).forEach(k => { avgByDay[k] = avgByDay[k].total / avgByDay[k].count; });

  const globalAvg = data.shifts.length
    ? data.shifts.reduce((s, sh) => s + sh.tips + sh.hours * (sh.wage || 0), 0) / data.shifts.length
    : 275;

  // Estimate for a specific scheduled shift using its day of week
  const estForShift = (s) => avgByDay[s.day] ?? globalAvg;

  // Build a lookup of actual earnings from logged shifts by date label
  const actualByDate = {};
  data.shifts.forEach(sh => {
    const key = sh.date; // e.g. "Mar 2"
    const earned = sh.tips + sh.hours * (sh.wage || 0);
    actualByDate[key] = (actualByDate[key] || 0) + earned;
  });

  const upcoming      = (data.schedule || []).filter(s => !s.logged);
  const allSchedule   = data.schedule || [];
  const thisWeek      = upcoming.slice(0, 4);
  const projectedWeek = thisWeek.reduce((a, s) => a + estForShift(s), 0);
  const projectedMonth = upcoming.reduce((a, s) => a + estForShift(s), 0);
  const hoursLeft      = upcoming.length * 6;

  const WEEKS = [
    { label: "Week of Mar 2",  dates: ["Mar 2","Mar 3","Mar 4","Mar 6"] },
    { label: "Week of Mar 9",  dates: ["Mar 9","Mar 10","Mar 11","Mar 13"] },
    { label: "Week of Mar 16", dates: ["Mar 15","Mar 16","Mar 17","Mar 18"] },
    { label: "Week of Mar 23", dates: ["Mar 20","Mar 23","Mar 24","Mar 25","Mar 27"] },
    { label: "Week of Mar 30", dates: ["Mar 30","Mar 31"] },
  ];

  const todayLabel = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const handleLog = (s) => {
    if (onLogShift) {
      onLogShift(s);
    } else {
      // fallback: just mark logged without opening modal
      save({
        ...data,
        schedule: data.schedule.map(sc =>
          sc.date === s.date && sc.time === s.time ? { ...sc, logged: true } : sc
        ),
      });
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ color: "#38bdf8", fontSize: 14, fontWeight: 600 }}>Upcoming Schedule</div>
        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11 }}>1059 · Surprise · CHW</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Shifts Left",     value: upcoming.length,                                    sub: hoursLeft + " hrs total",                  color: "#38bdf8" },
          { label: "Proj. This Week", value: "$" + Math.round(projectedWeek).toLocaleString(),   sub: "day-of-week estimate",                    color: "#a78bfa" },
          { label: "Proj. Month",     value: "$" + Math.round(projectedMonth).toLocaleString(),  sub: upcoming.length + " shifts remaining",     color: "#00ff88" },
        ].map((c, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: 1, width: "100%", background: `linear-gradient(90deg, ${c.color}00, ${c.color}, ${c.color}00)` }} />
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 500, marginBottom: 6 }}>{c.label}</div>
            <div style={{ color: c.color, fontSize: 24, fontWeight: 700 }}>{c.value}</div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 4 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "18px", marginBottom: 20 }}>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 500, marginBottom: 14 }}>Weekly Projection · day-of-week avg</div>
        {WEEKS.map((wk, wi) => {
          // All schedule entries for this week (logged + upcoming)
          const allWeekSchedule = allSchedule.filter(s => wk.dates.includes(s.date));
          const loggedWeek      = allWeekSchedule.filter(s => s.logged);
          const upcomingWeek    = allWeekSchedule.filter(s => !s.logged);

          // Actual earnings from logged shifts
          const actual    = loggedWeek.reduce((a, s) => a + (actualByDate[s.date] || 0), 0);
          // Projected earnings from remaining unlogged shifts
          const projected = upcomingWeek.reduce((a, s) => a + estForShift(s), 0);
          const total     = actual + projected;
          const pct       = Math.min(100, (total / (4 * globalAvg)) * 100);
          const isOpen    = openWeek === wi;
          const hasActual = actual > 0;

          return (
            <div key={wi} style={{ marginBottom: 12 }}>
              <div
                onClick={() => setOpenWeek(isOpen ? null : wi)}
                style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", marginBottom: 5 }}
              >
                <div style={{ color: isOpen ? "#fff" : "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: isOpen ? 600 : 400, transition: "color 0.2s" }}>
                  {isOpen ? "▼ " : "▶ "}{wk.label}
                </div>
                <div style={{ fontSize: 10, display: "flex", gap: 6, alignItems: "center" }}>
                  {hasActual && <span style={{ color: "#00ff88" }}>${Math.round(actual)} earned</span>}
                  {hasActual && upcomingWeek.length > 0 && <span style={{ color: "rgba(255,255,255,0.15)" }}>+</span>}
                  {upcomingWeek.length > 0 && <span style={{ color: "#a78bfa" }}>${Math.round(projected)} proj</span>}
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>· {allWeekSchedule.length} shift{allWeekSchedule.length !== 1 ? "s" : ""}</span>
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, height: isOpen ? 8 : 6, transition: "height 0.2s", position: "relative", overflow: "hidden" }}>
                {/* Actual earnings portion (green) */}
                {hasActual && (
                  <div style={{
                    position: "absolute", left: 0, top: 0,
                    background: "linear-gradient(90deg, #00ff88, #00e676)",
                    width: Math.min(100, (actual / (4 * globalAvg)) * 100) + "%",
                    height: "100%", borderRadius: 6, zIndex: 2,
                  }} />
                )}
                {/* Projected portion (purple, full bar width) */}
                <div style={{
                  background: isOpen ? "linear-gradient(90deg, #fff, #a78bfa)" : "linear-gradient(90deg, #a78bfa, #7c3aed)",
                  width: pct + "%", height: "100%", borderRadius: 6, transition: "width 0.4s",
                }} />
              </div>
              {isOpen && (
                <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                  {/* Show logged shifts for this week */}
                  {loggedWeek.map((s, si) => {
                    const earned = actualByDate[s.date] || 0;
                    return (
                      <div key={"logged-" + si} style={{
                        background: "rgba(0,230,118,0.04)",
                        border: "1px solid rgba(0,230,118,0.15)",
                        borderRadius: 12, padding: "10px 14px",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ textAlign: "center", minWidth: 32 }}>
                            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{s.day}</div>
                            <div style={{ color: "#00ff88", fontWeight: 700, fontSize: 15 }}>{s.date.split(" ")[1]}</div>
                          </div>
                          <div>
                            <div style={{ color: "#00ff88", fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                              {s.date}
                              <span style={{ color: "#00ff88", fontSize: 8, background: "#00e67615", border: "1px solid #00e67633", padding: "1px 5px", borderRadius: 8 }}>Logged</span>
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 1 }}>{s.time} · {s.role}</div>
                          </div>
                        </div>
                        <div style={{ color: "#00ff88", fontSize: 13, fontWeight: 600 }}>${Math.round(earned)}</div>
                      </div>
                    );
                  })}
                  {/* Show upcoming shifts for this week */}
                  {upcomingWeek.map((s, si) => {
                    const est = estForShift(s);
                    const isToday = s.date === todayLabel;
                    return (
                      <div key={"upcoming-" + si} style={{
                        background: isToday ? "rgba(0,230,118,0.04)" : "rgba(255,255,255,0.03)",
                        border: isToday ? "1px solid rgba(0,230,118,0.15)" : "1px solid rgba(255,255,255,0.06)",
                        borderRadius: 12, padding: "10px 14px",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                      }}>
                        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                          <div style={{ textAlign: "center", minWidth: 32 }}>
                            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{s.day}</div>
                            <div style={{ color: isToday ? "#00ff88" : "#e8e8e8", fontWeight: 700, fontSize: 15 }}>{s.date.split(" ")[1]}</div>
                          </div>
                          <div>
                            <div style={{ color: isToday ? "#00ff88" : "#e8e8e8", fontWeight: 600, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                              {s.date}
                              {isToday && <span style={{ color: "#00ff88", fontSize: 8, background: "#00e67615", border: "1px solid #00e67633", padding: "1px 5px", borderRadius: 8 }}>Today</span>}
                            </div>
                            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 1 }}>{s.time} · {s.role}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>~${Math.round(est)}</div>
                          <button onClick={() => handleLog(s)} style={{
                            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontSize: 9,
                            padding: "4px 10px", borderRadius: 10, cursor: "pointer", letterSpacing: 1,
                          }}>Log ✓</button>
                        </div>
                      </div>
                    );
                  })}
                  {allWeekSchedule.length === 0 && (
                    <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 11, padding: "8px 0", textAlign: "center" }}>No shifts this week</div>
                  )}
                  {/* Week summary when expanded */}
                  {(hasActual || upcomingWeek.length > 0) && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 4px 0", borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: 4 }}>
                      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10 }}>
                        {loggedWeek.length} logged · {upcomingWeek.length} remaining
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#fff" }}>
                        Total: ${Math.round(total)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {(openWeek !== null ? [] : upcoming).map((s, i) => {
          const isToday  = s.date === todayLabel;
          const est      = estForShift(s);
          const hasDayAvg = avgByDay[s.day] !== undefined;
          return (
            <div key={i} style={{
              background: isToday ? "rgba(0,230,118,0.04)" : "rgba(255,255,255,0.03)",
              backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
              border: isToday ? "1px solid rgba(0,230,118,0.15)" : "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16, padding: "12px 18px",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ textAlign: "center", minWidth: 36 }}>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 500 }}>{s.day}</div>
                  <div style={{ color: isToday ? "#00ff88" : "#e8e8e8", fontWeight: 700, fontSize: 16 }}>{s.date.split(" ")[1]}</div>
                </div>
                <div>
                  <div style={{ color: isToday ? "#00ff88" : "#e8e8e8", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    {s.date}
                    {isToday && <span style={{ color: "#00ff88", fontSize: 8, background: "#00e67615", border: "1px solid #00e67633", padding: "1px 5px", borderRadius: 8 }}>Today</span>}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>{s.time} · {s.role}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 13 }}>~${Math.round(est)}</div>
                  {hasDayAvg && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>{s.day} avg</div>}
                </div>
                <button onClick={() => handleLog(s)} style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)", fontSize: 9,
                  padding: "4px 10px", borderRadius: 10, cursor: "pointer", letterSpacing: 1
                }}>Log ✓</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
