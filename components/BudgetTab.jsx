import { useState } from "react";
import Modal from "./Modal.jsx";
import Input from "./Input.jsx";
import Btn from "./Btn.jsx";
import CSVImport from "./CSVImport.jsx";

const CATEGORIES = ["Food & Dining", "Transportation", "Entertainment", "Shopping", "Bills & Utilities", "Business Tools", "Other"];
const CAT_COLOR  = {
  "Food & Dining":    "#ff8c00",
  "Transportation":   "#60a5fa",
  "Entertainment":    "#a78bfa",
  "Shopping":         "#ffd700",
  "Bills & Utilities":"#34d399",
  "Business Tools":   "#f472b6",
  "Other":            "#888",
};

const toMonthKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const monthLabel = (key) => {
  const [y, m] = key.split("-");
  return new Date(+y, +m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

const offsetMonth = (key, delta) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return toMonthKey(d);
};

export default function BudgetTab({ data, save }) {
  const now = new Date();
  const currentMonthKey = toMonthKey(now);

  const [viewMonth,      setViewMonth]      = useState(currentMonthKey);
  const [modal,          setModal]          = useState(null);
  const [form,           setForm]           = useState({});
  const [showImport,     setShowImport]     = useState(false);
  const [filterCat,      setFilterCat]      = useState(null);
  const [recurringEdit,  setRecurringEdit]  = useState(null); // { descKey, desc, category }

  const budget    = data.budget    || {};
  const expenses  = data.expenses  || [];
  const income    = data.income    || [];
  const transfers = data.transfers || [];

  const monthExpenses  = expenses.filter(e => e.month === viewMonth);
  const monthIncome    = income.filter(e => e.month === viewMonth);
  const monthTransfers = transfers.filter(e => e.month === viewMonth);

  const spentByCategory = {};
  CATEGORIES.forEach(c => { spentByCategory[c] = 0; });
  monthExpenses.forEach(e => {
    const cat = CATEGORIES.includes(e.category) ? e.category : "Other";
    spentByCategory[cat] = (spentByCategory[cat] || 0) + e.amount;
  });

  const totalBudget = Object.values(budget).reduce((a, b) => a + b, 0);
  const totalSpent  = monthExpenses.reduce((a, e) => a + e.amount, 0);
  const totalEarned = monthIncome.reduce((a, e) => a + e.amount, 0);
  const remaining   = totalBudget - totalSpent;
  const netCashFlow = totalEarned - totalSpent;
  const isCurrentMonth = viewMonth === currentMonthKey;
  const totalTransferred = monthTransfers.reduce((a, e) => a + e.amount, 0);

  // Uncategorized = expenses in "Other" or with no recognized category
  const uncategorizedCount = monthExpenses.filter(e => !CATEGORIES.includes(e.category) || e.category === "Other").length;

  const maxSpent = Math.max(...CATEGORIES.map(c => spentByCategory[c] || 0), 1);

  const allMonths = [...new Set([...expenses.map(e => e.month), ...income.map(e => e.month), ...transfers.map(e => e.month)])].sort();
  if (!allMonths.includes(currentMonthKey)) allMonths.push(currentMonthKey);

  const clearImports = () => {
    save({ ...data, expenses: [], income: [], transfers: [] });
    setModal(null);
  };

  // Recurring expense detection: same description appearing in 2+ different months
  const recurringExpenses = (() => {
    const byDesc = {};
    expenses.forEach(e => {
      const key = e.desc.toLowerCase().trim();
      if (!byDesc[key]) byDesc[key] = { desc: e.desc, months: new Set(), totalAmount: 0, count: 0, category: e.category };
      byDesc[key].months.add(e.month);
      byDesc[key].totalAmount += e.amount;
      byDesc[key].count++;
    });
    return Object.values(byDesc)
      .filter(r => r.months.size >= 2)
      .sort((a, b) => b.totalAmount - a.totalAmount);
  })();

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

  const saveEditExpense = () => {
    const { id, desc, amount, category } = form;
    if (!desc || !amount || !category) return;
    save({
      ...data,
      expenses: expenses.map(e => e.id === id ? { ...e, desc, amount: +amount, category } : e),
    });
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

  const openEdit = (e) => {
    setForm({ id: e.id, desc: e.desc, amount: String(e.amount), category: e.category });
    setModal("edit-expense");
  };

  const deleteRecurring = (descKey) => {
    save({ ...data, expenses: expenses.filter(e => e.desc.toLowerCase().trim() !== descKey) });
  };
  const openEditRecurring = (r) => {
    setRecurringEdit({ descKey: r.desc.toLowerCase().trim(), desc: r.desc, category: r.category });
  };
  const saveEditRecurring = () => {
    if (!recurringEdit) return;
    save({
      ...data,
      expenses: expenses.map(e =>
        e.desc.toLowerCase().trim() === recurringEdit.descKey
          ? { ...e, desc: recurringEdit.desc, category: recurringEdit.category }
          : e
      ),
    });
    setRecurringEdit(null);
  };

  // Expenses to show in the list section — always newest first by id
  const filteredExpenses = (() => {
    const base = filterCat
      ? monthExpenses.filter(e => {
          const cat = CATEGORIES.includes(e.category) ? e.category : "Other";
          return cat === filterCat;
        })
      : [...monthExpenses];
    return [...base].sort((a, b) => (b.id || 0) - (a.id || 0));
  })();

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ color: "#34d399", fontSize: 14, fontWeight: 600 }}>Budget Tracker</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <button onClick={() => setViewMonth(offsetMonth(viewMonth, -1))}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.35)", fontSize: 12, padding: "3px 10px", borderRadius: 8, cursor: "pointer" }}>‹</button>
            <span style={{ color: "#e8e8e8", fontSize: 12, minWidth: 140, textAlign: "center" }}>{monthLabel(viewMonth)}</span>
            <button onClick={() => setViewMonth(offsetMonth(viewMonth, 1))} disabled={isCurrentMonth}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: isCurrentMonth ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.35)", fontSize: 12, padding: "3px 10px", borderRadius: 8, cursor: isCurrentMonth ? "default" : "pointer" }}>›</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Btn onClick={() => { setForm({}); setModal("edit-budget"); }} color="#34d399" style={{ fontSize: 10 }}>Edit Budget</Btn>
          <Btn onClick={() => setShowImport(true)} color="#60a5fa" style={{ fontSize: 10 }}>Import CSV</Btn>
          <Btn onClick={() => { setForm({ category: "Food & Dining" }); setModal("add-expense"); }} color="#34d399">+ Add Expense</Btn>
          {(expenses.length > 0 || income.length > 0) && (
            <Btn onClick={() => setModal("clear-imports")} color="#ff3b3b" style={{ fontSize: 10 }}>Clear All</Btn>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Income",        value: `$${totalEarned.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: "#00ff88", sub: `${monthIncome.length} deposits` },
          { label: "Spent So Far",  value: `$${totalSpent.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: totalSpent > totalBudget ? "#ff3b3b" : "#ffd700" },
          { label: "Net Cash Flow", value: `${netCashFlow >= 0 ? "+" : "-"}$${Math.abs(netCashFlow).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: netCashFlow >= 0 ? "#00ff88" : "#ff3b3b", sub: netCashFlow >= 0 ? "in the green" : "in the red" },
          { label: "Budget Left",   value: `$${Math.abs(remaining).toLocaleString(undefined, { maximumFractionDigits: 2 })}`, color: remaining >= 0 ? "#00ff88" : "#ff3b3b", sub: remaining < 0 ? "Over Budget" : "of budget left" },
        ].map((c, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: `1px solid ${c.color}22`, borderRadius: 20, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, height: 1, width: "100%", background: `linear-gradient(90deg, transparent, ${c.color}66, transparent)` }} />
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 500, marginBottom: 6 }}>{c.label}</div>
            <div style={{ color: c.color, fontSize: 22, fontWeight: 700 }}>{c.value}</div>
            {c.sub && <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 4 }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Category breakdown — clickable */}
      <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20, marginBottom: 20 }}>
        <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 500, marginBottom: 16 }}>
          Category Breakdown · {filterCat ? <span style={{ color: CAT_COLOR[filterCat] }}>tap again to clear</span> : "tap a category to filter"}
        </div>
        {CATEGORIES.map(cat => {
          const spent  = spentByCategory[cat] || 0;
          const limit  = budget[cat] || 0;
          const pct    = limit > 0 ? Math.min(100, (spent / limit) * 100) : Math.min(100, (spent / maxSpent) * 80);
          const over   = spent > limit && limit > 0;
          const color  = CAT_COLOR[cat];
          const active = filterCat === cat;
          const dimmed = filterCat && !active;
          const expCount = monthExpenses.filter(e => {
            const c = CATEGORIES.includes(e.category) ? e.category : "Other";
            return c === cat;
          }).length;

          return (
            <div key={cat}
              onClick={() => setFilterCat(active ? null : cat)}
              style={{ marginBottom: 16, cursor: "pointer", opacity: dimmed ? 0.3 : 1, transition: "opacity 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: active ? "#fff" : color, fontSize: 11, fontWeight: active ? 700 : 400 }}>
                    {active ? "▶ " : ""}{cat}
                  </span>
                  {/* Apple-style badge for Other/uncategorized */}
                  {cat === "Other" && uncategorizedCount > 0 && (
                    <span style={{
                      background: "#ff3b3b",
                      color: "#fff",
                      borderRadius: 10,
                      minWidth: 18,
                      height: 18,
                      fontSize: 10,
                      fontWeight: 800,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 5px",
                      letterSpacing: 0,
                      lineHeight: 1,
                    }}>{uncategorizedCount}</span>
                  )}
                  {expCount > 0 && (
                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 9 }}>({expCount})</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {over && <span style={{ color: "#ff3b3b", fontSize: 9, border: "1px solid #ff3b3b44", padding: "1px 6px", borderRadius: 3 }}>OVER</span>}
                  <span style={{ color: over ? "#ff3b3b" : "#e8e8e8", fontSize: 12 }}>
                    ${spent.toFixed(2)} <span style={{ color: "rgba(255,255,255,0.25)" }}>/ ${limit}</span>
                  </span>
                </div>
              </div>
              <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, height: active ? 10 : 7, overflow: "hidden", transition: "height 0.2s" }}>
                <div style={{
                  background: over ? "#ff3b3b" : active ? `linear-gradient(90deg, #fff4, ${color})` : color,
                  width: `${Math.min(pct, 100)}%`, height: "100%", borderRadius: 6, transition: "width 0.4s",
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Recurring expenses — card grid */}
      {recurringExpenses.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 500 }}>Recurring Expenses Detected</div>
            <div style={{ color: "#a78bfa", fontSize: 12, fontWeight: 700 }}>
              ${Math.round(recurringExpenses.reduce((a, r) => a + r.totalAmount / r.months.size, 0))}/mo committed
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10 }}>
            {recurringExpenses.map((r, i) => {
              const color      = CAT_COLOR[r.category] || "#888";
              const monthlyAvg = r.totalAmount / r.months.size;
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: `1px solid ${color}33`, borderRadius: 16, padding: "14px 14px 12px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, height: 1, width: "100%", background: `linear-gradient(90deg, transparent, ${color}66, transparent)` }} />
                  <div>
                    <div style={{ color, fontSize: 8, letterSpacing: 1, marginBottom: 5 }}>{r.category.toUpperCase()}</div>
                    <div style={{ color: "#e8e8e8", fontSize: 12, fontWeight: 600, marginBottom: 8, lineHeight: 1.3, wordBreak: "break-word" }}>{r.desc}</div>
                    <div style={{ color, fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
                      ${Math.round(monthlyAvg)}<span style={{ fontSize: 10, fontWeight: 400, color: "rgba(255,255,255,0.35)" }}>/mo</span>
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, marginBottom: 12 }}>
                      {r.months.size} months · ${Math.round(r.totalAmount)} total
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openEditRecurring(r)} style={{ flex: 1, background: `${color}12`, border: `1px solid ${color}44`, color: "rgba(255,255,255,0.5)", fontSize: 9, padding: "5px 0", borderRadius: 12, cursor: "pointer" }}>Edit All</button>
                      <button onClick={() => deleteRecurring(r.desc.toLowerCase().trim())} style={{ background: "#ff3b3b12", border: "1px solid #ff3b3b44", color: "#ff3b3b", fontSize: 11, padding: "4px 10px", borderRadius: 12, cursor: "pointer" }}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Expense list */}
      {filterCat ? (
        /* — Filtered view — */
        <div>
          <div style={{ textAlign: "center", padding: "16px 0 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 16 }}>
            <div style={{ color: CAT_COLOR[filterCat], fontSize: 28, fontWeight: 900, letterSpacing: 3 }}>{filterCat.toUpperCase()}</div>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 4 }}>
              {filteredExpenses.length} expense{filteredExpenses.length !== 1 ? "s" : ""} · ${filteredExpenses.reduce((a, e) => a + e.amount, 0).toFixed(2)} total
            </div>
          </div>
          {filteredExpenses.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 12, textAlign: "center", padding: "24px 0" }}>No expenses in this category.</div>
          ) : (
            <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
              {filteredExpenses.map(e => <ExpenseRow key={e.id} e={e} onEdit={() => openEdit(e)} onDelete={() => deleteExpense(e.id)} />)}
            </div>
          )}
        </div>
      ) : (
        /* — Default full list — */
        <>
          <div style={{ marginBottom: 16, color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 500 }}>
            Expenses · {monthExpenses.length} in {monthLabel(viewMonth)}
          </div>
          {monthExpenses.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 12, textAlign: "center", padding: "32px 0" }}>
              No expenses logged for {monthLabel(viewMonth)}.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {filteredExpenses.map(e => <ExpenseRow key={e.id} e={e} onEdit={() => openEdit(e)} onDelete={() => deleteExpense(e.id)} />)}
            </div>
          )}
        </>
      )}

      {/* Income list */}
      {monthIncome.length > 0 && (
        <>
          <div style={{ marginBottom: 16, marginTop: 24, color: "#00ff88", fontSize: 14, fontWeight: 600 }}>
            Income · {monthIncome.length} in {monthLabel(viewMonth)}
          </div>
          <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
            {[...monthIncome].reverse().map(e => (
              <div key={e.id} style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid #00ff8822", borderRadius: 16, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ color: "#00ff88", fontSize: 9, background: "#00ff8815", border: "1px solid #00ff8833", padding: "2px 7px", borderRadius: 8, whiteSpace: "nowrap" }}>{e.category}</span>
                  <div>
                    <div style={{ color: "#e8e8e8", fontSize: 13, fontWeight: 600 }}>{e.desc}</div>
                    <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 2 }}>{e.date}</div>
                  </div>
                </div>
                <div style={{ color: "#00ff88", fontSize: 16, fontWeight: 700 }}>+${e.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Transfers list */}
      {monthTransfers.length > 0 && (
        <>
          <div style={{ marginBottom: 16, marginTop: 24, color: "#ffd70088", fontSize: 14, fontWeight: 600 }}>
            Transfers · {monthTransfers.length} in {monthLabel(viewMonth)} · ${totalTransferred.toFixed(2)} Total
          </div>
          <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
            {[...monthTransfers].reverse().map(e => (
              <div key={e.id} style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid #ffd70022", borderRadius: 16, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ color: "#ffd70088", fontSize: 9, background: "#ffd70015", border: "1px solid #ffd70033", padding: "2px 7px", borderRadius: 8, whiteSpace: "nowrap" }}>Transfer</span>
                  <div>
                    <div style={{ color: "#e8e8e8", fontSize: 13, fontWeight: 600 }}>{e.desc}</div>
                    <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 2 }}>{e.date}</div>
                  </div>
                </div>
                <div style={{ color: "#ffd70088", fontSize: 16, fontWeight: 700 }}>↔${e.amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add expense modal */}
      {modal === "add-expense" && (
        <Modal title="Add Expense" onClose={() => setModal(null)}>
          <Input label="Description" value={form.desc || ""} onChange={v => setForm({ ...form, desc: v })} placeholder="Groceries at Fry's" />
          <Input label="Amount ($)" type="number" value={form.amount || ""} onChange={v => setForm({ ...form, amount: v })} placeholder="47.50" />
          <CategorySelect value={form.category || "Food & Dining"} onChange={v => setForm({ ...form, category: v })} />
          <Btn onClick={addExpense} color="#34d399" style={{ width: "100%", marginTop: 8 }}>Add Expense</Btn>
        </Modal>
      )}

      {/* Edit expense modal */}
      {modal === "edit-expense" && (
        <Modal title="Edit Expense" onClose={() => { setModal(null); setForm({}); }}>
          <Input label="Description" value={form.desc || ""} onChange={v => setForm({ ...form, desc: v })} />
          <Input label="Amount ($)" type="number" value={form.amount || ""} onChange={v => setForm({ ...form, amount: v })} />
          <CategorySelect value={form.category || "Other"} onChange={v => setForm({ ...form, category: v })} />
          <Btn onClick={saveEditExpense} color="#34d399" style={{ width: "100%", marginTop: 8 }}>Save Changes</Btn>
        </Modal>
      )}

      {/* Edit budget modal */}
      {modal === "edit-budget" && (
        <Modal title="Monthly Budget Limits" onClose={() => setModal(null)}>
          {CATEGORIES.map(cat => (
            <Input key={cat} label={cat} type="number"
              value={form[cat] !== undefined ? form[cat] : (budget[cat] || "")}
              onChange={v => setForm({ ...form, [cat]: v })}
              placeholder={String(budget[cat] || 0)} />
          ))}
          <Btn onClick={saveBudget} color="#34d399" style={{ width: "100%", marginTop: 8 }}>Save Budget</Btn>
        </Modal>
      )}

      {/* Clear imports confirmation */}
      {modal === "clear-imports" && (
        <Modal title="Clear All Imported Data" onClose={() => setModal(null)}>
          <div style={{ color: "#e8e8e8", fontSize: 12, marginBottom: 8 }}>
            This will remove all imported data:
          </div>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 16, lineHeight: 1.8 }}>
            • {expenses.length} expenses<br />
            • {income.length} income entries<br />
            • {transfers.length} transfers
          </div>
          <div style={{ color: "#ff3b3b", fontSize: 10, marginBottom: 16 }}>
            Budget limits will be kept. You can re-import your CSV after clearing.
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={() => setModal(null)} color="#555" style={{ flex: 1 }}>Cancel</Btn>
            <Btn onClick={clearImports} color="#ff3b3b" style={{ flex: 1 }}>Clear All</Btn>
          </div>
        </Modal>
      )}

      {/* Recurring edit modal */}
      {recurringEdit && (
        <Modal title="Edit Recurring" onClose={() => setRecurringEdit(null)}>
          <Input label="Description" value={recurringEdit.desc} onChange={v => setRecurringEdit({ ...recurringEdit, desc: v })} />
          <CategorySelect value={recurringEdit.category} onChange={v => setRecurringEdit({ ...recurringEdit, category: v })} />
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginBottom: 12 }}>
            Updates all {expenses.filter(e => e.desc.toLowerCase().trim() === recurringEdit.descKey).length} matching transactions.
          </div>
          <Btn onClick={saveEditRecurring} color="#a78bfa" style={{ width: "100%", marginTop: 8 }}>Save All Instances</Btn>
        </Modal>
      )}

      {showImport && <CSVImport data={data} save={save} onClose={() => setShowImport(false)} />}
    </div>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function ExpenseRow({ e, onEdit, onDelete }) {
  const color = CAT_COLOR[e.category] || "#888";
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, minWidth: 0 }}>
        <span style={{ color, fontSize: 9, background: `${color}15`, border: `1px solid ${color}33`, padding: "2px 7px", borderRadius: 8, whiteSpace: "nowrap", flexShrink: 0 }}>{e.category}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#e8e8e8", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.desc}</div>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 2 }}>{e.date}</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginLeft: 10 }}>
        <div style={{ color: "#ff3b3b", fontSize: 15, fontWeight: 700 }}>-${e.amount.toFixed(2)}</div>
        <button onClick={onEdit} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", fontSize: 9, padding: "4px 8px", borderRadius: 12, cursor: "pointer" }}>Edit</button>
        <button onClick={onDelete} style={{ background: "#ff3b3b12", border: "1px solid #ff3b3b44", color: "#ff3b3b", fontSize: 11, padding: "3px 8px", borderRadius: 12, cursor: "pointer" }}>✕</button>
      </div>
    </div>
  );
}

function CategorySelect({ value, onChange }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 500, display: "block", marginBottom: 5 }}>Category</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "9px 12px", color: "#e8e8e8", fontSize: 13, outline: "none" }}>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
  );
}
