import Modal from "../Modal.jsx";
import Input from "../Input.jsx";
import Btn   from "../Btn.jsx";
import { FLIP_CATEGORIES, BUDGET_CATEGORIES } from "../constants.js";

const selStyle = { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 14px", color: "#e8e8e8", fontSize: 14, outline: "none" };

export default function AppModals({
  modal, setModal, form, setForm, hourlyWage, data,
  addShift, saveFlip, saveStock, saveGoal, updateBalance, save,
}) {
  if (!modal) return null;

  if (modal === "shift") return (
    <Modal title={form._editIdx !== undefined ? "Edit Shift" : "Log Shift"} onClose={() => setModal(null)}>
      <div style={{ marginBottom: 14 }}>
        <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Date</label>
        <input type="date" value={form.rawDate || ""}
          onChange={e => {
            const raw = e.target.value;
            if (!raw) { setForm({ ...form, rawDate: "", date: "" }); return; }
            const [y, m, d] = raw.split("-");
            const label = new Date(+y, +m-1, +d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
            setForm({ ...form, rawDate: raw, date: label });
          }}
          style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "9px 12px", color: "#e8e8e8", fontSize: 13, outline: "none", boxSizing: "border-box", colorScheme: "dark" }} />
        {form.date && <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 4 }}>→ will save as "{form.date}"</div>}
      </div>
      <Input label="Hours Worked" type="number" value={form.hours || ""} onChange={v => setForm({ ...form, hours: v })} placeholder="6" min="0.5" max="24" step="0.5" error={form.hours && (+form.hours <= 0 || +form.hours > 24) ? "Must be between 0.5 and 24" : undefined} />
      <Input label="Total Made Today ($)" type="number" value={form.total || ""} onChange={v => setForm({ ...form, total: v })} placeholder="396.00" min="0" step="0.01" error={form.total && +form.total < 0 ? "Cannot be negative" : undefined} />
      {form.hours && form.total && (
        <div style={{ marginBottom: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "10px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Wage ({form.hours}hr × ${hourlyWage})</span>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>${(+form.hours * hourlyWage).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#a78bfa", fontSize: 11 }}>Tips (calculated)</span>
            <span style={{ color: "#a78bfa", fontSize: 11, fontWeight: 700 }}>${Math.max(0, +form.total - +form.hours * hourlyWage).toFixed(2)}</span>
          </div>
        </div>
      )}
      {form._error && <div style={{ color: "#ff3b3b", fontSize: 11, textAlign: "center", marginBottom: 10, padding: "8px", background: "#ff3b3b11", borderRadius: 6, border: "1px solid #ff3b3b33" }}>{form._error}</div>}
      <Btn onClick={addShift} style={{ width: "100%", marginTop: 4, opacity: (form.date && form.hours && form.total) ? 1 : 0.5 }}>
        {form._editIdx !== undefined ? "Save Changes" : "Log Shift"}
      </Btn>
    </Modal>
  );

  if (modal === "flip") return (
    <Modal title={form._editIdx !== undefined ? "Edit Flip" : "Add Flip"} onClose={() => setModal(null)}>
      <Input label="Item Name" value={form.item || ""} onChange={v => setForm({ ...form, item: v })} placeholder="Jordan 1 Bred" />
      <Input label="Buy Price ($)" type="number" value={form.bought || ""} onChange={v => setForm({ ...form, bought: v })} placeholder="215" min="0" step="0.01" error={form.bought && +form.bought < 0 ? "Cannot be negative" : undefined} />
      <Input label="Sell Price ($) — leave blank if active" type="number" value={form.sold || ""} onChange={v => setForm({ ...form, sold: v })} placeholder="380" min="0" step="0.01" error={form.sold && +form.sold < 0 ? "Cannot be negative" : undefined} />
      <Input label="Platform Fee % (e.g. 12.9 for eBay)" type="number" value={form.fees || ""} onChange={v => setForm({ ...form, fees: v })} placeholder="0" min="0" max="100" step="0.1" error={form.fees && (+form.fees < 0 || +form.fees > 100) ? "Must be 0-100%" : undefined} />
      {form.bought && form.sold && form.fees && (
        <div style={{ marginBottom: 14, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "10px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Gross profit</span>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>${(+form.sold - +form.bought).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>Platform fee ({form.fees}%)</span>
            <span style={{ color: "#ff3b3b", fontSize: 11 }}>-${((+form.sold - +form.bought) * +form.fees / 100).toFixed(2)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#00ff88", fontSize: 11 }}>Net profit</span>
            <span style={{ color: "#00ff88", fontSize: 11, fontWeight: 700 }}>${((+form.sold - +form.bought) * (1 - +form.fees / 100)).toFixed(2)}</span>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 14 }}>
        <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Category</label>
        <select value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })} style={selStyle}>
          <option value="">— Select Category —</option>
          {FLIP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Status</label>
        <select value={form.status || "listed"} onChange={e => setForm({ ...form, status: e.target.value })} style={selStyle}>
          <option value="listed">Listed / Active</option>
          <option value="sold">Sold</option>
        </select>
      </div>
      <Btn onClick={saveFlip} color="#ff8c00" style={{ width: "100%", marginTop: 8 }}>{form._editIdx !== undefined ? "Save Changes" : "Add Flip"}</Btn>
    </Modal>
  );

  if (modal === "stock") return (
    <Modal title={form._editIdx !== undefined ? "Edit Position" : "Add Position"} onClose={() => setModal(null)}>
      <Input label="Ticker" value={form.ticker || ""} onChange={v => setForm({ ...form, ticker: v })} placeholder="NVDA" />
      <Input label="Name / Description" value={form.name || ""} onChange={v => setForm({ ...form, name: v })} placeholder="Nvidia Corp" />
      <Input label="Shares" type="number" value={form.shares || ""} onChange={v => setForm({ ...form, shares: v })} placeholder="2" min="0.001" step="0.001" error={form.shares && +form.shares <= 0 ? "Must be positive" : undefined} />
      <Input label="Avg Buy Price ($)" type="number" value={form.buyPrice || ""} onChange={v => setForm({ ...form, buyPrice: v })} placeholder="480" min="0" step="0.01" error={form.buyPrice && +form.buyPrice < 0 ? "Cannot be negative" : undefined} />
      <Input label="Current Price ($)" type="number" value={form.currentPrice || ""} onChange={v => setForm({ ...form, currentPrice: v })} placeholder="875" min="0" step="0.01" error={form.currentPrice && +form.currentPrice < 0 ? "Cannot be negative" : undefined} />
      <Input label="Alert Below Price ($) — optional" type="number" value={form.alertBelow || ""} onChange={v => setForm({ ...form, alertBelow: v })} placeholder="55.00" min="0" step="0.01" />
      <Btn onClick={saveStock} color="#60a5fa" style={{ width: "100%", marginTop: 8 }}>{form._editIdx !== undefined ? "Save Changes" : "Add Position"}</Btn>
    </Modal>
  );

  if (modal === "goal") return (
    <Modal title={form._editIdx !== undefined ? "Edit Goal" : "Add Goal"} onClose={() => setModal(null)}>
      <Input label="Goal Name" value={form.name || ""} onChange={v => setForm({ ...form, name: v })} placeholder="New Car Fund" />
      <Input label="Target Amount ($)" type="number" value={form.target || ""} onChange={v => setForm({ ...form, target: v })} placeholder="5000" min="1" step="1" error={form.target && +form.target <= 0 ? "Must be positive" : undefined} />
      <div style={{ marginBottom: 14 }}>
        <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Auto-sync Progress From</label>
        <select value={form.autoKey || "none"} onChange={e => setForm({ ...form, autoKey: e.target.value })} style={selStyle}>
          <option value="none">Manual (enter below)</option>
          <option value="bank">Checking Balance</option>
          <option value="stocks">Stock Portfolio Value</option>
          <option value="flips">Total Flip Profit</option>
        </select>
      </div>
      {(!form.autoKey || form.autoKey === "none") && (
        <Input label="Current Amount ($)" type="number" value={form.current || ""} onChange={v => setForm({ ...form, current: v })} placeholder="0" />
      )}
      <Btn onClick={saveGoal} color="#e879f9" style={{ width: "100%", marginTop: 8 }}>{form._editIdx !== undefined ? "Save Changes" : "Add Goal"}</Btn>
    </Modal>
  );

  if (modal === "balance") return (
    <Modal title="Update Balances" onClose={() => setModal(null)}>
      <Input label="Checking Balance ($)" type="number" value={form.bank || ""} onChange={v => setForm({ ...form, bank: v })} placeholder="3256.03" />
      <Input label="Savings Balance ($)" type="number" value={form.savings || ""} onChange={v => setForm({ ...form, savings: v })} placeholder="25.69" />
      <Input label="Liquid / Deploy Capital ($)" type="number" value={form.liquid || ""} onChange={v => setForm({ ...form, liquid: v })} placeholder="3256.03" />
      <Btn onClick={updateBalance} style={{ width: "100%", marginTop: 8 }}>Update</Btn>
    </Modal>
  );

  if (modal === "expense") return (
    <Modal title="Add Expense" onClose={() => setModal(null)}>
      <Input label="Description" value={form.desc || ""} onChange={v => setForm({ ...form, desc: v })} placeholder="Groceries at Fry's" />
      <Input label="Amount ($)" type="number" value={form.amount || ""} onChange={v => setForm({ ...form, amount: v })} placeholder="47.50" />
      <div style={{ marginBottom: 14 }}>
        <label style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Category</label>
        <select value={form.category || "Food & Dining"} onChange={e => setForm({ ...form, category: e.target.value })} style={selStyle}>
          {BUDGET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <Btn onClick={() => {
        const { desc, amount, category } = form;
        if (!desc || !amount) return;
        const n = new Date();
        const mk = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`;
        const exp = { id: Date.now(), desc, amount: +amount, category: category || "Other", date: n.toLocaleDateString("en-US",{month:"short",day:"numeric"}), month: mk };
        save({ ...data, expenses: [...(data.expenses||[]), exp] });
        setModal(null); setForm({});
      }} color="#34d399" style={{ width: "100%", marginTop: 8 }}>Add Expense</Btn>
    </Modal>
  );

  return null;
}
