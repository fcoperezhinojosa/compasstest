"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCompass } from "@/hooks/useCompass";
import { useTargetTracking } from "@/hooks/useTargetTracking";
import CompassRose from "@/components/CompassRose";
import AccuracyMeter from "@/components/AccuracyMeter";
import TimerBar from "@/components/TimerBar";
import Feedback from "@/components/Feedback";
import {
  ChallengeResult,
  WindChallenge,
  SailingDifficulty,
  generateWindChallenges,
  getWindTarget,
  calculateBonus,
  getStarRating,
  loadStats,
  saveStats,
  getSuccessMessage,
  getFailMessage,
  SAILING_TUTORIAL_STEPS,
  POINTS_OF_SAIL,
} from "@/lib/challenges";
import styles from "@/app/page.module.css";

type Screen = "difficulty" | "tutorial" | "playing" | "results";

export default function EscuelaDeVela() {
  const router = useRouter();
  const compass = useCompass();

  useEffect(() => {
    compass.startListening();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [screen, setScreen] = useState<Screen>("difficulty");
  const [difficulty, setDifficulty] = useState<SailingDifficulty>("beginner");
  const [tutorialStep, setTutorialStep] = useState(0);
  const hasSeenTutorialRef = useRef(false);

  // Game state
  const [windChallenges, setWindChallenges] = useState<WindChallenge[]>([]);
  const [windIndex, setWindIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<ChallengeResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerDuration, setTimerDuration] = useState(20);
  const timeRemainingRef = useRef(0);

  const [feedback, setFeedback] = useState({
    visible: false,
    success: false,
    message: "",
    points: 0,
    sailingTip: "",
  });

  const currentWindChallenge =
    screen === "playing" && windChallenges[windIndex]
      ? windChallenges[windIndex]
      : null;

  const windTarget = currentWindChallenge
    ? getWindTarget(currentWindChallenge)
    : 0;

  // --- Difficulty selection ---
  const selectDifficulty = useCallback(
    (diff: SailingDifficulty) => {
      setDifficulty(diff);
      if (!hasSeenTutorialRef.current) {
        setTutorialStep(0);
        setScreen("tutorial");
      } else {
        startGame(diff);
      }
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // --- Start game ---
  const startGame = useCallback((diff: SailingDifficulty) => {
    const wc = generateWindChallenges(5, diff);
    setWindChallenges(wc);
    setWindIndex(0);
    setScore(0);
    setResults([]);
    setLocked(false);
    resetTracking();
    setTimerDuration(wc[0].timeLimit);
    setTimerRunning(true);
    setScreen("playing");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Complete a challenge ---
  const completeChallenge = useCallback(
    (success: boolean, acc: number) => {
      if (locked) return;
      setLocked(true);
      setTimerRunning(false);

      const wc = currentWindChallenge!;
      const bonus = success
        ? calculateBonus(timeRemainingRef.current, wc.timeLimit, acc)
        : 0;
      const pts = success ? wc.points + bonus : 0;
      const result: ChallengeResult = { success, points: pts, accuracy: acc };

      if (navigator.vibrate) {
        navigator.vibrate(success ? [100, 50, 100] : [300]);
      }

      setFeedback({
        visible: true,
        success,
        message: success ? getSuccessMessage() : getFailMessage(),
        points: pts,
        sailingTip: wc.sailingTip,
      });
      setScore((prev) => prev + pts);
      setResults((prev) => [...prev, result]);
    },
    [locked, currentWindChallenge],
  );

  // Target tracking via shared hook
  const { accuracy, reset: resetTracking } = useTargetTracking(
    compass.heading,
    currentWindChallenge ? windTarget : null,
    currentWindChallenge?.threshold ?? 20,
    !locked && timerRunning && screen === "playing",
    (acc) => completeChallenge(true, acc),
  );

  const handleTimerComplete = useCallback(() => {
    if (!locked) completeChallenge(false, 0);
  }, [locked, completeChallenge]);

  const handleTimerTick = useCallback((remaining: number) => {
    timeRemainingRef.current = remaining;
  }, []);

  const handleFeedbackDone = useCallback(() => {
    setFeedback((prev) => ({ ...prev, visible: false }));
    if (windIndex < windChallenges.length - 1) {
      const nextIdx = windIndex + 1;
      setWindIndex(nextIdx);
      resetTracking();
      setLocked(false);
      setTimerDuration(windChallenges[nextIdx].timeLimit);
      setTimerRunning(true);
    } else {
      setScreen("results");
    }
  }, [windIndex, windChallenges, resetTracking]);

  // Save stats when reaching results
  useEffect(() => {
    if (screen === "results" && results.length > 0) {
      const s = loadStats();
      s.totalPlayed++;
      s.challengesWon += results.filter((r) => r.success).length;
      if (score > s.bestScore) s.bestScore = score;
      saveStats(s);
    }
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const startNewGame = useCallback(() => {
    startGame(difficulty);
  }, [difficulty, startGame]);

  // ============================
  // RENDER
  // ============================

  // --- Difficulty selector ---
  if (screen === "difficulty") {
    return (
      <div className={styles.screen}>
        <div className={styles.topBar}>
          <button className={styles.btnIcon} onClick={() => router.push("/")}>
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
            onClick={() => selectDifficulty("beginner")}
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
            onClick={() => selectDifficulty("intermediate")}
          >
            <div className={styles.menuCardIcon}>&#9875;</div>
            <div className={styles.menuCardBody}>
              <h3 className={styles.menuCardTitle}>Intermedio</h3>
              <p className={styles.menuCardDesc}>
                Los 4 rumbos de vela. Tolerancia moderada, se muestra el rumbo
                objetivo.
              </p>
            </div>
            <div className={styles.menuCardArrow}>&rsaquo;</div>
          </div>

          <div
            className={styles.menuCard}
            onClick={() => selectDifficulty("advanced")}
          >
            <div className={styles.menuCardIcon}>&#127942;</div>
            <div className={styles.menuCardBody}>
              <h3 className={styles.menuCardTitle}>Avanzado</h3>
              <p className={styles.menuCardDesc}>
                Todos los rumbos, tolerancia ajustada, sin pistas. ¡Calcúlalo tú
                mismo!
              </p>
            </div>
            <div className={styles.menuCardArrow}>&rsaquo;</div>
          </div>
        </div>
      </div>
    );
  }

  // --- Tutorial ---
  if (screen === "tutorial") {
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
              {(
                Object.keys(POINTS_OF_SAIL) as Array<
                  keyof typeof POINTS_OF_SAIL
                >
              ).map((key) => {
                const p = POINTS_OF_SAIL[key];
                return (
                  <div key={key} className={styles.posCard}>
                    <span className={styles.posAngle}>
                      {p.angleFromWind}&deg;
                    </span>
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
                  startGame(difficulty);
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

  // --- Results ---
  if (screen === "results") {
    const labels = windChallenges.map((wc) => wc.instruction);
    const maxPossible = windChallenges.reduce(
      (sum, wc) => sum + wc.points + 100,
      0,
    );
    const stars =
      results.length > 0
        ? getStarRating((score / Math.max(maxPossible, 1)) * 100)
        : 0;

    return (
      <div className={styles.screen}>
        <div className={styles.resultsContent}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsIcon}>&#9978;</div>
            <h2>¡Lección de vela completada!</h2>
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
            <button className={styles.btnPrimary} onClick={startNewGame}>
              Jugar de nuevo
            </button>
            <button
              className={styles.btnOutline}
              onClick={() => router.push("/")}
            >
              Inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Wind Challenge (playing) ---
  if (!currentWindChallenge) return null;

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <button
          className={styles.btnIcon}
          onClick={() => {
            if (confirm("¿Abandonar este desafío? Se perderá el progreso."))
              router.push("/");
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
            Amura de{" "}
            {currentWindChallenge.tack === "starboard" ? "estribor" : "babor"}
          </span>
        </div>
        <div className={styles.instruction}>
          {currentWindChallenge.instruction}
        </div>
        <div className={styles.detail}>{currentWindChallenge.detail}</div>
        <div className={styles.posBadge}>
          {POINTS_OF_SAIL[currentWindChallenge.pointOfSail].angleFromWind}&deg;
          del viento
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
