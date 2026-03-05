import { useState } from "react";
import { gemini } from "./gemini.js";
import Modal from "./Modal.jsx";
import Input from "./Input.jsx";
import Btn from "./Btn.jsx";

// ── FB Marketplace Categories ────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "fb-exercise", icon: "💪", title: "Exercise Equipment",
    searchTerms: ["free treadmill", "peloton", "exercise bike", "bowflex", "nordictrack"],
    buyRange: [0, 200], sellRange: [200, 1200], daysToSell: "3–7",
    risk: "LOW", truckRequired: true, urgency: "hot-now",
    tags: ["PEAK SEASON", "TRUCK MOAT"],
    hotItems: [
      { model: "Peloton Bike+", buy: "$400–$600", sell: "$900–$1,200" },
      { model: "NordicTrack 1750", buy: "$200–$350", sell: "$600–$900" },
      { model: "Bowflex Velocore", buy: "$100–$200", sell: "$400–$600" },
    ],
  },
  {
    id: "fb-power-tools", icon: "🔧", title: "Power Tool Lots",
    searchTerms: ["dewalt lot", "milwaukee tools", "tool bundle", "circular saw"],
    buyRange: [50, 200], sellRange: [150, 600], daysToSell: "2–5",
    risk: "LOW", truckRequired: false, urgency: "evergreen",
    tags: ["FAST TURN", "HIGH DEMAND"],
    hotItems: [
      { model: "DeWalt 20V Combo Kit", buy: "$80–$150", sell: "$280–$380" },
      { model: "Milwaukee M18 FUEL Kit", buy: "$100–$200", sell: "$350–$500" },
      { model: "Makita Impact Driver Kit", buy: "$60–$100", sell: "$180–$250" },
    ],
  },
  {
    id: "fb-riding-mowers", icon: "🌿", title: "Riding Mowers",
    searchTerms: ["riding mower", "zero turn mower", "john deere", "husqvarna mower"],
    buyRange: [100, 400], sellRange: [400, 1200], daysToSell: "5–10",
    risk: "LOW", truckRequired: true, urgency: "hot-now",
    tags: ["PEAK SEASON", "TRUCK MOAT"],
    hotItems: [
      { model: "John Deere E110", buy: "$300–$500", sell: "$700–$1,000" },
      { model: "Husqvarna YTH18542", buy: "$200–$400", sell: "$600–$900" },
      { model: "Cub Cadet XT1 LT42", buy: "$250–$450", sell: "$700–$950" },
    ],
  },
  {
    id: "fb-large-tvs", icon: "📺", title: "Large TVs (55\"+)",
    searchTerms: ["55 inch tv", "65 inch tv", "samsung 4k tv", "lg oled"],
    buyRange: [30, 200], sellRange: [150, 600], daysToSell: "2–5",
    risk: "LOW-MED", truckRequired: false, urgency: "evergreen",
    tags: ["FAST TURN"],
    hotItems: [
      { model: "LG C2/C3 65\" OLED", buy: "$400–$700", sell: "$900–$1,200" },
      { model: "Samsung QN90B 65\"", buy: "$300–$500", sell: "$700–$1,000" },
    ],
  },
  {
    id: "fb-patio", icon: "☀️", title: "Patio / Outdoor",
    searchTerms: ["patio furniture", "outdoor sectional", "traeger grill", "big green egg"],
    buyRange: [50, 400], sellRange: [200, 1200], daysToSell: "4–10",
    risk: "LOW", truckRequired: true, urgency: "hot-now",
    tags: ["PEAK SEASON", "TRUCK MOAT", "HIGH DEMAND"],
    hotItems: [
      { model: "Traeger Pro 575", buy: "$200–$350", sell: "$500–$750" },
      { model: "Big Green Egg (Large)", buy: "$400–$600", sell: "$800–$1,200" },
      { model: "POLYWOOD Sectional", buy: "$100–$250", sell: "$400–$700" },
    ],
  },
  {
    id: "fb-appliances", icon: "🏠", title: "Washer / Dryer / Fridge",
    searchTerms: ["washer dryer set", "refrigerator", "lg washer", "samsung fridge"],
    buyRange: [50, 300], sellRange: [200, 700], daysToSell: "1–4",
    risk: "LOW", truckRequired: true, urgency: "evergreen",
    tags: ["TRUCK MOAT", "FAST TURN"],
    hotItems: [
      { model: "LG Front-Load Washer", buy: "$100–$200", sell: "$350–$500" },
      { model: "Samsung French Door Fridge", buy: "$200–$400", sell: "$600–$900" },
    ],
  },
  {
    id: "fb-baby-gear", icon: "🍼", title: "Premium Baby Gear",
    searchTerms: ["uppababy vista", "nuna pipa", "4moms mamaroo", "baby gear lot"],
    buyRange: [20, 200], sellRange: [80, 550], daysToSell: "2–5",
    risk: "LOW", truckRequired: false, urgency: "evergreen",
    tags: ["FAST TURN", "NO TRUCK NEEDED"],
    hotItems: [
      { model: "UPPAbaby Vista V2", buy: "$120–$200", sell: "$380–$550" },
      { model: "Nuna PIPA Lite", buy: "$100–$160", sell: "$250–$360" },
    ],
  },
  {
    id: "fb-gaming", icon: "🎮", title: "Gaming / Consoles",
    searchTerms: ["gaming pc", "ps5 bundle", "xbox series x", "gaming setup"],
    buyRange: [100, 500], sellRange: [200, 1200], daysToSell: "2–7",
    risk: "LOW-MED", truckRequired: false, urgency: "evergreen",
    tags: ["HIGH DEMAND"],
    hotItems: [
      { model: "RTX 3080 Gaming PC", buy: "$500–$700", sell: "$900–$1,200" },
      { model: "Meta Quest 3 128GB", buy: "$200–$280", sell: "$380–$470" },
    ],
  },
  {
    id: "fb-furniture", icon: "🛋️", title: "Free / Cheap Furniture",
    searchTerms: ["free couch", "free sectional", "free recliner", "furniture moving"],
    buyRange: [0, 50], sellRange: [80, 400], daysToSell: "3–7",
    risk: "LOW", truckRequired: true, urgency: "evergreen",
    tags: ["TRUCK MOAT", "NEAR ZERO COST"],
    hotItems: [
      { model: "Sectional Sofa (clean)", buy: "Free–$50", sell: "$150–$350" },
      { model: "Recliner (leather)", buy: "Free–$30", sell: "$80–$200" },
    ],
  },
  {
    id: "fb-scrap", icon: "🔩", title: "Free Scrap Metal",
    searchTerms: ["free metal", "free appliances", "scrap metal", "free washer"],
    buyRange: [0, 0], sellRange: [40, 200], daysToSell: "Same day",
    risk: "LOW", truckRequired: true, urgency: "evergreen",
    tags: ["TRUCK MOAT", "ZERO COST", "SAME DAY"],
    hotItems: [
      { model: "Appliance lot (3–5 units)", buy: "Free", sell: "$60–$120 (scrap)" },
      { model: "Copper wire / pipe", buy: "Free", sell: "$3–$4/lb" },
    ],
  },
];

