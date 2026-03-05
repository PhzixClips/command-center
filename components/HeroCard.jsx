export default function HeroCard({ netWorth, netWorthHistory, dailyDelta }) {
  // Build sparkline from last 30 data points
  const points = (netWorthHistory || []).slice(-30);
  const values = points.map(p => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // SVG sparkline dimensions
  const W = 320;
  const H = 60;
  const barW = Math.max(4, (W - (values.length - 1) * 2) / values.length);
  const gap = 2;

  const deltaSign = dailyDelta >= 0 ? "+" : "";
  const deltaColor = dailyDelta >= 0 ? "#00e676" : "#ff3b3b";

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(0,230,118,0.12)",
      borderRadius: 24,
      padding: "24px 24px 20px",
      marginBottom: 20,
      position: "relative",
      overflow: "hidden",
      boxShadow: "0 0 40px rgba(0,230,118,0.04), 0 4px 20px rgba(0,0,0,0.3)",
    }}>
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

      {/* Sparkline bar chart */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", maxWidth: "100%" }}>
          {values.map((v, i) => {
            const normalized = (v - min) / range;
            const barH = Math.max(3, normalized * (H - 4));
            const x = i * (barW + gap);
            const y = H - barH;
            // Last bar is brighter
            const isLast = i === values.length - 1;
            const opacity = isLast ? 1 : 0.3 + normalized * 0.5;
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={2}
                fill={isLast ? "#fff" : "#00e676"}
                opacity={opacity}
              />
            );
          })}
        </svg>
      </div>

      {/* Period label */}
      <div style={{ textAlign: "center", marginTop: 8 }}>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>Last 30 Days</span>
      </div>
    </div>
  );
}
