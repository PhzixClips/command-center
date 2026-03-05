// ── Time Constants ───────────────────────────────────────────────────────────
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR   = 60 * MS_PER_MINUTE;
export const MS_PER_DAY    = 24 * MS_PER_HOUR;

// ── App Defaults ─────────────────────────────────────────────────────────────
export const DEFAULT_HOURLY_WAGE    = 12.15;
export const DEFAULT_AVG_PER_SHIFT  = 275;
export const HISTORY_WINDOW         = 30;  // days of chart history to keep

// ── AI / Gemini ──────────────────────────────────────────────────────────────
export const AI_COOLDOWN_SECONDS    = 20;
export const AI_INSIGHT_MAX_TOKENS  = 1500;

// ── Stock Sync ───────────────────────────────────────────────────────────────
export const STOCK_STALE_THRESHOLD  = MS_PER_HOUR;  // 1 hour before auto-resync

// ── Budget / Backup ──────────────────────────────────────────────────────────
export const BACKUP_REMINDER_DAYS   = 7;
export const BUDGET_WARN_THRESHOLD  = 0.8;  // 80% of budget triggers warning
export const STALE_FLIP_DAYS        = 30;   // days before a listed flip is "stale"

// ── Tab Keys ─────────────────────────────────────────────────────────────────
export const TABS = ["overview", "income", "investments", "opportunities", "planning", "budget"];

// Map display names for the consolidated tabs
export const TAB_LABELS = {
  overview: "Overview",
  income: "Income",
  investments: "Investments",
  opportunities: "Opportunities",
  planning: "Planning",
  budget: "Budget",
};

// ── Day-of-Week Maps ─────────────────────────────────────────────────────────
export const SHORT_TO_FULL_DAY = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

// ── Flip Categories ──────────────────────────────────────────────────────────
export const FLIP_CATEGORIES = ["Shoes", "Electronics", "Clothing", "Collectibles", "Tickets", "Other"];

// ── Budget Categories ────────────────────────────────────────────────────────
export const BUDGET_CATEGORIES = ["Food & Dining", "Transportation", "Entertainment", "Shopping", "Bills & Utilities", "Other"];

// ── Goal Auto-Sync Keys ──────────────────────────────────────────────────────
export const GOAL_AUTO_LABELS = {
  bank:   "auto · checking",
  stocks: "auto · portfolio",
  flips:  "auto · flip profit",
};

// ── Notifications ────────────────────────────────────────────────────────────
export const NOTIFICATION_PERMISSION_GRANTED = "granted";
export const NOTIFICATION_PERMISSION_DENIED  = "denied";
