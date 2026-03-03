import { useState } from "react";
import { gemini } from "./gemini.js";
import Modal from "./Modal.jsx";
import Input from "./Input.jsx";
import Btn from "./Btn.jsx";

// ── Lane metadata ─────────────────────────────────────────────────────────────
const LANE_META = {
  FLIP:    { label: "Item Flip",   color: "#ff8c00", icon: "💰" },
  TICKETS: { label: "Tickets",     color: "#a78bfa", icon: "🎟️" },
  TRUCK:   { label: "Truck",       color: "#38bdf8", icon: "🚛" },
  ARB:     { label: "Retail Arb",  color: "#ffd700", icon: "📦" },
  SERVICE: { label: "Service",     color: "#00ff88", icon: "💡" },
};

const RISK_COLOR = {
  "LOW":      "#00ff88",
  "LOW-MED":  "#34d399",
  "MED":      "#ffd700",
  "MED-HIGH": "#ff8c00",
  "HIGH":     "#ff3b3b",
};

// ── Opportunity Library ───────────────────────────────────────────────────────
const OPP_LIBRARY = [
  // ITEM FLIPS ─────────────────────────────────────────────────────────────────
  {
    id: "shoes-snkrs", lane: "FLIP",
    title: "Nike / Jordan SNKRS Drop",
    detail: "Tax refund season = peak sneaker buying. Limited Jordans cop at retail and flip 80-180% within a week on GOAT/StockX. Raffles are free to enter.",
    action: "Check SNKRS app for upcoming drops. Enter every raffle — costs nothing. Also hit local Nike outlets. List same day on GOAT at market price.",
    minCapital: 150, maxCapital: 350,
    roiRange: [80, 180], risk: "MED-HIGH", timeframe: "3–10 days", effort: 1,
    platforms: ["SNKRS", "GOAT", "StockX", "eBay"],
    urgency: "hot-now", truckRequired: false,
  },
  {
    id: "gpu-flip", lane: "FLIP",
    title: "RTX 5080 GPU Flip",
    detail: "MSRP $999, still selling $1,400–1,650 on eBay. Newegg/Best Buy restock multiple times weekly. 40-65% ROI in under 48 hours if you're fast.",
    action: "Set NowInStock.net + Camel3x alerts for RTX 5080. Buy immediately on restock. List on eBay within 1 hour with 'fast shipping' in title. Sells same day.",
    minCapital: 900, maxCapital: 1700,
    roiRange: [40, 65], risk: "MED", timeframe: "1–3 days", effort: 2,
    platforms: ["Best Buy", "Newegg", "eBay"],
    urgency: "hot-now", truckRequired: false,
  },
  {
    id: "lego-arb", lane: "FLIP",
    title: "LEGO Retiring Set Arb",
    detail: "LEGO Star Wars sets retiring soon appreciate 40-80% within 90 days. Zero volatility, zero competition, just patience.",
    action: "Check Brickset.com 'Retiring Soon' list. Buy 2-3 units at Target clearance or Amazon. Store in closet. List in May on BrickLink and eBay.",
    minCapital: 80, maxCapital: 400,
    roiRange: [40, 80], risk: "LOW", timeframe: "60–120 days", effort: 1,
    platforms: ["Target clearance", "Amazon", "BrickLink", "eBay"],
    urgency: "seasonal", truckRequired: false,
  },
  {
    id: "ps5-bundle", lane: "FLIP",
    title: "PS5 Slim Bundle Flip",
    detail: "Target/Walmart PS5 bundles at $499-549 resell $620-700 on eBay. Bundle a cheap game to increase perceived value and margin.",
    action: "Buy PS5 bundle at Target. Add a used game ($40). List bundled on eBay: free shipping, 'Buy It Now'. 20-35% in 3-5 days.",
    minCapital: 500, maxCapital: 650,
    roiRange: [18, 35], risk: "LOW-MED", timeframe: "3–7 days", effort: 1,
    platforms: ["Target", "Walmart", "eBay"],
    urgency: "evergreen", truckRequired: false,
  },

  // TICKETS ────────────────────────────────────────────────────────────────────
  {
    id: "nba-playoffs", lane: "TICKETS",
    title: "NBA Playoffs Ticket Flip",
    detail: "Playoffs start April 19. Phoenix Suns home games: face $120-300 → resale $350-800 once matchups are confirmed. Buy NOW — price spikes 2-3x when bracket drops.",
    action: "Buy 2 Suns playoff tickets on Ticketmaster today. Hold. The moment bracket is announced, list on StubHub with auto-price at 2x face. Sell within 48hr.",
    minCapital: 250, maxCapital: 1200,
    roiRange: [80, 200], risk: "MED", timeframe: "4–8 weeks", effort: 1,
    platforms: ["Ticketmaster", "StubHub", "SeatGeek"],
    urgency: "hot-now", truckRequired: false,
  },
  {
    id: "ufc-ppv", lane: "TICKETS",
    title: "UFC / Boxing PPV Flip",
    detail: "UFC PPV cards April-June = stacked schedule. Floor seats $200-300 in → $600-900 out. Consistent 2-3x resale with zero effort between buy and sell.",
    action: "Check UFC.com fight schedule. Buy 2 floor seats day-of-sale. List on Vivid Seats with auto-pricing at 1.8x face. Sell 7-10 days pre-fight for max.",
    minCapital: 200, maxCapital: 800,
    roiRange: [100, 200], risk: "MED", timeframe: "2–6 weeks", effort: 1,
    platforms: ["Ticketmaster", "Vivid Seats", "StubHub"],
    urgency: "seasonal", truckRequired: false,
  },
  {
    id: "concert-flip", lane: "TICKETS",
    title: "Major Concert Ticket Flip",
    detail: "2026 touring cycle is massive — Beyoncé, Post Malone, Peso Pluma, Zach Bryan. 1.5-3x face on GA/floor. Presales are your edge.",
    action: "Sign up for Ticketmaster artist alerts. Use Citi/Chase card for presale access. Buy 4 tickets. List 2 at 1.8x immediately, hold 2 for night-of surge pricing.",
    minCapital: 400, maxCapital: 1200,
    roiRange: [70, 150], risk: "MED", timeframe: "1–6 weeks", effort: 2,
    platforms: ["Ticketmaster", "StubHub", "Vivid Seats"],
    urgency: "evergreen", truckRequired: false,
  },

  // TRUCK HUSTLES ──────────────────────────────────────────────────────────────
  {
    id: "dolly-goshare", lane: "TRUCK",
    title: "Dolly / GoShare Furniture Delivery",
    detail: "Furniture and appliance delivery, $55-90/hr with your truck. Weekend demand is high in Phoenix suburbs. No capital required — your truck earns while you have off days.",
    action: "Sign up at Dolly.com and GoShare.co today. Accept weekend jobs in Surprise/Peoria area. 3-4 jobs on a Saturday = $200-320 cash in hand.",
    minCapital: 0, maxCapital: 0,
    isService: true, hourlyRate: [45, 85],
    risk: "LOW", timeframe: "Same day", effort: 4,
    platforms: ["Dolly", "GoShare", "Lugg"],
    urgency: "evergreen", truckRequired: true,
  },
  {
    id: "large-item-flip", lane: "TRUCK",
    title: "Large Item Flip (Truck Moat)",
    detail: "Sectional couches, recliners, treadmills, riding mowers. Most flippers physically cannot move these. You can. Buy $0-100, sell $250-600. This is your exclusive lane.",
    action: "Search FB Marketplace 'free sofa', '$50 couch', 'free treadmill' every morning. Clean it up, take good photos, relist at 3-5x. Move 1-2 items per week.",
    minCapital: 0, maxCapital: 150,
    roiRange: [150, 500], risk: "LOW", timeframe: "1–7 days", effort: 3,
    platforms: ["Facebook Marketplace", "Craigslist", "OfferUp"],
    urgency: "evergreen", truckRequired: true,
  },
  {
    id: "junk-removal", lane: "TRUCK",
    title: "Junk Removal — Spring Peak",
    detail: "Spring cleaning season is HERE. 1-800-GOT-JUNK charges $300-600/truckload. You charge $100-150 and take their entire market. Keep anything valuable to re-flip.",
    action: "Post on Nextdoor NOW: 'Affordable junk removal — $100-150/truckload, licensed, Phoenix west valley.' Spring is the busiest 6 weeks. You will get calls today.",
    minCapital: 0, maxCapital: 0,
    isService: true, hourlyRate: [60, 120],
    risk: "LOW", timeframe: "Same day", effort: 3,
    platforms: ["Nextdoor", "Facebook Marketplace", "Craigslist"],
    urgency: "hot-now", truckRequired: true,
  },
  {
    id: "liquidation-pallet", lane: "TRUCK",
    title: "Amazon Return Pallet Flip",
    detail: "B-Stock Phoenix: pay $200-400/pallet, contains $800-2,000 retail. Requires truck to haul — most buyers can't do it, which reduces competition and prices.",
    action: "Register at bstock.com/amazon. Bid 'Customer Returns – Electronics/Misc' category. Phoenix warehouse pickup. Sell best items on eBay, bulk remainder on FB Marketplace.",
    minCapital: 200, maxCapital: 500,
    roiRange: [100, 300], risk: "MED-HIGH", timeframe: "1–3 weeks", effort: 5,
    platforms: ["B-Stock", "eBay", "Facebook Marketplace"],
    urgency: "evergreen", truckRequired: true,
  },
  {
    id: "scrap-metal", lane: "TRUCK",
    title: "Free Scrap Metal → Cash",
    detail: "$0 cost. FB/Craigslist free section + construction sites = full truckload → $80-200 at AZ scrap yard. Pure profit, zero risk.",
    action: "Search FB Marketplace 'free metal', 'free appliances', 'free AC unit' daily. Hit active construction sites and ask foreman. Sell at Arizona Metals — Glendale or Mesa.",
    minCapital: 0, maxCapital: 30,
    roiRange: [500, 2000], risk: "LOW", timeframe: "Half day", effort: 3,
    platforms: ["Facebook Marketplace Free", "Craigslist Free", "Arizona Metals"],
    urgency: "evergreen", truckRequired: true,
  },
  {
    id: "taskrabbit-truck", lane: "TRUCK",
    title: "TaskRabbit Hauling Premium",
    detail: "Top Phoenix Taskers with trucks earn $65-80/hr. Furniture assembly + hauling = most requested combo. Your truck puts you in the top-rate tier from day one.",
    action: "Sign up at taskrabbit.com. Select: Moving Help, Furniture Assembly, Hauling. Your truck = premium rate. Goal: 10 five-star reviews in first 3 weeks for algo boost.",
    minCapital: 0, maxCapital: 0,
    isService: true, hourlyRate: [55, 80],
    risk: "LOW", timeframe: "Per task", effort: 4,
    platforms: ["TaskRabbit"],
    urgency: "evergreen", truckRequired: true,
  },

  // RETAIL ARB ─────────────────────────────────────────────────────────────────
  {
    id: "tax-refund-electronics", lane: "ARB",
    title: "Tax Refund Electronics Buy-Up",
    detail: "March = peak electronics demand as refunds hit bank accounts. Buy AirPods, iPads, gaming gear at retail NOW — demand (and price) surges in 2-3 weeks.",
    action: "Buy 2-3 units: AirPods Pro 2, iPad 10th gen, DualSense controllers. List on eBay/FB in mid-March at 20-30% premium. Tax refund buyers are less price-sensitive.",
    minCapital: 300, maxCapital: 1500,
    roiRange: [20, 40], risk: "LOW-MED", timeframe: "2–4 weeks", effort: 2,
    platforms: ["Best Buy", "Target", "eBay", "Facebook Marketplace"],
    urgency: "hot-now", truckRequired: false,
  },
  {
    id: "clearance-fba", lane: "ARB",
    title: "Clearance → Amazon FBA",
    detail: "Target/Walmart clearance at 70-90% off. Scan with ScoutIQ to verify Amazon rank and margin instantly. Ship to FBA and let Amazon sell it for you.",
    action: "Download ScoutIQ ($15/mo). Hit Target clearance (red tags, back corners). Only buy rank <300k with 50%+ margin after fees. Box it, ship to FBA.",
    minCapital: 200, maxCapital: 1000,
    roiRange: [50, 200], risk: "MED", timeframe: "2–6 weeks", effort: 3,
    platforms: ["Target clearance", "Walmart clearance", "Amazon FBA"],
    urgency: "evergreen", truckRequired: false,
  },
  {
    id: "homedepot-haul", lane: "ARB",
    title: "Home Depot Haul-Away",
    detail: "People buy lumber, mulch, appliances at Home Depot but can't haul it. $40-60 per 30-min haul. Zero overhead — hang a sign or post on Nextdoor.",
    action: "Make a simple cardboard sign: 'Need it hauled? $40 cash – text [#]'. Place at Home Depot/Lowe's in Surprise. Or post on Nextdoor every Monday morning.",
    minCapital: 0, maxCapital: 10,
    roiRange: [0, 0],
    isService: true, hourlyRate: [40, 70],
    risk: "LOW", timeframe: "30–60 min", effort: 1,
    platforms: ["Nextdoor", "Craigslist", "Facebook Groups"],
    urgency: "evergreen", truckRequired: true,
  },

  // SERVICE / SKILL ────────────────────────────────────────────────────────────
  {
    id: "private-catering", lane: "SERVICE",
    title: "Private Event Server / Bartender",
    detail: "Private catering pays $25-45/hr cash. One 5-hr Saturday event = $125-225 vs ~$86 on a regular restaurant shift. Spring wedding season starts in 4 weeks.",
    action: "Post on Thumbtack and Bark.com TODAY: 'Professional server/bartender — private events, Phoenix AZ, 5-star rated.' Wedding + graduation season is about to spike.",
    minCapital: 0, maxCapital: 0,
    isService: true, hourlyRate: [25, 45],
    risk: "LOW", timeframe: "Per event", effort: 5,
    platforms: ["Thumbtack", "Bark.com", "GigSalad", "Facebook Groups"],
    urgency: "seasonal", truckRequired: false,
  },
];

