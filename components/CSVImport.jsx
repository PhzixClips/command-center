import { useState, useRef } from "react";
import Papa from "papaparse";

const CATEGORIES = ["Food & Dining", "Transportation", "Entertainment", "Shopping", "Bills & Utilities", "Business Tools", "Other"];
const INCOME_CATEGORIES = ["Paycheck", "Zelle/Transfer", "Side Income", "Refund", "Other Income"];
const TRANSFER_CATEGORIES = ["Transfer"];

const CAT_COLOR = {
  "Food & Dining":     "#ff8c00",
  "Transportation":    "#60a5fa",
  "Entertainment":     "#a78bfa",
  "Shopping":          "#ffd700",
  "Bills & Utilities": "#34d399",
  "Business Tools":    "#f472b6",
  "Other":             "#888",
  "Paycheck":          "#00ff88",
  "Zelle/Transfer":    "#00ff88",
  "Side Income":       "#00ff88",
  "Refund":            "#00ff88",
  "Other Income":      "#00ff88",
  "Transfer":          "#ffd70088",
};

const KEYWORDS = {
  "Food & Dining":     ["fry's", "walmart", "mcdonald", "starbucks", "chipotle", "subway", "pizza", "taco", "burger", "coffee", "restaurant", "doordash", "ubereats", "grubhub", "food", "grocery", "safeway", "kroger", "albertsons", "whole foods", "trader joe", "costco", "target", "sams club"],
  "Transportation":    ["shell", "chevron", "circle k", "arco", "bp ", "exxon", "mobil", "gas", "uber", "lyft", "parking", "toll", "autozone", "o'reilly", "napa auto", "carwash", "car wash", "valvoline", "jiffy lube"],
  "Entertainment":     ["netflix", "hulu", "disney", "spotify", "apple music", "youtube", "amazon prime", "hbo", "peacock", "amc", "movie", "cinema", "theater", "ticketmaster", "steam", "playstation", "xbox", "nintendo"],
  "Shopping":          ["amazon", "ebay", "best buy", "home depot", "lowes", "ikea", "tj maxx", "marshalls", "ross", "old navy", "h&m", "zara", "shein", "wish", "etsy"],
  "Bills & Utilities": ["at&t", "verizon", "tmobile", "t-mobile", "comcast", "cox", "centurylink", "electric", "water", "insurance", "geico", "state farm", "progressive", "allstate", "rent", "mortgage", "hoa", "gym", "planet fitness"],
  "Business Tools":    ["anthropic", "openai", "claude.ai", "chatgpt", "midjourney", "github", "notion", "figma", "canva", "adobe", "dropbox", "google workspace", "gsuite", "microsoft 365", "zoom", "slack", "airtable", "zapier", "shopify", "squarespace", "wix", "godaddy", "namecheap", "digitalocean", "aws ", "cloudflare", "cursor", "replit"],
};

const INCOME_KEYWORDS = {
  "Paycheck":      ["dailypay", "friday", "payroll", "direct dep", "paycheck", "ach deposit", "wage"],
  "Zelle/Transfer":["zelle", "venmo", "cashapp", "cash app", "transfer from"],
  "Side Income":   ["ebay", "poshmark", "mercari", "offerup", "facebook pay", "marketplace"],
  "Refund":        ["refund", "return", "credit adj", "reversal"],
};

const TRANSFER_KEYWORDS = ["round up", "roundup", "round-up", "transfer to", "transfer between", "save transfer", "savings transfer", "sweep"];

const autoCategory = (desc, type) => {
  const lower = (desc || "").toLowerCase();
  if (type === "income") {
    for (const [cat, words] of Object.entries(INCOME_KEYWORDS)) {
      if (words.some(w => lower.includes(w))) return cat;
    }
    return "Other Income";
  }
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    if (words.some(w => lower.includes(w))) return cat;
  }
  return "Other";
};

