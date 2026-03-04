import { useState } from "react";

const ACTIONS = [
  { label: "Log Shift",    key: "shift",   color: "#a78bfa", icon: "⏱" },
  { label: "Add Flip",     key: "flip",    color: "#ff8c00", icon: "📦" },
  { label: "Add Expense",  key: "expense", color: "#34d399", icon: "💸" },
];

export default function FAB({ onAction }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "fixed", bottom: 28, right: 24, zIndex: 500, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
      {open && ACTIONS.map((a) => (
        <button key={a.key} aria-label={a.label} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: 0, cursor: "pointer" }}
          onClick={() => { onAction(a.key); setOpen(false); }}>
          <span style={{
            background: "rgba(20,20,30,0.85)",
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
            width: 42, height: 42, borderRadius: 14,
            background: `${a.color}18`,
            border: `1px solid ${a.color}44`,
            color: a.color, fontSize: 16,
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
          width: 56, height: 56, borderRadius: 18,
          background: open ? "rgba(255,255,255,0.06)" : "linear-gradient(135deg, #00e676, #00b0ff)",
          border: open ? "1px solid rgba(255,255,255,0.1)" : "none",
          color: open ? "#00e676" : "#000",
          fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontWeight: 700,
          boxShadow: open ? "none" : "0 8px 32px rgba(0,230,118,0.3)",
          transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}>
        +
      </button>
    </div>
  );
}
