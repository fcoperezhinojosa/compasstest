"use client";

import styles from "./AccuracyMeter.module.css";

interface AccuracyMeterProps {
  accuracy: number;
  label?: string;
}

export default function AccuracyMeter({
  accuracy,
  label = "Accuracy",
}: AccuracyMeterProps) {
  const colorClass =
    accuracy >= 80 ? styles.great : accuracy >= 50 ? styles.good : "";

  return (
    <div className={styles.meter}>
      <div className={styles.label}>{label}</div>
      <div className={styles.bar}>
        <div
          className={`${styles.fill} ${colorClass}`}
          style={{ width: `${Math.min(accuracy, 100)}%` }}
        />
      </div>
      <div className={styles.value}>{accuracy}%</div>
    </div>
  );
}
