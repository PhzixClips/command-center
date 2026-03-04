import { useState, useRef, useCallback } from "react";

/**
 * Hook that wraps an async function with a cooldown period to prevent API spam.
 * @param {Function} fn - The async function to wrap
 * @param {number} cooldownMs - Cooldown period in milliseconds (default 15s)
 * @returns {{ execute: Function, loading: boolean, onCooldown: boolean, cooldownLeft: number }}
 */
export default function useGeminiCooldown(fn, cooldownMs = 15000) {
  const [loading, setLoading] = useState(false);
  const [onCooldown, setOnCooldown] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const timerRef = useRef(null);
  const intervalRef = useRef(null);

  const execute = useCallback(async (...args) => {
    if (loading || onCooldown) return;
    setLoading(true);
    try {
      await fn(...args);
    } finally {
      setLoading(false);
      setOnCooldown(true);
      setCooldownLeft(Math.ceil(cooldownMs / 1000));

      intervalRef.current = setInterval(() => {
        setCooldownLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timerRef.current = setTimeout(() => {
        setOnCooldown(false);
        setCooldownLeft(0);
      }, cooldownMs);
    }
  }, [fn, loading, onCooldown, cooldownMs]);

  return { execute, loading, onCooldown, cooldownLeft };
}
