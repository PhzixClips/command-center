export default function Input({ label, value, onChange, type = "text", placeholder, min, max, step, error, id }) {
  const inputId = id || `input-${(label || "").replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div style={{ marginBottom: 16 }}>
      <label htmlFor={inputId} style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 500, letterSpacing: 0.8, textTransform: "uppercase", display: "block", marginBottom: 6 }}>{label}</label>
      <input
        id={inputId}
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        min={min} max={max} step={step}
        aria-label={label}
        aria-invalid={!!error}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${error ? "#ff3b3b44" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 12,
          padding: "12px 14px",
          color: "#e8e8e8",
          fontSize: 14,
          fontWeight: 400,
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.2s",
        }}
      />
      {error && <div role="alert" style={{ color: "#ff3b3b", fontSize: 10, marginTop: 4 }}>{error}</div>}
    </div>
  );
}