// ── Scoring ───────────────────────────────────────────────────────────────────
function scoreOpp(opp, liquid, bankBalance, flips, hasTruck) {
  if (opp.truckRequired && !hasTruck) return -999;

  let score = 50;

  // Capital fit (0-40 pts) — most important
  if (opp.isService || opp.minCapital === 0) {
    score += 38;
  } else {
    const gap = opp.minCapital - liquid;
    if (gap <= 0 && liquid >= opp.maxCapital) score += 40;   // fully funded
    else if (gap <= 0)                         score += 28;   // min funded
    else                                       score -= Math.min(35, Math.round((gap / opp.minCapital) * 35));
  }

  // Urgency
  if (opp.urgency === "hot-now")  score += 25;
  if (opp.urgency === "seasonal") score += 12;

  // Lane affinity — boost categories they've already done successfully
  const soldFlips = flips.filter(f => f.status === "sold" && f.sold);
  const usedCats  = new Set(soldFlips.map(f => (f.category || "").toLowerCase()));
  if (opp.lane === "FLIP" && soldFlips.length > 0) score += 10;
  if (opp.id === "shoes-snkrs"  && usedCats.has("shoes"))       score += 12;
  if (opp.id === "gpu-flip"     && usedCats.has("electronics"))  score += 12;
  if (opp.id === "concert-flip" && usedCats.has("tickets"))      score += 12;

  // Truck exclusivity bonus
  if (opp.truckRequired && hasTruck) score += 15;

  // ROI / rate score
  if (!opp.isService) {
    const roi = opp.roiRange[0];
    if (roi >= 100) score += 15;
    else if (roi >= 50) score += 10;
    else if (roi >= 20) score += 5;
  } else {
    const rate = (opp.hourlyRate || [0])[0];
    if (rate >= 60) score += 15;
    else if (rate >= 40) score += 10;
    else score += 5;
  }

  // Risk penalty when capital is tight
  if (liquid < 600) {
    if (opp.risk === "HIGH")     score -= 15;
    if (opp.risk === "MED-HIGH") score -= 7;
  }

  return score;
}

