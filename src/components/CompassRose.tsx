"use client";

import styles from "./CompassRose.module.css";

interface CompassRoseProps {
  heading: number;
  targetBearing?: number;
  showTarget?: boolean;
  locked?: boolean;
  size?: "normal" | "compact";
}

export default function CompassRose({
  heading,
  targetBearing,
  showTarget = false,
  locked = false,
  size = "normal",
}: CompassRoseProps) {
  return (
    <div className={`${styles.container} ${size === "compact" ? styles.compact : ""}`}>
      <div className={`${styles.frame} ${locked ? styles.locked : ""}`}>
        {showTarget && targetBearing !== undefined && (
          <div
            className={`${styles.targetIndicator} ${styles.active}`}
            style={{ transform: `rotate(${targetBearing}deg)` }}
          />
        )}
        <div
          className={styles.rose}
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          <div className={styles.dial}>
            <span className={`${styles.cardinal} ${styles.north}`}>N</span>
            <span className={`${styles.cardinal} ${styles.east}`}>E</span>
            <span className={`${styles.cardinal} ${styles.south}`}>S</span>
            <span className={`${styles.cardinal} ${styles.west}`}>W</span>
            <span className={`${styles.intercardinal} ${styles.ne}`}>NE</span>
            <span className={`${styles.intercardinal} ${styles.se}`}>SE</span>
            <span className={`${styles.intercardinal} ${styles.sw}`}>SW</span>
            <span className={`${styles.intercardinal} ${styles.nw}`}>NW</span>
            <div className={styles.tickMarks} />
          </div>
        </div>
        <div className={styles.needle} />
        <div className={styles.centerDot} />
      </div>
      <div className={styles.bearingDisplay}>
        <span className={styles.bearingValue}>{Math.round(heading)}</span>
        <span className={styles.bearingUnit}>&deg;</span>
      </div>
    </div>
  );
}
