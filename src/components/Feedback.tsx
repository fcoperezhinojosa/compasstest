"use client";

import { useEffect } from "react";
import styles from "./Feedback.module.css";

interface FeedbackProps {
  visible: boolean;
  success: boolean;
  message: string;
  points: number;
  onDone: () => void;
  duration?: number;
  sailingTip?: string;
}

export default function Feedback({
  visible,
  success,
  message,
  points,
  onDone,
  duration = 1500,
  sailingTip,
}: FeedbackProps) {
  const tipDuration = sailingTip ? duration + 1500 : duration;

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDone, tipDuration);
    return () => clearTimeout(timer);
  }, [visible, onDone, tipDuration]);

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.icon}>{success ? "\u2713" : "\u2717"}</div>
      <div className={`${styles.text} ${success ? styles.success : styles.fail}`}>
        {message}
      </div>
      <div className={styles.points}>
        {success ? `+${points} puntos` : "Sin puntos"}
      </div>
      {sailingTip && (
        <div className={styles.tipBox}>
          <div className={styles.tipLabel}>Consejo de navegación</div>
          <div className={styles.tipText}>{sailingTip}</div>
        </div>
      )}
    </div>
  );
}
