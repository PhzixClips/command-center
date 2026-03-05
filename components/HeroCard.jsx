import { useState, useRef, useCallback } from "react";

const PERIODS = [
  { key: "1W", days: 7 },
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
  { key: "ALL", days: Infinity },
];

export default function HeroCard({ netWorth, netWorthHistory, dailyDelta }) {
  const [period, setPeriod] = useState("1M");
  const [scrub, setScrub] = useState(null);
  const svgRef = useRef(null);

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

  // SVG chart dimensions
  const W = 360;
  const H = 160;
  const PAD = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const getX = (i) => (values.length === 1) ? W / 2 : (i / (values.length - 1)) * W;
  const getY = (v) => PAD + (1 - (v - min) / range) * (H - PAD * 2);

  const pathD = values.map((v, i) => `${i === 0 ? "M" : "L"}${getX(i).toFixed(1)},${getY(v).toFixed(1)}`).join(" ");
  const fillD = pathD + ` L${getX(values.length - 1).toFixed(1)},${H} L${getX(0).toFixed(1)},${H} Z`;

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

  const displayValue = scrub ? scrub.value : netWorth;
  const displayDate = scrub ? scrub.date : null;
  const displayDeltaLabel = scrub
    ? `${delta >= 0 ? "+" : ""}$${Math.abs(Math.round(delta)).toLocaleString()} (${deltaPct}%)`
    : `${dailyDelta >= 0 ? "+" : ""}$${Math.abs(Math.round(dailyDelta)).toLocaleString()} today`;
  const displayDeltaColor = scrub ? lineColor : (dailyDelta >= 0 ? "#00e676" : "#ff3b3b");

  const scrubX = scrub ? getX(scrub.index) : null;
  const scrubY = scrub ? getY(scrub.value) : null;

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: `1px solid ${lineColor}12`,
      borderRadius: 28,
      padding: "32px 28px 20px",
      marginBottom: 28,
      position: "relative",
      overflow: "hidden",
      boxShadow: `0 0 60px ${lineColor}06, 0 8px 32px rgba(0,0,0,0.4)`,
    }}>
      {/* Ambient glow behind the number */}
      <div style={{
        position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)",
        width: 280, height: 120,
        background: `radial-gradient(ellipse, ${lineColor}08, transparent 70%)`,
        pointerEvents: "none",
      }} />
      {/* Top line glow */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, transparent, ${lineColor}33, transparent)`,
      }} />

      {/* Net worth display */}
      <div style={{ textAlign: "center", marginBottom: 8, position: "relative" }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600, letterSpacing: 2.5, marginBottom: 10, textTransform: "uppercase" }}>
          {displayDate || "NET WORTH"}
        </div>
        <div style={{
          color: "#fff", fontSize: 64, fontWeight: 800,
          letterSpacing: -3, lineHeight: 1,
          fontFeatureSettings: '"tnum"',
        }}>
          ${displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </div>
        <div style={{ color: displayDeltaColor, fontSize: 14, fontWeight: 600, marginTop: 10 }}>
          {displayDeltaLabel}
        </div>
      </div>

      {/* Line chart */}
      <div
        style={{ margin: "20px -12px 0", position: "relative", touchAction: "none" }}
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
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.18} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={fillD} fill="url(#heroFill)" />
          <path d={pathD} fill="none" stroke={lineColor} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          {scrub !== null && scrubX !== null && (
            <>
              <line x1={scrubX} y1={0} x2={scrubX} y2={H} stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="3,3" />
              <circle cx={scrubX} cy={scrubY} r={6} fill={lineColor} stroke="#fff" strokeWidth={2} />
            </>
          )}
        </svg>
      </div>

      {/* Period selector */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
        {PERIODS.map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            style={{
              background: period === p.key ? `${lineColor}15` : "transparent",
              border: period === p.key ? `1px solid ${lineColor}28` : "1px solid transparent",
              color: period === p.key ? lineColor : "rgba(255,255,255,0.2)",
              fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
              padding: "6px 16px", borderRadius: 12, cursor: "pointer",
              transition: "all 0.15s",
            }}
          >{p.key}</button>
        ))}
      </div>
    </div>
  );
}
