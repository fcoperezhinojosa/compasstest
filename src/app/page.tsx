"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCompass } from "@/hooks/useCompass";
import { loadStats } from "@/lib/challenges";
import styles from "./page.module.css";

type Screen = "desktop" | "permission" | "home" | "gameMenu";

export default function Home() {
  const router = useRouter();
  const compass = useCompass();

  const [screen, setScreen] = useState<Screen>("home");
  const [stats, setStats] = useState({ bestScore: 0, challengesWon: 0, totalPlayed: 0 });

  // --- Init ---
  useEffect(() => {
    if (!compass.isMobile) {
      setScreen("desktop");
      return;
    }
    if (!compass.isSupported) {
      setScreen("desktop");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const DOE = typeof window !== "undefined" ? (DeviceOrientationEvent as any) : null;
    if (DOE && typeof DOE.requestPermission === "function") {
      setScreen("permission");
    } else {
      compass.startListening();
      setScreen("home");
    }
    setStats(loadStats());
  }, [compass.isMobile, compass.isSupported]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh stats when returning to home
  useEffect(() => {
    if (screen === "home") {
      setStats(loadStats());
    }
  }, [screen]);

  // --- Permission ---
  const handlePermission = useCallback(async () => {
    const granted = await compass.requestPermission();
    if (granted) {
      compass.startListening();
      setScreen("home");
    }
  }, [compass]);

  // ============================
  // RENDER
  // ============================

  // Desktop blocker
  if (screen === "desktop") {
    return (
      <div className={styles.screen}>
        <div className={styles.centered}>
          <div className={styles.phoneIcon}>&#128241;</div>
          <h1 className={styles.titleAccent}>Solo para móvil</h1>
          <p className={styles.subtitle}>
            Esta aplicación requiere un dispositivo móvil con sensor de brújula.
          </p>
          <p className={styles.dim}>
            Por favor, abre esta página en tu teléfono o tableta.
          </p>
        </div>
      </div>
    );
  }

  // Permission screen
  if (screen === "permission") {
    return (
      <div className={styles.screen}>
        <div className={styles.centered}>
          <div className={styles.compassIconLarge}>&#9978;</div>
          <h1 className={styles.titleGradient}>Desafío de Brújula</h1>
          <p className={styles.subtitle}>Prueba de navegación a vela</p>
          <p className={styles.dim}>
            Esta aplicación necesita acceso al sensor de brújula de tu dispositivo.
          </p>
          <button className={styles.btnPrimary} onClick={handlePermission}>
            Activar brújula
          </button>
        </div>
      </div>
    );
  }

  // Home
  if (screen === "home") {
    return (
      <div className={styles.screen}>
        <div className={styles.homeContent}>
          <div className={styles.homeHeader}>
            <div className={styles.compassIconAnimated}>&#9978;</div>
            <h1 className={styles.titleGradient}>Desafío de Brújula</h1>
            <p className={styles.subtitle}>Prueba de navegación a vela</p>
          </div>
          <div className={styles.statsRow}>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{stats.bestScore}</span>
              <span className={styles.statLabel}>Mejor puntuación</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statValue}>{stats.challengesWon}</span>
              <span className={styles.statLabel}>Victorias</span>
            </div>
          </div>
          <div className={styles.actions}>
            <button className={styles.btnPrimary} onClick={() => setScreen("gameMenu")}>
              Jugar
            </button>
            <button
              className={styles.btnOutline}
              onClick={() => router.push("/brujula-libre")}
            >
              Brújula libre
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game Mode Menu
  if (screen === "gameMenu") {
    return (
      <div className={styles.screen}>
        <div className={styles.topBar}>
          <button className={styles.btnIcon} onClick={() => setScreen("home")}>
            &larr;
          </button>
          <span className={styles.topBarTitle}>Modo de juego</span>
          <span />
        </div>
        <div className={styles.menuContent}>
          <div
            className={styles.menuCard}
            onClick={() => router.push("/partida-rapida")}
          >
            <div className={styles.menuCardIcon}>&#9978;</div>
            <div className={styles.menuCardBody}>
              <h3 className={styles.menuCardTitle}>Partida rápida</h3>
              <p className={styles.menuCardDesc}>
                5 desafíos de brújula. ¡Encuentra el rumbo correcto antes de que se acabe el tiempo!
              </p>
            </div>
            <div className={styles.menuCardArrow}>&rsaquo;</div>
          </div>

          <div
            className={styles.menuCard}
            onClick={() => router.push("/travesia")}
          >
            <div className={styles.menuCardIcon}>&#9971;</div>
            <div className={styles.menuCardBody}>
              <h3 className={styles.menuCardTitle}>Modo Travesía</h3>
              <p className={styles.menuCardDesc}>
                Navega una ruta a vela de varias etapas por los mares.
              </p>
            </div>
            <div className={styles.menuCardArrow}>&rsaquo;</div>
          </div>

          <div
            className={styles.menuCard}
            onClick={() => router.push("/escuela-de-vela")}
          >
            <div className={`${styles.menuCardIcon} ${styles.windIcon}`}>&#9973;</div>
            <div className={styles.menuCardBody}>
              <h3 className={styles.menuCardTitle}>Escuela de Vela</h3>
              <p className={styles.menuCardDesc}>
                ¡Aprende los rumbos de vela! Domina la ceñida, el través, el largo y la popa.
              </p>
              <span className={styles.menuBadge}>NUEVO</span>
            </div>
            <div className={styles.menuCardArrow}>&rsaquo;</div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
