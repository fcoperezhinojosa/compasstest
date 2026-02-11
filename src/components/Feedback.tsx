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
}

export default function Feedback({
  visible,
  success,
  message,
  points,
  onDone,
  duration = 1500,
}: FeedbackProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDone, duration);
    return () => clearTimeout(timer);
  }, [visible, onDone, duration]);

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.icon}>{success ? "\u2713" : "\u2717"}</div>
      <div className={`${styles.text} ${success ? styles.success : styles.fail}`}>
        {message}
      </div>
      <div className={styles.points}>
        {success ? `+${points} points` : "No points"}
      </div>
    </div>
  );
}
