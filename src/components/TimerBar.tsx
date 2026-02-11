"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./TimerBar.module.css";

interface TimerBarProps {
  duration: number; // seconds
  running: boolean;
  onComplete: () => void;
  onTick?: (remaining: number) => void;
}

export default function TimerBar({
  duration,
  running,
  onComplete,
  onTick,
}: TimerBarProps) {
  const [percent, setPercent] = useState(100);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!running) {
      startTimeRef.current = null;
      completedRef.current = false;
      setPercent(100);
      return;
    }

    completedRef.current = false;
    startTimeRef.current = Date.now();
    const totalMs = duration * 1000;

    const tick = () => {
      if (!startTimeRef.current || completedRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, totalMs - elapsed);
      const pct = (remaining / totalMs) * 100;
      setPercent(pct);
      onTick?.(remaining / 1000);

      if (remaining <= 0) {
        completedRef.current = true;
        onComplete();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [duration, running, onComplete, onTick]);

  const colorClass =
    percent < 20 ? styles.danger : percent < 40 ? styles.warning : "";

  return (
    <div className={styles.bar}>
      <div
        className={`${styles.fill} ${colorClass}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
