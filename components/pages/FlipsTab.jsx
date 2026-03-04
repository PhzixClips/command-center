import Btn from "../Btn.jsx";
import { MS_PER_DAY, STALE_FLIP_DAYS } from "../constants.js";

export default function FlipsTab({
  data, thisYear, setTab,
  flipProfit, soldFlips, avgFlipROI, bestFlip, avgDaysToSell, flipsByCategory,
  openEditFlip, deleteFlip, setModal, setForm,
}) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ color: "#ff8c00", fontSize: 14, fontWeight: 600 }}>Flip Tracker</div>
          <button onClick={() => setTab("opportunities")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#ffd700", fontSize: 12, fontWeight: 500, padding: 0, marginTop: 4 }}>
            Find opportunities →
          </button>
        </div>
        <Btn onClick={() => { setModal("flip"); setForm({ status: "listed" }); }} color="#ff8c00">+ Add Flip</Btn>
      </div>

      {soldFlips.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #ff8c0022", borderRadius: 16, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, fontWeight: 500, marginBottom: 14 }}>Flip Analytics · Net of Fees</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
            {[
              { label: "NET PROFIT",      value: `$${Math.round(flipProfit)}`,                          color: "#00ff88" },
              { label: "FLIPS SOLD",      value: soldFlips.length,                                      color: "#ff8c00" },
              { label: "AVG ROI",         value: avgFlipROI ? `+${avgFlipROI}%` : "—",                 color: "#ffd700" },
              { label: "BEST FLIP",       value: bestFlip ? `+$${bestFlip.sold-bestFlip.bought}` : "—", color: "#a78bfa" },
              { label: "AVG DAYS TO SELL",value: avgDaysToSell !== null ? `${avgDaysToSell}d` : "—",    color: "#38bdf8" },
              { label: "ACTIVE",          value: data.flips.filter(f=>f.status!=="sold").length,        color: "#60a5fa" },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 9, letterSpacing: 1 }}>{s.label}</div>
                <div style={{ color: s.color, fontSize: 18, fontWeight: 700, marginTop: 4 }}>{s.value}</div>
              </div>
            ))}
          </div>
          {bestFlip && (
            <div style={{ marginTop: 14, borderTop: "1px solid #1a1a1a", paddingTop: 12, color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
              Best: <span style={{ color: "#a78bfa" }}>{bestFlip.item}</span> — ${bestFlip.bought} → ${bestFlip.sold} (+{((bestFlip.sold-bestFlip.bought)/bestFlip.bought*100).toFixed(0)}% ROI{bestFlip.fees ? `, ${bestFlip.fees}% fee` : ""})
            </div>
          )}
          {Object.keys(flipsByCategory).length > 0 && (
            <div style={{ marginTop: 14, borderTop: "1px solid #1a1a1a", paddingTop: 12 }}>
              <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12, fontWeight: 500, marginBottom: 8 }}>ROI by Category</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {Object.entries(flipsByCategory).map(([cat, v]) => (
                  <div key={cat} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 5, padding: "6px 10px" }}>
                    <div style={{ color: "#ff8c00", fontSize: 9 }}>{cat}</div>
                    <div style={{ color: "#e8e8e8", fontSize: 13, fontWeight: 700 }}>${Math.round(v.profit)}</div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 9 }}>+{(v.roiSum/v.count).toFixed(0)}% avg · {v.count} sold</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {data.flips.map((f, i) => {
          const gross      = f.sold ? f.sold - f.bought : null;
          const net        = gross !== null ? gross - gross * (f.fees || 0) / 100 : null;
          const roi        = gross !== null ? ((gross / f.bought) * 100).toFixed(0) : null;
          const hasFee     = f.fees && f.fees > 0;
          const daysListed = (f.listedDate && f.status !== "sold") ? (() => {
            const d = new Date(`${f.listedDate} ${thisYear}`);
            return Math.max(0, Math.floor((Date.now() - d.getTime()) / MS_PER_DAY));
          })() : null;
          const isStale = daysListed !== null && daysListed > STALE_FLIP_DAYS;
          return (
            <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${isStale ? "#ff3b3b44" : f.status==="sold" ? "#00ff8822" : "#1a1a1a"}`, borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ color: "#e8e8e8", fontWeight: 600 }}>{f.item}</div>
                  {f.category && <span style={{ color: "#38bdf8", fontSize: 9, border: "1px solid #38bdf844", padding: "2px 8px", borderRadius: 8 }}>{f.category}</span>}
                  {daysListed !== null && <span style={{ color: isStale ? "#ff3b3b" : "#444", fontSize: 9, border: `1px solid ${isStale ? "#ff3b3b44" : "#33333344"}`, padding: "2px 8px", borderRadius: 8 }}>{daysListed}d{isStale ? " STALE" : ""}</span>}
                </div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 3 }}>
                  Bought ${f.bought.toLocaleString()} {f.sold ? `→ Sold $${f.sold.toLocaleString()}` : "· Listed"}
                  {hasFee && <span style={{ color: "rgba(255,255,255,0.25)" }}> · {f.fees}% fee</span>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {net !== null
                  ? <div style={{ textAlign: "right" }}>
                      <div style={{ color: "#00ff88", fontSize: 18, fontWeight: 700 }}>+${Math.round(net)}</div>
                      <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10 }}>+{roi}% ROI{hasFee ? <span style={{ color: "rgba(255,255,255,0.25)" }}> (gross +${Math.round(gross)})</span> : ""}</div>
                    </div>
                  : <div style={{ color: "#ffd700", fontSize: 12, border: "1px solid #ffd70055", padding: "4px 10px", borderRadius: 4 }}>ACTIVE</div>
                }
                <button onClick={() => openEditFlip(i)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 9, padding: "4px 8px", borderRadius: 8, cursor: "pointer" }}>Edit</button>
                <button onClick={() => deleteFlip(i)} style={{ background: "none", border: "1px solid #ff3b3b44", color: "#ff3b3b", fontSize: 11, padding: "3px 8px", borderRadius: 8, cursor: "pointer" }}>✕</button>
              </div>
            </div>
          );
        })}
        {data.flips.length === 0 && (
          <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 12, textAlign: "center", padding: "32px 0" }}>No flips yet. Add your first one above.</div>
        )}
      </div>
    </div>
  );
}
