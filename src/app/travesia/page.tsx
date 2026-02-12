"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCompass } from "@/hooks/useCompass";
import { useTargetTracking } from "@/hooks/useTargetTracking";
import CompassRose from "@/components/CompassRose";
import AccuracyMeter from "@/components/AccuracyMeter";
import TimerBar from "@/components/TimerBar";
import VoyageMap from "@/components/VoyageMap";
import {
  ChallengeResult,
  VoyageRoute,
  getRandomVoyage,
  calculateBonus,
  getStarRating,
  loadStats,
  saveStats,
} from "@/lib/challenges";
import styles from "@/app/page.module.css";

type Screen = "playing" | "results";

function createVoyage() {
  const route = getRandomVoyage();
  return {
    route,
    completed: new Array(route.legs.length).fill(false) as boolean[],
  };
}

export default function Travesia() {
  const router = useRouter();
  const compass = useCompass();

  useEffect(() => {
    compass.startListening();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [screen, setScreen] = useState<Screen>("playing");
  const [voyage, setVoyage] = useState<VoyageRoute>(() => createVoyage().route);
  const [voyageLeg, setVoyageLeg] = useState(0);
  const [voyageCompleted, setVoyageCompleted] = useState<boolean[]>(
    () => createVoyage().completed,
  );
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<ChallengeResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [timerRunning, setTimerRunning] = useState(true);
  const [timerDuration, setTimerDuration] = useState(15);
  const timeRemainingRef = useRef(0);

  // Synchronize initial voyage state
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      const { route, completed } = createVoyage();
      setVoyage(route);
      setVoyageCompleted(completed);
      setTimerDuration(route.legs[0].timeLimit);
    }
  }, []);

  const currentLeg = voyage.legs[voyageLeg] || null;

  const completeChallenge = useCallback(
    (success: boolean, acc: number) => {
      if (locked) return;
      setLocked(true);
      setTimerRunning(false);

      const leg = voyage.legs[voyageLeg];
      const bonus = success
        ? calculateBonus(timeRemainingRef.current, leg.timeLimit, acc)
        : 0;
      const pts = success ? leg.points + bonus : 0;
      const result: ChallengeResult = { success, points: pts, accuracy: acc };

      if (navigator.vibrate) {
        navigator.vibrate(success ? [100, 50, 100] : [300]);
      }

      setVoyageCompleted((prev) => {
        const next = [...prev];
        next[voyageLeg] = success;
        return next;
      });
      setScore((prev) => prev + pts);
      setResults((prev) => [...prev, result]);

      // Auto-advance after short delay (no feedback overlay)
      setTimeout(() => {
        if (voyageLeg < voyage.legs.length - 1) {
          const nextLeg = voyageLeg + 1;
          setVoyageLeg(nextLeg);
          resetTracking();
          setLocked(false);
          setTimerDuration(voyage.legs[nextLeg].timeLimit);
          setTimerRunning(true);
        } else {
          // Save stats
          const s = loadStats();
          s.totalPlayed++;
          const finalResults = [...results, result];
          s.challengesWon += finalResults.filter((r) => r.success).length;
          const finalScore = score + pts;
          if (finalScore > s.bestScore) s.bestScore = finalScore;
          saveStats(s);
          setScreen("results");
        }
      }, success ? 1000 : 1500);
    },
    [locked, voyage, voyageLeg, results, score], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Target tracking via shared hook
  const { accuracy, reset: resetTracking } = useTargetTracking(
    compass.heading,
    currentLeg?.target ?? null,
    currentLeg?.threshold ?? 15,
    !locked && timerRunning && screen === "playing",
    (acc) => completeChallenge(true, acc),
  );

  const handleTimerComplete = useCallback(() => {
    if (!locked) completeChallenge(false, 0);
  }, [locked, completeChallenge]);

  const handleTimerTick = useCallback((remaining: number) => {
    timeRemainingRef.current = remaining;
  }, []);

  const startNewGame = useCallback(() => {
    const { route, completed } = createVoyage();
    setVoyage(route);
    setVoyageLeg(0);
    setVoyageCompleted(completed);
    setScore(0);
    setResults([]);
    setLocked(false);
    resetTracking();
    setTimerDuration(route.legs[0].timeLimit);
    setTimerRunning(true);
    setScreen("playing");
  }, [resetTracking]);

  // --- RENDER ---

  if (screen === "results") {
    const labels = voyage.legs.map((l) => l.name);
    const maxPossible = voyage.legs.reduce(
      (sum, l) => sum + l.points + 100,
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
            <h2>¡{voyage.name} completada!</h2>
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

  if (!currentLeg) return null;

  return (
    <div className={styles.screen}>
      <div className={styles.topBar}>
        <button
          className={styles.btnIcon}
          onClick={() => {
            if (confirm("¿Abandonar esta travesía? Se perderá el progreso."))
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

      <VoyageMap
        totalLegs={voyage.legs.length}
        currentLeg={voyageLeg}
        completedLegs={voyageCompleted}
      />

      <div className={styles.challengeHeader}>
        <div className={styles.voyageLegLabel}>
          Etapa {voyageLeg + 1} de {voyage.legs.length}
        </div>
        <div className={styles.instruction}>{currentLeg.name}</div>
        <div className={styles.detail}>{currentLeg.detail}</div>
      </div>

      <CompassRose
        heading={compass.heading}
        targetBearing={currentLeg.target}
        showTarget
        locked={locked}
        size="compact"
      />

      <AccuracyMeter accuracy={accuracy} label="En rumbo" />
    </div>
  );
}
