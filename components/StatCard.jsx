export default function StatCard({ label, value, sub, accent = "#00ff88" }) {
  return (
    <div style={{ background: "#0d0d0d", border: `1px solid ${accent}22`, borderRadius: 8, padding: "18px 22px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: accent }} />
      <div style={{ color: "#666", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6, fontFamily: "monospace" }}>{label}</div>
      <div style={{ color: accent, fontSize: 26, fontWeight: 700, fontFamily: "'Courier New', monospace", letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ color: "#555", fontSize: 11, marginTop: 4, fontFamily: "monospace" }}>{sub}</div>}
    </div>
  );
}
