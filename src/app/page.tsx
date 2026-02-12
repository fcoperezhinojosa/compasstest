"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useCompass } from "@/hooks/useCompass";
import CompassRose from "@/components/CompassRose";
import AccuracyMeter from "@/components/AccuracyMeter";
import TimerBar from "@/components/TimerBar";
import Feedback from "@/components/Feedback";
import VoyageMap from "@/components/VoyageMap";
import {
  Challenge,
  ChallengeResult,
  VoyageRoute,
  WindChallenge,
  SailingDifficulty,
  generateQuickPlay,
  getRandomVoyage,
  generateWindChallenges,
  getWindTarget,
  calculateAccuracy,
  isOnTarget,
  calculateBonus,
  getStarRating,
  loadStats,
  saveStats,
  getSuccessMessage,
  getFailMessage,
  SAILING_TUTORIAL_STEPS,
  POINTS_OF_SAIL,
} from "@/lib/challenges";
import styles from "./page.module.css";

type Screen =
  | "desktop"
  | "permission"
  | "home"
  | "gameMenu"
  | "freeCompass"
  | "quickplay"
  | "voyage"
  | "sailingDifficulty"
  | "sailingTutorial"
  | "windChallenge"
  | "results";

const LOCK_DURATION = 1200;

export default function Home() {
  const compass = useCompass();

  const [screen, setScreen] = useState<Screen>("home");
  const [stats, setStats] = useState({ bestScore: 0, challengesWon: 0, totalPlayed: 0 });

  // Quick play state
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<ChallengeResult[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [locked, setLocked] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(15);
  const timeRemainingRef = useRef(0);
  const lockStartRef = useRef<number | null>(null);

  // Feedback state
  const [feedback, setFeedback] = useState({
    visible: false,
    success: false,
    message: "",
    points: 0,
    sailingTip: "",
  });

  // Voyage state
  const [voyage, setVoyage] = useState<VoyageRoute | null>(null);
  const [voyageLeg, setVoyageLeg] = useState(0);
  const [voyageCompleted, setVoyageCompleted] = useState<boolean[]>([]);

  // Wind / Sailing School state
  const [windChallenges, setWindChallenges] = useState<WindChallenge[]>([]);
  const [windIndex, setWindIndex] = useState(0);
  const [sailingDifficulty, setSailingDifficulty] = useState<SailingDifficulty>("beginner");
  const [tutorialStep, setTutorialStep] = useState(0);
  const hasSeenTutorialRef = useRef(false);

  // Game mode ref for results
  const gameModeRef = useRef<"quickplay" | "voyage" | "windChallenge">("quickplay");

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

  // --- Compass heading handler for challenges ---
  // For wind challenges, build a Challenge-like object from WindChallenge
  const currentWindChallenge =
    screen === "windChallenge" && windChallenges[windIndex]
      ? windChallenges[windIndex]
      : null;

  const windTarget = currentWindChallenge ? getWindTarget(currentWindChallenge) : 0;

  const currentChallenge =
    screen === "quickplay" && challenges[challengeIndex]
      ? challenges[challengeIndex]
      : screen === "voyage" && voyage
      ? voyage.legs[voyageLeg]
      : screen === "windChallenge" && currentWindChallenge
      ? {
          type: "wind",
          target: windTarget,
          instruction: currentWindChallenge.instruction,
          detail: currentWindChallenge.detail,
          timeLimit: currentWindChallenge.timeLimit,
          threshold: currentWindChallenge.threshold,
          points: currentWindChallenge.points,
        } as Challenge
      : null;

  useEffect(() => {
    if (!currentChallenge || locked || !timerRunning) return;

    const acc = calculateAccuracy(
      compass.heading,
      currentChallenge.target,
      currentChallenge.threshold
    );
    setAccuracy(acc);

    const onTgt = isOnTarget(
      compass.heading,
      currentChallenge.target,
      currentChallenge.threshold
    );

    if (onTgt) {
      if (!lockStartRef.current) {
        lockStartRef.current = Date.now();
      }
      if (Date.now() - lockStartRef.current >= LOCK_DURATION) {
        completeChallenge(true, acc);
      }
    } else {
      lockStartRef.current = null;
    }
  }, [compass.heading, currentChallenge, locked, timerRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Permission ---
  const handlePermission = useCallback(async () => {
    const granted = await compass.requestPermission();
    if (granted) {
      compass.startListening();
      setScreen("home");
    }
  }, [compass]);

  // --- Navigation ---
  const goHome = useCallback(() => {
    setTimerRunning(false);
    setLocked(false);
    lockStartRef.current = null;
    setStats(loadStats());
    setScreen("home");
  }, []);

  // --- Quick Play ---
  const startQuickPlay = useCallback(() => {
    gameModeRef.current = "quickplay";
    const ch = generateQuickPlay(5);
    setChallenges(ch);
    setChallengeIndex(0);
    setScore(0);
    setResults([]);
    setAccuracy(0);
    setLocked(false);
    lockStartRef.current = null;
    setTimerDuration(ch[0].timeLimit);
    setTimerRunning(true);
    setScreen("quickplay");
  }, []);

  // --- Voyage ---
  const startVoyage = useCallback(() => {
    gameModeRef.current = "voyage";
    const route = getRandomVoyage();
    setVoyage(route);
    setVoyageLeg(0);
    setVoyageCompleted(new Array(route.legs.length).fill(false));
    setScore(0);
    setResults([]);
    setAccuracy(0);
    setLocked(false);
    lockStartRef.current = null;
    setTimerDuration(route.legs[0].timeLimit);
    setTimerRunning(true);
    setScreen("voyage");
  }, []);

  // --- Sailing School ---
  const openSailingDifficulty = useCallback(() => {
    setScreen("sailingDifficulty");
  }, []);

  const selectSailingDifficulty = useCallback((diff: SailingDifficulty) => {
    setSailingDifficulty(diff);
    if (!hasSeenTutorialRef.current) {
      setTutorialStep(0);
      setScreen("sailingTutorial");
    } else {
      startSailingGame(diff);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startSailingGame = useCallback((diff: SailingDifficulty) => {
    gameModeRef.current = "windChallenge";
    const wc = generateWindChallenges(5, diff);
    setWindChallenges(wc);
    setWindIndex(0);
    setScore(0);
    setResults([]);
    setAccuracy(0);
    setLocked(false);
    lockStartRef.current = null;
    setTimerDuration(wc[0].timeLimit);
    setTimerRunning(true);
    setScreen("windChallenge");
  }, []);

  const startWindChallenge = useCallback(() => {
    startSailingGame(sailingDifficulty);
  }, [sailingDifficulty, startSailingGame]);

  // --- Complete a challenge/leg ---
  const completeChallenge = useCallback(
    (success: boolean, acc: number) => {
      if (locked) return;
      setLocked(true);
      setTimerRunning(false);
      lockStartRef.current = null;

      const ch = currentChallenge!;
      const bonus = success
        ? calculateBonus(timeRemainingRef.current, ch.timeLimit, acc)
        : 0;
      const pts = success ? ch.points + bonus : 0;
      const result: ChallengeResult = { success, points: pts, accuracy: acc };

      if (navigator.vibrate) {
        navigator.vibrate(success ? [100, 50, 100] : [300]);
      }

      if (screen === "voyage") {
        // Update voyage waypoints
        setVoyageCompleted((prev) => {
          const next = [...prev];
          next[voyageLeg] = success;
          return next;
        });

        setScore((prev) => prev + pts);
        setResults((prev) => [...prev, result]);

        // Short delay then advance
        setTimeout(() => {
          if (voyage && voyageLeg < voyage.legs.length - 1) {
            const nextLeg = voyageLeg + 1;
            setVoyageLeg(nextLeg);
            setAccuracy(0);
            setLocked(false);
            lockStartRef.current = null;
            setTimerDuration(voyage.legs[nextLeg].timeLimit);
            setTimerRunning(true);
          } else {
            showResults([...results, result], score + pts);
          }
        }, success ? 1000 : 1500);
      } else {
        // Quick play & wind challenge - show feedback overlay
        const tip = (screen === "windChallenge" && currentWindChallenge)
          ? currentWindChallenge.sailingTip
          : "";
        setFeedback({
          visible: true,
          success,
          message: success ? getSuccessMessage() : getFailMessage(),
          points: pts,
          sailingTip: tip,
        });
        setScore((prev) => prev + pts);
        setResults((prev) => [...prev, result]);
      }
    },
    [locked, currentChallenge, screen, voyage, voyageLeg, results, score] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Timer timeout
  const handleTimerComplete = useCallback(() => {
    if (!locked) {
      completeChallenge(false, 0);
    }
  }, [locked, completeChallenge]);

  // Timer tick
  const handleTimerTick = useCallback((remaining: number) => {
    timeRemainingRef.current = remaining;
  }, []);

  // Feedback done - advance to next challenge
  const handleFeedbackDone = useCallback(() => {
    setFeedback((prev) => ({ ...prev, visible: false }));

    if (gameModeRef.current === "windChallenge") {
      if (windIndex < windChallenges.length - 1) {
        const nextIdx = windIndex + 1;
        setWindIndex(nextIdx);
        setAccuracy(0);
        setLocked(false);
        lockStartRef.current = null;
        setTimerDuration(windChallenges[nextIdx].timeLimit);
        setTimerRunning(true);
      } else {
        setScreen("results");
      }
    } else {
      if (challengeIndex < challenges.length - 1) {
        const nextIdx = challengeIndex + 1;
        setChallengeIndex(nextIdx);
        setAccuracy(0);
        setLocked(false);
        lockStartRef.current = null;
        setTimerDuration(challenges[nextIdx].timeLimit);
        setTimerRunning(true);
      } else {
        setScreen("results");
      }
    }
  }, [challengeIndex, challenges, windIndex, windChallenges]);

  // --- Results ---
  const showResults = useCallback(
    (finalResults: ChallengeResult[], finalScore: number) => {
      // Save stats
      const s = loadStats();
      s.totalPlayed++;
      const wins = finalResults.filter((r) => r.success).length;
      s.challengesWon += wins;
      if (finalScore > s.bestScore) s.bestScore = finalScore;
      saveStats(s);
      setStats(s);
      setScreen("results");
    },
    []
  );

  // When quick play or wind challenge reaches results screen
  useEffect(() => {
    if (
      screen === "results" &&
      (gameModeRef.current === "quickplay" || gameModeRef.current === "windChallenge") &&
      results.length > 0
    ) {
      const s = loadStats();
      s.totalPlayed++;
      const wins = results.filter((r) => r.success).length;
      s.challengesWon += wins;
      if (score > s.bestScore) s.bestScore = score;
      saveStats(s);
      setStats(s);
    }
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Helpers ---
  const getLabels = (): string[] => {
    if (gameModeRef.current === "voyage" && voyage) {
      return voyage.legs.map((l) => l.name);
    }
    if (gameModeRef.current === "windChallenge") {
      return windChallenges.map((wc) => wc.instruction);
    }
    return challenges.map((c) => c.instruction);
  };

  const getMaxPossible = (): number => {
    if (gameModeRef.current === "voyage" && voyage) {
      return voyage.legs.reduce((sum, l) => sum + l.points + 100, 0);
    }
    if (gameModeRef.current === "windChallenge") {
      return windChallenges.reduce((sum, wc) => sum + wc.points + 100, 0);
    }
    return challenges.reduce((sum, c) => sum + c.points + 100, 0);
  };

  const stars =
    results.length > 0
      ? getStarRating((score / Math.max(getMaxPossible(), 1)) * 100)
      : 0;

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
              onClick={() => {
                compass.startListening();
                setScreen("freeCompass");
              }}
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
          <button className={styles.btnIcon} onClick={goHome}>
            &larr;
          </button>
          <span className={styles.topBarTitle}>Modo de juego</span>
          <span />
        </div>
        <div className={styles.menuContent}>
          <div
            className={styles.menuCard}
            onClick={startQuickPlay}
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
            onClick={startVoyage}
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
            onClick={openSailingDifficulty}
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

  // Sailing Difficulty Selector
  if (screen === "sailingDifficulty") {
    return (
      <div className={styles.screen}>
        <div className={styles.topBar}>
          <button className={styles.btnIcon} onClick={() => setScreen("gameMenu")}>
            &larr;
          </button>
          <span className={styles.topBarTitle}>Escuela de Vela</span>
          <span />
        </div>
        <div className={styles.menuContent}>
          <div className={styles.diffHeader}>
            <div className={styles.diffIcon}>&#9973;</div>
            <h2 className={styles.diffTitle}>Elige tu nivel</h2>
            <p className={styles.diffSubtitle}>
              Aprende los rumbos de vela a tu ritmo
            </p>
          </div>

          <div
            className={styles.menuCard}
            onClick={() => selectSailingDifficulty("beginner")}
          >
            <div className={styles.menuCardIcon}>&#127793;</div>
            <div className={styles.menuCardBody}>
              <h3 className={styles.menuCardTitle}>Principiante</h3>
              <p className={styles.menuCardDesc}>
                Través y popa. Gran tolerancia, con pistas.
              </p>
            </div>
            <div className={styles.menuCardArrow}>&rsaquo;</div>
          </div>

          <div
            className={styles.menuCard}
            onClick={() => selectSailingDifficulty("intermediate")}
          >
            <div className={styles.menuCardIcon}>&#9875;</div>
            <div className={styles.menuCardBody}>
              <h3 className={styles.menuCardTitle}>Intermedio</h3>
              <p className={styles.menuCardDesc}>
                Los 4 rumbos de vela. Tolerancia moderada, se muestra el rumbo objetivo.
              </p>
            </div>
            <div className={styles.menuCardArrow}>&rsaquo;</div>
          </div>

          <div
            className={styles.menuCard}
            onClick={() => selectSailingDifficulty("advanced")}
          >
            <div className={styles.menuCardIcon}>&#127942;</div>
            <div className={styles.menuCardBody}>
              <h3 className={styles.menuCardTitle}>Avanzado</h3>
              <p className={styles.menuCardDesc}>
                Todos los rumbos, tolerancia ajustada, sin pistas. ¡Calcúlalo tú mismo!
              </p>
            </div>
            <div className={styles.menuCardArrow}>&rsaquo;</div>
          </div>
        </div>
      </div>
    );
  }

  // Sailing Tutorial
  if (screen === "sailingTutorial") {
    const step = SAILING_TUTORIAL_STEPS[tutorialStep];
    const isLast = tutorialStep === SAILING_TUTORIAL_STEPS.length - 1;
    return (
      <div className={styles.screen}>
        <div className={styles.tutorialContent}>
          <div className={styles.tutorialProgress}>
            {SAILING_TUTORIAL_STEPS.map((_, i) => (
              <div
                key={i}
                className={`${styles.tutorialDot} ${
                  i === tutorialStep ? styles.tutorialDotActive : ""
                } ${i < tutorialStep ? styles.tutorialDotDone : ""}`}
              />
            ))}
          </div>
          <div className={styles.tutorialIcon}>{step.icon}</div>
          <h2 className={styles.tutorialTitle}>{step.title}</h2>
          <p className={styles.tutorialText}>{step.text}</p>

          {tutorialStep === 1 && (
            <div className={styles.posGrid}>
              {(Object.keys(POINTS_OF_SAIL) as Array<keyof typeof POINTS_OF_SAIL>).map((key) => {
                const p = POINTS_OF_SAIL[key];
                return (
                  <div key={key} className={styles.posCard}>
                    <span className={styles.posAngle}>{p.angleFromWind}&deg;</span>
                    <span className={styles.posName}>{p.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className={styles.tutorialActions}>
            {tutorialStep > 0 && (
              <button
                className={styles.btnOutline}
                onClick={() => setTutorialStep((s) => s - 1)}
              >
                Atrás
              </button>
            )}
            <button
              className={styles.btnPrimary}
              onClick={() => {
                if (isLast) {
                  hasSeenTutorialRef.current = true;
                  startSailingGame(sailingDifficulty);
                } else {
                  setTutorialStep((s) => s + 1);
                }
              }}
            >
              {isLast ? "¡A navegar!" : "Siguiente"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Free compass
  if (screen === "freeCompass") {
    return (
      <div className={styles.screen}>
        <div className={styles.topBar}>
          <button className={styles.btnIcon} onClick={goHome}>
            &larr;
          </button>
          <span className={styles.topBarTitle}>Brújula libre</span>
          <span />
        </div>
        <CompassRose heading={compass.heading} />
      </div>
    );
  }

  // Quick play
  if (screen === "quickplay" && challenges[challengeIndex]) {
    const ch = challenges[challengeIndex];
    return (
      <div className={styles.screen}>
        <div className={styles.topBar}>
          <button
            className={styles.btnIcon}
            onClick={() => {
              if (confirm("¿Abandonar este desafío? Se perderá el progreso.")) goHome();
            }}
          >
            &larr;
          </button>
          <TimerBar
            duration={timerDuration}
            running={timerRunning}
            onComplete={handleTimerComplete}
            onTick={handleTimerTick}
          />
          <div className={styles.scoreDisplay}>
            <span>{score}</span> ptos
          </div>
        </div>

        <div className={styles.challengeHeader}>
          <div className={styles.instruction}>{ch.instruction}</div>
          <div className={styles.detail}>{ch.detail}</div>
          <div className={styles.counter}>
            {challengeIndex + 1} / {challenges.length}
          </div>
        </div>

        <CompassRose
          heading={compass.heading}
          targetBearing={ch.target}
          showTarget
          locked={locked}
        />

        <AccuracyMeter accuracy={accuracy} />

        <Feedback
          visible={feedback.visible}
          success={feedback.success}
          message={feedback.message}
          points={feedback.points}
          onDone={handleFeedbackDone}
        />
      </div>
    );
  }

  // Voyage mode
  if (screen === "voyage" && voyage) {
    const leg = voyage.legs[voyageLeg];
    return (
      <div className={styles.screen}>
        <div className={styles.topBar}>
          <button
            className={styles.btnIcon}
            onClick={() => {
              if (confirm("¿Abandonar esta travesía? Se perderá el progreso.")) goHome();
            }}
          >
            &larr;
          </button>
          <TimerBar
            duration={timerDuration}
            running={timerRunning}
            onComplete={handleTimerComplete}
            onTick={handleTimerTick}
          />
          <div className={styles.scoreDisplay}>
            <span>{score}</span> ptos
          </div>
        </div>

        <VoyageMap
          totalLegs={voyage.legs.length}
          currentLeg={voyageLeg}
          completedLegs={voyageCompleted}
        />

        <div className={styles.challengeHeader}>
          <div className={styles.voyageLegLabel}>
            Etapa {voyageLeg + 1} de {voyage.legs.length}
          </div>
          <div className={styles.instruction}>{leg.name}</div>
          <div className={styles.detail}>{leg.detail}</div>
        </div>

        <CompassRose
          heading={compass.heading}
          targetBearing={leg.target}
          showTarget
          locked={locked}
          size="compact"
        />

        <AccuracyMeter accuracy={accuracy} label="En rumbo" />
      </div>
    );
  }

  // Wind Challenge
  if (screen === "windChallenge" && currentWindChallenge) {
    return (
      <div className={styles.screen}>
        <div className={styles.topBar}>
          <button
            className={styles.btnIcon}
            onClick={() => {
              if (confirm("¿Abandonar este desafío? Se perderá el progreso.")) goHome();
            }}
          >
            &larr;
          </button>
          <TimerBar
            duration={timerDuration}
            running={timerRunning}
            onComplete={handleTimerComplete}
            onTick={handleTimerTick}
          />
          <div className={styles.scoreDisplay}>
            <span>{score}</span> ptos
          </div>
        </div>

        <div className={styles.challengeHeader}>
          <div className={styles.windInfoBar}>
            <span className={styles.windInfoIcon}>&#127788;&#65039;</span>
            <span className={styles.windInfoText}>
              Viento del <strong>{currentWindChallenge.windLabel}</strong>
            </span>
            <span className={styles.windInfoOffset}>
              Amura de {currentWindChallenge.tack === "starboard" ? "estribor" : "babor"}
            </span>
          </div>
          <div className={styles.instruction}>{currentWindChallenge.instruction}</div>
          <div className={styles.detail}>{currentWindChallenge.detail}</div>
          <div className={styles.posBadge}>
            {POINTS_OF_SAIL[currentWindChallenge.pointOfSail].angleFromWind}&deg; del viento
          </div>
          <div className={styles.counter}>
            {windIndex + 1} / {windChallenges.length}
          </div>
        </div>

        <CompassRose
          heading={compass.heading}
          targetBearing={windTarget}
          showTarget
          locked={locked}
          windMode
          windDirection={currentWindChallenge.windDirection}
          destinationBearing={currentWindChallenge.targetBearing}
        />

        <AccuracyMeter accuracy={accuracy} label="En rumbo" />

        <Feedback
          visible={feedback.visible}
          success={feedback.success}
          message={feedback.message}
          points={feedback.points}
          onDone={handleFeedbackDone}
          sailingTip={feedback.sailingTip}
        />
      </div>
    );
  }

  // Results
  if (screen === "results") {
    const labels = getLabels();
    return (
      <div className={styles.screen}>
        <div className={styles.resultsContent}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsIcon}>&#9978;</div>
            <h2>
              {gameModeRef.current === "voyage" && voyage
                ? `¡${voyage.name} completada!`
                : gameModeRef.current === "windChallenge"
                ? "¡Lección de vela completada!"
                : "¡Desafío completado!"}
            </h2>
          </div>
          <div className={styles.resultsScore}>
            <span className={styles.resultsScoreValue}>{score}</span>
            <span className={styles.resultsScoreLabel}>Puntos totales</span>
          </div>
          <div className={styles.stars}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{ color: i < stars ? "#ffd700" : "#556688" }}
              >
                {i < stars ? "\u2605" : "\u2606"}
              </span>
            ))}
          </div>
          <div className={styles.breakdown}>
            {results.map((r, i) => (
              <div key={i} className={styles.resultRow}>
                <span className={styles.resultLabel}>
                  {labels[i] || `Desafío ${i + 1}`}
                </span>
                <span
                  className={`${styles.resultValue} ${
                    r.success ? styles.successText : styles.failText
                  }`}
                >
                  {r.success ? `+${r.points}` : "Fallido"}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.actions}>
            <button
              className={styles.btnPrimary}
              onClick={
                gameModeRef.current === "voyage"
                  ? startVoyage
                  : gameModeRef.current === "windChallenge"
                  ? startWindChallenge
                  : startQuickPlay
              }
            >
              Jugar de nuevo
            </button>
            <button className={styles.btnOutline} onClick={goHome}>
              Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
