import { useState } from "react";
import { gemini } from "./gemini.js";
import Modal from "./Modal.jsx";
import Input from "./Input.jsx";
import Btn from "./Btn.jsx";

// ── Lane metadata ─────────────────────────────────────────────────────────────
const LANE_META = {
  FBMKT:   { label: "Marketplace", color: "#00e676", icon: "📱" },
  FLIP:    { label: "Flip",        color: "#00e676", icon: "💰" },
  TICKETS: { label: "Tickets",     color: "#00e676", icon: "🎟️" },
  TRUCK:   { label: "Truck",       color: "#60a5fa", icon: "🚛" },
  ARB:     { label: "Retail Arb",  color: "#00e676", icon: "📦" },
  SERVICE: { label: "Service",     color: "#60a5fa", icon: "💡" },
  STOCKS:  { label: "Stocks",      color: "#60a5fa", icon: "📈" },
};

// ── Opportunity Library (unchanged data) ─────────────────────────────────────
const OPP_LIBRARY = [
  {
    id: "shoes-snkrs", lane: "FLIP",
    title: "Nike / Jordan SNKRS Drop",
    detail: "Tax refund season = peak sneaker buying. Limited Jordans cop at retail and flip 80-180% within a week on GOAT/StockX. Raffles are free to enter.",
    action: "Check SNKRS app for upcoming drops. Enter every raffle — costs nothing. Also hit local Nike outlets. List same day on GOAT at market price.",
    minCapital: 150, maxCapital: 350,
    roiRange: [80, 180], risk: "MED-HIGH", timeframe: "3–10 days", effort: 1,
    links: [
      { label: "SNKRS Upcoming Drops", url: "https://www.nike.com/launch" },
      { label: "GOAT", url: "https://www.goat.com" },
      { label: "StockX — Sell", url: "https://stockx.com/sell" },
    ],
    urgency: "hot-now", truckRequired: false,
    tags: ["PEAK SEASON", "FAST TURN"],
  },
  {
    id: "gpu-flip", lane: "FLIP",
    title: "GPU / Console Resell",
    detail: "High-demand GPUs and consoles frequently sell above MSRP when supply is tight.",
    action: "Check eBay sold listings to confirm margin. Set NowInStock alerts. Buy on restock, list within 1 hour.",
    minCapital: 300, maxCapital: 1700,
    roiRange: [20, 60], risk: "MED", timeframe: "1–5 days", effort: 2,
    links: [
      { label: "eBay GPU Sold Prices", url: "https://www.ebay.com/sch/i.html?_nkw=nvidia+rtx+gpu&LH_Complete=1&LH_Sold=1&_sop=16" },
      { label: "NowInStock Alerts", url: "https://www.nowinstock.net/computers/videocards/" },
    ],
    urgency: "seasonal", truckRequired: false,
    tags: ["HIGH DEMAND"],
  },
  {
    id: "lego-arb", lane: "FLIP",
    title: "LEGO Retiring Set Arb",
    detail: "LEGO Star Wars sets retiring soon appreciate 40-80% within 90 days. Zero volatility.",
    action: "Check Brickset.com 'Retiring Soon' list. Buy 2-3 units at Target clearance. Store. List in May.",
    minCapital: 80, maxCapital: 400,
    roiRange: [40, 80], risk: "LOW", timeframe: "60–120 days", effort: 1,
    links: [
      { label: "Brickset Retiring Soon", url: "https://www.brickset.com/sets/retiring-soon" },
      { label: "BrickLink", url: "https://www.bricklink.com" },
    ],
    urgency: "seasonal", truckRequired: false,
    tags: ["LOW RISK", "PATIENCE PLAY"],
  },
  {
    id: "ps5-bundle", lane: "FLIP",
    title: "PS5 Slim Bundle Flip",
    detail: "Target/Walmart PS5 bundles at $499-549 resell $620-700 on eBay.",
    action: "Buy PS5 bundle at Target. Add a used game ($40). List bundled on eBay.",
    minCapital: 500, maxCapital: 650,
    roiRange: [18, 35], risk: "LOW-MED", timeframe: "3–7 days", effort: 1,
    links: [
      { label: "Target PS5 Bundles", url: "https://www.target.com/s?searchTerm=ps5+bundle" },
      { label: "eBay PS5 Sold", url: "https://www.ebay.com/sch/i.html?_nkw=ps5+slim+bundle&LH_Complete=1&LH_Sold=1" },
    ],
    urgency: "evergreen", truckRequired: false,
    tags: ["EASY FLIP"],
  },
  {
    id: "nba-playoffs", lane: "TICKETS",
    title: "NBA Playoffs Tickets",
    detail: "Face $120-300 resale $350-800 once bracket is set.",
    action: "Check NBA standings. Buy for clinched teams. List at 2x face when matchup announced.",
    minCapital: 250, maxCapital: 1200,
    roiRange: [80, 200], risk: "MED", timeframe: "4–8 weeks", effort: 1,
    links: [
      { label: "NBA Standings", url: "https://www.nba.com/standings" },
      { label: "Ticketmaster NBA", url: "https://www.ticketmaster.com/search?q=nba+playoffs" },
      { label: "StubHub Sell", url: "https://www.stubhub.com/sell" },
    ],
    urgency: "hot-now", truckRequired: false,
    tags: ["PEAK SEASON", "HIGH DEMAND"],
  },
  {
    id: "ufc-ppv", lane: "TICKETS",
    title: "UFC / Boxing PPV Flip",
    detail: "Floor seats $200-300 in, $600-900 out. Consistent 2-3x resale.",
    action: "Buy 2 floor seats day-of-sale. List on Vivid Seats. Sell 7-10 days pre-fight.",
    minCapital: 200, maxCapital: 800,
    roiRange: [100, 200], risk: "MED", timeframe: "2–6 weeks", effort: 1,
    links: [
      { label: "UFC Events", url: "https://www.ufc.com/events" },
      { label: "Ticketmaster UFC", url: "https://www.ticketmaster.com/search?q=ufc" },
    ],
    urgency: "seasonal", truckRequired: false,
    tags: ["FAST TURN"],
  },
  {
    id: "concert-flip", lane: "TICKETS",
    title: "Concert Presale Flip",
    detail: "Major acts consistently resell 1.5-3x face. Presale access is the edge.",
    action: "Check Ticketmaster presales. Use Citi/Chase card for presale code. Buy 4 GA/floor.",
    minCapital: 300, maxCapital: 1200,
    roiRange: [50, 150], risk: "MED", timeframe: "1–6 weeks", effort: 2,
    links: [
      { label: "Ticketmaster Presales", url: "https://www.ticketmaster.com/discover/concerts" },
      { label: "StubHub Sell", url: "https://www.stubhub.com/sell" },
    ],
    urgency: "evergreen", truckRequired: false,
    tags: ["REPEATABLE"],
  },
  {
    id: "dolly-goshare", lane: "TRUCK",
    title: "Dolly / GoShare Delivery",
    detail: "Furniture delivery, $55-90/hr with your truck. Weekend demand is high.",
    action: "Sign up at Dolly.com and GoShare.co. Accept weekend jobs. 3-4 jobs Saturday = $200-320.",
    minCapital: 0, maxCapital: 0,
    isService: true, hourlyRate: [45, 85],
    risk: "LOW", timeframe: "Same day", effort: 4,
    links: [
      { label: "Dolly", url: "https://www.dolly.com" },
      { label: "GoShare", url: "https://www.goshare.co" },
    ],
    urgency: "evergreen", truckRequired: true,
    tags: ["NO CAPITAL", "SAME DAY PAY"],
  },
  {
    id: "large-item-flip", lane: "TRUCK",
    title: "Large Item Flip (Truck Moat)",
    detail: "Sectional couches, recliners, treadmills. Most flippers can't move these. You can.",
    action: "Search FB Marketplace 'free sofa'. Clean it, relist at 3-5x. Move 1-2 items/week.",
    minCapital: 0, maxCapital: 150,
    roiRange: [150, 500], risk: "LOW", timeframe: "1–7 days", effort: 3,
    links: [
      { label: "FB Free Stuff", url: "https://www.facebook.com/marketplace/search/?query=free%20stuff&exact=false" },
      { label: "OfferUp", url: "https://offerup.com" },
    ],
    urgency: "evergreen", truckRequired: true,
    tags: ["TRUCK MOAT", "LOW RISK"],
  },
  {
    id: "junk-removal", lane: "TRUCK",
    title: "Junk Removal — Spring Peak",
    detail: "Charge $100-150/truckload vs $300-600 for 1-800-GOT-JUNK. Keep anything valuable.",
    action: "Post on Nextdoor NOW: 'Affordable junk removal — $100-150/truckload, Phoenix west valley.'",
    minCapital: 0, maxCapital: 0,
    isService: true, hourlyRate: [60, 120],
    risk: "LOW", timeframe: "Same day", effort: 3,
    links: [
      { label: "Post on Nextdoor", url: "https://nextdoor.com" },
    ],
    urgency: "hot-now", truckRequired: true,
    tags: ["PEAK SEASON", "NO CAPITAL", "SAME DAY PAY"],
  },
  {
    id: "liquidation-pallet", lane: "TRUCK",
    title: "Amazon Return Pallet",
    detail: "Pay $200-400/pallet, contains $800-2,000 retail. Truck required = less competition.",
    action: "Register at bstock.com/amazon. Bid Customer Returns. Phoenix warehouse pickup.",
    minCapital: 200, maxCapital: 500,
    roiRange: [100, 300], risk: "MED-HIGH", timeframe: "1–3 weeks", effort: 5,
    links: [
      { label: "B-Stock Amazon", url: "https://bstock.com/amazon/" },
      { label: "eBay Sell", url: "https://www.ebay.com/sl/sell" },
    ],
    urgency: "evergreen", truckRequired: true,
    tags: ["TRUCK MOAT", "HIGH UPSIDE"],
  },
  {
    id: "scrap-metal", lane: "TRUCK",
    title: "Free Scrap Metal → Cash",
    detail: "$0 cost. FB free section + construction sites = $80-200 at scrap yard. Pure profit.",
    action: "Search FB 'free metal', 'free appliances' daily. Hit construction sites. Sell at Arizona Metals.",
    minCapital: 0, maxCapital: 30,
    roiRange: [500, 2000], risk: "LOW", timeframe: "Half day", effort: 3,
    links: [
      { label: "FB Free Metal", url: "https://www.facebook.com/marketplace/search/?query=free%20metal%20scrap" },
      { label: "Craigslist Free", url: "https://phoenix.craigslist.org/search/zip" },
    ],
    urgency: "evergreen", truckRequired: true,
    tags: ["NO CAPITAL", "TRUCK MOAT"],
  },
  {
    id: "taskrabbit-truck", lane: "TRUCK",
    title: "TaskRabbit Hauling Premium",
    detail: "Top Phoenix Taskers with trucks earn $65-80/hr. Your truck = top-rate tier from day one.",
    action: "Sign up at taskrabbit.com. Select: Moving Help, Furniture Assembly, Hauling.",
    minCapital: 0, maxCapital: 0,
    isService: true, hourlyRate: [55, 80],
    risk: "LOW", timeframe: "Per task", effort: 4,
    links: [
      { label: "TaskRabbit Signup", url: "https://www.taskrabbit.com/become-a-tasker" },
    ],
    urgency: "evergreen", truckRequired: true,
    tags: ["NO CAPITAL", "SAME DAY PAY"],
  },
  {
    id: "tax-refund-electronics", lane: "ARB",
    title: "Tax Refund Electronics",
    detail: "March = peak electronics demand. Buy AirPods, iPads at retail NOW — price surges in 2-3 weeks.",
    action: "Buy 2-3 units: AirPods Pro 2, iPad 10th gen. List on eBay mid-March at 20-30% premium.",
    minCapital: 300, maxCapital: 1500,
    roiRange: [20, 40], risk: "LOW-MED", timeframe: "2–4 weeks", effort: 2,
    links: [
      { label: "Best Buy", url: "https://www.bestbuy.com" },
      { label: "eBay Sold Comps", url: "https://www.ebay.com/sch/i.html?_nkw=airpods+pro&LH_Complete=1&LH_Sold=1" },
    ],
    urgency: "hot-now", truckRequired: false,
    tags: ["PEAK SEASON"],
  },
  {
    id: "clearance-fba", lane: "ARB",
    title: "Clearance → Amazon FBA",
    detail: "Target/Walmart clearance at 70-90% off. Scan with ScoutIQ. Ship to FBA.",
    action: "Download ScoutIQ ($15/mo). Hit Target clearance. Only buy rank <300k with 50%+ margin.",
    minCapital: 200, maxCapital: 1000,
    roiRange: [50, 200], risk: "MED", timeframe: "2–6 weeks", effort: 3,
    links: [
      { label: "ScoutIQ", url: "https://scoutiq.co" },
      { label: "Amazon Seller Central", url: "https://sell.amazon.com" },
    ],
    urgency: "evergreen", truckRequired: false,
    tags: ["REPEATABLE"],
  },
  {
    id: "homedepot-haul", lane: "ARB",
    title: "Home Depot Haul-Away",
    detail: "People can't haul lumber/appliances. $40-60 per 30-min haul. Zero overhead.",
    action: "Make a cardboard sign: 'Need it hauled? $40 cash – text [#]'. Place at Home Depot.",
    minCapital: 0, maxCapital: 10,
    roiRange: [0, 0],
    isService: true, hourlyRate: [40, 70],
    risk: "LOW", timeframe: "30–60 min", effort: 1,
    links: [
      { label: "Post on Nextdoor", url: "https://nextdoor.com" },
    ],
    urgency: "evergreen", truckRequired: true,
    tags: ["NO CAPITAL", "SAME DAY PAY"],
  },
  // FB MARKETPLACE
  {
    id: "fb-exercise", lane: "FBMKT", icon: "💪",
    title: "Exercise Equipment",
    searchTerms: ["free treadmill", "peloton", "exercise bike", "bowflex", "nordictrack"],
    minCapital: 0, maxCapital: 200, buyRange: [0, 200], sellRange: [200, 1200], roiRange: [150, 500],
    daysToSell: "3–7", risk: "LOW", truckRequired: true, urgency: "hot-now",
    tags: ["PEAK SEASON", "TRUCK MOAT"],
    hotItems: [
      { model: "Peloton Bike+", buy: "$400–$600", sell: "$900–$1,200" },
      { model: "NordicTrack 1750", buy: "$200–$350", sell: "$600–$900" },
      { model: "Bowflex Velocore", buy: "$100–$200", sell: "$400–$600" },
    ],
  },
  {
    id: "fb-power-tools", lane: "FBMKT", icon: "🔧",
    title: "Power Tool Lots",
    searchTerms: ["dewalt lot", "milwaukee tools", "tool bundle", "circular saw"],
    minCapital: 50, maxCapital: 200, buyRange: [50, 200], sellRange: [150, 600], roiRange: [100, 300],
    daysToSell: "2–5", risk: "LOW", truckRequired: false, urgency: "evergreen",
    tags: ["FAST TURN", "HIGH DEMAND"],
    hotItems: [
      { model: "DeWalt 20V Combo Kit", buy: "$80–$150", sell: "$280–$380" },
      { model: "Milwaukee M18 FUEL Kit", buy: "$100–$200", sell: "$350–$500" },
      { model: "Makita Impact Driver Kit", buy: "$60–$100", sell: "$180–$250" },
    ],
  },
  {
    id: "fb-riding-mowers", lane: "FBMKT", icon: "🌿",
    title: "Riding Mowers",
    searchTerms: ["riding mower", "zero turn mower", "john deere", "husqvarna mower"],
    minCapital: 100, maxCapital: 400, buyRange: [100, 400], sellRange: [400, 1200], roiRange: [100, 300],
    daysToSell: "5–10", risk: "LOW", truckRequired: true, urgency: "hot-now",
    tags: ["PEAK SEASON", "TRUCK MOAT"],
    hotItems: [
      { model: "John Deere E110", buy: "$300–$500", sell: "$700–$1,000" },
      { model: "Husqvarna YTH18542", buy: "$200–$400", sell: "$600–$900" },
      { model: "Cub Cadet XT1 LT42", buy: "$250–$450", sell: "$700–$950" },
    ],
  },
  {
    id: "fb-large-tvs", lane: "FBMKT", icon: "📺",
    title: "Large TVs (55\"+)",
    searchTerms: ["55 inch tv", "65 inch tv", "samsung 4k tv", "lg oled"],
    minCapital: 30, maxCapital: 200, buyRange: [30, 200], sellRange: [150, 600], roiRange: [100, 300],
    daysToSell: "2–5", risk: "LOW-MED", truckRequired: false, urgency: "evergreen",
    tags: ["FAST TURN"],
    hotItems: [
      { model: "LG C2/C3 65\" OLED", buy: "$400–$700", sell: "$900–$1,200" },
      { model: "Samsung QN90B 65\"", buy: "$300–$500", sell: "$700–$1,000" },
    ],
  },
  {
    id: "fb-patio", lane: "FBMKT", icon: "☀️",
    title: "Patio / Outdoor Furniture",
    searchTerms: ["patio furniture", "outdoor sectional", "traeger grill", "big green egg"],
    minCapital: 50, maxCapital: 400, buyRange: [50, 400], sellRange: [200, 1200], roiRange: [100, 400],
    daysToSell: "4–10", risk: "LOW", truckRequired: true, urgency: "hot-now",
    tags: ["PEAK SEASON", "TRUCK MOAT", "HIGH DEMAND"],
    hotItems: [
      { model: "Traeger Pro 575", buy: "$200–$350", sell: "$500–$750" },
      { model: "Big Green Egg (Large)", buy: "$400–$600", sell: "$800–$1,200" },
      { model: "POLYWOOD Sectional", buy: "$100–$250", sell: "$400–$700" },
    ],
  },
  {
    id: "fb-appliances", lane: "FBMKT", icon: "🏠",
    title: "Washer / Dryer / Fridge",
    searchTerms: ["washer dryer set", "refrigerator", "lg washer", "samsung fridge"],
    minCapital: 50, maxCapital: 300, buyRange: [50, 300], sellRange: [200, 700], roiRange: [100, 300],
    daysToSell: "1–4", risk: "LOW", truckRequired: true, urgency: "evergreen",
    tags: ["TRUCK MOAT", "FAST TURN"],
    hotItems: [
      { model: "LG Front-Load Washer", buy: "$100–$200", sell: "$350–$500" },
      { model: "Samsung French Door Fridge", buy: "$200–$400", sell: "$600–$900" },
    ],
  },
  {
    id: "fb-baby-gear", lane: "FBMKT", icon: "🍼",
    title: "Premium Baby Gear",
    searchTerms: ["uppababy vista", "nuna pipa", "4moms mamaroo", "baby gear lot"],
    minCapital: 20, maxCapital: 200, buyRange: [20, 200], sellRange: [80, 550], roiRange: [100, 300],
    daysToSell: "2–5", risk: "LOW", truckRequired: false, urgency: "evergreen",
    tags: ["FAST TURN", "NO TRUCK NEEDED"],
    hotItems: [
      { model: "UPPAbaby Vista V2", buy: "$120–$200", sell: "$380–$550" },
      { model: "Nuna PIPA Lite", buy: "$100–$160", sell: "$250–$360" },
    ],
  },
  {
    id: "fb-gaming", lane: "FBMKT", icon: "🎮",
    title: "Gaming Setups / Consoles",
    searchTerms: ["gaming pc", "ps5 bundle", "xbox series x", "gaming setup"],
    minCapital: 100, maxCapital: 500, buyRange: [100, 500], sellRange: [200, 1200], roiRange: [75, 200],
    daysToSell: "2–7", risk: "LOW-MED", truckRequired: false, urgency: "evergreen",
    tags: ["HIGH DEMAND"],
    hotItems: [
      { model: "RTX 3080 Gaming PC", buy: "$500–$700", sell: "$900–$1,200" },
      { model: "Meta Quest 3 128GB", buy: "$200–$280", sell: "$380–$470" },
    ],
  },
  // STOCKS
  {
    id: "stocks-covered-calls", lane: "STOCKS",
    title: "Covered Call Income",
    detail: "Sell covered calls on your holdings. 1-3% monthly premium = 12-36% annualized.",
    action: "For every 100 shares, sell 1 call 1-2 strikes OTM, 30-45 days out. Collect premium.",
    minCapital: 0, maxCapital: 0,
    roiRange: [12, 36], risk: "LOW", timeframe: "Monthly",
    links: [
      { label: "Options Calculator", url: "https://www.optionsprofitcalculator.com" },
    ],
    urgency: "evergreen", truckRequired: false,
    tags: ["PASSIVE INCOME"],
  },
  {
    id: "stocks-swing-trade", lane: "STOCKS",
    title: "Momentum Swing Trade",
    detail: "3-7 day swing trade on breakout stocks. Target 15-25% gain. Cut losses at -10%.",
    action: "Run Finviz screener. Filter: price $5-50, volume >500k. Buy at breakout. Set stop-loss.",
    minCapital: 200, maxCapital: 500,
    roiRange: [15, 40], risk: "MED-HIGH", timeframe: "3–7 days",
    links: [
      { label: "Finviz Screener", url: "https://finviz.com/screener.ashx?v=111&f=sh_avgvol_o500,sh_price_u50,ta_change_u3" },
      { label: "Unusual Whales", url: "https://unusualwhales.com" },
    ],
    urgency: "evergreen", truckRequired: false,
    tags: ["HIGH RISK"],
  },
  {
    id: "stocks-gdxy-dividend", lane: "STOCKS",
    title: "GDXY Monthly Dividend",
    detail: "GDXY pays monthly dividends. Current yield 35-50%+ annually. Buy before ex-dividend.",
    action: "Check GDXY ex-dividend date. Buy 2 days before. Collect monthly.",
    minCapital: 50, maxCapital: 500,
    roiRange: [30, 50], risk: "MED", timeframe: "Monthly",
    links: [
      { label: "GDXY Dividend History", url: "https://finance.yahoo.com/quote/GDXY/history/?filter=div" },
    ],
    urgency: "seasonal", truckRequired: false,
    tags: ["PASSIVE INCOME"],
  },
  // SERVICE
  {
    id: "private-catering", lane: "SERVICE",
    title: "Private Event Server",
    detail: "Private catering pays $25-45/hr cash. One 5-hr Saturday event = $125-225.",
    action: "Post on Thumbtack and Bark.com TODAY. Wedding + graduation season is about to spike.",
    minCapital: 0, maxCapital: 0,
    isService: true, hourlyRate: [25, 45],
    risk: "LOW", timeframe: "Per event", effort: 5,
    links: [
      { label: "Thumbtack", url: "https://www.thumbtack.com/pro/" },
      { label: "Bark.com", url: "https://www.bark.com" },
    ],
    urgency: "seasonal", truckRequired: false,
    tags: ["NO CAPITAL", "PEAK SEASON"],
  },
];

