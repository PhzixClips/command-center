export default function ScheduleTab({ data, save, onLogShift }) {
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

  const upcoming      = (data.schedule || []).filter(s => !s.logged);
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
        <div style={{ color: "#38bdf8", fontSize: 11, letterSpacing: 2 }}>UPCOMING SCHEDULE</div>
        <div style={{ color: "#555", fontSize: 11, fontFamily: "monospace" }}>1059 · Surprise · CHW</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "SHIFTS LEFT",     value: upcoming.length,                                    sub: hoursLeft + " hrs total",                  color: "#38bdf8" },
          { label: "PROJ. THIS WEEK", value: "$" + Math.round(projectedWeek).toLocaleString(),   sub: "day-of-week estimate",                    color: "#a78bfa" },
          { label: "PROJ. MONTH",     value: "$" + Math.round(projectedMonth).toLocaleString(),  sub: upcoming.length + " shifts remaining",     color: "#00ff88" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#0d0d0d", border: "1px solid " + c.color + "22", borderRadius: 8, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: c.color }} />
            <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, marginBottom: 6, fontFamily: "monospace" }}>{c.label}</div>
            <div style={{ color: c.color, fontSize: 24, fontWeight: 700, fontFamily: "monospace" }}>{c.value}</div>
            <div style={{ color: "#444", fontSize: 11, marginTop: 4, fontFamily: "monospace" }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, padding: "18px", marginBottom: 20 }}>
        <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, marginBottom: 14 }}>WEEKLY PROJECTION · day-of-week avg</div>
        {WEEKS.map((wk, wi) => {
          const weekShifts = upcoming.filter(s => wk.dates.includes(s.date));
          const proj = weekShifts.reduce((a, s) => a + estForShift(s), 0);
          const pct  = Math.min(100, (proj / (4 * globalAvg)) * 100);
          return (
            <div key={wi} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <div style={{ color: "#666", fontSize: 10, fontFamily: "monospace" }}>{wk.label}</div>
                <div style={{ color: "#a78bfa", fontSize: 10, fontFamily: "monospace" }}>${Math.round(proj)} · {weekShifts.length} shifts</div>
              </div>
              <div style={{ background: "#1a1a1a", borderRadius: 3, height: 6 }}>
                <div style={{ background: "linear-gradient(90deg, #a78bfa, #7c3aed)", width: pct + "%", height: "100%", borderRadius: 3, transition: "width 0.4s" }} />
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "grid", gap: 8 }}>
        {upcoming.map((s, i) => {
          const isToday  = s.date === todayLabel;
          const est      = estForShift(s);
          const hasDayAvg = avgByDay[s.day] !== undefined;
          return (
            <div key={i} style={{
              background: isToday ? "#00ff8808" : "#0d0d0d",
              border: "1px solid " + (isToday ? "#00ff8844" : "#1a1a1a"),
              borderRadius: 8, padding: "12px 18px",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ textAlign: "center", minWidth: 36 }}>
                  <div style={{ color: "#555", fontSize: 9, fontFamily: "monospace" }}>{s.day}</div>
                  <div style={{ color: isToday ? "#00ff88" : "#e8e8e8", fontWeight: 700, fontSize: 16 }}>{s.date.split(" ")[1]}</div>
                </div>
                <div>
                  <div style={{ color: isToday ? "#00ff88" : "#e8e8e8", fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    {s.date}
                    {isToday && <span style={{ color: "#00ff88", fontSize: 8, border: "1px solid #00ff88", padding: "1px 5px", borderRadius: 3 }}>TODAY</span>}
                  </div>
                  <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>{s.time} · {s.role}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#444", fontFamily: "monospace", fontSize: 13 }}>~${Math.round(est)}</div>
                  {hasDayAvg && <div style={{ color: "#333", fontFamily: "monospace", fontSize: 9 }}>{s.day} avg</div>}
                </div>
                <button onClick={() => handleLog(s)} style={{
                  background: "none", border: "1px solid #333", color: "#555", fontSize: 9,
                  fontFamily: "monospace", padding: "4px 10px", borderRadius: 4, cursor: "pointer", letterSpacing: 1
                }}>LOG ✓</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