const toMonthKey = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const formatDisplayDate = (dateStr) => {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const STEPS = ["upload", "map", "preview", "done"];

export default function CSVImport({ data, save, onClose }) {
  const fileRef = useRef();
  const [step, setStep] = useState("upload");
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({ date: "", desc: "", amount: "", balance: "" });
  const [preview, setPreview] = useState([]);
  const [detectedBalance, setDetectedBalance] = useState(null);
  const [balanceForm, setBalanceForm] = useState({ checking: "", savings: "" });
  const [imported, setImported] = useState({ expenses: 0, income: 0, transfers: 0 });
  const [error, setError] = useState("");

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (!result.data?.length) { setError("File appears to be empty."); return; }
        const hdrs = result.meta.fields || [];
        setHeaders(hdrs);
        setRows(result.data);
        const find = (candidates) => hdrs.find(h => candidates.some(c => h.toLowerCase().includes(c))) || "";
        setMapping({
          date:    find(["date", "posted", "transaction date"]),
          desc:    find(["description", "memo", "payee", "name", "transaction"]),
          amount:  find(["amount", "debit", "withdrawal"]),
          balance: find(["balance", "running balance", "available balance"]),
        });
        setStep("map");
      },
      error: () => setError("Could not read file. Make sure it's a CSV."),
    });
  };

  const buildPreview = () => {
    if (!mapping.date || !mapping.desc || !mapping.amount) {
      setError("Please map Date, Description, and Amount columns.");
      return;
    }

    // Auto-fill checking balance from running balance column if mapped
    let latestBalance = null;
    if (mapping.balance) {
      const sorted = [...rows].sort((a, b) => new Date(b[mapping.date]) - new Date(a[mapping.date]));
      for (const row of sorted) {
        const raw = (row[mapping.balance] || "").replace(/[$,\s]/g, "");
        const val = parseFloat(raw);
        if (!isNaN(val) && val >= 0) { latestBalance = val; break; }
      }
    }
    setDetectedBalance(latestBalance);
    setBalanceForm({ checking: latestBalance != null ? latestBalance.toFixed(2) : "", savings: "" });

    const parsed = [];
    for (const row of rows) {
      const rawAmt = (row[mapping.amount] || "").replace(/[$,\s]/g, "");
      let amount = parseFloat(rawAmt);
      if (isNaN(amount) || amount === 0) continue;
      const desc = (row[mapping.desc] || "").trim();
      const lower = desc.toLowerCase();
      const isTransfer = TRANSFER_KEYWORDS.some(w => lower.includes(w));
      const type = isTransfer ? "transfer" : (amount < 0 ? "expense" : "income");
      amount = Math.abs(amount);
      const dateStr = row[mapping.date] || "";
      const month = toMonthKey(dateStr);
      if (!month) continue;
      parsed.push({
        id:       Date.now() + Math.random(),
        desc,
        amount,
        type,
        category: isTransfer ? "Transfer" : autoCategory(desc, type),
        date:     formatDisplayDate(dateStr),
        month,
        _raw:     dateStr,
      });
    }
    if (!parsed.length) { setError("No transactions found. Check your column mapping."); return; }
    setError("");
    setPreview(parsed);
    setStep("preview");
  };

  const updateCategory = (idx, cat) => {
    setPreview(p => p.map((r, i) => i === idx ? { ...r, category: cat } : r));
  };

  const removeRow = (idx) => {
    setPreview(p => p.filter((_, i) => i !== idx));
  };

  const doImport = () => {
    const existingExpenses  = data.expenses  || [];
    const existingIncome    = data.income    || [];
    const existingTransfers = data.transfers || [];
    const expenseKeys  = new Set(existingExpenses.map(e => `${e.desc}|${e.amount}|${e.month}`));
    const incomeKeys   = new Set(existingIncome.map(e => `${e.desc}|${e.amount}|${e.month}`));
    const transferKeys = new Set(existingTransfers.map(e => `${e.desc}|${e.amount}|${e.month}`));

    const clean = ({ _raw, type, ...r }) => ({ ...r, id: Date.now() + Math.random() });
    const newExpenses  = preview.filter(r => r.type === "expense"  && !expenseKeys.has(`${r.desc}|${r.amount}|${r.month}`)).map(clean);
    const newIncome    = preview.filter(r => r.type === "income"   && !incomeKeys.has(`${r.desc}|${r.amount}|${r.month}`)).map(clean);
    const newTransfers = preview.filter(r => r.type === "transfer" && !transferKeys.has(`${r.desc}|${r.amount}|${r.month}`)).map(clean);

    const newData = {
      ...data,
      expenses:  [...existingExpenses,  ...newExpenses],
      income:    [...existingIncome,    ...newIncome],
      transfers: [...existingTransfers, ...newTransfers],
    };

    // Update main screen balances if entered
    const newChecking = parseFloat(balanceForm.checking);
    const newSavings  = parseFloat(balanceForm.savings);
    if (!isNaN(newChecking) && newChecking >= 0) newData.bankBalance = newChecking;
    if (!isNaN(newSavings)  && newSavings  >= 0) newData.savings     = newSavings;

    save(newData);
    setImported({ expenses: newExpenses.length, income: newIncome.length, transfers: newTransfers.length });
    setStep("done");
  };

  const expenseRows  = preview.filter(r => r.type === "expense");
  const incomeRows   = preview.filter(r => r.type === "income");
  const transferRows = preview.filter(r => r.type === "transfer");
  const totalExpense  = expenseRows.reduce((s, r) => s + r.amount, 0);
  const totalIncome   = incomeRows.reduce((s, r) => s + r.amount, 0);
  const totalTransfer = transferRows.reduce((s, r) => s + r.amount, 0);

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#0a0a0a", border: "1px solid #222", borderRadius: 12, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ color: "#34d399", fontSize: 11, letterSpacing: 2, fontFamily: "monospace" }}>IMPORT CSV</div>
            <div style={{ color: "#444", fontSize: 10, fontFamily: "monospace", marginTop: 3 }}>
              {step === "upload"  && "Upload your bank export"}
              {step === "map"     && `${rows.length} rows detected — map columns`}
              {step === "preview" && `${preview.length} transactions · ${expenseRows.length} out · ${incomeRows.length} in · ${transferRows.length} transfers`}
              {step === "done"    && "Import complete"}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "1px solid #333", color: "#666", fontSize: 13, padding: "4px 10px", borderRadius: 5, cursor: "pointer", fontFamily: "monospace" }}>✕</button>
        </div>

        {/* Step indicators */}
        <div style={{ padding: "14px 24px", display: "flex", gap: 6 }}>
          {["upload","map","preview"].map((s, i) => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: STEPS.indexOf(step) >= i ? "#34d399" : "#1a1a1a", transition: "background 0.3s" }} />
          ))}
        </div>

        <div style={{ padding: "0 24px 24px" }}>

          {/* STEP 1: UPLOAD */}
          {step === "upload" && (
            <div>
              <div
                onClick={() => fileRef.current?.click()}
                style={{ border: "2px dashed #222", borderRadius: 10, padding: "40px 20px", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#34d399"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#222"}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>📂</div>
                <div style={{ color: "#e8e8e8", fontFamily: "monospace", fontSize: 13, marginBottom: 6 }}>Click to select your bank CSV</div>
                <div style={{ color: "#444", fontFamily: "monospace", fontSize: 10 }}>Exported from Desert Financial, Chase, WF, BoA, etc.</div>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleFile} />
              </div>
              {error && <div style={{ color: "#ff3b3b", fontFamily: "monospace", fontSize: 11, marginTop: 12 }}>{error}</div>}
              <div style={{ marginTop: 16, color: "#333", fontSize: 10, fontFamily: "monospace", lineHeight: 1.8 }}>
                HOW TO EXPORT FROM YOUR BANK:<br />
                Desert Financial → Accounts → Select account → Download → CSV<br />
                Chase → Activity → Download → CSV<br />
                Wells Fargo → Account Activity → Download → Comma Delimited
              </div>
            </div>
          )}

          {/* STEP 2: MAP COLUMNS */}
          {step === "map" && (
            <div>
              <div style={{ color: "#666", fontSize: 10, fontFamily: "monospace", marginBottom: 16 }}>
                Columns found: {headers.join(", ")}
              </div>
              {[
                { key: "date",    label: "Date column",                                             required: true  },
                { key: "desc",    label: "Description column",                                      required: true  },
                { key: "amount",  label: "Amount (negative = expense, positive = income)",          required: true  },
                { key: "balance", label: "Running Balance column (optional — auto-fills Checking)", required: false },
              ].map(({ key, label, required }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ color: required ? "#e8e8e8" : "#555", fontSize: 10, fontFamily: "monospace", letterSpacing: 1, display: "block", marginBottom: 5 }}>
                    {label.toUpperCase()}
                  </label>
                  <select
                    value={mapping[key]}
                    onChange={e => setMapping(m => ({ ...m, [key]: e.target.value }))}
                    style={{ width: "100%", background: "#111", border: "1px solid #2a2a2a", borderRadius: 6, padding: "9px 12px", color: "#e8e8e8", fontFamily: "monospace", fontSize: 12, outline: "none" }}
                  >
                    <option value="">— {required ? "select column" : "skip"} —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
              {error && <div style={{ color: "#ff3b3b", fontFamily: "monospace", fontSize: 11, marginBottom: 12 }}>{error}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => setStep("upload")} style={{ flex: 1, background: "none", border: "1px solid #222", color: "#555", fontFamily: "monospace", fontSize: 11, padding: "10px", borderRadius: 6, cursor: "pointer" }}>← BACK</button>
                <button onClick={buildPreview} style={{ flex: 2, background: "#34d39918", border: "1px solid #34d399", color: "#34d399", fontFamily: "monospace", fontSize: 11, padding: "10px", borderRadius: 6, cursor: "pointer" }}>PREVIEW IMPORT →</button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW */}
          {step === "preview" && (
            <div>
              <div style={{ color: "#555", fontSize: 10, fontFamily: "monospace", marginBottom: 12 }}>
                Review transactions. Green = income, Red = expense. Edit categories or ✕ to remove.
              </div>
              <div style={{ maxHeight: 360, overflow: "auto", display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {preview.map((row, idx) => {
                  const isIncome = row.type === "income";
                  const isTransfer = row.type === "transfer";
                  const color = CAT_COLOR[row.category] || "#888";
                  const cats = isTransfer ? TRANSFER_CATEGORIES : (isIncome ? INCOME_CATEGORIES : CATEGORIES);
                  const amtColor = isTransfer ? "#ffd70088" : (isIncome ? "#00ff88" : "#ff3b3b");
                  const borderColor = isTransfer ? "#ffd70022" : (isIncome ? "#00ff8822" : "#1a1a1a");
                  return (
                    <div key={idx} style={{ background: "#111", border: `1px solid ${borderColor}`, borderRadius: 7, padding: "10px 12px", display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: "#e8e8e8", fontSize: 12, fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{row.desc}</div>
                        <div style={{ color: "#444", fontSize: 10, fontFamily: "monospace", marginTop: 2 }}>{row.date} · {row.month}</div>
                      </div>
                      <select
                        value={row.category}
                        onChange={e => updateCategory(idx, e.target.value)}
                        style={{ background: `${color}18`, border: `1px solid ${color}55`, borderRadius: 4, padding: "3px 7px", color, fontFamily: "monospace", fontSize: 9, outline: "none", cursor: "pointer" }}
                      >
                        {cats.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div style={{ color: amtColor, fontFamily: "monospace", fontSize: 13, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {isTransfer ? "↔" : (isIncome ? "+" : "-")}${row.amount.toFixed(2)}
                      </div>
                      <button onClick={() => removeRow(idx)} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 13, padding: "0 2px" }}>✕</button>
                    </div>
                  );
                })}
              </div>
              {/* Summary */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 100, background: "#0d0d0d", border: "1px solid #00ff8822", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ color: "#555", fontFamily: "monospace", fontSize: 9, marginBottom: 4 }}>INCOME ({incomeRows.length})</div>
                  <div style={{ color: "#00ff88", fontFamily: "monospace", fontSize: 14, fontWeight: 700 }}>+${totalIncome.toFixed(2)}</div>
                </div>
                <div style={{ flex: 1, minWidth: 100, background: "#0d0d0d", border: "1px solid #ff3b3b22", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ color: "#555", fontFamily: "monospace", fontSize: 9, marginBottom: 4 }}>EXPENSES ({expenseRows.length})</div>
                  <div style={{ color: "#ff3b3b", fontFamily: "monospace", fontSize: 14, fontWeight: 700 }}>-${totalExpense.toFixed(2)}</div>
                </div>
                {transferRows.length > 0 && (
                  <div style={{ flex: 1, minWidth: 100, background: "#0d0d0d", border: "1px solid #ffd70022", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ color: "#555", fontFamily: "monospace", fontSize: 9, marginBottom: 4 }}>TRANSFERS ({transferRows.length})</div>
                    <div style={{ color: "#ffd70088", fontFamily: "monospace", fontSize: 14, fontWeight: 700 }}>↔${totalTransfer.toFixed(2)}</div>
                  </div>
                )}
              </div>
              <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{ color: "#555", fontFamily: "monospace", fontSize: 11 }}>NET CASH FLOW</span>
                <span style={{ color: totalIncome - totalExpense >= 0 ? "#00ff88" : "#ff3b3b", fontFamily: "monospace", fontSize: 14, fontWeight: 700 }}>
                  {totalIncome - totalExpense >= 0 ? "+" : "-"}${Math.abs(totalIncome - totalExpense).toFixed(2)}
                </span>
              </div>
              {/* Balance sync — updates Checking + Savings on main screen */}
              <div style={{ background: "#0d0d0d", border: "1px solid #34d39933", borderRadius: 8, padding: "14px 16px", marginBottom: 16 }}>
                <div style={{ color: "#34d399", fontSize: 9, fontFamily: "monospace", letterSpacing: 2, marginBottom: 6 }}>UPDATE MAIN SCREEN BALANCES</div>
                {detectedBalance != null && (
                  <div style={{ color: "#555", fontSize: 10, fontFamily: "monospace", marginBottom: 10 }}>
                    Checking auto-filled from your CSV's balance column.
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: "#666", fontSize: 9, fontFamily: "monospace", letterSpacing: 1, display: "block", marginBottom: 5 }}>CHECKING ($)</label>
                    <input type="number" value={balanceForm.checking} onChange={e => setBalanceForm(f => ({ ...f, checking: e.target.value }))}
                      placeholder={`${data.bankBalance?.toFixed(2) || "0.00"} current`}
                      style={{ width: "100%", background: "#111", border: "1px solid #2a2a2a", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "monospace", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ color: "#666", fontSize: 9, fontFamily: "monospace", letterSpacing: 1, display: "block", marginBottom: 5 }}>SAVINGS ($)</label>
                    <input type="number" value={balanceForm.savings} onChange={e => setBalanceForm(f => ({ ...f, savings: e.target.value }))}
                      placeholder={`${(data.savings || 0).toFixed(2)} current`}
                      style={{ width: "100%", background: "#111", border: "1px solid #2a2a2a", borderRadius: 6, padding: "8px 10px", color: "#e8e8e8", fontFamily: "monospace", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ color: "#333", fontSize: 9, fontFamily: "monospace", marginTop: 8 }}>Leave blank to keep current balances unchanged.</div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setStep("map")} style={{ flex: 1, background: "none", border: "1px solid #222", color: "#555", fontFamily: "monospace", fontSize: 11, padding: "10px", borderRadius: 6, cursor: "pointer" }}>← BACK</button>
                <button onClick={doImport} style={{ flex: 2, background: "#34d39918", border: "1px solid #34d399", color: "#34d399", fontFamily: "monospace", fontSize: 11, padding: "10px", borderRadius: 6, cursor: "pointer" }}>IMPORT {preview.length} TRANSACTIONS</button>
              </div>
            </div>
          )}

          {/* STEP 4: DONE */}
          {step === "done" && (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
              <div style={{ color: "#34d399", fontFamily: "monospace", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>IMPORT COMPLETE</div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 12, flexWrap: "wrap" }}>
                <div style={{ color: "#ff3b3b", fontFamily: "monospace", fontSize: 12 }}>{imported.expenses} expenses</div>
                <div style={{ color: "#00ff88", fontFamily: "monospace", fontSize: 12 }}>{imported.income} income</div>
                <div style={{ color: "#ffd70088", fontFamily: "monospace", fontSize: 12 }}>{imported.transfers} transfers</div>
              </div>
              {(!isNaN(parseFloat(balanceForm.checking)) && parseFloat(balanceForm.checking) >= 0) && (
                <div style={{ color: "#34d399", fontFamily: "monospace", fontSize: 11, marginBottom: 4 }}>
                  Checking updated → ${parseFloat(balanceForm.checking).toFixed(2)}
                </div>
              )}
              {(!isNaN(parseFloat(balanceForm.savings)) && parseFloat(balanceForm.savings) >= 0) && (
                <div style={{ color: "#34d399", fontFamily: "monospace", fontSize: 11, marginBottom: 4 }}>
                  Savings updated → ${parseFloat(balanceForm.savings).toFixed(2)}
                </div>
              )}
              <button onClick={onClose} style={{ marginTop: 16, background: "#34d39918", border: "1px solid #34d399", color: "#34d399", fontFamily: "monospace", fontSize: 12, padding: "12px 32px", borderRadius: 7, cursor: "pointer" }}>DONE</button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
