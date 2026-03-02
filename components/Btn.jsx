export default function Btn({ children, onClick, color = "#00ff88", style = {} }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: `1px solid ${color}`, color, fontFamily: "monospace", fontSize: 12, padding: "9px 18px", borderRadius: 6, cursor: "pointer", letterSpacing: 1, ...style }}>
      {children}
    </button>
  );
}