// ── Scoring (unchanged logic) ────────────────────────────────────────────────
function scoreOpp(opp, liquid, bankBalance, flips, hasTruck) {
  if (opp.truckRequired && !hasTruck) return -999;
  let score = 50;
  if (opp.isService || opp.minCapital === 0) { score += 38; }
  else {
    const gap = opp.minCapital - liquid;
    if (gap <= 0 && liquid >= opp.maxCapital) score += 40;
    else if (gap <= 0) score += 28;
    else score -= Math.min(35, Math.round((gap / opp.minCapital) * 35));
  }
  if (opp.urgency === "hot-now") score += 25;
  if (opp.urgency === "seasonal") score += 12;
  const soldFlips = flips.filter(f => f.status === "sold" && f.sold);
  const usedCats = new Set(soldFlips.map(f => (f.category || "").toLowerCase()));
  if (opp.lane === "FLIP" && soldFlips.length > 0) score += 10;
  if (opp.id === "shoes-snkrs" && usedCats.has("shoes")) score += 12;
  if (opp.id === "gpu-flip" && usedCats.has("electronics")) score += 12;
  if (opp.truckRequired && hasTruck) score += 15;
  if (!opp.isService) {
    const roi = (opp.roiRange || [0, 0])[0];
    if (roi >= 100) score += 15;
    else if (roi >= 50) score += 10;
    else if (roi >= 20) score += 5;
  } else {
    const rate = (opp.hourlyRate || [0])[0];
    if (rate >= 60) score += 15;
    else if (rate >= 40) score += 10;
    else score += 5;
  }
  if (liquid < 600) {
    if (opp.risk === "HIGH") score -= 15;
    if (opp.risk === "MED-HIGH") score -= 7;
  }
  return score;
}

