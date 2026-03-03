import { useState } from "react";
import { gemini } from "./gemini.js";
import Modal from "./Modal.jsx";
import Input from "./Input.jsx";
import Btn from "./Btn.jsx";

// ── Lane metadata ─────────────────────────────────────────────────────────────
const LANE_META = {
  FBMKT:   { label: "FB Marketplace", color: "#00d4aa", icon: "📱" },
  FLIP:    { label: "Item Flip",      color: "#ff8c00", icon: "💰" },
  TICKETS: { label: "Tickets",        color: "#a78bfa", icon: "🎟️" },
  TRUCK:   { label: "Truck",          color: "#38bdf8", icon: "🚛" },
  ARB:     { label: "Retail Arb",     color: "#ffd700", icon: "📦" },
  SERVICE: { label: "Service",        color: "#00ff88", icon: "💡" },
  STOCKS:  { label: "Stocks",         color: "#60a5fa", icon: "📈" },
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
    links: [
      { label: "SNKRS Upcoming Drops", url: "https://www.nike.com/launch" },
      { label: "GOAT", url: "https://www.goat.com" },
      { label: "StockX — Sell", url: "https://stockx.com/sell" },
      { label: "eBay Sneakers", url: "https://www.ebay.com/sch/i.html?_nkw=jordan+sneakers&_sop=10" },
    ],
    urgency: "hot-now", truckRequired: false,
  },
  {
    id: "gpu-flip", lane: "FLIP",
    title: "GPU / Console Resell Flip",
    detail: "High-demand GPUs and consoles frequently sell above MSRP when supply is tight. Check eBay sold listings BEFORE buying to confirm current margin — don't assume.",
    action: "Step 1: Hit the eBay sold listings link to see real current resale prices today. Step 2: Set NowInStock alerts for any GPU/console with confirmed margin >20%. Step 3: Buy on restock, list within 1 hour.",
    minCapital: 300, maxCapital: 1700,
    roiRange: [20, 60], risk: "MED", timeframe: "1–5 days", effort: 2,
    links: [
      { label: "eBay — GPU Sold Prices (check first)", url: "https://www.ebay.com/sch/i.html?_nkw=nvidia+rtx+gpu&LH_Complete=1&LH_Sold=1&_sop=16" },
      { label: "NowInStock — GPU Alerts", url: "https://www.nowinstock.net/computers/videocards/" },
      { label: "Best Buy — GPUs", url: "https://www.bestbuy.com/site/searchpage.jsp?st=rtx+gpu" },
    ],
    urgency: "seasonal", truckRequired: false,
  },
  {
    id: "lego-arb", lane: "FLIP",
    title: "LEGO Retiring Set Arb",
    detail: "LEGO Star Wars sets retiring soon appreciate 40-80% within 90 days. Zero volatility, zero competition, just patience.",
    action: "Check Brickset.com 'Retiring Soon' list. Buy 2-3 units at Target clearance or Amazon. Store in closet. List in May on BrickLink and eBay.",
    minCapital: 80, maxCapital: 400,
    roiRange: [40, 80], risk: "LOW", timeframe: "60–120 days", effort: 1,
    links: [
      { label: "Brickset — Retiring Soon", url: "https://www.brickset.com/sets/retiring-soon" },
      { label: "BrickLink — Sell", url: "https://www.bricklink.com" },
      { label: "eBay LEGO Star Wars", url: "https://www.ebay.com/sch/i.html?_nkw=lego+star+wars+retired&_sop=10" },
    ],
    urgency: "seasonal", truckRequired: false,
  },
  {
    id: "ps5-bundle", lane: "FLIP",
    title: "PS5 Slim Bundle Flip",
    detail: "Target/Walmart PS5 bundles at $499-549 resell $620-700 on eBay. Bundle a cheap game to increase perceived value and margin.",
    action: "Buy PS5 bundle at Target. Add a used game ($40). List bundled on eBay: free shipping, 'Buy It Now'. 20-35% in 3-5 days.",
    minCapital: 500, maxCapital: 650,
    roiRange: [18, 35], risk: "LOW-MED", timeframe: "3–7 days", effort: 1,
    links: [
      { label: "Target — PS5 Bundles", url: "https://www.target.com/s?searchTerm=ps5+bundle" },
      { label: "eBay — PS5 Sold Prices", url: "https://www.ebay.com/sch/i.html?_nkw=ps5+slim+bundle&LH_Complete=1&LH_Sold=1" },
    ],
    urgency: "evergreen", truckRequired: false,
  },

  // TICKETS ────────────────────────────────────────────────────────────────────
  {
    id: "nba-playoffs", lane: "TICKETS",
    title: "NBA Playoffs Ticket Flip",
    detail: "Playoffs start ~Apr 19. Strategy: only buy for teams confirmed in playoff position — check standings first. Face $120-300 → resale $350-800 once bracket is set.",
    action: "Step 1: Check NBA standings RIGHT NOW (link below) — only buy for a team with a clinched or near-certain playoff spot. Step 2: Buy 2 floor/lower bowl tickets. Step 3: List at 2x face the moment their first-round matchup is announced.",
    minCapital: 250, maxCapital: 1200,
    roiRange: [80, 200], risk: "MED", timeframe: "4–8 weeks", effort: 1,
    links: [
      { label: "NBA Standings — Check Now", url: "https://www.nba.com/standings" },
      { label: "Ticketmaster — NBA Tickets", url: "https://www.ticketmaster.com/search?q=nba+playoffs" },
      { label: "StubHub — Sell Tickets", url: "https://www.stubhub.com/sell" },
      { label: "SeatGeek — NBA", url: "https://seatgeek.com/nba-tickets" },
    ],
    urgency: "hot-now", truckRequired: false,
  },
  {
    id: "ufc-ppv", lane: "TICKETS",
    title: "UFC / Boxing PPV Flip",
    detail: "UFC PPV cards April-June = stacked schedule. Floor seats $200-300 in → $600-900 out. Consistent 2-3x resale with zero effort between buy and sell.",
    action: "Check UFC.com fight schedule. Buy 2 floor seats day-of-sale. List on Vivid Seats with auto-pricing at 1.8x face. Sell 7-10 days pre-fight for max.",
    minCapital: 200, maxCapital: 800,
    roiRange: [100, 200], risk: "MED", timeframe: "2–6 weeks", effort: 1,
    links: [
      { label: "UFC — Upcoming Events", url: "https://www.ufc.com/events" },
      { label: "Ticketmaster — UFC Tickets", url: "https://www.ticketmaster.com/search?q=ufc" },
      { label: "Vivid Seats — Sell", url: "https://www.vividseats.com/sell-tickets" },
    ],
    urgency: "seasonal", truckRequired: false,
  },
  {
    id: "concert-flip", lane: "TICKETS",
    title: "Concert Presale Ticket Flip",
    detail: "Major touring acts consistently resell 1.5-3x face. The edge is presale access — you buy before the public, at face, and list immediately. Check what's actually on sale right now.",
    action: "Step 1: Check Ticketmaster presales happening today (link below). Step 2: Use Citi/Chase card for presale code access. Step 3: Buy 4 GA/floor. List 2 at 1.8x on StubHub immediately, hold 2 to sell week-of show.",
    minCapital: 300, maxCapital: 1200,
    roiRange: [50, 150], risk: "MED", timeframe: "1–6 weeks", effort: 2,
    links: [
      { label: "Ticketmaster — Active Presales", url: "https://www.ticketmaster.com/discover/concerts" },
      { label: "StubHub — Sell", url: "https://www.stubhub.com/sell" },
      { label: "Vivid Seats — Sell", url: "https://www.vividseats.com/sell-tickets" },
    ],
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
    links: [
      { label: "Dolly — Become a Helper", url: "https://www.dolly.com" },
      { label: "GoShare — Driver Signup", url: "https://www.goshare.co" },
    ],
    urgency: "evergreen", truckRequired: true,
  },
  {
    id: "large-item-flip", lane: "TRUCK",
    title: "Large Item Flip (Truck Moat)",
    detail: "Sectional couches, recliners, treadmills, riding mowers. Most flippers physically cannot move these. You can. Buy $0-100, sell $250-600. This is your exclusive lane.",
    action: "Search FB Marketplace 'free sofa', '$50 couch', 'free treadmill' every morning. Clean it up, take good photos, relist at 3-5x. Move 1-2 items per week.",
    minCapital: 0, maxCapital: 150,
    roiRange: [150, 500], risk: "LOW", timeframe: "1–7 days", effort: 3,
    links: [
      { label: "FB Marketplace — Free Stuff", url: "https://www.facebook.com/marketplace/category/free-stuff" },
      { label: "OfferUp", url: "https://offerup.com" },
      { label: "Craigslist — Free Phoenix", url: "https://phoenix.craigslist.org/search/zip" },
    ],
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
    links: [
      { label: "Post on Nextdoor", url: "https://nextdoor.com" },
      { label: "FB Marketplace — Services", url: "https://www.facebook.com/marketplace/category/home-sales" },
    ],
    urgency: "hot-now", truckRequired: true,
  },
  {
    id: "liquidation-pallet", lane: "TRUCK",
    title: "Amazon Return Pallet Flip",
    detail: "B-Stock Phoenix: pay $200-400/pallet, contains $800-2,000 retail. Requires truck to haul — most buyers can't do it, which reduces competition and prices.",
    action: "Register at bstock.com/amazon. Bid 'Customer Returns – Electronics/Misc' category. Phoenix warehouse pickup. Sell best items on eBay, bulk remainder on FB Marketplace.",
    minCapital: 200, maxCapital: 500,
    roiRange: [100, 300], risk: "MED-HIGH", timeframe: "1–3 weeks", effort: 5,
    links: [
      { label: "B-Stock — Amazon Returns", url: "https://bstock.com/amazon/" },
      { label: "eBay — Sell", url: "https://www.ebay.com/sl/sell" },
      { label: "FB Marketplace", url: "https://www.facebook.com/marketplace/" },
    ],
    urgency: "evergreen", truckRequired: true,
  },
  {
    id: "scrap-metal", lane: "TRUCK",
    title: "Free Scrap Metal → Cash",
    detail: "$0 cost. FB/Craigslist free section + construction sites = full truckload → $80-200 at AZ scrap yard. Pure profit, zero risk.",
    action: "Search FB Marketplace 'free metal', 'free appliances', 'free AC unit' daily. Hit active construction sites and ask foreman. Sell at Arizona Metals — Glendale or Mesa.",
    minCapital: 0, maxCapital: 30,
    roiRange: [500, 2000], risk: "LOW", timeframe: "Half day", effort: 3,
    links: [
      { label: "FB Marketplace — Free Stuff", url: "https://www.facebook.com/marketplace/category/free-stuff" },
      { label: "Craigslist Free — Phoenix", url: "https://phoenix.craigslist.org/search/zip" },
    ],
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
    links: [
      { label: "TaskRabbit — Become a Tasker", url: "https://www.taskrabbit.com/become-a-tasker" },
    ],
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
    links: [
      { label: "Best Buy — Electronics", url: "https://www.bestbuy.com" },
      { label: "eBay — Electronics Sold", url: "https://www.ebay.com/sch/i.html?_nkw=airpods+pro&LH_Complete=1&LH_Sold=1" },
    ],
    urgency: "hot-now", truckRequired: false,
  },
  {
    id: "clearance-fba", lane: "ARB",
    title: "Clearance → Amazon FBA",
    detail: "Target/Walmart clearance at 70-90% off. Scan with ScoutIQ to verify Amazon rank and margin instantly. Ship to FBA and let Amazon sell it for you.",
    action: "Download ScoutIQ ($15/mo). Hit Target clearance (red tags, back corners). Only buy rank <300k with 50%+ margin after fees. Box it, ship to FBA.",
    minCapital: 200, maxCapital: 1000,
    roiRange: [50, 200], risk: "MED", timeframe: "2–6 weeks", effort: 3,
    links: [
      { label: "ScoutIQ — Download", url: "https://scoutiq.co" },
      { label: "Amazon Seller Central", url: "https://sell.amazon.com" },
    ],
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
    links: [
      { label: "Post on Nextdoor", url: "https://nextdoor.com" },
    ],
    urgency: "evergreen", truckRequired: true,
  },

  // FB MARKETPLACE ─────────────────────────────────────────────────────────────
  {
    id: "fb-exercise", lane: "FBMKT", icon: "💪",
    title: "Exercise Equipment",
    detail: "New Year guilt gear floods the market Jan-March. Pelotons, treadmills, Bowflex — people pay to clear their garage. Your truck moves what other flippers physically can't.",
    searchTerms: ["free treadmill", "peloton", "exercise bike", "bowflex", "nordictrack"],
    minCapital: 0, maxCapital: 200, buyRange: [0, 200], sellRange: [200, 1200], roiRange: [150, 500],
    daysToSell: "3–7", risk: "LOW", truckRequired: true, urgency: "hot-now",
    hotItems: [
      { model: "Peloton Bike+", buy: "$400–$600", sell: "$900–$1,200", roi: "+80–150%" },
      { model: "NordicTrack 1750 Treadmill", buy: "$200–$350", sell: "$600–$900", roi: "+100–200%" },
      { model: "Bowflex Velocore Bike", buy: "$100–$200", sell: "$400–$600", roi: "+100–300%" },
      { model: "Life Fitness 95T Treadmill", buy: "$100–$250", sell: "$500–$800", roi: "+100–400%" },
    ],
  },
  {
    id: "fb-power-tools", lane: "FBMKT", icon: "🔧",
    title: "Power Tool Lots",
    detail: "DeWalt/Milwaukee combo kits retail $500-800, sell fast at $250-500 used. Phoenix construction never stops — constant demand. Bundle multiple tools to raise your ask.",
    searchTerms: ["dewalt lot", "milwaukee tools", "tool bundle", "circular saw", "drill set"],
    minCapital: 50, maxCapital: 200, buyRange: [50, 200], sellRange: [150, 600], roiRange: [100, 300],
    daysToSell: "2–5", risk: "LOW", truckRequired: false, urgency: "evergreen",
    hotItems: [
      { model: "DeWalt DCK277C2 20V Combo Kit", buy: "$80–$150", sell: "$280–$380", roi: "+100–250%" },
      { model: "Milwaukee 2997-22 M18 FUEL Kit", buy: "$100–$200", sell: "$350–$500", roi: "+100–200%" },
      { model: "DeWalt DCS575 7-1/4\" Circ. Saw", buy: "$80–$120", sell: "$220–$300", roi: "+80–200%" },
      { model: "Makita XDT16 Impact Driver Kit", buy: "$60–$100", sell: "$180–$250", roi: "+80–200%" },
    ],
  },
  {
    id: "fb-riding-mowers", lane: "FBMKT", icon: "🌿",
    title: "Riding Mowers",
    detail: "Spring in AZ = peak lawn equipment season right now. Buy end-of-winter at discount, sell $500-1,200 when everyone's prepping yards. Truck required — that's your edge.",
    searchTerms: ["riding mower", "zero turn mower", "lawn tractor", "john deere", "husqvarna mower"],
    minCapital: 100, maxCapital: 400, buyRange: [100, 400], sellRange: [400, 1200], roiRange: [100, 300],
    daysToSell: "5–10", risk: "LOW", truckRequired: true, urgency: "hot-now",
    hotItems: [
      { model: "John Deere E110 42\"", buy: "$300–$500", sell: "$700–$1,000", roi: "+80–150%" },
      { model: "Husqvarna YTH18542 46\"", buy: "$200–$400", sell: "$600–$900", roi: "+100–150%" },
      { model: "Cub Cadet XT1 LT42", buy: "$250–$450", sell: "$700–$950", roi: "+100–150%" },
      { model: "Ariens Ikon XD 42\"", buy: "$200–$350", sell: "$600–$850", roi: "+100–200%" },
    ],
  },
  {
    id: "fb-large-tvs", lane: "FBMKT", icon: "📺",
    title: "Large TVs (55\"+)",
    detail: "People upgrading to OLED dump perfectly good 55-75\" TVs for $50-200. Clean the screen, relist $200-500. High turnover, sells in days, no truck needed under 65\".",
    searchTerms: ["55 inch tv", "65 inch tv", "samsung 4k tv", "lg oled", "75 inch tv"],
    minCapital: 30, maxCapital: 200, buyRange: [30, 200], sellRange: [150, 600], roiRange: [100, 300],
    daysToSell: "2–5", risk: "LOW-MED", truckRequired: false, urgency: "evergreen",
    hotItems: [
      { model: "LG C2/C3 65\" OLED", buy: "$400–$700", sell: "$900–$1,200", roi: "+70–150%" },
      { model: "Samsung QN90B 65\" QLED", buy: "$300–$500", sell: "$700–$1,000", roi: "+80–200%" },
      { model: "Sony X90J 75\"", buy: "$300–$500", sell: "$750–$1,100", roi: "+80–180%" },
      { model: "TCL 75\" 6-Series R655", buy: "$150–$300", sell: "$420–$600", roi: "+80–200%" },
    ],
  },
  {
    id: "fb-patio", lane: "FBMKT", icon: "☀️",
    title: "Patio / Outdoor Furniture",
    detail: "Phoenix patio season starts NOW — March through May is peak. Outdoor sectionals, fire pits, grills. Buy cheap, relist clean. High ticket, moves fast in AZ.",
    searchTerms: ["patio furniture", "outdoor sectional", "traeger grill", "big green egg", "patio set"],
    minCapital: 50, maxCapital: 400, buyRange: [50, 400], sellRange: [200, 1200], roiRange: [100, 400],
    daysToSell: "4–10", risk: "LOW", truckRequired: true, urgency: "hot-now",
    hotItems: [
      { model: "Traeger Pro 575 Pellet Grill", buy: "$200–$350", sell: "$500–$750", roi: "+80–200%" },
      { model: "Big Green Egg (Large)", buy: "$400–$600", sell: "$800–$1,200", roi: "+80–150%" },
      { model: "POLYWOOD Outdoor Sectional 4pc", buy: "$100–$250", sell: "$400–$700", roi: "+100–300%" },
      { model: "Hampton Bay 6-Pc Patio Set", buy: "$100–$200", sell: "$400–$650", roi: "+100–300%" },
    ],
  },
  {
    id: "fb-appliances", lane: "FBMKT", icon: "🏠",
    title: "Washer / Dryer / Fridge",
    detail: "Working appliances sell same day in Phoenix. W/D sets buy $75-200, sell $300-600. Your truck is the moat — most buyers AND most flippers can't haul a washer.",
    searchTerms: ["washer dryer set", "refrigerator", "lg washer", "samsung fridge", "appliance lot"],
    minCapital: 50, maxCapital: 300, buyRange: [50, 300], sellRange: [200, 700], roiRange: [100, 300],
    daysToSell: "1–4", risk: "LOW", truckRequired: true, urgency: "evergreen",
    hotItems: [
      { model: "LG WM3900HWA Front-Load Washer", buy: "$100–$200", sell: "$350–$500", roi: "+100–200%" },
      { model: "Samsung 4-Door French Door Fridge", buy: "$200–$400", sell: "$600–$900", roi: "+100–200%" },
      { model: "Samsung Front-Load W/D Set", buy: "$250–$450", sell: "$600–$900", roi: "+80–150%" },
      { model: "Bosch 500 Series Dishwasher", buy: "$80–$150", sell: "$300–$450", roi: "+100–300%" },
    ],
  },
  {
    id: "fb-baby-gear", lane: "FBMKT", icon: "🍼",
    title: "Premium Baby Gear",
    detail: "UPPAbaby/Nuna gear holds value. Buy $100-200, relist $350-550. Low weight so no truck needed. Parents buying used = reliable high-margin daily demand.",
    searchTerms: ["uppababy vista", "nuna pipa", "4moms mamaroo", "baby gear lot", "graco snugride"],
    minCapital: 20, maxCapital: 200, buyRange: [20, 200], sellRange: [80, 550], roiRange: [100, 300],
    daysToSell: "2–5", risk: "LOW", truckRequired: false, urgency: "evergreen",
    hotItems: [
      { model: "UPPAbaby Vista V2 Stroller", buy: "$120–$200", sell: "$380–$550", roi: "+100–200%" },
      { model: "Nuna PIPA Lite Car Seat", buy: "$100–$160", sell: "$250–$360", roi: "+80–150%" },
      { model: "4moms MamaRoo 4 Swing", buy: "$60–$100", sell: "$160–$220", roi: "+80–150%" },
      { model: "Graco TriRide 3-in-1 Car Seat", buy: "$40–$80", sell: "$140–$190", roi: "+80–200%" },
    ],
  },
  {
    id: "fb-gaming", lane: "FBMKT", icon: "🎮",
    title: "Gaming Setups / Consoles",
    detail: "Gaming PCs, PS5/Xbox with extra controllers and games. Bundle everything — FB buyers pay more than eBay for local no-ship. Sell as a complete ready-to-play setup.",
    searchTerms: ["gaming pc", "ps5 bundle", "xbox series x", "gaming setup", "rtx 3080 pc"],
    minCapital: 100, maxCapital: 500, buyRange: [100, 500], sellRange: [200, 1200], roiRange: [75, 200],
    daysToSell: "2–7", risk: "LOW-MED", truckRequired: false, urgency: "evergreen",
    hotItems: [
      { model: "RTX 3080 Gaming PC (pre-built)", buy: "$500–$700", sell: "$900–$1,200", roi: "+60–100%" },
      { model: "PS5 Disc + 2 AAA Games", buy: "$350–$430", sell: "$500–$640", roi: "+20–75%" },
      { model: "Meta Quest 3 128GB", buy: "$200–$280", sell: "$380–$470", roi: "+60–100%" },
      { model: "Nintendo Switch OLED + games", buy: "$180–$250", sell: "$340–$440", roi: "+50–100%" },
    ],
  },

  // STOCKS ─────────────────────────────────────────────────────────────────────
  {
    id: "stocks-covered-calls", lane: "STOCKS",
    title: "Covered Call Income (CHPY / TDAX)",
    detail: "Sell covered calls on your existing holdings to collect premium every month. 1-3% monthly premium is normal on volatile names — that's 12-36% annualized on shares you're already holding.",
    action: "For every 100 shares you own, sell 1 covered call 1-2 strikes OTM expiring 30-45 days out. Collect premium immediately. Repeat each month. Check your broker for current call premiums.",
    minCapital: 0, maxCapital: 0,
    roiRange: [12, 36], risk: "LOW", timeframe: "Monthly",
    links: [
      { label: "Options Profit Calculator", url: "https://www.optionsprofitcalculator.com" },
      { label: "Tastytrade — Options", url: "https://www.tastytrade.com" },
      { label: "CHPY on Yahoo Finance", url: "https://finance.yahoo.com/quote/CHPY" },
    ],
    urgency: "evergreen", truckRequired: false,
  },
  {
    id: "stocks-swing-trade", lane: "STOCKS",
    title: "Momentum Swing Trade",
    detail: "Use $200-400 of checking for a 3-7 day swing trade on a stock breaking out with high relative volume. Target 15-25% gain. Cut losses immediately at -8-10% — no holding.",
    action: "Run the Finviz screener (link below). Filter: price $5-50, volume >500k, change >3%, above 50-day MA. Buy at market open on a clean breakout. Set a 20% target and -10% stop.",
    minCapital: 200, maxCapital: 500,
    roiRange: [15, 40], risk: "MED-HIGH", timeframe: "3–7 days",
    links: [
      { label: "Finviz Screener — Momentum", url: "https://finviz.com/screener.ashx?v=111&f=sh_avgvol_o500,sh_price_u50,ta_change_u3" },
      { label: "Unusual Whales — Options Flow", url: "https://unusualwhales.com" },
      { label: "Market Chameleon", url: "https://marketchameleon.com" },
    ],
    urgency: "evergreen", truckRequired: false,
  },
  {
    id: "stocks-gdxy-dividend", lane: "STOCKS",
    title: "GDXY Monthly Dividend Capture",
    detail: "GDXY pays monthly dividends from covered call premiums on gold miners. Current yield 35-50%+ annually. Buy before ex-dividend date, collect monthly income, hold or sell after.",
    action: "Check GDXY ex-dividend date (Yahoo Finance link). Buy at least 2 trading days before ex-div. Collect dividend. GDXY pays monthly — this compounds quickly if you hold.",
    minCapital: 50, maxCapital: 500,
    roiRange: [30, 50], risk: "MED", timeframe: "Monthly",
    links: [
      { label: "GDXY Dividend History", url: "https://finance.yahoo.com/quote/GDXY/history/?filter=div" },
      { label: "GDXY Quote + Chart", url: "https://finance.yahoo.com/quote/GDXY" },
      { label: "Ex-Dividend Calendar", url: "https://finance.yahoo.com/calendar/dividend" },
    ],
    urgency: "seasonal", truckRequired: false,
  },
  {
    id: "stocks-screener", lane: "STOCKS",
    title: "Stock Research Tools",
    detail: "These are the tools serious retail traders use. Finviz for scanning, Unusual Whales for tracking smart money options flow, MarketBeat for earnings calendar. Know before you trade.",
    action: "Bookmark all 3 links. Before any trade: check Unusual Whales for unusual options activity on the stock. Check Finviz for technical setup. Check earnings calendar so you're not blindsided.",
    minCapital: 0, maxCapital: 0,
    roiRange: [0, 0], risk: "LOW", timeframe: "Ongoing",
    links: [
      { label: "Finviz — Stock Screener", url: "https://finviz.com/screener.ashx" },
      { label: "Unusual Whales — Smart Money", url: "https://unusualwhales.com" },
      { label: "MarketBeat Earnings Calendar", url: "https://www.marketbeat.com/financial-calendar/earnings-reports/" },
    ],
    urgency: "evergreen", truckRequired: false,
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
    links: [
      { label: "Thumbtack — Create Pro Profile", url: "https://www.thumbtack.com/pro/" },
      { label: "Bark.com — Get Leads", url: "https://www.bark.com" },
      { label: "GigSalad", url: "https://www.gigsalad.com" },
    ],
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
        if (/^DATES:/i.test(line))
          return <div key={i} style={{ color: "#ffd700", marginTop: 2 }}>{line}</div>;
        if (/^LINK:/i.test(line)) {
          const url = line.match(/https?:\/\/[^\s)]+/)?.[0];
          const label = line.replace(/^LINK:\s*/i, "").replace(/https?:\/\/[^\s)]+/, "").trim() || url;
          return (
            <div key={i} style={{ marginTop: 4 }}>
              {url
                ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "#38bdf8", fontFamily: "monospace", fontSize: 11, textDecoration: "none", border: "1px solid #38bdf844", padding: "2px 9px", borderRadius: 4, background: "#38bdf808" }}>
                    🔗 {label || url}
                  </a>
                : <span style={{ color: "#555" }}>{line}</span>
              }
            </div>
          );
        }
        if (/^FIRST MOVE:/i.test(line))
          return <div key={i} style={{ color: "#ff8c00", fontWeight: 700, marginTop: 18, borderTop: "1px solid #1a1a1a", paddingTop: 14 }}>{line}</div>;
        if (line.trim() === "")
          return <div key={i} style={{ height: 4 }} />;
        return <div key={i} style={{ color: "#888" }}>{line}</div>;
      })}
    </div>
  );
}

