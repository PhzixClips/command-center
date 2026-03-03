import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const CHART_VIEWS = [
  { key: "networth",  label: "NET WORTH",    color: "#00ff88" },
  { key: "liquid",    label: "LIQUID",       color: "#ffd700" },
  { key: "shifts",    label: "SHIFT INCOME", color: "#a78bfa" },
  { key: "stocks",    label: "PORTFOLIO",    color: "#60a5fa" },
  { key: "projected", label: "PROJECTED",    color: "#fb923c" },
];

function buildChartData(data, stockValue, totalShiftEarnings, netWorth) {
  const today      = new Date();
  const thisYear   = today.getFullYear();
  const parseLabel = (s) => { const d = new Date(`${s} ${thisYear}`); return isNaN(d.getTime()) ? null : d; };

  // 30-day window oldest → newest
  const base = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  // Real net worth history — forward-fill gaps instead of fabricating them
  const nwMap = {};
  (data.netWorthHistory || []).forEach(p => { nwMap[p.date] = p.value; });

  // Real balance (checking + savings) history
  const balMap = {};
  (data.balanceHistory || []).forEach(p => { balMap[p.date] = p.value; });

  // Real cumulative shift income — all shifts, tips + wage
  const windowStart = new Date(today);
  windowStart.setDate(today.getDate() - 29);
  windowStart.setHours(0, 0, 0, 0);

  const shiftsByDate = {};
  let preWindowShift = 0;
  data.shifts.forEach(s => {
    const earn = s.tips + s.hours * (s.wage || 0);
    const d    = parseLabel(s.date);
    if (!d) return;
    if (d < windowStart) preWindowShift += earn;
    else shiftsByDate[s.date] = (shiftsByDate[s.date] || 0) + earn;
  });

  let lastNW   = null;
  let lastBal  = null;
  let shiftCum = preWindowShift;
  const avgShift = data.shifts.length ? totalShiftEarnings / data.shifts.length : 275;
  const rows = [];

  for (const [i, date] of base.entries()) {
    if (nwMap[date]  !== undefined) lastNW  = nwMap[date];
    if (balMap[date] !== undefined) lastBal = balMap[date];
    shiftCum += (shiftsByDate[date] || 0);

    rows.push({
      date,
      networth:  lastNW  !== null ? lastNW  : Math.round(netWorth),
      liquid:    lastBal !== null ? lastBal : Math.round(data.bankBalance + (data.savings || 0)),
      shifts:    Math.round(shiftCum),
      stocks:    Math.round(stockValue),                    // flat — no fabricated history
      projected: Math.round(avgShift * 8 * (i / 29)),      // ramp to ~8-shift month target
    });
  }
  return rows;
}

export default function ChartPanel({ data, stockValue, totalShiftEarnings, netWorth }) {
  const [view, setView] = useState("networth");
  const chartData = buildChartData(data, stockValue, totalShiftEarnings, netWorth);
  const current = CHART_VIEWS.find(v => v.key === view);
  const first = chartData[0]?.[view] || 0;
  const last  = chartData[chartData.length - 1]?.[view] || 0;
  const delta = last - first;
  const deltaPct = first > 0 ? ((delta / first) * 100).toFixed(1) : "0.0";
  const labels = {
    networth:  { title: "30-DAY NET WORTH",        suffix: "" },
    liquid:    { title: "LIQUID CAPITAL FLOW",      suffix: "" },
    shifts:    { title: "CUMULATIVE SHIFT INCOME",  suffix: "" },
    stocks:    { title: "PORTFOLIO VALUE",          suffix: "" },
    projected: { title: "PROJECTED MONTHLY INCOME", suffix: "/mo" },
  };
  return (
    <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, padding: "20px", marginBottom: 24 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {CHART_VIEWS.map(v => (
          <button key={v.key} onClick={() => setView(v.key)} style={{
            background: view === v.key ? `${v.color}18` : "none",
            border: `1px solid ${view === v.key ? v.color : "#222"}`,
            color: view === v.key ? v.color : "#444",
            fontFamily: "monospace", fontSize: 9, letterSpacing: 1,
            padding: "5px 10px", borderRadius: 4, cursor: "pointer", transition: "all 0.15s"
          }}>{v.label}</button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 }}>
        <div>
          <div style={{ color: "#444", fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>{labels[view].title}</div>
          <div style={{ color: current.color, fontSize: 22, fontWeight: 700, fontFamily: "monospace" }}>
            ${last.toLocaleString()}{labels[view].suffix}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: delta >= 0 ? "#00ff88" : "#ff3b3b", fontFamily: "monospace", fontSize: 13, fontWeight: 700 }}>
            {delta >= 0 ? "▲" : "▼"} ${Math.abs(Math.round(delta)).toLocaleString()}
          </div>
          <div style={{ color: "#444", fontSize: 10, fontFamily: "monospace" }}>{delta >= 0 ? "+" : ""}{deltaPct}% · 30d</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" tick={{ fill: "#333", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={6} />
          <YAxis tick={{ fill: "#333", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+"k" : v}`} width={44} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div style={{ background: "#111", border: `1px solid ${current.color}44`, padding: "8px 14px", fontFamily: "monospace", fontSize: 11, borderRadius: 6 }}>
                <div style={{ color: "#555", marginBottom: 2 }}>{label}</div>
                <div style={{ color: current.color, fontWeight: 700 }}>${payload[0].value.toLocaleString()}</div>
              </div>
            );
          }} />
          <Line type="monotone" dataKey={view} stroke={current.color} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: current.color }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
