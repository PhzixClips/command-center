import Btn from "../Btn.jsx";

export default function StocksTab({
  data, stockValue, stockCost, priceAlerts,
  syncLoading, lastSynced, syncStockPrices,
  openEditStock, deleteStock, setModal, setForm,
}) {
  return (
    <div>
      {priceAlerts.length > 0 && (
        <div style={{ background: "#ff3b3b11", border: "1px solid #ff3b3b44", borderRadius: 14, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ color: "#ff3b3b", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Price Alert</div>
          {priceAlerts.map((s, i) => (
            <div key={i} style={{ color: "#ff8c00", fontSize: 12 }}>
              {s.ticker} is ${s.currentPrice.toFixed(2)} — below your alert of ${s.alertBelow}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ color: "#60a5fa", fontSize: 14, fontWeight: 600 }}>Stock Portfolio</div>
          {lastSynced && <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, marginTop: 3 }}>last synced {lastSynced}</div>}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={syncStockPrices} disabled={syncLoading} style={{ background: syncLoading ? "rgba(255,255,255,0.04)" : "#60a5fa12", border: "1px solid #60a5fa44", color: "#60a5fa", fontSize: 11, fontWeight: 500, padding: "8px 16px", borderRadius: 12, cursor: "pointer" }}>
            {syncLoading ? "Syncing..." : "Sync Prices"}
          </button>
          <Btn onClick={() => { setModal("stock"); setForm({}); }} color="#60a5fa">+ Add</Btn>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {data.stocks.map((s, i) => {
          const value     = s.shares * s.currentPrice;
          const cost      = s.shares * s.buyPrice;
          const pl        = value - cost;
          const plPct     = ((pl / cost) * 100).toFixed(1);
          const isAlerted = s.alertBelow && s.currentPrice < s.alertBelow;
          return (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: `1px solid ${isAlerted ? "#ff3b3b55" : pl>=0?"#00ff8822":"#ff3b3b22"}`, borderRadius: 16, padding: "14px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 18 }}>{s.ticker}</div>
                    {isAlerted && <span style={{ color: "#ff3b3b", fontSize: 9, border: "1px solid #ff3b3b44", padding: "2px 8px", borderRadius: 8 }}>ALERT</span>}
                    {s.alertBelow && !isAlerted && <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 9 }}>alert ↓${s.alertBelow}</span>}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{s.name} · {s.shares} sh · avg ${s.buyPrice} → <span style={{ color: "#60a5fa" }}>${s.currentPrice}</span></div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#e8e8e8", fontSize: 16, fontWeight: 700 }}>${value.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
                    <div style={{ color: pl>=0?"#00ff88":"#ff3b3b", fontSize: 12 }}>{pl>=0?"+":""}${Math.round(pl)} ({plPct}%)</div>
                  </div>
                  <button onClick={() => openEditStock(i)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 9, padding: "4px 8px", borderRadius: 8, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => deleteStock(i)} style={{ background: "none", border: "1px solid #ff3b3b44", color: "#ff3b3b", fontSize: 11, padding: "3px 8px", borderRadius: 8, cursor: "pointer" }}>✕</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 20, background: "rgba(255,255,255,0.03)", backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "14px 18px", display: "flex", gap: 32, boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
        <div><div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>PORTFOLIO VALUE</div><div style={{ color: "#60a5fa", fontSize: 18, fontWeight: 700 }}>${Math.round(stockValue).toLocaleString()}</div></div>
        <div><div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>TOTAL P&L</div><div style={{ color: stockValue>=stockCost?"#00ff88":"#ff3b3b", fontSize: 18, fontWeight: 700 }}>{stockValue>=stockCost?"+":""}${Math.round(stockValue-stockCost).toLocaleString()}</div></div>
      </div>
    </div>
  );
}
