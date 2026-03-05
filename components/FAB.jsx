import { useState } from "react";

const ACTIONS = [
  { label: "Log Shift",    key: "shift",   color: "#00e676", icon: "⏱" },
  { label: "Add Flip",     key: "flip",    color: "#00e676", icon: "📦" },
  { label: "Add Expense",  key: "expense", color: "#ff3b3b", icon: "💸" },
];

export default function FAB({ onAction, bottomOffset = 28 }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "fixed", bottom: bottomOffset + 8, right: 20, zIndex: 450, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
      {open && ACTIONS.map((a) => (
        <button key={a.key} className="fab-item" aria-label={a.label} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: 0, cursor: "pointer" }}
          onClick={() => { onAction(a.key); setOpen(false); }}>
          <span style={{
            background: "rgba(10,10,16,0.9)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${a.color}33`,
            color: a.color,
            fontSize: 11,
            fontWeight: 500,
            padding: "6px 14px",
            borderRadius: 10,
            whiteSpace: "nowrap",
            cursor: "pointer",
          }}>
            {a.label}
          </span>
          <div style={{
            width: 40, height: 40, borderRadius: 14,
            background: `${a.color}15`,
            border: `1px solid ${a.color}33`,
            color: a.color, fontSize: 15,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            {a.icon}
          </div>
        </button>
      ))}
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        aria-expanded={open}
        style={{
          width: 52, height: 52, borderRadius: 16,
          background: open ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #00e676, #00b0ff)",
          border: open ? "1px solid rgba(255,255,255,0.1)" : "none",
          color: open ? "#00e676" : "#000",
          fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontWeight: 700,
          boxShadow: open ? "none" : "0 6px 24px rgba(0,230,118,0.25)",
          transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}>
        +
      </button>
    </div>
  );
}