// ── Profit bar visualization ─────────────────────────────────────────────────
function ProfitBar({ buyLow, buyHigh, sellLow, sellHigh }) {
  const maxVal = sellHigh || sellLow || buyHigh || 1;
  const buyW = ((buyHigh || buyLow) / maxVal) * 100;
  const profitStart = buyW;
  const profitW = Math.max(0, 100 - buyW);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>BUY ${buyLow}–${buyHigh}</span>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}>SELL ${sellLow}–${sellHigh}</span>
      </div>
      <div style={{ height: 6, borderRadius: 4, background: "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${buyW}%`, background: "rgba(255,255,255,0.1)", borderRadius: "4px 0 0 4px" }} />
        <div style={{ position: "absolute", left: `${profitStart}%`, top: 0, height: "100%", width: `${profitW}%`, background: "linear-gradient(90deg, #00e67666, #00e676)", borderRadius: "0 4px 4px 0" }} />
      </div>
      <div style={{ color: "#00e676", fontSize: 10, fontWeight: 600, textAlign: "right", marginTop: 3 }}>
        ${(sellLow || 0) - (buyHigh || 0)}–${(sellHigh || 0) - (buyLow || 0)} profit
      </div>
    </div>
  );
}

// ── Collapsed Sniper Card ────────────────────────────────────────────────────
function OppCard({ opp, liquid, onExecute, onDismiss, rank }) {
  const [open, setOpen] = useState(false);
  const isFB = opp.lane === "FBMKT";
  const gap = isFB
    ? ((opp.buyRange || [0, 0])[0] > 0 ? Math.max(0, (opp.buyRange || [0, 0])[0] - liquid) : 0)
    : (!opp.isService && opp.minCapital > 0 ? Math.max(0, opp.minCapital - liquid) : 0);
  const locked = gap > 0;

  const roi = opp.roiRange || [0, 0];
  const buyUnder = isFB ? (opp.buyRange || [0, 0])[1] : (opp.maxCapital || opp.minCapital || 0);
  const profitLow = isFB ? ((opp.sellRange || [0, 0])[0] - (opp.buyRange || [0, 0])[1]) : Math.round((opp.minCapital || 0) * (roi[0] / 100));
  const profitHigh = isFB ? ((opp.sellRange || [0, 0])[1] - (opp.buyRange || [0, 0])[0]) : Math.round((opp.maxCapital || 0) * (roi[1] / 100));
  const sellLow = isFB ? (opp.sellRange || [0, 0])[0] : Math.round((opp.minCapital || 0) * (1 + roi[0] / 100));
  const sellHigh = isFB ? (opp.sellRange || [0, 0])[1] : Math.round((opp.maxCapital || 0) * (1 + roi[1] / 100));

  const scout = (term) =>
    window.open(`https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(term)}`, "_blank");

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: `1px solid ${open ? "rgba(0,230,118,0.15)" : "rgba(255,255,255,0.04)"}`,
      borderRadius: 20,
      overflow: "hidden",
      transition: "border-color 0.2s",
    }}>
      {/* ── Collapsed view: scannable at a glance ── */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ padding: "18px 20px", cursor: "pointer" }}
      >
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          {rank && rank <= 3 && (
            <span style={{ color: "#00e676", fontSize: 9, fontWeight: 700, background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)", padding: "2px 7px", borderRadius: 6, flexShrink: 0 }}>#{rank}</span>
          )}
          <span style={{ fontSize: 15, flexShrink: 0 }}>{opp.icon || LANE_META[opp.lane]?.icon}</span>
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 15, flex: 1, lineHeight: 1.2 }}>{opp.title}</span>
          {opp.ai && <span style={{ color: "#60a5fa", fontSize: 8, border: "1px solid rgba(96,165,250,0.3)", padding: "1px 5px", borderRadius: 4, flexShrink: 0 }}>AI</span>}
          <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 10, flexShrink: 0, transition: "transform 0.2s", display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▼</span>
        </div>

        {/* Tags */}
        {(opp.tags || []).length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {opp.tags.map(tag => (
              <span key={tag} style={{
                color: tag.includes("PEAK") || tag.includes("HOT") ? "#ff3b3b" : tag.includes("TRUCK") ? "#60a5fa" : "rgba(255,255,255,0.3)",
                fontSize: 8, fontWeight: 600, letterSpacing: 1,
                background: tag.includes("PEAK") || tag.includes("HOT") ? "rgba(255,59,59,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${tag.includes("PEAK") || tag.includes("HOT") ? "rgba(255,59,59,0.15)" : "rgba(255,255,255,0.06)"}`,
                padding: "3px 8px", borderRadius: 6,
              }}>{tag}</span>
            ))}
          </div>
        )}

        {/* Key numbers — the only thing that matters at a glance */}
        <div style={{ display: "grid", gridTemplateColumns: opp.isService ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
          {opp.isService ? (
            <>
              <div>
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: 1.5, marginBottom: 4 }}>RATE</div>
                <div style={{ color: "#00e676", fontSize: 22, fontWeight: 800 }}>${opp.hourlyRate[0]}–${opp.hourlyRate[1]}</div>
                <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 9 }}>per hour</div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: 1.5, marginBottom: 4 }}>TIMEFRAME</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 16, fontWeight: 600 }}>{opp.timeframe}</div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: 1.5, marginBottom: 4 }}>BUY UNDER</div>
                <div style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>${buyUnder.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: 1.5, marginBottom: 4 }}>EST PROFIT</div>
                <div style={{ color: "#00e676", fontSize: 22, fontWeight: 800 }}>${profitLow > 0 ? profitLow.toLocaleString() : 0}–${profitHigh > 0 ? profitHigh.toLocaleString() : 0}</div>
              </div>
              <div>
                <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: 1.5, marginBottom: 4 }}>SELL FOR</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 22, fontWeight: 800 }}>${sellLow > 0 ? sellLow.toLocaleString() : 0}</div>
              </div>
            </>
          )}
        </div>

        {/* Scan button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isFB && opp.searchTerms?.length > 0) {
              scout(opp.searchTerms[0]);
            } else if (!locked) {
              onExecute(opp);
            }
          }}
          style={{
            width: "100%", marginTop: 16,
            background: locked ? "rgba(255,255,255,0.02)" : "rgba(0,230,118,0.06)",
            border: locked ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,230,118,0.15)",
            color: locked ? "rgba(255,255,255,0.2)" : "#00e676",
            fontSize: 12, fontWeight: 600, letterSpacing: 1,
            padding: "12px 0", borderRadius: 12, cursor: locked ? "default" : "pointer",
            transition: "all 0.15s",
          }}
        >
          {locked ? `NEED +$${gap} MORE` : isFB ? "SCAN MARKETPLACE" : opp.isService ? "GET STARTED" : "GO →"}
        </button>
      </div>

      {/* ── Expanded detail ── */}
      {open && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {/* Description */}
          {opp.detail && (
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, lineHeight: 1.7, margin: "16px 0" }}>{opp.detail}</p>
          )}

          {/* Profit bar (for non-service) */}
          {!opp.isService && isFB && opp.buyRange && opp.sellRange && (
            <ProfitBar buyLow={opp.buyRange[0]} buyHigh={opp.buyRange[1]} sellLow={opp.sellRange[0]} sellHigh={opp.sellRange[1]} />
          )}

          {/* Hot items as clean vertical list */}
          {opp.hotItems?.length > 0 && (
            <div style={{ margin: "16px 0" }}>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: 2, marginBottom: 10 }}>HOT MODELS</div>
              {opp.hotItems.map((item, idx) => (
                <div key={idx} style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                  borderRadius: 12,
                  padding: "12px 14px",
                  marginBottom: 8,
                }}>
                  <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{item.model}</div>
                  <div style={{ display: "flex", gap: 20 }}>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Buy: <span style={{ color: "#fff" }}>{item.buy}</span></span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>Sell: <span style={{ color: "#00e676" }}>{item.sell}</span></span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Search buttons (FBMKT) */}
          {opp.searchTerms?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {opp.searchTerms.map(t => (
                  <button
                    key={t} onClick={() => scout(t)}
                    style={{
                      background: "rgba(0,230,118,0.04)", border: "1px solid rgba(0,230,118,0.12)", color: "#00e676",
                      fontSize: 10, padding: "7px 12px", borderRadius: 10, cursor: "pointer",
                    }}
                  >
                    Find {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action plan */}
          {opp.action && (
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, padding: "12px 14px", marginBottom: 12 }}>
              <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 9, letterSpacing: 2, marginBottom: 6 }}>ACTION PLAN</div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 1.7 }}>{opp.action}</div>
            </div>
          )}

          {/* Links */}
          {(opp.links || []).length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {opp.links.map(l => (
                <a
                  key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    color: "#60a5fa", fontSize: 10,
                    border: "1px solid rgba(96,165,250,0.15)", padding: "6px 12px", borderRadius: 10,
                    textDecoration: "none", background: "rgba(96,165,250,0.04)",
                  }}
                >
                  {l.label}
                </a>
              ))}
            </div>
          )}

          {/* Dismiss */}
          {onDismiss && (
            <button
              onClick={() => onDismiss(opp.id)}
              style={{ background: "none", border: "none", color: "rgba(255,255,255,0.1)", fontSize: 10, cursor: "pointer", marginTop: 12, padding: 0 }}
            >Not interested</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Playbook text formatter ─────────────────────────────────────────────────
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
        if (/^DATES:/i.test(line))
          return <div key={i} style={{ color: "#60a5fa", marginTop: 2 }}>{line}</div>;
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function OpportunitiesTab({ data, save, onStartFlip }) {
  const [playbook, setPlaybook] = useState(data.cachedPlaybook || "");
  const [playbookTime, setPlaybookTime] = useState(data.playbookTime || null);
  const [playbookLoading, setPlaybookLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [dismissedIds, setDismissedIds] = useState(() => new Set(data.dismissedIds || []));
  const [aiOpps, setAiOpps] = useState(data.aiOpps || []);
  const [generating, setGenerating] = useState(false);

  const liquid = data.bankBalance || 0;
  const hasTruck = data.hasTruck !== false;
  const flips = data.flips || [];

  const allScored = [...OPP_LIBRARY, ...aiOpps].map(o => ({
    ...o,
    score: scoreOpp(o, liquid, data.bankBalance, flips, hasTruck),
  })).sort((a, b) => b.score - a.score);

  const displayed = (activeFilter === "ALL"
    ? allScored
    : allScored.filter(o => o.lane === activeFilter)
  ).filter(o => o.score > -50 && !dismissedIds.has(o.id));

  // ── AI opportunity generation ────────────────────────────────────────────
  const generateAiOpp = async (currentAiOpps, currentDismissed) => {
    const seenTitles = [...OPP_LIBRARY.map(o => o.title), ...currentAiOpps.map(o => o.title)].join(", ");
    try {
      const text = await gemini(
        "You are a street-smart money-making advisor for a Phoenix AZ server with a pickup truck. Generate ONE specific, actionable opportunity. Return ONLY valid JSON.",
        `Liquid: $${liquid}. Truck: YES. Phoenix AZ. Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}.
Do NOT suggest: ${seenTitles}.
Return JSON: {"id":"ai-${Date.now()}","ai":true,"lane":"FLIP","title":"Short title","detail":"2-3 sentences","action":"Exact steps","roiRange":[min,max],"risk":"LOW","timeframe":"3-7 days","links":[{"label":"Name","url":"https://example.com"}],"urgency":"hot-now","truckRequired":false,"minCapital":0,"maxCapital":300,"isService":false,"tags":["TAG1","TAG2"]}`,
        700, false, true
      );
      const parsed = JSON.parse(text);
      if (!parsed.title || !parsed.lane) return null;
      parsed.id = `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      parsed.ai = true;
      if (!parsed.roiRange) parsed.roiRange = [0, 0];
      if (!parsed.minCapital) parsed.minCapital = 0;
      if (!parsed.maxCapital) parsed.maxCapital = 500;
      if (!parsed.tags) parsed.tags = [];
      return parsed;
    } catch { return null; }
  };

  const dismissOpp = async (id) => {
    const newDismissed = new Set([...dismissedIds, id]);
    const newAiOpps = aiOpps.filter(o => o.id !== id);
    setDismissedIds(newDismissed);
    setAiOpps(newAiOpps);
    save({ ...data, dismissedIds: [...newDismissed], aiOpps: newAiOpps });
    setGenerating(true);
    const newOpp = await generateAiOpp(newAiOpps, newDismissed);
    setGenerating(false);
    if (newOpp) {
      const updated = [...newAiOpps, newOpp];
      setAiOpps(updated);
      save({ ...data, dismissedIds: [...newDismissed], aiOpps: updated });
    }
  };

  const buildPlaybook = async () => {
    setPlaybookLoading(true);
    setPlaybook("");
    const soldFlips = flips.filter(f => f.status === "sold" && f.sold);
    const flipSummary = soldFlips.length > 0
      ? `${soldFlips.length} flips sold, avg ROI ~${(soldFlips.reduce((a, f) => a + (f.sold - f.bought) / f.bought, 0) / soldFlips.length * 100).toFixed(0)}%`
      : "no flip history yet";
    const top3 = allScored.filter(o => o.score > 0).slice(0, 3)
      .map(o => `"${o.title}" (${o.lane})`).join(", ");
    try {
      const text = await gemini(
        "You are a street-smart financial advisor for a Phoenix AZ server/flipper with a pickup truck. Give specific, actionable advice.",
        `Liquid: $${liquid}. Savings: $${data.savings || 0}. Flip history: ${flipSummary}. Truck: YES. Top opps: ${top3}. Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}.
Give me a 3-MOVE ACTION PLAN for THIS WEEK. Format each:
MOVE 1: [TITLE]
DO TODAY: [exact action]
BUY: [item + price]
SELL: [platform + price]
NET PROFIT: $[X]–$[Y]
TIME: [hours]
LINK: [URL]

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
    save({ ...data, oppHistory: [...(data.oppHistory || []), { id: Date.now(), title, lane, earned: +earned, hours: hours ? +hours : null, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }) }] });
    setModal(null);
    setForm({});
  };

  const deleteHistory = (id) => save({ ...data, oppHistory: (data.oppHistory || []).filter(o => o.id !== id) });
  const oppHistory = data.oppHistory || [];
  const totalHustled = oppHistory.reduce((a, o) => a + (o.earned || 0), 0);

  const FILTER_TABS = ["ALL", "FBMKT", "FLIP", "TICKETS", "TRUCK", "ARB", "SERVICE", "STOCKS"];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 700 }}>Opportunities</div>
          <button
            onClick={buildPlaybook}
            disabled={playbookLoading}
            style={{
              background: playbookLoading ? "rgba(255,255,255,0.03)" : "rgba(0,230,118,0.06)",
              border: "1px solid rgba(0,230,118,0.15)",
              color: playbookLoading ? "rgba(255,255,255,0.3)" : "#00e676",
              fontSize: 11, fontWeight: 600,
              padding: "10px 20px", borderRadius: 14, cursor: playbookLoading ? "default" : "pointer",
            }}
          >
            {playbookLoading ? "Thinking..." : "Build My Week"}
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
          {allScored.filter(o => o.score > 0).length} active
        </div>
      </div>

      {/* AI Playbook */}
      {(playbook || playbookLoading) && (
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, padding: "20px 22px", marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: "#00e676", fontSize: 13, fontWeight: 600 }}>AI Weekly Playbook</div>
            {playbookTime && <div style={{ color: "rgba(255,255,255,0.12)", fontSize: 9 }}>generated {playbookTime}</div>}
          </div>
          {playbookLoading
            ? <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>Analyzing your situation...</div>
            : <PlaybookText text={playbook} />
          }
        </div>
      )}

      {/* Lane filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, overflowX: "auto", paddingBottom: 4, WebkitOverflowScrolling: "touch" }}>
        {FILTER_TABS.map(f => {
          const active = activeFilter === f;
          const count = f === "ALL" ? displayed.length : allScored.filter(o => o.lane === f && o.score > -50).length;
          return (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                background: active ? "rgba(0,230,118,0.06)" : "rgba(255,255,255,0.02)",
                border: active ? "1px solid rgba(0,230,118,0.15)" : "1px solid rgba(255,255,255,0.04)",
                color: active ? "#00e676" : "rgba(255,255,255,0.25)",
                fontSize: 10, fontWeight: active ? 600 : 400,
                padding: "7px 14px", borderRadius: 12, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              {f === "ALL" ? "All" : LANE_META[f]?.icon + " " + (LANE_META[f]?.label || f)} ({count})
            </button>
          );
        })}
      </div>

      {/* Generating indicator */}
      {generating && (
        <div style={{ background: "rgba(96,165,250,0.04)", border: "1px solid rgba(96,165,250,0.1)", borderRadius: 14, padding: "12px 16px", marginBottom: 16, color: "#60a5fa", fontSize: 12 }}>
          AI generating new opportunity...
        </div>
      )}

      {/* Cards */}
      <div style={{ display: "grid", gap: 16 }}>
        {displayed.map((opp, i) => (
          <OppCard key={opp.id} opp={opp} liquid={liquid} onExecute={executeOpp} onDismiss={dismissOpp} rank={activeFilter === "ALL" && i < 3 ? i + 1 : null} />
        ))}
      </div>

      {/* History */}
      {oppHistory.length > 0 && (
        <div style={{ marginTop: 36 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600, letterSpacing: 2 }}>HISTORY</div>
            <div style={{ color: "#00e676", fontSize: 14, fontWeight: 700 }}>${totalHustled.toLocaleString()}</div>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {[...oppHistory].reverse().map(o => (
              <div key={o.id} style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 14, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ color: "#fff", fontSize: 13, marginBottom: 3 }}>{o.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 10 }}>
                    {o.date}{o.hours ? ` · ${o.hours}hr · $${(o.earned / o.hours).toFixed(0)}/hr` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                  <div style={{ color: "#00e676", fontSize: 17, fontWeight: 700 }}>+${o.earned}</div>
                  <button onClick={() => deleteHistory(o.id)} style={{ background: "none", border: "1px solid rgba(255,59,59,0.15)", color: "#ff3b3b", fontSize: 10, padding: "3px 7px", borderRadius: 6, cursor: "pointer" }}>x</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log hustle modal */}
      {modal === "log-hustle" && (
        <Modal title={`LOG: ${form.title}`} onClose={() => { setModal(null); setForm({}); }}>
          <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginBottom: 14 }}>
            Record what you actually made so your history tracks real results.
          </div>
          <Input label="Amount Earned ($)" type="number" value={form.earned || ""} onChange={v => setForm({ ...form, earned: v })} placeholder="180" />
          <Input label="Hours Worked (optional)" type="number" value={form.hours || ""} onChange={v => setForm({ ...form, hours: v })} placeholder="3" />
          <Btn onClick={saveHustle} color="#00e676" style={{ width: "100%", marginTop: 8 }}>LOG HUSTLE</Btn>
        </Modal>
      )}
    </div>
  );
}
