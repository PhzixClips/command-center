import { useState, useRef, useCallback } from "react";

export default function HeroCard({ netWorth, netWorthHistory, dailyDelta }) {
  const [expanded, setExpanded] = useState(false);
  const [holdBar, setHoldBar] = useState(null); // { index, x, y, date, value }
  const longPressTimer = useRef(null);
  const touchStartPos = useRef(null);

  // Build sparkline from last 30 data points
  const points = (netWorthHistory || []).slice(-30);
  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // SVG dimensions — bigger when expanded
  const W = 320;
  const H = expanded ? 160 : 60;
  const barW = Math.max(4, (W - (values.length - 1) * 2) / values.length);
  const gap = 2;

  const deltaSign = dailyDelta >= 0 ? "+" : "";
  const deltaColor = dailyDelta >= 0 ? "#00e676" : "#ff3b3b";

  // Long-press handlers
  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    longPressTimer.current = setTimeout(() => {
      // Find which bar is closest to the touch point
      const svg = e.currentTarget.querySelector("svg");
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      const scaleX = W / rect.width;
      const svgX = touchX * scaleX;

      // Find closest bar
      let closest = 0;
      let closestDist = Infinity;
      for (let i = 0; i < values.length; i++) {
        const barCenter = i * (barW + gap) + barW / 2;
        const dist = Math.abs(svgX - barCenter);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      }

      if (points[closest]) {
        setHoldBar({
          index: closest,
          date: points[closest].date,
          value: points[closest].value,
        });
      }
      longPressTimer.current = null;
    }, 400);
  }, [points, values, barW, gap]);

  const handleTouchMove = useCallback((e) => {
    if (holdBar !== null) {
      // If already in hold mode, update which bar is selected
      const touch = e.touches[0];
      const svg = e.currentTarget.querySelector("svg");
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      const scaleX = W / rect.width;
      const svgX = touchX * scaleX;

      let closest = 0;
      let closestDist = Infinity;
      for (let i = 0; i < values.length; i++) {
        const barCenter = i * (barW + gap) + barW / 2;
        const dist = Math.abs(svgX - barCenter);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      }

      if (points[closest]) {
        setHoldBar({
          index: closest,
          date: points[closest].date,
          value: points[closest].value,
        });
      }
      e.preventDefault();
      return;
    }

    // If moved too far before long press triggers, cancel it
    if (touchStartPos.current) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);
      if (dx > 10 || dy > 10) clearLongPress();
    }
  }, [holdBar, points, values, barW, gap, clearLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (holdBar !== null) {
      setHoldBar(null);
      return;
    }
    if (longPressTimer.current) {
      // Was a short tap — toggle expanded
      clearLongPress();
      setExpanded(prev => !prev);
    }
  }, [holdBar, clearLongPress]);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(0,230,118,0.12)",
        borderRadius: 24,
        padding: "24px 24px 20px",
        marginBottom: 20,
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 0 40px rgba(0,230,118,0.04), 0 4px 20px rgba(0,0,0,0.3)",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => { if (!holdBar) setExpanded(prev => !prev); }}
    >
      {/* Subtle top glow */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(0,230,118,0.3), rgba(0,176,255,0.2), transparent)",
      }} />

      {/* Label */}
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 500, letterSpacing: 1 }}>Net Worth</div>
      </div>

      {/* Big number */}
      <div style={{ textAlign: "center", marginBottom: 4 }}>
        <span style={{ color: "#fff", fontSize: 38, fontWeight: 800, letterSpacing: -1.5 }}>
          ${netWorth.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </div>

      {/* Daily delta */}
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <span style={{ color: deltaColor, fontSize: 14, fontWeight: 600 }}>
          {deltaSign}${Math.abs(Math.round(dailyDelta))} today
        </span>
      </div>

      {/* Hold tooltip */}
      {holdBar !== null && (
        <div style={{
          textAlign: "center", marginBottom: 10,
          animation: "fadeIn 0.15s ease",
        }}>
          <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{holdBar.date}</span>
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 700, marginLeft: 10 }}>
            ${holdBar.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          {holdBar.index > 0 && (() => {
            const prev = values[holdBar.index - 1];
            const diff = holdBar.value - prev;
            return (
              <span style={{ color: diff >= 0 ? "#00e676" : "#ff3b3b", fontSize: 11, marginLeft: 8 }}>
                {diff >= 0 ? "+" : ""}{diff.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            );
          })()}
        </div>
      )}

      {/* Sparkline / expanded chart */}
      <div style={{ display: "flex", justifyContent: "center", transition: "all 0.3s ease" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", maxWidth: "100%", transition: "height 0.3s ease" }}>
          {values.map((v, i) => {
            const normalized = (v - min) / range;
            const barH = Math.max(3, normalized * (H - 4));
            const x = i * (barW + gap);
            const y = H - barH;
            const isLast = i === values.length - 1;
            const isHeld = holdBar !== null && holdBar.index === i;
            const opacity = isHeld ? 1 : isLast ? 1 : 0.3 + normalized * 0.5;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={2}
                fill={isHeld ? "#fff" : isLast ? "#fff" : "#00e676"}
                opacity={opacity}
              />
            );
          })}
          {/* Y-axis labels when expanded */}
          {expanded && [0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const val = min + range * pct;
            const y = H - (pct * (H - 4)) - 2;
            return (
              <g key={`label-${i}`}>
                <line x1={0} x2={W} y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
                <text x={W - 2} y={y - 3} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize={8}>
                  ${val >= 1000 ? `${(val / 1000).toFixed(1)}k` : Math.round(val)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* X-axis dates when expanded */}
      {expanded && points.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0 0", marginTop: 4 }}>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>{points[0].date}</span>
          {points.length > 15 && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>{points[Math.floor(points.length / 2)].date}</span>}
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>{points[points.length - 1].date}</span>
        </div>
      )}

      {/* Period label + expand hint */}
      <div style={{ textAlign: "center", marginTop: 8, display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>Last 30 Days</span>
        <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 9, transition: "transform 0.3s", display: "inline-block", transform: expanded ? "rotate(180deg)" : "none" }}>▼</span>
      </div>

      {/* Expanded stats row */}
      {expanded && (
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10,
          marginTop: 16, paddingTop: 14,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          animation: "fadeIn 0.2s ease",
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, marginBottom: 4 }}>30D HIGH</div>
            <div style={{ color: "#00e676", fontSize: 15, fontWeight: 700 }}>
              ${max.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, marginBottom: 4 }}>30D LOW</div>
            <div style={{ color: "#ff3b3b", fontSize: 15, fontWeight: 700 }}>
              ${min.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, marginBottom: 4 }}>RANGE</div>
            <div style={{ color: "#60a5fa", fontSize: 15, fontWeight: 700 }}>
              ${range.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
