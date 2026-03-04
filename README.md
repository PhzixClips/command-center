# Capital Command

Personal finance intelligence dashboard for side-hustlers. Track serving shifts, flip items, manage a stock portfolio, and get AI-powered insights — all in one place.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173/command-center/](http://localhost:5173/command-center/)

## Setup

### Gemini API Key (optional, enables AI features)

1. Get a free key at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Click the gear icon in the app header
3. Paste your key and save

The key is stored in your browser's localStorage only — never sent to any external server.

### Hourly Wage

Configure your base hourly wage in Settings (gear icon). Default is $12.15. This is used to calculate tip breakdowns when logging shifts.

## Features

- **Shift Tracking** — Log hours + total earned, auto-calculates tips. Grouped by week with earnings-by-day analytics.
- **Flip Tracker** — Track buy/sell prices, platform fees, ROI, and days-to-sell. Category breakdowns.
- **Stock Portfolio** — Add positions, auto-sync prices, set price alerts.
- **Budget & Expenses** — Monthly budgets by category, CSV bank statement import with auto-categorization, recurring expense detection.
- **AI Daily Card** — Gemini-powered daily priority recommendation.
- **Dollar Deployer** — AI-driven capital allocation across buffer/emergency/flip/invest/spend buckets.
- **Live Opportunity Alerts** — Web-searched real-time flip and investment opportunities.
- **AI Money Brief** — Personalized financial coaching insights.
- **30-Day Charts** — Net worth, liquid capital, shift earnings, portfolio value, and projected income.
- **Goal Tracking** — Set financial goals with auto-sync from checking/portfolio/flips.
- **Opportunities Library** — Curated 30+ flip opportunities with links, ROI ranges, and action plans.

## Tech Stack

- **React 18** + **Vite 5**
- **Recharts** for charts
- **PapaParse** for CSV import
- **Google Gemini API** for AI features
- **localStorage** for persistence (no backend required)

## Architecture

```
App.jsx                  — Main orchestrator: state, routing, modals, core calculations
components/
  gemini.js              — Gemini API client (30s timeout, search grounding)
  storage.js             — Abstracted storage (localStorage fallback)
  parseJSON.js           — Robust JSON extraction from AI responses
  useGeminiCooldown.js   — Rate-limiting hook for AI calls
  ErrorBoundary.jsx      — React error boundary (per-section crash isolation)
  defaults.js            — Demo/seed data
  StatCard.jsx           — Metric display card
  DailyCard.jsx          — AI daily priority card
  ChartPanel.jsx         — 30-day historical charts
  AlertsFeed.jsx         — Live opportunity alerts
  DollarDeployer.jsx     — AI capital allocation
  ScheduleTab.jsx        — Work schedule management
  BudgetTab.jsx          — Budget tracking & expense management
  CSVImport.jsx          — Bank statement CSV import wizard
  OpportunitiesTab.jsx   — Curated flip opportunities library
  OpportunityCard.jsx    — Opportunity card component
  FAB.jsx                — Floating action button
  Modal.jsx              — Dialog component (Escape to close, click-outside dismiss)
  Input.jsx              — Form input with validation
  Btn.jsx                — Styled button with disabled state
```

## Deployment

Deployed to GitHub Pages via GitHub Actions on push to `main`. The build output goes to `/dist` at base path `/command-center/`.

```bash
npm run build    # Produces dist/
npm run preview  # Preview production build locally
```

## Data

All data is stored in your browser's localStorage under the key `fcc-data`. Use the Export JSON button on the overview tab to back up your data. Import it back anytime with the Import JSON button.
