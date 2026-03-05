import { useCallback } from "react";

/**
 * Opens a native mobile app.
 * - iOS: opens the App Store page (tap "Open" to launch the installed app).
 * - Android: uses intent:// with the package name to launch directly.
 * - Desktop: opens the fallback website URL.
 */
function openNativeApp(appLink) {
  if (!appLink) return;
  const ua = navigator.userAgent || "";
  const isAndroid = /android/i.test(ua);
  const isIOS = /iphone|ipad|ipod/i.test(ua);

  if (isAndroid && appLink.androidPackage) {
    window.location.href =
      `intent://#Intent;package=${appLink.androidPackage};launchFlags=0x10000000;end`;
  } else if (isIOS && appLink.iosAppId) {
    window.location.href = `https://apps.apple.com/app/id${appLink.iosAppId}`;
  } else if (appLink.fallbackUrl) {
    window.open(appLink.fallbackUrl, "_blank", "noopener");
  }
}

export default function StatCard({ label, value, sub, accent = "#00e676", appLink }) {
  const clickable = !!appLink;

  const handleClick = useCallback(() => {
    if (appLink) openNativeApp(appLink);
  }, [appLink]);

  const cardStyle = {
    background: "rgba(255,255,255,0.03)",
    backdropFilter: "blur(40px)",
    WebkitBackdropFilter: "blur(40px)",
    border: `1px solid ${accent}12`,
    borderRadius: 18,
    padding: "22px 24px",
    position: "relative",
    overflow: "hidden",
    boxShadow: `0 0 24px ${accent}04, 0 4px 16px rgba(0,0,0,0.25)`,
    ...(clickable ? { cursor: "pointer" } : {}),
  };

  return (
    <article
      aria-label={label}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? handleClick : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") handleClick(); } : undefined}
      style={cardStyle}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${accent}44, ${accent}15, transparent 70%)`,
      }} />
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>{label}</div>
      <div style={{ color: accent, fontSize: 24, fontWeight: 700, letterSpacing: -0.5 }}>{value}</div>
      {sub && <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 11, marginTop: 8, fontWeight: 400 }}>{sub}</div>}
    </article>
  );
}
