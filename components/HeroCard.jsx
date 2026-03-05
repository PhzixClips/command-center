import { useState, useRef, useCallback } from "react";

const PERIODS = [
  { key: "1W", days: 7 },
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
  { key: "ALL", days: Infinity },
];

export default function HeroCard({ netWorth, netWorthHistory, dailyDelta }) {
  const [period, setPeriod] = useState("1M");
  const [scrub, setScrub] = useState(null); // { index, date, value }
  const svgRef = useRef(null);

  // Filter history by period
  const allPoints = netWorthHistory || [];
  const periodDays = PERIODS.find(p => p.key === period)?.days || 30;
  const points = periodDays === Infinity ? allPoints : allPoints.slice(-periodDays);
  const values = points.map(p => p.value);

  if (values.length === 0) values.push(netWorth);

  const first = values[0];
  const current = scrub ? scrub.value : values[values.length - 1];
  const delta = current - first;
  const deltaPct = first > 0 ? ((delta / first) * 100).toFixed(2) : "0.00";
  const isUp = delta >= 0;
  const lineColor = isUp ? "#00e676" : "#ff3b3b";

  // SVG line chart
  const W = 320;
  const H = 120;
  const PAD = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const getX = (i) => (values.length === 1) ? W / 2 : (i / (values.length - 1)) * W;
  const getY = (v) => PAD + (1 - (v - min) / range) * (H - PAD * 2);

  const pathD = values.map((v, i) => `${i === 0 ? "M" : "L"}${getX(i).toFixed(1)},${getY(v).toFixed(1)}`).join(" ");

  // Gradient fill path (line + close to bottom)
  const fillD = pathD + ` L${getX(values.length - 1).toFixed(1)},${H} L${getX(0).toFixed(1)},${H} Z`;

  // Touch scrub: find closest data point from touch position
  const findPointFromTouch = useCallback((clientX) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = (clientX - rect.left) / rect.width;
    const idx = Math.round(x * (values.length - 1));
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    if (points[clamped]) {
      return { index: clamped, date: points[clamped].date, value: points[clamped].value };
    }
    return null;
  }, [values.length, points]);

  const handleTouchStart = useCallback((e) => {
    e.stopPropagation();
    const pt = findPointFromTouch(e.touches[0].clientX);
    if (pt) setScrub(pt);
  }, [findPointFromTouch]);

  const handleTouchMove = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    const pt = findPointFromTouch(e.touches[0].clientX);
    if (pt) setScrub(pt);
  }, [findPointFromTouch]);

  const handleTouchEnd = useCallback((e) => {
    e.stopPropagation();
    setScrub(null);
  }, []);

  // Display values
  const displayValue = scrub ? scrub.value : netWorth;
  const displayDate = scrub ? scrub.date : null;
  const displayDelta = scrub ? scrub.value - first : dailyDelta;
  const displayDeltaLabel = scrub ? `${delta >= 0 ? "+" : ""}$${Math.abs(Math.round(delta)).toLocaleString()} (${deltaPct}%)` : `${dailyDelta >= 0 ? "+" : ""}$${Math.abs(Math.round(dailyDelta)).toLocaleString()} today`;
  const displayDeltaColor = scrub ? lineColor : (dailyDelta >= 0 ? "#00e676" : "#ff3b3b");

  // Scrub indicator position
  const scrubX = scrub ? getX(scrub.index) : null;
  const scrubY = scrub ? getY(scrub.value) : null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${lineColor}18`,
      borderRadius: 24,
      padding: "24px 24px 16px",
      marginBottom: 20,
      position: "relative",
      overflow: "hidden",
      boxShadow: `0 0 40px ${lineColor}08, 0 4px 20px rgba(0,0,0,0.3)`,
    }}>
      {/* Top glow */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${lineColor}44, transparent)`,
      }} />

      {/* Net worth display */}
      <div style={{ textAlign: "center", marginBottom: 2 }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500, letterSpacing: 1.5, marginBottom: 6 }}>
          {displayDate || "NET WORTH"}
        </div>
        <div style={{ color: "#fff", fontSize: 36, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1 }}>
          ${displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
        <div style={{ color: displayDeltaColor, fontSize: 13, fontWeight: 600, marginTop: 6 }}>
          {displayDeltaLabel}
        </div>
      </div>

      {/* Line chart with touch scrub */}
      <div
        style={{ margin: "18px -8px 0", position: "relative", touchAction: "none" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg
          ref={svgRef}
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          style={{ display: "block", width: "100%", height: "auto" }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          {/* Fill under the line */}
          <path d={fillD} fill="url(#heroFill)" />
          {/* The line */}
          <path d={pathD} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {/* Scrub indicator */}
          {scrub !== null && scrubX !== null && (
            <>
              <line x1={scrubX} y1={0} x2={scrubX} y2={H} stroke="rgba(255,255,255,0.15)" strokeWidth={1} strokeDasharray="3,3" />
              <circle cx={scrubX} cy={scrubY} r={5} fill={lineColor} stroke="#fff" strokeWidth={2} />
            </>
          )}
        </svg>
      </div>

      {/* Period selector */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 14 }}>
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            style={{
              background: period === p.key ? `${lineColor}18` : "transparent",
              border: period === p.key ? `1px solid ${lineColor}33` : "1px solid transparent",
              color: period === p.key ? lineColor : "rgba(255,255,255,0.25)",
              fontSize: 10, fontWeight: 600, letterSpacing: 0.5,
              padding: "5px 12px", borderRadius: 10, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >{p.key}</button>
        ))}
      </div>
    </div>
  );
}
