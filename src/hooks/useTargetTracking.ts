"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { calculateAccuracy, isOnTarget } from "@/lib/challenges";

const LOCK_DURATION = 1200;

export function useTargetTracking(
  heading: number,
  target: number | null,
  threshold: number,
  active: boolean,
  onLocked: (accuracy: number) => void,
) {
  const [accuracy, setAccuracy] = useState(0);
  const lockStartRef = useRef<number | null>(null);
  const lockedRef = useRef(false);
  const onLockedRef = useRef(onLocked);
  onLockedRef.current = onLocked;

  useEffect(() => {
    if (!active || target === null) {
      lockedRef.current = false;
      return;
    }
    if (lockedRef.current) return;

    const acc = calculateAccuracy(heading, target, threshold);
    setAccuracy(acc);

    if (isOnTarget(heading, target, threshold)) {
      if (!lockStartRef.current) lockStartRef.current = Date.now();
      if (Date.now() - lockStartRef.current >= LOCK_DURATION) {
        lockedRef.current = true;
        onLockedRef.current(acc);
      }
    } else {
      lockStartRef.current = null;
    }
  }, [heading, target, threshold, active]);

  const reset = useCallback(() => {
    setAccuracy(0);
    lockStartRef.current = null;
    lockedRef.current = false;
  }, []);

  return { accuracy, reset };
}
