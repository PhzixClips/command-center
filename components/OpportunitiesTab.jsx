import { useState, useMemo } from "react";

// ── FB Marketplace search launcher ──────────────────────────────────────────
const launch = (term) =>
  window.open(
    `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(term)}`,
    "_blank"
  );

// ── Seasonal awareness ─────────────────────────────────────────────────────
const MONTH = new Date().getMonth(); // 0-indexed
const isSummer = MONTH >= 4 && MONTH <= 9;   // May–Oct
const isWinter = MONTH >= 10 || MONTH <= 2;  // Nov–Mar
const isHoliday = MONTH === 10 || MONTH === 11; // Nov–Dec

// ── Trending — rotates by season ────────────────────────────────────────────
const TRENDING = [
  ...(isSummer
    ? ["portable AC", "pool robot cleaner", "misting system"]
    : ["patio heater", "fire pit", "space heater"]),
  ...(isHoliday ? ["christmas decor", "inflatables"] : []),
  "free couch",
  "dewalt tools",
  "PS5",
].slice(0, 6);

// ── Deal type filters ───────────────────────────────────────────────────────
const DEAL_TYPES = [
  { key: "all",    label: "All",          icon: "" },
  { key: "quick",  label: "Quick Cash",   icon: "\uD83D\uDCB0" },
  { key: "margin", label: "High Margin",  icon: "\uD83D\uDCC8" },
  { key: "free",   label: "Free Stuff",   icon: "\uD83C\uDD93" },
  { key: "small",  label: "Small Items",  icon: "\uD83D\uDCE6" },
  { key: "large",  label: "Large Items",  icon: "\uD83D\uDE9A" },
];

// ── Category data ───────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "quick",
    icon: "\uD83D\uDD25",
    title: "Quick Cash",
    desc: "Same-day electronics & small items",
    tags: ["quick", "small"],
    items: [
      "AirPods", "iPad", "PS5", "Xbox", "Nintendo Switch",
      "gaming monitor", "gaming chair", "camera", "GoPro",
      "sound bar", "bluetooth speaker", "Apple Watch",
      "Meta Quest", "mechanical keyboard",
    ],
  },
  {
    id: "tools",
    icon: "\uD83D\uDEE0\uFE0F",
    title: "Tools & Contractor",
    desc: "High demand in the West Valley",
    tags: ["margin", "large"],
    items: [
      "dewalt tools", "milwaukee tools", "tool box", "tool chest",
      "air compressor", "pressure washer", "table saw", "miter saw",
      "shop vac", "drill press", "welder", "generator",
      "truck bed tool box", "scaffolding",
    ],
  },
  {
    id: "home",
    icon: "\uD83C\uDFE1",
    title: "Home & Outdoor",
    desc: "Furniture, patio, and yard",
    tags: ["margin", "large"],
    items: [
      "patio furniture", "patio sectional", "outdoor sofa", "outdoor dining set",
      "pergola", "gazebo", "shade canopy", "fire pit", "propane fire table",
      "patio heater", "washer dryer", "refrigerator",
      ...(isSummer ? ["misting system", "shade sail"] : ["space heater", "fireplace insert"]),
    ],
  },
  {
    id: "pool",
    icon: "\uD83C\uDF0A",
    title: "Pool & Summer",
    desc: "Arizona-specific seasonal",
    tags: ["margin", "large"],
    items: [
      "pool pump", "pool filter", "pool robot cleaner", "pool vacuum",
      "pool heater", "pool cover roller", "above ground pool", "pool equipment",
      "portable AC", "window AC", "swamp cooler", "mini split AC",
      ...(isSummer ? ["evaporative cooler", "misting fan"] : ["pool cover", "pool enclosure"]),
    ],
  },
  {
    id: "free",
    icon: "\uD83C\uDD93",
    title: "Free & Clearance",
    desc: "Best ROI — near zero cost",
    tags: ["free", "large"],
    items: [
      "free couch", "free furniture", "free dresser", "free appliances",
      "free bed frame", "free desk", "free tv", "curb alert",
      "moving sale", "estate sale", "must go today", "garage sale",
      "free washer", "free scrap metal",
    ],
  },
  {
    id: "fitness",
    icon: "\uD83C\uDFCB\uFE0F",
    title: "Fitness Equipment",
    desc: "People buy motivation, sell cheap",
    tags: ["margin", "large"],
    items: [
      "dumbbells", "adjustable dumbbells", "squat rack", "barbell set",
      "treadmill", "peloton", "bowflex", "exercise bike",
      "weight bench", "rowing machine", "elliptical", "kettlebells",
    ],
  },
  {
    id: "vehicle",
    icon: "\uD83D\uDE9A",
    title: "Vehicle & Truck Parts",
    desc: "Arizona truck culture = fast sales",
    tags: ["margin", "small"],
    items: [
      "truck bed cover", "roof rack", "rims", "tires",
      "lift kit", "bed extender", "tonneau cover", "bull bar",
      "LED light bar", "trailer hitch", "truck toolbox", "running boards",
    ],
  },
];

