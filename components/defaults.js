const seedNetWorthHistory = () => {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (29 - i));
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      value: 4800 + Math.round(Math.sin(i * 0.4) * 300 + i * 40 + Math.random() * 150),
    };
  });
};

export const defaultState = {
  bankBalance: 3256.03,
  liquidCash: 3256.03,
  savings: 25.69,
  stocks: [
    { ticker: "CHPY", name: "Tidal Trust",    shares: 26.09,  buyPrice: 59.48, currentPrice: 59.54 },
    { ticker: "CHPY", name: "Tidal Trust II", shares: 4.987,  buyPrice: 59.48, currentPrice: 59.54 },
    { ticker: "GDXY", name: "Tidal Trust",    shares: 0.165,  buyPrice: 18.24, currentPrice: 18.075 },
    { ticker: "TDAX", name: "ETF Opport.",    shares: 15.486, buyPrice: 22.348, currentPrice: 22.5031 },
  ],
  shifts: [
    { date: "Feb 20", hours: 6, tips: 321.66, wage: 0 },
    { date: "Feb 22", hours: 6, tips: 207.84, wage: 0 },
    { date: "Feb 23", hours: 6, tips: 160.71, wage: 0 },
    { date: "Feb 24", hours: 6, tips: 333.90, wage: 0 },
    { date: "Feb 25", hours: 6, tips: 285.06, wage: 0 },
    { date: "Feb 27", hours: 6, tips: 342.57, wage: 0 },
  ],
  flips: [],
  netWorthHistory: seedNetWorthHistory(),
  schedule: [
    { date: "Mar 2",  day: "Mon", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 3",  day: "Tue", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 4",  day: "Wed", time: "4:30 PM",  role: "Patio Server", logged: false },
    { date: "Mar 6",  day: "Fri", time: "4:45 PM",  role: "Server",       logged: false },
    { date: "Mar 9",  day: "Mon", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 10", day: "Tue", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 11", day: "Wed", time: "4:30 PM",  role: "Patio Server", logged: false },
    { date: "Mar 13", day: "Fri", time: "4:45 PM",  role: "Server",       logged: false },
    { date: "Mar 15", day: "Sun", time: "5:00 PM",  role: "Server",       logged: false },
    { date: "Mar 16", day: "Mon", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 17", day: "Tue", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 18", day: "Wed", time: "4:30 PM",  role: "Patio Server", logged: false },
    { date: "Mar 20", day: "Fri", time: "4:45 PM",  role: "Server",       logged: false },
    { date: "Mar 23", day: "Mon", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 24", day: "Tue", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 25", day: "Wed", time: "4:30 PM",  role: "Patio Server", logged: false },
    { date: "Mar 27", day: "Fri", time: "4:45 PM",  role: "Server",       logged: false },
    { date: "Mar 30", day: "Mon", time: "3:00 PM",  role: "Server",       logged: false },
    { date: "Mar 31", day: "Tue", time: "3:00 PM",  role: "Server",       logged: false },
  ],
  goals: [
    { name: "Emergency Fund",    target: 5000,  current: 3256.03, autoKey: "bank" },
    { name: "Flip Capital Pool", target: 2000,  current: 500,     autoKey: "flips" },
    { name: "Stock Portfolio",   target: 10000, current: 2165.23, autoKey: "stocks" },
  ],
  expenses: [],
  budget: {
    "Food & Dining":    400,
    "Transportation":   150,
    "Entertainment":    200,
    "Shopping":         300,
    "Bills & Utilities":200,
    "Other":            150,
  },
};

export const generateOpportunities = (liquid) => {
  const opps = [
    {
      type: "🎟️ Ticket Flip",
      title: "Kendrick Lamar – Grand National Tour",
      detail: "Face value ~$180. Resale avg $420 on StubHub. Buy 2-4 tickets for ~$360-720 and flip within 2 weeks of show.",
      roi: "+133%",
      capital: Math.min(liquid, 720),
      risk: "MED",
      timeframe: "2–3 weeks",
      action: "Hit Ticketmaster drops on Tues 10am local. Use multiple accounts.",
    },
    {
      type: "📦 Item Flip",
      title: "RTX 5080 GPU Arbitrage",
      detail: "MSRP $999, selling $1,400–1,600 on eBay. Scalp from Best Buy / Newegg restocks.",
      roi: "+40–60%",
      capital: 999,
      risk: "MED",
      timeframe: "1–2 weeks",
      action: "Set restock alerts on NowInStock.net and r/buildapcsales.",
    },
    {
      type: "📦 Item Flip",
      title: "Jordan Retro Releases (April Drop)",
      detail: "Jordan 1 'Bred Reimagined' releasing April 12. Cop at $180, resell ~$380-500 based on comps.",
      roi: "+111–178%",
      capital: 180,
      risk: "MED-HIGH",
      timeframe: "1 week",
      action: "Enter SNKRS raffles, use Kick Game / Sole Supplier as backup. Bot optional.",
    },
    {
      type: "📈 Stocks & ETFs",
      title: "MSTR Leveraged Play",
      detail: "MicroStrategy is a leveraged Bitcoin proxy. With $400 you could buy 0.3 shares. High volatility = high upside.",
      roi: "Varies wildly",
      capital: 400,
      risk: "HIGH",
      timeframe: "Open-ended",
      action: "Buy on Robinhood/Webull. Set a stop-loss at -20% to cap downside.",
    },
    {
      type: "💡 Side Hustle",
      title: "Sell Serving Shift Insights / Catering Gigs",
      detail: "Private catering pays $25-40/hr cash. One 5-hr gig = $125-200 vs ~$86 on a typical restaurant shift.",
      roi: "+45-130% per hour",
      capital: 0,
      risk: "LOW",
      timeframe: "This weekend",
      action: "Post on Thumbtack, Bark.com, and local Facebook groups offering bartending/serving.",
    },
    {
      type: "🎟️ Ticket Flip",
      title: "UFC Pay-Per-View Premium Seats",
      detail: "PPV cards in Vegas have consistent 2–3x resale. $300 floor seats flip for $700-900.",
      roi: "+133–200%",
      capital: 300,
      risk: "MED",
      timeframe: "3–6 weeks",
      action: "Buy on Ticketmaster day-of-sale. Sell on Vivid Seats 1 week pre-fight.",
    },
  ].filter(o => o.capital <= liquid * 2);
  return opps.sort((a, b) => parseFloat(b.roi) - parseFloat(a.roi));
};
