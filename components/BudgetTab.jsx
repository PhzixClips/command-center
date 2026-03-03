import { useState } from "react";
import Modal from "./Modal.jsx";
import Input from "./Input.jsx";
import Btn from "./Btn.jsx";

const CATEGORIES = ["Food & Dining", "Transportation", "Entertainment", "Shopping", "Bills & Utilities", "Other"];
const CAT_COLOR  = {
  "Food & Dining":    "#ff8c00",
  "Transportation":   "#60a5fa",
  "Entertainment":    "#a78bfa",
  "Shopping":         "#ffd700",
  "Bills & Utilities":"#34d399",
  "Other":            "#888",
};

const toMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (key) => {
  const [y, m] = key.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
};

const offsetMonth = (key, delta) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toMonthKey(d);
};

export default function BudgetTab({ data, save }) {
  const now = new Date();
  const currentMonthKey = toMonthKey(now);

  const [viewMonth, setViewMonth] = useState(currentMonthKey);
  const [modal, setModal] = useState(null);
  const [form, setForm]   = useState({});

  const budget   = data.budget   || {};
  const expenses = data.expenses || [];

  const monthExpenses = expenses.filter(e => e.month === viewMonth);

  const spentByCategory = {};
  CATEGORIES.forEach(c => { spentByCategory[c] = 0; });
  monthExpenses.forEach(e => { spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount; });

  const totalBudget = Object.values(budget).reduce((a, b) => a + b, 0);
  const totalSpent  = monthExpenses.reduce((a, e) => a + e.amount, 0);
  const remaining   = totalBudget - totalSpent;
  const isCurrentMonth = viewMonth === currentMonthKey;

  // All months that have expenses, for the picker
  const allMonths = [...new Set(expenses.map(e => e.month))].sort();
  if (!allMonths.includes(currentMonthKey)) allMonths.push(currentMonthKey);

  const addExpense = () => {
    const { desc, amount, category } = form;
    if (!desc || !amount || !category) return;
    const exp = {
      id: Date.now(),
      desc,
      amount: +amount,
      category: category || "Other",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      month: currentMonthKey,
    };
    save({ ...data, expenses: [...expenses, exp] });
    setModal(null); setForm({});
  };

  const deleteExpense = (id) => {
    save({ ...data, expenses: expenses.filter(e => e.id !== id) });
  };

  const saveBudget = () => {
    const newBudget = {};
    CATEGORIES.forEach(c => { newBudget[c] = +(form[c] ?? budget[c] ?? 0); });
    save({ ...data, budget: newBudget });
    setModal(null); setForm({});
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ color: "#34d399", fontSize: 11, letterSpacing: 2 }}>BUDGET TRACKER</div>
          {/* Month picker */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <button onClick={() => setViewMonth(offsetMonth(viewMonth, -1))}
              style={{ background: "none", border: "1px solid #1a1a1a", color: "#555", fontFamily: "monospace", fontSize: 12, padding: "3px 10px", borderRadius: 4, cursor: "pointer" }}>‹</button>
            <span style={{ color: "#e8e8e8", fontFamily: "monospace", fontSize: 12, minWidth: 140, textAlign: "center" }}>{monthLabel(viewMonth)}</span>
            <button onClick={() => setViewMonth(offsetMonth(viewMonth, 1))} disabled={isCurrentMonth}
              style={{ background: "none", border: "1px solid #1a1a1a", color: isCurrentMonth ? "#222" : "#555", fontFamily: "monospace", fontSize: 12, padding: "3px 10px", borderRadius: 4, cursor: isCurrentMonth ? "default" : "pointer" }}>›</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={() => { setForm({}); setModal("edit-budget"); }} color="#34d399" style={{ fontSize: 10 }}>EDIT BUDGET</Btn>
          <Btn onClick={() => { setForm({ category: "Food & Dining" }); setModal("add-expense"); }} color="#34d399">+ ADD EXPENSE</Btn>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "MONTHLY BUDGET", value: `$${totalBudget.toLocaleString()}`, color: "#34d399" },
          { label: "SPENT SO FAR",   value: `$${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: totalSpent > totalBudget ? "#ff3b3b" : "#ffd700" },
          { label: "REMAINING",      value: `$${Math.abs(remaining).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: remaining >= 0 ? "#00ff88" : "#ff3b3b", sub: remaining < 0 ? "OVER BUDGET" : "left this month" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#0d0d0d", border: `1px solid ${c.color}22`, borderRadius: 8, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: c.color }} />
            <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, marginBottom: 6, fontFamily: "monospace" }}>{c.label}</div>
            <div style={{ color: c.color, fontSize: 22, fontWeight: 700, fontFamily: "monospace" }}>{c.value}</div>
            {c.sub && <div style={{ color: "#555", fontSize: 10, marginTop: 4, fontFamily: "monospace" }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, marginBottom: 16 }}>CATEGORY BREAKDOWN</div>
        {CATEGORIES.map(cat => {
          const spent = spentByCategory[cat] || 0;
          const limit = budget[cat] || 0;
          const pct   = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
          const over  = spent > limit && limit > 0;
          const color = CAT_COLOR[cat];
          return (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ color: color, fontSize: 11, fontFamily: "monospace" }}>{cat}</div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {over && <span style={{ color: "#ff3b3b", fontSize: 9, fontFamily: "monospace", border: "1px solid #ff3b3b44", padding: "1px 6px", borderRadius: 3 }}>OVER</span>}
                  <span style={{ color: over ? "#ff3b3b" : "#e8e8e8", fontFamily: "monospace", fontSize: 12 }}>
                    ${spent.toFixed(2)} <span style={{ color: "#444" }}>/ ${limit}</span>
                  </span>
                </div>
              </div>
              <div style={{ background: "#1a1a1a", borderRadius: 4, height: 8, overflow: "hidden" }}>
                <div style={{ background: over ? "#ff3b3b" : color, width: `${Math.min(pct, 100)}%`, height: "100%", borderRadius: 4, transition: "width 0.4s" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Expense list */}
      <div style={{ marginBottom: 16, color: "#555", fontSize: 9, letterSpacing: 2, fontFamily: "monospace" }}>
        EXPENSES · {monthExpenses.length} IN {monthLabel(viewMonth)}
      </div>
      {monthExpenses.length === 0 ? (
        <div style={{ color: "#333", fontFamily: "monospace", fontSize: 12, textAlign: "center", padding: "32px 0" }}>
          No expenses logged for {monthLabel(viewMonth)}.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {[...monthExpenses].reverse().map(e => {
            const color = CAT_COLOR[e.category] || "#888";
            return (
              <div key={e.id} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ color, fontSize: 9, fontFamily: "monospace", border: `1px solid ${color}44`, padding: "2px 7px", borderRadius: 3, whiteSpace: "nowrap" }}>{e.category}</span>
                  <div>
                    <div style={{ color: "#e8e8e8", fontSize: 13, fontWeight: 600 }}>{e.desc}</div>
                    <div style={{ color: "#444", fontSize: 10, fontFamily: "monospace", marginTop: 2 }}>{e.date}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ color: "#ff3b3b", fontFamily: "monospace", fontSize: 16, fontWeight: 700 }}>-${e.amount.toFixed(2)}</div>
                  <button onClick={() => deleteExpense(e.id)} style={{ background: "none", border: "1px solid #ff3b3b44", color: "#ff3b3b", fontSize: 11, fontFamily: "monospace", padding: "3px 8px", borderRadius: 4, cursor: "pointer" }}>✕</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add expense modal */}
      {modal === "add-expense" && (
        <Modal title="ADD EXPENSE" onClose={() => setModal(null)}>
          <Input label="Description" value={form.desc || ""} onChange={v => setForm({ ...form, desc: v })} placeholder="Groceries at Fry's" />
          <Input label="Amount ($)" type="number" value={form.amount || ""} onChange={v => setForm({ ...form, amount: v })} placeholder="47.50" />
          <div style={{ marginBottom: 14 }}>
            <label style={{ color: "#666", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Category</label>
            <select value={form.category || "Food & Dining"} onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, padding: "9px 12px", color: "#e8e8e8", fontFamily: "monospace", fontSize: 13, outline: "none" }}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Btn onClick={addExpense} color="#34d399" style={{ width: "100%", marginTop: 8 }}>ADD EXPENSE</Btn>
        </Modal>
      )}

      {/* Edit budget modal */}
      {modal === "edit-budget" && (
        <Modal title="MONTHLY BUDGET LIMITS" onClose={() => setModal(null)}>
          {CATEGORIES.map(cat => (
            <Input key={cat} label={cat} type="number"
              value={form[cat] !== undefined ? form[cat] : (budget[cat] || "")}
              onChange={v => setForm({ ...form, [cat]: v })}
              placeholder={String(budget[cat] || 0)} />
          ))}
          <Btn onClick={saveBudget} color="#34d399" style={{ width: "100%", marginTop: 8 }}>SAVE BUDGET</Btn>
        </Modal>
      )}
    </div>
  );
}
