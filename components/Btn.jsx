export default function Btn({ children, onClick, color = "#00ff88", style = {} }) {
  return (
    <button onClick={onClick} style={{
      background: `${color}12`,
      border: `1px solid ${color}44`,
      color,
      fontSize: 12,
      fontWeight: 500,
      padding: "10px 20px",
      borderRadius: 12,
      cursor: "pointer",
      letterSpacing: 0.5,
      transition: "all 0.2s ease",
      ...style,
    }}>
      {children}
    </button>
  );
}