// ── Unified Opportunity Card (collapsible) ────────────────────────────────────
function OppCard({ opp, liquid, onExecute, rank }) {
  const [open, setOpen] = useState(false);
  const laneColor = LANE_META[opp.lane]?.color || "#555";
  const isFB  = opp.lane === "FBMKT";
  const gap   = isFB
    ? (opp.buyRange[0] > 0 ? Math.max(0, opp.buyRange[0] - liquid) : 0)
    : (!opp.isService && opp.minCapital > 0 ? Math.max(0, opp.minCapital - liquid) : 0);
  const locked = gap > 0;

  const roiLabel = opp.isService
    ? `$${opp.hourlyRate[0]}–${opp.hourlyRate[1]}/hr`
    : `+${opp.roiRange[0]}–${opp.roiRange[1]}%`;

  const capitalLabel = isFB
    ? `$${opp.buyRange[0]}–$${opp.buyRange[1]}`
    : (opp.minCapital > 0 ? `$${opp.minCapital.toLocaleString()}${opp.maxCapital > opp.minCapital ? `–$${opp.maxCapital.toLocaleString()}` : ""}` : null);

  const scout = (term) =>
    window.open(`https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(term)}`, "_blank");

  return (
    <div style={{
      background: "#0a0a0a",
      border: `1px solid ${open ? laneColor + "66" : rank && rank <= 3 ? laneColor + "44" : "#1a1a1a"}`,
      borderRadius: 8,
      opacity: gap > 500 ? 0.55 : 1,
      overflow: "hidden",
    }}>
      {/* ── Compact header row (always visible) ── */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", cursor: "pointer", borderLeft: `3px solid ${laneColor}` }}
      >
        {rank && rank <= 3 && (
          <span style={{ color: laneColor, fontSize: 10, fontFamily: "monospace", fontWeight: 700, minWidth: 18, flexShrink: 0 }}>#{rank}</span>
        )}

        {/* Icon + title + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
            <span style={{ fontSize: 13 }}>{opp.icon || LANE_META[opp.lane]?.icon}</span>
            <span style={{ color: "#e8e8e8", fontWeight: 600, fontSize: 13, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{opp.title}</span>
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            <span style={{ color: laneColor, fontSize: 8, border: `1px solid ${laneColor}44`, padding: "1px 5px", borderRadius: 3, fontFamily: "monospace", letterSpacing: 1 }}>
              {LANE_META[opp.lane]?.label?.toUpperCase()}
            </span>
            {opp.urgency === "hot-now"  && <span style={{ color: "#ff3b3b", fontSize: 8, border: "1px solid #ff3b3b44", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>HOT</span>}
            {opp.urgency === "seasonal" && <span style={{ color: "#ffd700",  fontSize: 8, border: "1px solid #ffd70044", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>SEASONAL</span>}
            {opp.truckRequired          && <span style={{ color: "#38bdf8", fontSize: 8, border: "1px solid #38bdf844", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>TRUCK</span>}
          </div>
        </div>

        {/* Stats cluster */}
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#333", fontSize: 8, fontFamily: "monospace", letterSpacing: 1 }}>{opp.isService ? "RATE" : "ROI"}</div>
            <div style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>{roiLabel}</div>
          </div>
          {capitalLabel && (
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#333", fontSize: 8, fontFamily: "monospace", letterSpacing: 1 }}>BUY</div>
              <div style={{ color: locked ? "#ff3b3b" : "#777", fontSize: 11, fontFamily: "monospace" }}>{capitalLabel}</div>
            </div>
          )}
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#333", fontSize: 8, fontFamily: "monospace", letterSpacing: 1 }}>RISK</div>
            <div style={{ color: RISK_COLOR[opp.risk] || "#888", fontSize: 11, fontFamily: "monospace", fontWeight: 600 }}>{opp.risk}</div>
          </div>
        </div>

        {/* Execute button */}
        <button
          onClick={(e) => { e.stopPropagation(); if (!locked) onExecute(opp); }}
          style={{
            background: locked ? "transparent" : `${laneColor}18`,
            border: `1px solid ${locked ? "#1a1a1a" : laneColor}`,
            color: locked ? "#2a2a2a" : laneColor,
            fontFamily: "monospace", fontSize: 9, letterSpacing: 1,
            padding: "6px 11px", borderRadius: 4, cursor: locked ? "default" : "pointer", flexShrink: 0,
          }}
        >
          {locked ? `+$${gap}` : "GO →"}
        </button>

        <span style={{ color: "#2a2a2a", fontSize: 9, flexShrink: 0, display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▼</span>
      </div>

      {/* ── Expanded detail ── */}
      {open && (
        <div style={{ padding: "12px 14px 14px", borderTop: "1px solid #111" }}>
          <p style={{ color: "#666", fontSize: 12, lineHeight: 1.65, margin: "0 0 12px" }}>{opp.detail}</p>

          {/* Action plan */}
          {opp.action && (
            <div style={{ background: "#111", borderRadius: 5, padding: "9px 12px", marginBottom: 12, borderLeft: `3px solid ${laneColor}44` }}>
              <div style={{ color: "#333", fontSize: 8, letterSpacing: 2, marginBottom: 4, fontFamily: "monospace" }}>▶ ACTION</div>
              <div style={{ color: "#aaa", fontSize: 11, lineHeight: 1.7 }}>{opp.action}</div>
            </div>
          )}

          {/* Hot items table (FBMKT) */}
          {opp.hotItems?.length > 0 && (
            <div style={{ background: "#111", borderRadius: 5, padding: "9px 12px", marginBottom: 12, borderLeft: `3px solid ${laneColor}44` }}>
              <div style={{ color: "#333", fontSize: 8, letterSpacing: 2, marginBottom: 7, fontFamily: "monospace" }}>🔥 HOT ITEMS TO WATCH</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "monospace", fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ color: "#444", textAlign: "left", paddingBottom: 5, fontSize: 8, letterSpacing: 1, fontWeight: 500 }}>MODEL</th>
                    <th style={{ color: "#ff6b6b", textAlign: "right", paddingBottom: 5, fontSize: 8, fontWeight: 500 }}>BUY</th>
                    <th style={{ color: "#00ff88", textAlign: "right", paddingBottom: 5, fontSize: 8, fontWeight: 500 }}>SELL</th>
                    <th style={{ color: "#ffd700", textAlign: "right", paddingBottom: 5, fontSize: 8, fontWeight: 500 }}>ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {opp.hotItems.map((item, idx) => (
                    <tr key={idx} style={{ borderTop: "1px solid #1a1a1a" }}>
                      <td style={{ color: "#bbb", paddingTop: 5, paddingBottom: 5, paddingRight: 8 }}>{item.model}</td>
                      <td style={{ color: "#ff6b6b", textAlign: "right", paddingTop: 5 }}>{item.buy}</td>
                      <td style={{ color: "#00ff88", textAlign: "right", paddingTop: 5 }}>{item.sell}</td>
                      <td style={{ color: "#ffd700", textAlign: "right", paddingTop: 5 }}>{item.roi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Scout terms (FBMKT) */}
          {opp.searchTerms?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "#333", fontSize: 8, letterSpacing: 2, marginBottom: 6, fontFamily: "monospace" }}>🔍 SCOUT FB MARKETPLACE</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {opp.searchTerms.map(t => (
                  <button
                    key={t} onClick={() => scout(t)}
                    style={{
                      background: `${laneColor}10`, border: `1px solid ${laneColor}44`, color: laneColor,
                      fontFamily: "monospace", fontSize: 9, padding: "4px 9px", borderRadius: 3, cursor: "pointer",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Price ladder (FBMKT) */}
          {opp.buyRange && (
            <div style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <div style={{ color: "#333", fontSize: 8, fontFamily: "monospace", letterSpacing: 1, marginBottom: 2 }}>BUY RANGE</div>
                <div style={{ color: "#ff6b6b", fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>${opp.buyRange[0]}–${opp.buyRange[1]}</div>
              </div>
              <div style={{ color: "#222", fontSize: 14, marginBottom: 2 }}>→</div>
              <div>
                <div style={{ color: "#333", fontSize: 8, fontFamily: "monospace", letterSpacing: 1, marginBottom: 2 }}>SELL RANGE</div>
                <div style={{ color: "#00ff88", fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>${opp.sellRange[0]}–${opp.sellRange[1]}</div>
              </div>
              <div>
                <div style={{ color: "#333", fontSize: 8, fontFamily: "monospace", letterSpacing: 1, marginBottom: 2 }}>SELLS IN</div>
                <div style={{ color: "#aaa", fontSize: 12, fontFamily: "monospace" }}>{opp.daysToSell}d</div>
              </div>
            </div>
          )}

          {/* Timeframe (non-FBMKT) */}
          {opp.timeframe && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ color: "#333", fontSize: 8, fontFamily: "monospace", letterSpacing: 1, marginBottom: 2 }}>TIMEFRAME</div>
              <div style={{ color: "#888", fontSize: 11, fontFamily: "monospace" }}>{opp.timeframe}</div>
            </div>
          )}

          {/* Links */}
          {(opp.links || []).length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {opp.links.map(l => (
                <a
                  key={l.url} href={l.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    color: laneColor, fontSize: 9, fontFamily: "monospace",
                    border: `1px solid ${laneColor}44`, padding: "3px 8px", borderRadius: 3,
                    textDecoration: "none", background: `${laneColor}08`,
                  }}
                >
                  ↗ {l.label}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
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

  const liquid   = data.bankBalance || 0;
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
        "You are a street-smart financial advisor for a Phoenix AZ server/flipper with a pickup truck. Search the web for current prices, live event listings, and eBay sold comps before giving advice. Give specific, actionable advice based on real current data.",
        `MY SITUATION:
• Liquid cash (checking only, NOT selling stocks): $${liquid}
• Savings: $${data.savings || 0}
• Net worth trend: ${netWorthTrend}
• Flip history: ${flipSummary}
• Pickup truck: YES — Phoenix AZ, west valley
• Free days this week: ${Math.max(0, 7 - Math.min(freeThisWeek, 4))} days off
• Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
• Top scored opportunities for my capital: ${top3}

Search for: current eBay sold listings for electronics/GPUs, upcoming Phoenix AZ events (concerts, UFC, sports) with ticket prices on StubHub/SeatGeek, and current Facebook Marketplace prices for furniture/appliances in Phoenix.

Give me a NUMBERED 3-MOVE ACTION PLAN for THIS WEEK based on what you find. Pick moves that fit my capital. Format:

MOVE 1: [TITLE IN CAPS]
DO TODAY: [exact action — platform, what to search/click]
BUY: [exact item + platform + price from current listings]
SELL: [platform + price based on current comps]
NET PROFIT: $[X]–$[Y]
TIME: [hours]
DATES: [real dates from search]
LINK: [most direct URL]

MOVE 2: (same format)
MOVE 3: (same format)

FIRST MOVE: [one sentence — which to do first and why given I have $${liquid}]`,
        1800,
        true
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

  const FILTER_TABS = ["ALL", "FBMKT", "FLIP", "TICKETS", "TRUCK", "ARB", "SERVICE", "STOCKS"];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ color: "#ffd700", fontSize: 11, letterSpacing: 2 }}>OPPORTUNITY ENGINE</div>
          <div style={{ color: "#555", fontSize: 12, fontFamily: "monospace", marginTop: 4 }}>
            <span style={{ color: "#00ff88", fontWeight: 700 }}>${liquid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> checking ·{" "}
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
      {activeFilter === "ALL" && displayed.length > 0 ? (
        <>
          {/* Top 3 */}
          <div style={{ color: "#ffd700", fontSize: 9, letterSpacing: 2, fontFamily: "monospace", marginBottom: 12 }}>
            ⭐ TOP 3 PICKS — RANKED FOR YOUR SITUATION
          </div>
          <div style={{ display: "grid", gap: 14, marginBottom: displayed.length > 3 ? 28 : 0 }}>
            {displayed.slice(0, 3).map((opp, i) => (
              <OppCard key={opp.id} opp={opp} liquid={liquid} onExecute={executeOpp} rank={i + 1} />
            ))}
          </div>
          {/* Rest */}
          {displayed.length > 3 && (
            <>
              <div style={{ color: "#333", fontSize: 9, letterSpacing: 2, fontFamily: "monospace", marginBottom: 14, borderTop: "1px solid #1a1a1a", paddingTop: 16 }}>
                MORE OPPORTUNITIES — SORTED BY SCORE
              </div>
              <div style={{ display: "grid", gap: 14 }}>
                {displayed.slice(3).map(opp => (
                  <OppCard key={opp.id} opp={opp} liquid={liquid} onExecute={executeOpp} />
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {displayed.map(opp => (
            <OppCard key={opp.id} opp={opp} liquid={liquid} onExecute={executeOpp} />
          ))}
        </div>
      )}

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
