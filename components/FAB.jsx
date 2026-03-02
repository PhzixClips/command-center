import { useState } from "react";

const ACTIONS = [
  { label: "Log Shift",    key: "shift",   color: "#a78bfa", icon: "⏱" },
  { label: "Add Flip",     key: "flip",    color: "#ff8c00", icon: "📦" },
  { label: "Add Expense",  key: "expense", color: "#34d399", icon: "💸" },
];

export default function FAB({ onAction }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 500, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
      {open && ACTIONS.map((a) => (
        <div key={a.key} style={{ display: "flex", alignItems: "center", gap: 10 }}
          onClick={() => { onAction(a.key); setOpen(false); }}>
          <span style={{ background: "#111", border: `1px solid ${a.color}44`, color: a.color, fontFamily: "monospace", fontSize: 10, padding: "4px 10px", borderRadius: 4, whiteSpace: "nowrap", cursor: "pointer", letterSpacing: 1 }}>
            {a.label}
          </span>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", background: "#111",
            border: `1px solid ${a.color}`, color: a.color, fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            boxShadow: `0 0 12px ${a.color}33`
          }}>
            {a.icon}
          </div>
        </div>
      ))}
      <div
        onClick={() => setOpen(!open)}
        style={{
          width: 52, height: 52, borderRadius: "50%",
          background: open ? "#111" : "#00ff88",
          border: `2px solid ${open ? "#00ff88" : "transparent"}`,
          color: open ? "#00ff88" : "#000",
          fontSize: 24, display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontWeight: 700,
          boxShadow: "0 4px 20px #00ff8844",
          transition: "all 0.2s",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}>
        +
      </div>
    </div>
  );
}
