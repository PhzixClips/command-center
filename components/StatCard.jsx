export default function StatCard({ label, value, sub, accent = "#00ff88" }) {
  return (
    <article aria-label={label} style={{
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 16,
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: `linear-gradient(90deg, ${accent}44, transparent 70%)`,
      }} />
      <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, fontWeight: 500 }}>{label}</div>
      <div style={{ color: accent, fontSize: 26, fontWeight: 700, letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, marginTop: 6, fontWeight: 400 }}>{sub}</div>}
    </article>
  );
}
