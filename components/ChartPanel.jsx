import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { DEFAULT_AVG_PER_SHIFT } from "./constants.js";

const CHART_VIEWS = [
  { key: "networth",  label: "NET WORTH",    color: "#00e676" },
  { key: "liquid",    label: "LIQUID",       color: "#00e676" },
  { key: "shifts",    label: "SHIFT INCOME", color: "#00e676" },
  { key: "stocks",    label: "PORTFOLIO",    color: "#60a5fa" },
  { key: "projected", label: "PROJECTED",    color: "#60a5fa" },
];

function buildChartData(data, stockValue, totalShiftEarnings, netWorth) {
  const today      = new Date();
  const thisYear   = today.getFullYear();
  const parseLabel = (s) => { const d = new Date(`${s} ${thisYear}`); return isNaN(d.getTime()) ? null : d; };

  const base = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  const nwMap  = {};
  (data.netWorthHistory || []).forEach(p => { nwMap[p.date]  = p.value; });
  const balMap = {};
  (data.balanceHistory  || []).forEach(p => { balMap[p.date] = p.value; });
  const stkMap = {};
  (data.stockHistory    || []).forEach(p => { stkMap[p.date] = p.value; });

  const shiftsByDate = {};
  data.shifts.forEach(s => {
    const earn = s.tips + s.hours * (s.wage || 0);
    if (!parseLabel(s.date)) return;
    shiftsByDate[s.date] = (shiftsByDate[s.date] || 0) + earn;
  });

  let lastNW  = null;
  let lastBal = null;
  let lastStk = null;
  const avgShift = data.shifts.length ? totalShiftEarnings / data.shifts.length : DEFAULT_AVG_PER_SHIFT;
  const rows = [];

  for (const [i, date] of base.entries()) {
    if (nwMap[date]  !== undefined) lastNW  = nwMap[date];
    if (balMap[date] !== undefined) lastBal = balMap[date];
    if (stkMap[date] !== undefined) lastStk = stkMap[date];

    rows.push({
      date,
      networth:  lastNW  !== null ? lastNW  : Math.round(netWorth),
      liquid:    lastBal !== null ? lastBal : Math.round(data.bankBalance + (data.savings || 0)),
      shifts:    Math.round(shiftsByDate[date] || 0),
      stocks:    lastStk !== null ? lastStk : Math.round(stockValue),
      projected: Math.round(avgShift * 8 * (i / 29)),
    });
  }
  return rows;
}

export default function ChartPanel({ data, stockValue, totalShiftEarnings, netWorth }) {
  const [view, setView] = useState("networth");
  const chartData = useMemo(
    () => buildChartData(data, stockValue, totalShiftEarnings, netWorth),
    [data, stockValue, totalShiftEarnings, netWorth]
  );
  const current   = CHART_VIEWS.find(v => v.key === view);
  const first = chartData[0]?.[view] || 0;
  const last  = chartData[chartData.length - 1]?.[view] || 0;
  const delta = last - first;
  const deltaPct = first > 0 ? ((delta / first) * 100).toFixed(1) : "0.0";

  const weeklyShift     = chartData.slice(-7).reduce((a, r) => a + r.shifts, 0);
  const windowShiftTotal = chartData.reduce((a, r) => a + r.shifts, 0);

  const labels = {
    networth:  { title: "30-DAY NET WORTH",        suffix: "" },
    liquid:    { title: "LIQUID CAPITAL FLOW",      suffix: "" },
    shifts:    { title: "DAILY SHIFT EARNINGS",     suffix: "" },
    stocks:    { title: "PORTFOLIO VALUE",           suffix: "" },
    projected: { title: "PROJECTED MONTHLY INCOME", suffix: "/mo" },
  };

  return (
    <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "22px 22px 18px", marginBottom: 28 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {CHART_VIEWS.map(v => (
          <button key={v.key} onClick={() => setView(v.key)} style={{
            background: view === v.key ? "rgba(255,255,255,0.06)" : "transparent",
            border: "none",
            color: view === v.key ? v.color : "rgba(255,255,255,0.2)",
            fontSize: 9, letterSpacing: 1, fontWeight: view === v.key ? 600 : 400,
            padding: "5px 10px", borderRadius: 8, cursor: "pointer", transition: "all 0.15s"
          }}>{v.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <div>
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>{labels[view].title}</div>
          <div style={{ color: current.color, fontSize: 24, fontWeight: 700 }}>
            ${(view === "shifts" ? windowShiftTotal : last).toLocaleString()}{labels[view].suffix}
          </div>
          {view === "shifts" && (
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 3 }}>30-day total</div>
          )}
        </div>
        {view === "shifts" ? (
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#00e676", fontSize: 17, fontWeight: 700 }}>
              ${weeklyShift.toLocaleString()}
            </div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>last 7 days</div>
          </div>
        ) : (
          <div style={{ textAlign: "right" }}>
            <div style={{ color: delta >= 0 ? "#00e676" : "#ff3b3b", fontSize: 14, fontWeight: 700 }}>
              {delta >= 0 ? "+" : ""}{deltaPct}%
            </div>
            <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>{delta >= 0 ? "+" : ""}${Math.abs(Math.round(delta)).toLocaleString()} · 30d</div>
          </div>
        )}
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }} tickLine={false} axisLine={false} interval={6} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.15)", fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+"k" : v}`} width={44} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div style={{ background: "rgba(15,15,25,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", padding: "10px 16px", fontSize: 11, borderRadius: 12 }}>
                <div style={{ color: "rgba(255,255,255,0.25)", marginBottom: 3 }}>{label}</div>
                <div style={{ color: current.color, fontWeight: 700, fontSize: 14 }}>${payload[0].value.toLocaleString()}</div>
              </div>
            );
          }} />
          <Line
            type={view === "shifts" ? "linear" : "monotone"}
            dataKey={view}
            stroke={current.color}
            strokeWidth={view === "shifts" ? 2 : 2.5}
            dot={view === "shifts" ? { r: 2.5, fill: current.color, strokeWidth: 0 } : false}
            activeDot={{ r: 5, fill: current.color, stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
