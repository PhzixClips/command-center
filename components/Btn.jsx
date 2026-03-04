export default function Btn({ children, onClick, color = "#00ff88", style = {}, disabled = false, ariaLabel }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel} style={{
      background: disabled ? "rgba(255,255,255,0.02)" : `${color}12`,
      border: `1px solid ${disabled ? "rgba(255,255,255,0.06)" : `${color}44`}`,
      color: disabled ? "rgba(255,255,255,0.2)" : color,
      fontSize: 12,
      fontWeight: 500,
      padding: "10px 20px",
      borderRadius: 12,
      cursor: disabled ? "not-allowed" : "pointer",
      letterSpacing: 0.5,
      transition: "all 0.2s ease",
      opacity: disabled ? 0.5 : 1,
      ...style,
    }}>
      {children}
    </button>
  );
}