// ── Main Component ──────────────────────────────────────────────────────────
export default function OpportunitiesTab() {
  const [expandedId, setExpandedId] = useState(null);
  const [dealType, setDealType] = useState("all");

  const filtered = useMemo(() => {
    if (dealType === "all") return CATEGORIES;
    return CATEGORIES.filter((c) => c.tags.includes(dealType));
  }, [dealType]);

  return (
    <div style={{ paddingBottom: 32 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          color: "#fff", fontSize: 22, fontWeight: 700, letterSpacing: -0.5,
        }}>
          Deal Launcher
        </div>
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 2 }}>
          Phoenix AZ &middot; tap to snipe Marketplace
        </div>
      </div>

      {/* Trending */}
      <div style={{ marginBottom: 22 }}>
        <div style={{
          color: "rgba(255,255,255,0.25)", fontSize: 10, fontWeight: 600,
          letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10,
        }}>
          {isSummer ? "Hot Right Now" : isHoliday ? "Holiday Flips" : "Trending Flips"}
        </div>
        <div style={{
          display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4,
          WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
        }}>
          {TRENDING.map((t) => (
            <button
              key={t}
              onClick={() => launch(t)}
              style={{
                flexShrink: 0,
                background: "rgba(255,59,59,0.06)",
                border: "1px solid rgba(255,59,59,0.15)",
                color: "#ff6b6b", fontSize: 13, fontWeight: 500,
                padding: "10px 16px", borderRadius: 12, cursor: "pointer",
                WebkitTapHighlightColor: "transparent", whiteSpace: "nowrap",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Deal type filters */}
      <div style={{
        display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2,
        marginBottom: 18, WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
      }}>
        {DEAL_TYPES.map((dt) => {
          const active = dealType === dt.key;
          return (
            <button
              key={dt.key}
              onClick={() => { setDealType(dt.key); setExpandedId(null); }}
              style={{
                flexShrink: 0,
                background: active ? "rgba(0,230,118,0.08)" : "rgba(255,255,255,0.02)",
                border: active ? "1px solid rgba(0,230,118,0.2)" : "1px solid rgba(255,255,255,0.05)",
                color: active ? "#00e676" : "rgba(255,255,255,0.3)",
                fontSize: 12, fontWeight: active ? 600 : 400,
                padding: "8px 14px", borderRadius: 10, cursor: "pointer",
                WebkitTapHighlightColor: "transparent", whiteSpace: "nowrap",
              }}
            >
              {dt.icon ? `${dt.icon} ${dt.label}` : dt.label}
            </button>
          );
        })}
      </div>

      {/* Categories */}
      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map((cat) => {
          const expanded = expandedId === cat.id;
          return (
            <div
              key={cat.id}
              style={{
                background: expanded ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                borderRadius: 16, overflow: "hidden",
                transition: "background 0.15s",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {/* Card header */}
              <div
                onClick={() => setExpandedId(expanded ? null : cat.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px 18px", cursor: "pointer",
                }}
              >
                <div style={{
                  fontSize: 26, width: 44, height: 44,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "rgba(255,255,255,0.04)", borderRadius: 12, flexShrink: 0,
                }}>
                  {cat.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>
                    {cat.title}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 2 }}>
                    {cat.desc}
                    <span style={{ color: "rgba(255,255,255,0.12)", margin: "0 6px" }}>&middot;</span>
                    {cat.items.length} searches
                  </div>
                </div>
                <div style={{
                  color: "rgba(255,255,255,0.15)", fontSize: 11,
                  transition: "transform 0.2s",
                  transform: expanded ? "rotate(180deg)" : "none",
                  flexShrink: 0,
                }}>
                  &#9660;
                </div>
              </div>

              {/* Expanded search list */}
              {expanded && (
                <div style={{ padding: "0 14px 16px 14px", display: "grid", gap: 6 }}>
                  {/* Quick-launch all button */}
                  <button
                    onClick={() => launch(cat.items[0])}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: 6, background: "rgba(0,230,118,0.05)",
                      border: "1px solid rgba(0,230,118,0.12)",
                      color: "#00e676", fontSize: 12, fontWeight: 600,
                      padding: "11px 0", borderRadius: 10, cursor: "pointer",
                      marginBottom: 4, WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    SCAN {cat.title.toUpperCase()}
                  </button>

                  {cat.items.map((item) => (
                    <div
                      key={item}
                      onClick={() => launch(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && launch(item)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        background: "rgba(255,255,255,0.025)", borderRadius: 10,
                        padding: "13px 14px", cursor: "pointer",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <span style={{
                        color: "rgba(255,255,255,0.8)", fontSize: 14,
                        fontWeight: 500, flex: 1,
                      }}>
                        {item}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.12)", fontSize: 14, flexShrink: 0 }}>
                        &rsaquo;
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{
          textAlign: "center", padding: "40px 20px",
          color: "rgba(255,255,255,0.2)", fontSize: 13,
        }}>
          No categories match this filter
        </div>
      )}
    </div>
  );
}