// ── Score a category for sorting ────────────────────────────────────────────
function scoreCategory(cat, liquid, hasTruck) {
  let score = 50;
  if (cat.truckRequired && !hasTruck) return -999;
  if (cat.truckRequired && hasTruck) score += 15;
  const buyMax = cat.buyRange[1];
  if (buyMax === 0 || liquid >= buyMax) score += 30;
  else if (liquid >= cat.buyRange[0]) score += 15;
  else score -= 20;
  if (cat.urgency === "hot-now") score += 20;
  const profitHigh = cat.sellRange[1] - cat.buyRange[0];
  if (profitHigh >= 800) score += 15;
  else if (profitHigh >= 400) score += 10;
  if (cat.daysToSell?.includes("1") || cat.daysToSell?.includes("Same")) score += 10;
  return score;
}

// ── Open FB Marketplace search ──────────────────────────────────────────────
const scout = (term) =>
  window.open(`https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(term)}`, "_blank");

// ── Profit bar ──────────────────────────────────────────────────────────────
function ProfitBar({ buyLow, buyHigh, sellLow, sellHigh }) {
  const maxVal = sellHigh || 1;
  const buyW = ((buyHigh || buyLow) / maxVal) * 100;
  const profitW = Math.max(0, 100 - buyW);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>BUY ${buyLow}–${buyHigh}</span>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>SELL ${sellLow}–${sellHigh}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${buyW}%`, background: "rgba(255,255,255,0.1)", borderRadius: "3px 0 0 3px" }} />
        <div style={{ position: "absolute", left: `${buyW}%`, top: 0, height: "100%", width: `${profitW}%`, background: "linear-gradient(90deg, #00e67666, #00e676)", borderRadius: "0 3px 3px 0" }} />
      </div>
    </div>
  );
}

// ── Single category row ─────────────────────────────────────────────────────
function CategoryRow({ cat, liquid, expanded, onToggle, onStartFlip }) {
  const profitLow = Math.max(0, cat.sellRange[0] - cat.buyRange[1]);
  const profitHigh = Math.max(0, cat.sellRange[1] - cat.buyRange[0]);
  const canAfford = liquid >= cat.buyRange[0];
  const isHot = cat.urgency === "hot-now";

  return (
    <div style={{
      background: expanded ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.015)",
      borderRadius: 14,
      overflow: "hidden",
      transition: "background 0.15s",
      borderLeft: isHot ? "3px solid #ff3b3b" : "3px solid transparent",
    }}>
      {/* Collapsed row — compact, scannable */}
      <div
        onClick={onToggle}
        style={{
          display: "grid",
          gridTemplateColumns: "36px 1fr 90px 90px 32px",
          alignItems: "center",
          gap: 8,
          padding: "14px 14px 14px 12px",
          cursor: "pointer",
        }}
      >
        {/* Icon */}
        <div style={{ fontSize: 20, textAlign: "center" }}>{cat.icon}</div>

        {/* Title + tags */}
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#fff", fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {cat.title}
          </div>
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10, marginTop: 2 }}>
            {cat.daysToSell} days · {cat.risk}
            {cat.truckRequired && <span style={{ color: "#60a5fa" }}> · 🚛</span>}
          </div>
        </div>

        {/* Buy range */}
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: 1 }}>BUY</div>
          <div style={{ color: canAfford ? "#fff" : "rgba(255,255,255,0.25)", fontSize: 14, fontWeight: 700 }}>
            ${cat.buyRange[0] === 0 ? "Free" : cat.buyRange[0]}
            {cat.buyRange[1] > cat.buyRange[0] && <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>–{cat.buyRange[1]}</span>}
          </div>
        </div>

        {/* Profit */}
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: 1 }}>PROFIT</div>
          <div style={{ color: "#00e676", fontSize: 14, fontWeight: 700 }}>
            ${profitLow}–{profitHigh}
          </div>
        </div>

        {/* Chevron */}
        <div style={{
          color: "rgba(255,255,255,0.15)", fontSize: 10, textAlign: "center",
          transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "none",
        }}>▼</div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: "0 14px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>

          {/* Profit bar */}
          <ProfitBar buyLow={cat.buyRange[0]} buyHigh={cat.buyRange[1]} sellLow={cat.sellRange[0]} sellHigh={cat.sellRange[1]} />

          {/* Tags */}
          {cat.tags.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 12 }}>
              {cat.tags.map(tag => (
                <span key={tag} style={{
                  color: tag.includes("PEAK") || tag.includes("HOT") ? "#ff3b3b" : tag.includes("TRUCK") ? "#60a5fa" : "rgba(255,255,255,0.3)",
                  fontSize: 8, fontWeight: 600, letterSpacing: 1,
                  background: tag.includes("PEAK") || tag.includes("HOT") ? "rgba(255,59,59,0.06)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${tag.includes("PEAK") || tag.includes("HOT") ? "rgba(255,59,59,0.15)" : "rgba(255,255,255,0.06)"}`,
                  padding: "2px 7px", borderRadius: 5,
                }}>{tag}</span>
              ))}
            </div>
          )}

          {/* Hot items — tight table layout */}
          {cat.hotItems?.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 8, letterSpacing: 2, marginBottom: 8 }}>HOT MODELS</div>
              <div style={{ display: "grid", gap: 6 }}>
                {cat.hotItems.map((item, i) => (
                  <div key={i} style={{
                    display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 12,
                    background: "rgba(255,255,255,0.02)", borderRadius: 8, padding: "8px 10px",
                  }}>
                    <div style={{ color: "#fff", fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.model}</div>
                    <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>{item.buy}</div>
                    <div style={{ color: "#00e676", fontSize: 11, fontWeight: 600 }}>{item.sell}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search buttons */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
            {cat.searchTerms.map(t => (
              <button
                key={t} onClick={() => scout(t)}
                style={{
                  background: "rgba(0,230,118,0.04)", border: "1px solid rgba(0,230,118,0.12)", color: "#00e676",
                  fontSize: 10, padding: "6px 10px", borderRadius: 8, cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Main CTA */}
          <button
            onClick={() => scout(cat.searchTerms[0])}
            style={{
              width: "100%", marginTop: 14,
              background: "rgba(0,230,118,0.06)",
              border: "1px solid rgba(0,230,118,0.15)",
              color: "#00e676",
              fontSize: 12, fontWeight: 600, letterSpacing: 1,
              padding: "11px 0", borderRadius: 10, cursor: "pointer",
            }}
          >
            SCAN MARKETPLACE
          </button>
        </div>
      )}
    </div>
  );
}

// ── AI Playbook text formatter ──────────────────────────────────────────────
function PlaybookText({ text }) {
  return (
    <div style={{ fontSize: 12, lineHeight: 1.8 }}>
      {text.split("\n").map((line, i) => {
        if (/^MOVE \d/i.test(line))
          return <div key={i} style={{ color: "#00e676", fontWeight: 700, fontSize: 14, marginTop: i > 0 ? 18 : 0 }}>{line}</div>;
        if (/^DO TODAY:/i.test(line))
          return <div key={i} style={{ color: "#00e676", marginTop: 4 }}>{line}</div>;
        if (/^BUY:/i.test(line))
          return <div key={i} style={{ color: "#60a5fa", marginTop: 2 }}>{line}</div>;
        if (/^SELL:/i.test(line))
          return <div key={i} style={{ color: "#00e676", marginTop: 2 }}>{line}</div>;
        if (/^NET PROFIT:/i.test(line))
          return <div key={i} style={{ color: "#00e676", fontWeight: 700, marginTop: 2 }}>{line}</div>;
        if (/^TIME:/i.test(line))
          return <div key={i} style={{ color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{line}</div>;
        if (/^LINK:/i.test(line)) {
          const url = line.match(/https?:\/\/[^\s)]+/)?.[0];
          const label = line.replace(/^LINK:\s*/i, "").replace(/https?:\/\/[^\s)]+/, "").trim() || url;
          return (
            <div key={i} style={{ marginTop: 4 }}>
              {url
                ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#60a5fa", fontSize: 11, textDecoration: "none", border: "1px solid rgba(96,165,250,0.2)", padding: "2px 9px", borderRadius: 6, background: "rgba(96,165,250,0.04)" }}>
                    {label || url}
                  </a>
                : <span style={{ color: "rgba(255,255,255,0.35)" }}>{line}</span>
              }
            </div>
          );
        }
        if (/^FIRST MOVE:/i.test(line))
          return <div key={i} style={{ color: "#00e676", fontWeight: 700, marginTop: 18, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 14 }}>{line}</div>;
        if (line.trim() === "")
          return <div key={i} style={{ height: 4 }} />;
        return <div key={i} style={{ color: "rgba(255,255,255,0.4)" }}>{line}</div>;
      })}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function OpportunitiesTab({ data, save, onStartFlip }) {
  const [playbook, setPlaybook] = useState(data.cachedPlaybook || "");
  const [playbookTime, setPlaybookTime] = useState(data.playbookTime || null);
  const [playbookLoading, setPlaybookLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [filter, setFilter] = useState("all"); // "all" | "hot" | "no-truck" | "free"

  const liquid = data.bankBalance || 0;
  const hasTruck = data.hasTruck !== false;

  const scored = CATEGORIES
    .map(c => ({ ...c, score: scoreCategory(c, liquid, hasTruck) }))
    .filter(c => c.score > -50)
    .sort((a, b) => b.score - a.score);

  const filtered = scored.filter(c => {
    if (filter === "hot") return c.urgency === "hot-now";
    if (filter === "no-truck") return !c.truckRequired;
    if (filter === "free") return c.buyRange[0] === 0;
    return true;
  });

  // ── AI marketplace playbook ─────────────────────────────────────────────
  const buildPlaybook = async () => {
    setPlaybookLoading(true);
    setPlaybook("");
    try {
      const catSummary = scored.slice(0, 5).map(c =>
        `${c.title} (buy $${c.buyRange[0]}–${c.buyRange[1]}, sell $${c.sellRange[0]}–${c.sellRange[1]})`
      ).join("; ");
      const text = await gemini(
        "You are a Facebook Marketplace flipping expert in Phoenix AZ. The user has a pickup truck. Give specific, actionable advice for THIS WEEK.",
        `Liquid cash: $${liquid}. Truck: ${hasTruck ? "YES" : "NO"}. Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.
Top categories: ${catSummary}.
Give me a 3-MOVE ACTION PLAN for FB Marketplace flips THIS WEEK. Format each:
MOVE 1: [TITLE]
DO TODAY: [exact FB search + what to look for]
BUY: [item + max price to pay]
SELL: [platform + target price]
NET PROFIT: $[X]–$[Y]
TIME: [hours to flip]
LINK: [FB Marketplace search URL]

FIRST MOVE: [which to do first and why]`,
        1800, true
      );
      const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      setPlaybook(text || "Unable to generate playbook.");
      setPlaybookTime(time);
      save({ ...data, cachedPlaybook: text, playbookTime: time });
    } catch (err) {
      setPlaybook(`Error: ${err.message || "check connection"}`);
    }
    setPlaybookLoading(false);
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>Marketplace</div>
          <button
            onClick={buildPlaybook}
            disabled={playbookLoading}
            style={{
              background: playbookLoading ? "rgba(255,255,255,0.03)" : "rgba(0,230,118,0.06)",
              border: "1px solid rgba(0,230,118,0.15)",
              color: playbookLoading ? "rgba(255,255,255,0.3)" : "#00e676",
              fontSize: 11, fontWeight: 600,
              padding: "9px 18px", borderRadius: 12, cursor: playbookLoading ? "default" : "pointer",
            }}
          >
            {playbookLoading ? "Thinking..." : "AI Game Plan"}
          </button>
        </div>
        <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
          <span style={{ color: "#00e676", fontWeight: 700 }}>${liquid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span> to deploy
          <span style={{ margin: "0 8px", color: "rgba(255,255,255,0.1)" }}>·</span>
          <button
            onClick={() => save({ ...data, hasTruck: !hasTruck })}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: hasTruck ? "#60a5fa" : "rgba(255,255,255,0.2)", padding: 0 }}
          >
            Truck {hasTruck ? "ON" : "OFF"}
          </button>
          <span style={{ margin: "0 8px", color: "rgba(255,255,255,0.1)" }}>·</span>
          {filtered.length} categories
        </div>
      </div>

      {/* AI Playbook */}
      {(playbook || playbookLoading) && (
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "18px 18px", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ color: "#00e676", fontSize: 13, fontWeight: 600 }}>AI Marketplace Plan</div>
            {playbookTime && <div style={{ color: "rgba(255,255,255,0.12)", fontSize: 9 }}>generated {playbookTime}</div>}
          </div>
          {playbookLoading
            ? <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Scanning marketplace deals...</div>
            : <PlaybookText text={playbook} />
          }
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, overflowX: "auto", paddingBottom: 2 }}>
        {[
          { key: "all", label: "All" },
          { key: "hot", label: "🔥 Hot Now" },
          { key: "no-truck", label: "No Truck" },
          { key: "free", label: "Free Pickup" },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              background: filter === f.key ? "rgba(0,230,118,0.06)" : "rgba(255,255,255,0.02)",
              border: filter === f.key ? "1px solid rgba(0,230,118,0.15)" : "1px solid rgba(255,255,255,0.04)",
              color: filter === f.key ? "#00e676" : "rgba(255,255,255,0.25)",
              fontSize: 11, fontWeight: filter === f.key ? 600 : 400,
              padding: "7px 14px", borderRadius: 10, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "36px 1fr 90px 90px 32px",
        gap: 8, padding: "0 14px 8px 12px",
      }}>
        <div />
        <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 8, letterSpacing: 1.5 }}>CATEGORY</div>
        <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 8, letterSpacing: 1.5, textAlign: "right" }}>BUY</div>
        <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 8, letterSpacing: 1.5, textAlign: "right" }}>PROFIT</div>
        <div />
      </div>

      {/* Category list */}
      <div style={{ display: "grid", gap: 8 }}>
        {filtered.map(cat => (
          <CategoryRow
            key={cat.id}
            cat={cat}
            liquid={liquid}
            expanded={expandedId === cat.id}
            onToggle={() => setExpandedId(expandedId === cat.id ? null : cat.id)}
            onStartFlip={onStartFlip}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
          No categories match this filter
        </div>
      )}
    </div>
  );
}