// ── Playbook text formatter ───────────────────────────────────────────────────
function PlaybookText({ text }) {
  return (
    <div style={{ fontFamily: "monospace", fontSize: 12, lineHeight: 1.8 }}>
      {text.split("\n").map((line, i) => {
        if (/^MOVE \d/i.test(line))
          return <div key={i} style={{ color: "#ffd700", fontWeight: 700, fontSize: 14, marginTop: i > 0 ? 18 : 0 }}>{line}</div>;
        if (/^DO TODAY:/i.test(line))
          return <div key={i} style={{ color: "#00ff88", marginTop: 4 }}>{line}</div>;
        if (/^BUY:/i.test(line))
          return <div key={i} style={{ color: "#60a5fa", marginTop: 2 }}>{line}</div>;
        if (/^SELL:/i.test(line))
          return <div key={i} style={{ color: "#a78bfa", marginTop: 2 }}>{line}</div>;
        if (/^NET PROFIT:/i.test(line))
          return <div key={i} style={{ color: "#00ff88", fontWeight: 700, marginTop: 2 }}>{line}</div>;
        if (/^TIME:/i.test(line))
          return <div key={i} style={{ color: "#555", marginTop: 2 }}>{line}</div>;
        if (/^FIRST MOVE:/i.test(line))
          return <div key={i} style={{ color: "#ff8c00", fontWeight: 700, marginTop: 18, borderTop: "1px solid #1a1a1a", paddingTop: 14 }}>{line}</div>;
        if (line.trim() === "")
          return <div key={i} style={{ height: 4 }} />;
        return <div key={i} style={{ color: "#888" }}>{line}</div>;
      })}
    </div>
  );
}

