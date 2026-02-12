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
  Challenge,
  ChallengeResult,
  generateQuickPlay,
  calculateBonus,
  getStarRating,
  loadStats,
  saveStats,
  getSuccessMessage,
  getFailMessage,
} from "@/lib/challenges";
import styles from "@/app/page.module.css";

type Screen = "playing" | "results";

export default function PartidaRapida() {
  const router = useRouter();
  const compass = useCompass();

  useEffect(() => {
    compass.startListening();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [screen, setScreen] = useState<Screen>("playing");
  const [challenges, setChallenges] = useState<Challenge[]>(() => generateQuickPlay(5));
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<ChallengeResult[]>([]);
  const [locked, setLocked] = useState(false);
  const [timerRunning, setTimerRunning] = useState(true);
  const [timerDuration, setTimerDuration] = useState(15);
  const timeRemainingRef = useRef(0);

  const [feedback, setFeedback] = useState({
    visible: false,
    success: false,
    message: "",
    points: 0,
    sailingTip: "",
  });

  // Set initial timer from first challenge
  useEffect(() => {
    if (challenges.length > 0) {
      setTimerDuration(challenges[0].timeLimit);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const currentChallenge = challenges[challengeIndex] || null;

  const completeChallenge = useCallback(
    (success: boolean, acc: number) => {
      if (locked) return;
      setLocked(true);
      setTimerRunning(false);

      const ch = currentChallenge!;
      const bonus = success
        ? calculateBonus(timeRemainingRef.current, ch.timeLimit, acc)
        : 0;
      const pts = success ? ch.points + bonus : 0;
      const result: ChallengeResult = { success, points: pts, accuracy: acc };

      if (navigator.vibrate) {
        navigator.vibrate(success ? [100, 50, 100] : [300]);
      }

      setFeedback({
        visible: true,
        success,
        message: success ? getSuccessMessage() : getFailMessage(),
        points: pts,
        sailingTip: "",
      });
      setScore((prev) => prev + pts);
      setResults((prev) => [...prev, result]);
    },
    [locked, currentChallenge],
  );

  // Target tracking via shared hook
  const { accuracy, reset: resetTracking } = useTargetTracking(
    compass.heading,
    currentChallenge?.target ?? null,
    currentChallenge?.threshold ?? 15,
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
    if (challengeIndex < challenges.length - 1) {
      const nextIdx = challengeIndex + 1;
      setChallengeIndex(nextIdx);
      resetTracking();
      setLocked(false);
      setTimerDuration(challenges[nextIdx].timeLimit);
      setTimerRunning(true);
    } else {
      setScreen("results");
    }
  }, [challengeIndex, challenges, resetTracking]);

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
    const ch = generateQuickPlay(5);
    setChallenges(ch);
    setChallengeIndex(0);
    setScore(0);
    setResults([]);
    setLocked(false);
    resetTracking();
    setTimerDuration(ch[0].timeLimit);
    setTimerRunning(true);
    setScreen("playing");
  }, [resetTracking]);

  // --- RENDER ---

  if (screen === "results") {
    const labels = challenges.map((c) => c.instruction);
    const maxPossible = challenges.reduce((sum, c) => sum + c.points + 100, 0);
    const stars =
      results.length > 0
        ? getStarRating((score / Math.max(maxPossible, 1)) * 100)
        : 0;

    return (
      <div className={styles.screen}>
        <div className={styles.resultsContent}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsIcon}>&#9978;</div>
            <h2>¡Desafío completado!</h2>
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

  if (!currentChallenge) return null;

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
        <div className={styles.instruction}>{currentChallenge.instruction}</div>
        <div className={styles.detail}>{currentChallenge.detail}</div>
        <div className={styles.counter}>
          {challengeIndex + 1} / {challenges.length}
        </div>
      </div>

      <CompassRose
        heading={compass.heading}
        targetBearing={currentChallenge.target}
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
