import { useRef, useCallback, useState } from "react";

const SNAP_THRESHOLD   = 40;   // px drag to commit
const VELOCITY_TRIGGER = 0.3;  // px/ms flick to commit
const TRANSITION_MS    = 300;  // settle animation (iOS uses ~350ms)

/**
 * iOS-style swipe: tracks drag state so the caller can render
 * both current + adjacent pages side-by-side during the gesture.
 *
 * Returns:
 *   dragX          – current horizontal offset (px)
 *   swipeDirection – "left" | "right" | null (which way content is moving)
 *   phase          – "idle" | "dragging" | "settling"
 *   settle()       – call after switching tab to animate new page to center
 *   handlers       – { onTouchStart, onTouchMove, onTouchEnd }
 */
export default function useSwipe(tabIndex, tabCount) {
  const touchRef = useRef(null);
  const [dragX, setDragX]   = useState(0);
  const [phase, setPhase]   = useState("idle");       // idle | dragging | settling
  const [direction, setDir] = useState(null);          // "left" | "right" | null
  const commitRef           = useRef(null);            // which direction was committed

  const onTouchStart = useCallback((e) => {
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON") return;
    if (phase === "settling") return;

    touchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      startTime: Date.now(),
      locked: null,
    };
  }, [phase]);

  const onTouchMove = useCallback((e) => {
    if (!touchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;

    // Direction lock
    if (!touchRef.current.locked) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        touchRef.current.locked = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
      }
      if (!touchRef.current.locked) return;
    }
    if (touchRef.current.locked === "v") { touchRef.current = null; return; }

    e.preventDefault();

    // Clamp at edges: if swiping right on first tab or left on last, add heavy resistance
    const atLeftEdge  = tabIndex === 0 && dx > 0;
    const atRightEdge = tabIndex === tabCount - 1 && dx < 0;
    const dampened    = (atLeftEdge || atRightEdge)
      ? dx * 0.15                     // rubber-band at edges
      : dx;                           // 1:1 tracking in the middle

    if (phase !== "dragging") setPhase("dragging");
    setDir(dx < 0 ? "left" : dx > 0 ? "right" : null);
    setDragX(dampened);
  }, [phase, tabIndex, tabCount]);

  const onTouchEnd = useCallback((e) => {
    if (!touchRef.current || phase !== "dragging") {
      touchRef.current = null;
      return;
    }

    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dt = Date.now() - touchRef.current.startTime;
    const velocity = Math.abs(dx) / Math.max(1, dt);
    const committed = Math.abs(dx) > SNAP_THRESHOLD || velocity > VELOCITY_TRIGGER;

    touchRef.current = null;

    // Check edge: can't commit if at boundary
    const atEdge = (tabIndex === 0 && dx > 0) || (tabIndex === tabCount - 1 && dx < 0);

    if (committed && !atEdge && dx !== 0) {
      // Commit: slide both pages to final position
      const dir = dx < 0 ? "left" : "right";
      commitRef.current = dir;
      setPhase("settling");
      // Animate to exactly one viewport width
      setDragX(dir === "left" ? -window.innerWidth : window.innerWidth);
    } else {
      // Bounce back
      setPhase("settling");
      setDragX(0);
      setTimeout(() => {
        setPhase("idle");
        setDir(null);
        commitRef.current = null;
      }, TRANSITION_MS);
    }
  }, [phase, tabIndex, tabCount]);

  // Called by App after it switches the active tab
  const settle = useCallback(() => {
    // Tab has changed — reset to center with no animation
    setDragX(0);
    setPhase("idle");
    setDir(null);
    commitRef.current = null;
  }, []);

  return {
    dragX,
    swipeDirection: direction,
    phase,
    committed: commitRef.current,
    settle,
    transitionMs: TRANSITION_MS,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
