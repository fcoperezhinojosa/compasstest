"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCompass } from "@/hooks/useCompass";
import CompassRose from "@/components/CompassRose";
import styles from "@/app/page.module.css";

export default function BrujulaLibre() {
  const router = useRouter();
  const compass = useCompass();

  useEffect(() => {
    compass.startListening();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <button className={styles.btnIcon} onClick={() => router.push("/")}>
          &larr;
        </button>
        <span className={styles.topBarTitle}>Brújula libre</span>
        <span />
      </div>
      <CompassRose heading={compass.heading} />
    </div>
  );
}
