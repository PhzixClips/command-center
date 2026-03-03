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
  const today = new Date();
  const base = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
  const nwMap = {};
  (data.netWorthHistory || []).forEach(p => { nwMap[p.date] = p.value; });
  const shiftMap = {};
  let runningShift = 0;
  data.shifts.forEach(s => { shiftMap[s.date] = s.tips; });
  const stockBase = 1800;
  const stockEnd = stockValue;
  const avgShift = data.shifts.length ? totalShiftEarnings / data.shifts.length : 275;
  const projectedMonthly = avgShift * 6;
  return base.map((date, i) => {
    const progress = i / 29;
    const noise = Math.sin(i * 0.7) * 80 + Math.cos(i * 1.3) * 40;
    const nw = nwMap[date] || Math.round(netWorth * 0.88 + netWorth * 0.12 * progress + noise * 0.5);
    const liquid = Math.max(800, Math.round(data.bankBalance * (0.75 + 0.25 * Math.sin(i * 0.5)) + (shiftMap[date] || 0)));
    runningShift += (shiftMap[date] || (i > 20 ? avgShift / 5 : avgShift / 8));
    const shifts = Math.round(runningShift);
    const stocks = Math.round(stockBase + (stockEnd - stockBase) * progress + noise * 0.3);
    const projected = Math.round((projectedMonthly / 29) * (i + 1));
    return { date, networth: nw, liquid, shifts, stocks, projected };
  });
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
