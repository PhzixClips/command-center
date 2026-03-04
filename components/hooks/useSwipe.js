import { useRef, useCallback, useState } from "react";

const SNAP_THRESHOLD   = 50;   // px drag to commit
const VELOCITY_TRIGGER = 0.4;  // px/ms flick speed to commit
const MAX_DRAG         = 280;  // max drag distance
const TRANSITION_MS    = 220;  // animation duration

export default function useSwipe(onSwipeLeft, onSwipeRight) {
  const touchRef = useRef(null);
  const [dragX, setDragX]               = useState(0);
  const [isDragging, setIsDragging]     = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const onTouchStart = useCallback((e) => {
    // Skip form elements and ongoing transitions
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON") return;
    if (transitioning) return;

    const t = e.touches[0];
    touchRef.current = {
      startX: t.clientX,
      startY: t.clientY,
      startTime: Date.now(),
      locked: null,
    };
  }, [transitioning]);

  const onTouchMove = useCallback((e) => {
    if (!touchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;

    // Decide direction lock after small movement
    if (!touchRef.current.locked) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        touchRef.current.locked = Math.abs(dx) >= Math.abs(dy) ? "h" : "v";
      }
      if (!touchRef.current.locked) return;
    }

    // Vertical scroll — release completely
    if (touchRef.current.locked === "v") {
      touchRef.current = null;
      return;
    }

    // Horizontal drag
    e.preventDefault();
    if (!isDragging) setIsDragging(true);

    // Rubber-band damping: full response up to threshold, then resistance
    const absDx = Math.abs(dx);
    const damped = absDx <= MAX_DRAG * 0.5
      ? dx
      : Math.sign(dx) * (MAX_DRAG * 0.5 + (absDx - MAX_DRAG * 0.5) * 0.35);

    setDragX(damped);
  }, [isDragging]);

  const onTouchEnd = useCallback((e) => {
    if (!touchRef.current) return;

    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.startX;
    const dt = Date.now() - touchRef.current.startTime;
    const velocity = Math.abs(dx) / Math.max(1, dt);
    const committed = (Math.abs(dx) > SNAP_THRESHOLD || velocity > VELOCITY_TRIGGER) && isDragging;

    touchRef.current = null;

    if (committed && dx !== 0) {
      const direction = dx < 0 ? "left" : "right";
      const exitX = dx < 0 ? -window.innerWidth * 0.7 : window.innerWidth * 0.7;

      // Phase 1: slide current content off
      setIsDragging(false);
      setDragX(exitX);
      setTransitioning(true);

      setTimeout(() => {
        // Phase 2: switch tab, position new content off-screen on the entry side
        if (direction === "left") onSwipeLeft();
        else onSwipeRight();

        const entryX = direction === "left" ? window.innerWidth * 0.5 : -window.innerWidth * 0.5;
        setDragX(entryX);

        // Phase 3: next frame — animate new content to center
        requestAnimationFrame(() => {
          setDragX(0);
          setTimeout(() => setTransitioning(false), TRANSITION_MS);
        });
      }, TRANSITION_MS);
    } else {
      // Bounce back
      setIsDragging(false);
      setDragX(0);
    }
  }, [isDragging, onSwipeLeft, onSwipeRight]);

  // Style: no transition during active drag (instant tracking), smooth transition otherwise
  const swipeStyle = dragX === 0 && !isDragging && !transitioning
    ? {}
    : {
        transform: `translate3d(${dragX}px, 0, 0)`,
        transition: isDragging
          ? "none"
          : `transform ${TRANSITION_MS}ms cubic-bezier(0.25, 1, 0.5, 1)`,
      };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeStyle,
    transitioning,
  };
}
