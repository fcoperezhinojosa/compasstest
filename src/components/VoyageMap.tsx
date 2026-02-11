"use client";

import styles from "./VoyageMap.module.css";

interface VoyageMapProps {
  totalLegs: number;
  currentLeg: number;
  completedLegs: boolean[];
}

export default function VoyageMap({
  totalLegs,
  currentLeg,
  completedLegs,
}: VoyageMapProps) {
  return (
    <div className={styles.map}>
      <div className={styles.progress}>
        {Array.from({ length: totalLegs }).map((_, i) => (
          <div key={i} className={styles.item}>
            {i > 0 && (
              <div
                className={`${styles.line} ${
                  completedLegs[i - 1] ? styles.lineCompleted : ""
                }`}
              />
            )}
            <div
              className={`${styles.waypoint} ${
                completedLegs[i]
                  ? styles.completed
                  : i === currentLeg
                  ? styles.active
                  : ""
              }`}
            >
              {i + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
