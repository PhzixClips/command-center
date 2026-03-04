import { useRef, useCallback } from "react";

const SWIPE_THRESHOLD = 50;   // min px to count as swipe
const SWIPE_MAX_Y     = 80;   // max vertical drift before ignoring
const SWIPE_MAX_MS    = 400;  // max time for a swipe gesture

export default function useSwipe(onSwipeLeft, onSwipeRight) {
  const touchRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!touchRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    const dt = Date.now() - touchRef.current.time;
    touchRef.current = null;

    // Must be a horizontal-dominant, fast enough swipe
    if (dt > SWIPE_MAX_MS) return;
    if (Math.abs(dy) > SWIPE_MAX_Y) return;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;

    if (dx < 0) onSwipeLeft();
    else onSwipeRight();
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchEnd };
}