// ── Opportunity Card ──────────────────────────────────────────────────────────
function OppCard({ opp, liquid, onExecute }) {
  const laneColor = LANE_META[opp.lane]?.color || "#555";
  const gap       = (!opp.isService && opp.minCapital > 0) ? Math.max(0, opp.minCapital - liquid) : 0;
  const isHot     = opp.score >= 80;

  return (
    <div style={{
      background: "#0d0d0d",
      border: `1px solid ${isHot ? laneColor + "55" : "#1a1a1a"}`,
      borderRadius: 10,
      padding: "16px 18px",
      opacity: gap > 500 ? 0.6 : 1,
    }}>
      {/* Badges */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ color: laneColor, fontSize: 9, border: `1px solid ${laneColor}44`, padding: "1px 7px", borderRadius: 3, fontFamily: "monospace", letterSpacing: 1 }}>
          {LANE_META[opp.lane]?.icon} {LANE_META[opp.lane]?.label?.toUpperCase()}
        </span>
        {opp.urgency === "hot-now" && (
          <span style={{ color: "#ff3b3b", fontSize: 9, border: "1px solid #ff3b3b55", padding: "1px 7px", borderRadius: 3, fontFamily: "monospace", letterSpacing: 1 }}>🔴 HOT NOW</span>
        )}
        {opp.urgency === "seasonal" && (
          <span style={{ color: "#ffd700", fontSize: 9, border: "1px solid #ffd70044", padding: "1px 7px", borderRadius: 3, fontFamily: "monospace" }}>⏳ SEASONAL</span>
        )}
        {opp.truckRequired && (
          <span style={{ color: "#38bdf8", fontSize: 9, border: "1px solid #38bdf844", padding: "1px 7px", borderRadius: 3, fontFamily: "monospace" }}>🚛 TRUCK</span>
        )}
      </div>

      {/* Title */}
      <div style={{ color: "#e8e8e8", fontWeight: 700, fontSize: 15, marginBottom: 7 }}>{opp.title}</div>

      {/* Detail */}
      <div style={{ color: "#777", fontSize: 12, lineHeight: 1.65, marginBottom: 12 }}>{opp.detail}</div>

      {/* Action box */}
      <div style={{ background: "#111", borderRadius: 6, padding: "10px 13px", marginBottom: 14, borderLeft: `3px solid ${laneColor}44` }}>
        <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, marginBottom: 5, fontFamily: "monospace" }}>ACTION</div>
        <div style={{ color: "#aaa", fontSize: 11, lineHeight: 1.7 }}>{opp.action}</div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 20, marginBottom: 12, flexWrap: "wrap" }}>
        {opp.isService ? (
          <div>
            <div style={{ color: "#444", fontSize: 9, fontFamily: "monospace", letterSpacing: 1 }}>EARNINGS</div>
            <div style={{ color: "#00ff88", fontSize: 15, fontWeight: 700, fontFamily: "monospace" }}>
              ${opp.hourlyRate[0]}–${opp.hourlyRate[1]}/hr
            </div>
          </div>
        ) : (
          <div>
            <div style={{ color: "#444", fontSize: 9, fontFamily: "monospace", letterSpacing: 1 }}>EXPECTED ROI</div>
            <div style={{ color: "#00ff88", fontSize: 15, fontWeight: 700, fontFamily: "monospace" }}>
              +{opp.roiRange[0]}–{opp.roiRange[1]}%
            </div>
          </div>
        )}
        {opp.minCapital > 0 && (
          <div>
            <div style={{ color: "#444", fontSize: 9, fontFamily: "monospace", letterSpacing: 1 }}>CAPITAL</div>
            <div style={{ color: gap > 0 ? "#ff3b3b" : "#e8e8e8", fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>
              ${opp.minCapital.toLocaleString()}{opp.maxCapital > opp.minCapital ? `–$${opp.maxCapital.toLocaleString()}` : ""}
            </div>
          </div>
        )}
        <div>
          <div style={{ color: "#444", fontSize: 9, fontFamily: "monospace", letterSpacing: 1 }}>TIME</div>
          <div style={{ color: "#e8e8e8", fontSize: 13, fontFamily: "monospace" }}>{opp.timeframe}</div>
        </div>
        <div>
          <div style={{ color: "#444", fontSize: 9, fontFamily: "monospace", letterSpacing: 1 }}>RISK</div>
          <div style={{ color: RISK_COLOR[opp.risk] || "#888", fontSize: 13, fontFamily: "monospace", fontWeight: 600 }}>{opp.risk}</div>
        </div>
      </div>

      {/* Platform chips */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
        {opp.platforms.map(p => (
          <span key={p} style={{ color: "#333", fontSize: 9, fontFamily: "monospace", border: "1px solid #222", padding: "2px 7px", borderRadius: 3 }}>{p}</span>
        ))}
      </div>

      {/* Execute / locked */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {gap > 0 ? (
          <span style={{ color: "#444", fontSize: 10, fontFamily: "monospace" }}>NEED ${gap.toLocaleString()} MORE</span>
        ) : (
          <span />
        )}
        <button
          onClick={() => onExecute(opp)}
          disabled={gap > 0}
          style={{
            background: gap > 0 ? "#0d0d0d" : `${laneColor}18`,
            border: `1px solid ${gap > 0 ? "#222" : laneColor}`,
            color: gap > 0 ? "#333" : laneColor,
            fontFamily: "monospace", fontSize: 11, letterSpacing: 1,
            padding: "8px 18px", borderRadius: 5,
            cursor: gap > 0 ? "default" : "pointer",
          }}
        >
          {gap > 0 ? "LOCKED" : "EXECUTE →"}
        </button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OpportunitiesTab({ data, save, onStartFlip }) {
  const [playbook,        setPlaybook]        = useState(data.cachedPlaybook || "");
  const [playbookTime,    setPlaybookTime]    = useState(data.playbookTime || null);
  const [playbookLoading, setPlaybookLoading] = useState(false);
  const [activeFilter,    setActiveFilter]    = useState("ALL");
  const [modal,           setModal]           = useState(null);
  const [form,            setForm]            = useState({});

  const liquid   = data.liquidCash || data.bankBalance || 0;
  const hasTruck = data.hasTruck !== false; // defaults true
  const flips    = data.flips || [];

  // Score every opportunity against current situation
  const allScored = OPP_LIBRARY.map(o => ({
    ...o,
    score: scoreOpp(o, liquid, data.bankBalance, flips, hasTruck),
  })).sort((a, b) => b.score - a.score);

  const displayed = (activeFilter === "ALL"
    ? allScored
    : allScored.filter(o => o.lane === activeFilter)
  ).filter(o => o.score > -50);

  // ── Build AI Playbook ─────────────────────────────────────────────────────
  const buildPlaybook = async () => {
    setPlaybookLoading(true);
    setPlaybook("");

    const soldFlips   = flips.filter(f => f.status === "sold" && f.sold);
    const flipSummary = soldFlips.length > 0
      ? `${soldFlips.length} flips sold, avg ROI ~${(soldFlips.reduce((a, f) => a + (f.sold - f.bought) / f.bought, 0) / soldFlips.length * 100).toFixed(0)}%, categories: ${[...new Set(soldFlips.map(f => f.category || "misc"))].join(", ")}`
      : "no flip history yet — new to this";

    const top3 = allScored.filter(o => o.score > 0).slice(0, 3)
      .map(o => `"${o.title}" (${o.lane}, ${o.isService ? `$${o.hourlyRate?.[0]}-${o.hourlyRate?.[1]}/hr` : `+${o.roiRange[0]}-${o.roiRange[1]}% ROI`})`).join(", ");

    const freeThisWeek  = (data.schedule || []).filter(s => !s.logged).length;
    const netWorthTrend = (() => {
      const h = data.netWorthHistory || [];
      if (h.length < 2) return "N/A";
      const delta = h[h.length - 1].value - h[0].value;
      return `${delta >= 0 ? "+" : ""}$${Math.abs(Math.round(delta))} over ${h.length} days`;
    })();

    try {
      const text = await gemini(
        "You are a street-smart, aggressive financial advisor for a Phoenix AZ server/flipper who has a pickup truck. Give ULTRA-SPECIFIC advice with real platform names, real current market prices, and exact actions to take TODAY. Zero generic advice. Numbers only. Direct and punchy.",
        `MY SITUATION RIGHT NOW:
• Liquid capital to deploy: $${liquid}
• Bank balance: $${data.bankBalance}
• Savings: $${data.savings || 0}
• Net worth trend: ${netWorthTrend}
• Flip history: ${flipSummary}
• Pickup truck: YES — Phoenix AZ, west valley
• Upcoming server shifts this week: ${Math.min(freeThisWeek, 4)}
• Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
• Season: Tax refund season (March), spring cleaning starting, NBA playoffs in ~6 weeks
• Top scored opportunities for my capital: ${top3}

Give me a NUMBERED 3-MOVE ACTION PLAN for THIS WEEK. Each move must have this EXACT format:

MOVE 1: [TITLE IN CAPS]
DO TODAY: [exact specific action to take right now — platform, search term, button to click]
BUY: [exact item + exact platform + exact dollar amount]
SELL: [exact platform + exact listing price or range]
NET PROFIT: $[X]–$[Y]
TIME: [hours of work]

MOVE 2: (same format)

MOVE 3: (same format)

FIRST MOVE: [one sentence — which of the 3 to start today and the specific dollar reason why given my exact numbers]`,
        1600
      );
      const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      setPlaybook(text || "Unable to generate playbook.");
      setPlaybookTime(time);
      save({ ...data, cachedPlaybook: text, playbookTime: time });
    } catch {
      setPlaybook("Failed to generate — check connection.");
    }
    setPlaybookLoading(false);
  };

  // ── Execute ───────────────────────────────────────────────────────────────
  const executeOpp = (opp) => {
    if (opp.isService) {
      setForm({ title: opp.title, lane: opp.lane });
      setModal("log-hustle");
    } else {
      onStartFlip({ title: opp.title, capital: opp.minCapital > 0 ? opp.minCapital : undefined });
    }
  };

  const saveHustle = () => {
    const { title, lane, earned, hours } = form;
    if (!earned) return;
    const entry = {
      id: Date.now(),
      title,
      lane,
      earned: +earned,
      hours:  hours ? +hours : null,
      date:   new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
    save({ ...data, oppHistory: [...(data.oppHistory || []), entry] });
    setModal(null);
    setForm({});
  };

  const deleteHistory = (id) => save({ ...data, oppHistory: (data.oppHistory || []).filter(o => o.id !== id) });

  const oppHistory    = data.oppHistory || [];
  const totalHustled  = oppHistory.reduce((a, o) => a + (o.earned || 0), 0);

  const FILTER_TABS = ["ALL", "FLIP", "TICKETS", "TRUCK", "ARB", "SERVICE"];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ color: "#ffd700", fontSize: 11, letterSpacing: 2 }}>OPPORTUNITY ENGINE</div>
          <div style={{ color: "#555", fontSize: 12, fontFamily: "monospace", marginTop: 4 }}>
            <span style={{ color: "#00ff88", fontWeight: 700 }}>${liquid.toLocaleString()}</span> liquid ·{" "}
            <button
              onClick={() => save({ ...data, hasTruck: !hasTruck })}
              style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "monospace", fontSize: 12, color: hasTruck ? "#38bdf8" : "#444", padding: 0 }}
            >
              🚛 Truck {hasTruck ? "ON" : "OFF"}
            </button>
            {" "}· {allScored.filter(o => o.score > 0).length} active opps
          </div>
        </div>
        <button
          onClick={buildPlaybook}
          disabled={playbookLoading}
          style={{
            background: playbookLoading ? "#111" : "linear-gradient(135deg, #ffd70022, #ff8c0022)",
            border: "1px solid #ffd70066",
            color: playbookLoading ? "#555" : "#ffd700",
            fontFamily: "monospace", fontSize: 11, letterSpacing: 2,
            padding: "10px 20px", borderRadius: 6, cursor: playbookLoading ? "default" : "pointer",
          }}
        >
          {playbookLoading ? "⚡ THINKING..." : "⚡ BUILD MY WEEK"}
        </button>
      </div>

      {/* AI Playbook */}
      {(playbook || playbookLoading) && (
        <div style={{ background: "#080808", border: "1px solid #ffd70033", borderRadius: 10, padding: 20, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: "#ffd700", fontSize: 10, letterSpacing: 2, fontFamily: "monospace" }}>⚡ AI WEEKLY PLAYBOOK</div>
            {playbookTime && <div style={{ color: "#333", fontSize: 9, fontFamily: "monospace" }}>generated {playbookTime}</div>}
          </div>
          {playbookLoading
            ? <div style={{ color: "#555", fontFamily: "monospace", fontSize: 12 }}>Analyzing your situation and building your personalized plan...</div>
            : <PlaybookText text={playbook} />
          }
        </div>
      )}

      {/* Lane filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, overflowX: "auto", paddingBottom: 4 }}>
        {FILTER_TABS.map(f => {
          const color  = f === "ALL" ? "#ffd700" : (LANE_META[f]?.color || "#555");
          const active = activeFilter === f;
          const count  = f === "ALL" ? displayed.length : allScored.filter(o => o.lane === f && o.score > -50).length;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: active ? `${color}18` : "none",
                border: `1px solid ${active ? color : "#1a1a1a"}`,
                color: active ? color : "#444",
                fontFamily: "monospace", fontSize: 10, letterSpacing: 1,
                padding: "5px 12px", borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              {f === "ALL" ? "ALL" : `${LANE_META[f]?.icon} ${f}`} ({count})
            </button>
          );
        })}
      </div>

      {/* Opportunity cards */}
      <div style={{ display: "grid", gap: 14 }}>
        {displayed.map(opp => (
          <OppCard key={opp.id} opp={opp} liquid={liquid} onExecute={executeOpp} />
        ))}
      </div>

      {/* Opportunity History */}
      {oppHistory.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ color: "#555", fontSize: 9, letterSpacing: 2, fontFamily: "monospace" }}>OPP HISTORY</div>
            <div style={{ color: "#00ff88", fontSize: 13, fontFamily: "monospace", fontWeight: 700 }}>
              ${totalHustled.toLocaleString()} earned total
            </div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {[...oppHistory].reverse().map(o => {
              const color = LANE_META[o.lane]?.color || "#555";
              return (
                <div key={o.id} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 8, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                      <span style={{ color, fontSize: 9, fontFamily: "monospace", border: `1px solid ${color}44`, padding: "1px 6px", borderRadius: 3 }}>{o.lane}</span>
                      <div style={{ color: "#e8e8e8", fontSize: 13 }}>{o.title}</div>
                    </div>
                    <div style={{ color: "#444", fontSize: 10, fontFamily: "monospace" }}>
                      {o.date}{o.hours ? ` · ${o.hours}hr` : ""}
                      {o.hours ? <span style={{ color: "#555" }}> · ${(o.earned / o.hours).toFixed(0)}/hr eff.</span> : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ color: "#00ff88", fontFamily: "monospace", fontSize: 16, fontWeight: 700 }}>+${o.earned}</div>
                    <button onClick={() => deleteHistory(o.id)} style={{ background: "none", border: "1px solid #ff3b3b44", color: "#ff3b3b", fontSize: 11, fontFamily: "monospace", padding: "3px 7px", borderRadius: 4, cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Log hustle modal */}
      {modal === "log-hustle" && (
        <Modal title={`LOG: ${form.title}`} onClose={() => { setModal(null); setForm({}); }}>
          <div style={{ color: "#555", fontSize: 11, fontFamily: "monospace", marginBottom: 14 }}>
            Record what you actually made so your history tracks your real results.
          </div>
          <Input label="Amount Earned ($)" type="number" value={form.earned || ""} onChange={v => setForm({ ...form, earned: v })} placeholder="180" />
          <Input label="Hours Worked (optional)" type="number" value={form.hours || ""} onChange={v => setForm({ ...form, hours: v })} placeholder="3" />
          <Btn onClick={saveHustle} color="#00ff88" style={{ width: "100%", marginTop: 8 }}>LOG HUSTLE</Btn>
        </Modal>
      )}
    </div>
  );
}
