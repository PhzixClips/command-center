export default function StatCard({ label, value, sub, accent = "#00e676" }) {
  return (
    <article aria-label={label} style={{
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      border: `1px solid ${accent}12`,
      borderRadius: 18,
      padding: "22px 24px",
      position: "relative",
      overflow: "hidden",
      boxShadow: `0 0 24px ${accent}04, 0 4px 16px rgba(0,0,0,0.25)`,
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent}44, ${accent}15, transparent 70%)`,
      }} />
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>{label}</div>
      <div style={{ color: accent, fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 8, fontWeight: 400 }}>{sub}</div>}
    </article>
  );
}
