export default function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: "#666", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, padding: "9px 12px", color: "#e8e8e8", fontFamily: "monospace", fontSize: 13, outline: "none", boxSizing: "border-box" }}
      />
    </div>
  );
}
