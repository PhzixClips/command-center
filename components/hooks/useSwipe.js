import { useRef, useCallback, useState } from "react";

const SNAP_THRESHOLD   = 60;   // px drag needed to commit to tab switch
const VELOCITY_TRIGGER = 0.3;  // px/ms — fast flick also commits
const MAX_DRAG         = 300;  // max px the content can be dragged
const TRANSITION_MS    = 250;  // snap/bounce animation duration

export default function useSwipe(onSwipeLeft, onSwipeRight, containerRef) {
  const touchRef   = useRef(null);
  const dragging   = useRef(false);
  const [dragX, setDragX]       = useState(0);
  const [transitioning, setTransitioning] = useState(false);

  const onTouchStart = useCallback((e) => {
    // Don't hijack scrolling inside inputs, selects, etc.
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (transitioning) return;

    const t = e.touches[0];
    touchRef.current = {
      startX: t.clientX,
      startY: t.clientY,
      lastX: t.clientX,
      lastTime: Date.now(),
      locked: null, // null = undecided, "h" = horizontal, "v" = vertical
    };
    dragging.current = false;
  }, [transitioning]);

  const onTouchMove = useCallback((e) => {
    if (!touchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.startX;
    const dy = t.clientY - touchRef.current.startY;

    // Lock direction after 10px of movement
    if (!touchRef.current.locked) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        touchRef.current.locked = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
      }
      if (!touchRef.current.locked) return;
    }

    // If vertical scroll, bail completely
    if (touchRef.current.locked === "v") {
      touchRef.current = null;
      return;
    }

    // Horizontal drag — prevent vertical scroll and track
    e.preventDefault();
    dragging.current = true;

    // Apply rubber-band resistance at edges
    const clamped = Math.sign(dx) * Math.min(Math.abs(dx), MAX_DRAG);
    const resistance = Math.abs(clamped) > SNAP_THRESHOLD ? 0.4 : 1;
    const dampened = clamped * resistance + (clamped > 0
      ? Math.max(0, clamped - SNAP_THRESHOLD) * 0.6
      : Math.min(0, clamped + SNAP_THRESHOLD) * 0.6
    );

    // Actually just use simpler damping: linear up to threshold, then slow down
    const simpleDrag = Math.sign(dx) * Math.min(Math.abs(dx), MAX_DRAG) *
      (Math.abs(dx) > MAX_DRAG * 0.6 ? 0.5 : 1);

    touchRef.current.lastX = t.clientX;
    touchRef.current.lastTime = Date.now();

    setDragX(simpleDrag);
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!touchRef.current || !dragging.current) {
      touchRef.current = null;
      return;
    }

    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.startX;
    const velocity = Math.abs(dx) / Math.max(1, Date.now() - touchRef.current.lastTime);
    const committed = Math.abs(dx) > SNAP_THRESHOLD || velocity > VELOCITY_TRIGGER;

    touchRef.current = null;
    dragging.current = false;

    if (committed && dx !== 0) {
      // Animate off-screen then switch tab
      const direction = dx < 0 ? "left" : "right";
      const exitX = dx < 0 ? -window.innerWidth : window.innerWidth;

      setDragX(exitX);
      setTransitioning(true);

      setTimeout(() => {
        // Switch tab
        if (direction === "left") onSwipeLeft();
        else onSwipeRight();

        // Immediately position from opposite side
        setDragX(direction === "left" ? window.innerWidth : -window.innerWidth);

        // Next frame: animate to center
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setDragX(0);
            setTimeout(() => setTransitioning(false), TRANSITION_MS);
          });
        });
      }, TRANSITION_MS);
    } else {
      // Bounce back
      setDragX(0);
    }
  }, [onSwipeLeft, onSwipeRight]);

  // Style to apply to the container
  const swipeStyle = {
    transform: `translateX(${dragX}px)`,
    transition: dragging.current
      ? "none"
      : `transform ${TRANSITION_MS}ms cubic-bezier(0.25, 1, 0.5, 1)`,
    willChange: dragging.current ? "transform" : "auto",
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeStyle,
    dragX,
    transitioning,
  };
}
