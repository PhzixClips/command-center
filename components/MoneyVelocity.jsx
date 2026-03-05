export default function MoneyVelocity({ monthShiftIncome, monthFlipIncome, monthExpensesTotal, savings }) {
  const earned = Math.round(monthShiftIncome + monthFlipIncome);
  const spent = Math.round(monthExpensesTotal);
  const saved = Math.round(savings || 0);

  const items = [
    { label: "Earned",  value: earned, prefix: "+", color: "#00e676" },
    { label: "Spent",   value: spent,  prefix: "-", color: "#ff3b3b" },
    { label: "Saved",   value: saved,  prefix: "+", color: "#34d399" },
  ];

  // Flow ratio: earned vs spent
  const ratio = spent > 0 ? (earned / spent).toFixed(1) : "—";
  const ratioColor = earned >= spent ? "#00e676" : "#ff3b3b";

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      backdropFilter: "blur(40px)",
      WebkitBackdropFilter: "blur(40px)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 20,
      padding: "18px 22px",
      marginBottom: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, #00e67644, #ff3b3b44, transparent)",
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div>
          <div style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Money Velocity</div>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10 }}>This month's cashflow</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: ratioColor, fontSize: 20, fontWeight: 800 }}>{ratio}x</div>
          <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>earn/spend</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        {items.map((item, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${item.color}18`,
            borderRadius: 14,
            padding: "12px 14px",
            textAlign: "center",
          }}>
            <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: 500, marginBottom: 6 }}>{item.label}</div>
            <div style={{ color: item.color, fontSize: 18, fontWeight: 700 }}>
              {item.prefix}${item.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Flow bar */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>Income</span>
          <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>Expenses</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, height: 6, overflow: "hidden", position: "relative" }}>
          <div style={{
            background: "linear-gradient(90deg, #00e676, #34d399)",
            width: `${Math.min(100, earned > 0 ? (earned / (earned + spent)) * 100 : 50)}%`,
            height: "100%",
            borderRadius: 6,
            transition: "width 0.4s",
          }} />
        </div>
      </div>
    </div>
  );
}
