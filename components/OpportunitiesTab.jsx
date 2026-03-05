import { useState } from "react";

// ── FB Marketplace search launcher ──────────────────────────────────────────
const launch = (term) =>
  window.open(
    `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(term)}`,
    "_blank"
  );

// ── Trending searches (Phoenix AZ) ─────────────────────────────────────────
const TRENDING = [
  "portable AC",
  "patio furniture",
  "free couch",
  "gaming chair",
  "washer dryer",
];

// ── Category data ───────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "outdoor",
    icon: "\u{1F3DC}\uFE0F",
    title: "Outdoor Living",
    items: [
      "patio furniture", "patio sectional", "fire pit", "propane fire table",
      "pergola", "gazebo", "shade canopy", "patio heater", "outdoor sofa",
      "outdoor dining set",
    ],
  },
  {
    id: "pool",
    icon: "\u{1F3CA}",
    title: "Pool & Backyard Gear",
    items: [
      "pool pump", "pool filter", "pool robot cleaner", "pool vacuum",
      "above ground pool", "pool heater", "pool ladder", "pool cover roller",
      "pool floats bulk", "pool equipment",
    ],
  },
  {
    id: "free",
    icon: "\u{1F193}",
    title: "Free / Moving Sales",
    items: [
      "free couch", "free dresser", "free furniture", "free appliances",
      "curb alert", "moving sale", "estate sale", "must go today",
      "free bed frame", "free desk",
    ],
  },
  {
    id: "appliances",
    icon: "\u{1F3E0}",
    title: "Appliances & Cooling",
    items: [
      "portable AC", "window AC", "swamp cooler", "mini fridge",
      "washer dryer", "refrigerator", "freezer", "microwave",
      "air fryer", "toaster oven",
    ],
  },
  {
    id: "electronics",
    icon: "\u{1F3AE}",
    title: "Electronics / Quick Flips",
    items: [
      "PS5", "Xbox", "Nintendo Switch", "gaming chair", "gaming monitor",
      "sound bar", "bluetooth speaker", "AirPods", "iPad", "GoPro",
    ],
  },
];

// ── Styles ──────────────────────────────────────────────────────────────────
const S = {
  heading: {
    color: "#fff",
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  sub: {
    color: "rgba(255,255,255,0.3)",
    fontSize: 12,
    marginTop: 2,
  },
  trendingWrap: {
    display: "flex",
    gap: 8,
    overflowX: "auto",
    paddingBottom: 4,
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
  },
  trendingChip: {
    flexShrink: 0,
    background: "rgba(255,59,59,0.06)",
    border: "1px solid rgba(255,59,59,0.15)",
    color: "#ff6b6b",
    fontSize: 13,
    fontWeight: 500,
    padding: "10px 16px",
    borderRadius: 12,
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    whiteSpace: "nowrap",
  },
  card: (expanded) => ({
    background: expanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
    borderRadius: 16,
    overflow: "hidden",
    transition: "background 0.15s",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
  }),
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "18px 18px",
  },
  cardIcon: {
    fontSize: 28,
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    flexShrink: 0,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: 600,
  },
  cardCount: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 12,
    marginTop: 2,
  },
  chevron: (expanded) => ({
    marginLeft: "auto",
    color: "rgba(255,255,255,0.15)",
    fontSize: 11,
    transition: "transform 0.2s",
    transform: expanded ? "rotate(180deg)" : "none",
    flexShrink: 0,
  }),
  itemList: {
    padding: "0 14px 16px 14px",
    display: "grid",
    gap: 6,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(255,255,255,0.025)",
    borderRadius: 10,
    padding: "14px 14px",
    cursor: "pointer",
    WebkitTapHighlightColor: "transparent",
    transition: "background 0.1s",
  },
  itemText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
    fontWeight: 500,
    flex: 1,
  },
  itemArrow: {
    color: "rgba(255,255,255,0.12)",
    fontSize: 14,
    flexShrink: 0,
  },
};

// ── Main Component ──────────────────────────────────────────────────────────
export default function OpportunitiesTab() {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={S.heading}>Deal Launcher</div>
        <div style={S.sub}>Phoenix AZ &middot; tap to search Marketplace</div>
      </div>

      {/* Trending */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          color: "rgba(255,255,255,0.25)",
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 10,
        }}>
          Trending Flips
        </div>
        <div style={S.trendingWrap}>
          {TRENDING.map((t) => (
            <button key={t} onClick={() => launch(t)} style={S.trendingChip}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div style={{ display: "grid", gap: 10 }}>
        {CATEGORIES.map((cat) => {
          const expanded = expandedId === cat.id;
          return (
            <div key={cat.id} style={S.card(expanded)}>
              {/* Card header */}
              <div
                style={S.cardHeader}
                onClick={() => setExpandedId(expanded ? null : cat.id)}
              >
                <div style={S.cardIcon}>{cat.icon}</div>
                <div>
                  <div style={S.cardTitle}>{cat.title}</div>
                  <div style={S.cardCount}>{cat.items.length} searches</div>
                </div>
                <div style={S.chevron(expanded)}>&#9660;</div>
              </div>

              {/* Expanded search list */}
              {expanded && (
                <div style={S.itemList}>
                  {cat.items.map((item) => (
                    <div
                      key={item}
                      style={S.item}
                      onClick={() => launch(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && launch(item)}
                    >
                      <span style={S.itemText}>{item}</span>
                      <span style={S.itemArrow}>&rsaquo;</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
