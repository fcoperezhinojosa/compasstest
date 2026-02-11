import { angleDifference } from "@/hooks/useCompass";

export interface Challenge {
  type: string;
  target: number;
  instruction: string;
  detail: string;
  timeLimit: number;
  threshold: number;
  points: number;
}

export interface VoyageLeg {
  target: number;
  name: string;
  detail: string;
  timeLimit: number;
  threshold: number;
  points: number;
}

export interface VoyageRoute {
  name: string;
  description: string;
  legs: VoyageLeg[];
}

export interface ChallengeResult {
  success: boolean;
  points: number;
  accuracy: number;
}

export interface Stats {
  bestScore: number;
  challengesWon: number;
  totalPlayed: number;
}

const QUICK_PLAY_POOL: Challenge[] = [
  { type: "cardinal", target: 0, instruction: "Find the North!", detail: "Point your device towards North (0\u00b0)", timeLimit: 15, threshold: 15, points: 100 },
  { type: "cardinal", target: 90, instruction: "Find the East!", detail: "Point your device towards East (90\u00b0)", timeLimit: 15, threshold: 15, points: 100 },
  { type: "cardinal", target: 180, instruction: "Find the South!", detail: "Point your device towards South (180\u00b0)", timeLimit: 15, threshold: 15, points: 100 },
  { type: "cardinal", target: 270, instruction: "Find the West!", detail: "Point your device towards West (270\u00b0)", timeLimit: 15, threshold: 15, points: 100 },
  { type: "bearing", target: 45, instruction: "Navigate Northeast!", detail: "Find bearing 45\u00b0 (NE)", timeLimit: 12, threshold: 12, points: 150 },
  { type: "bearing", target: 135, instruction: "Navigate Southeast!", detail: "Find bearing 135\u00b0 (SE)", timeLimit: 12, threshold: 12, points: 150 },
  { type: "bearing", target: 225, instruction: "Navigate Southwest!", detail: "Find bearing 225\u00b0 (SW)", timeLimit: 12, threshold: 12, points: 150 },
  { type: "bearing", target: 315, instruction: "Navigate Northwest!", detail: "Find bearing 315\u00b0 (NW)", timeLimit: 12, threshold: 12, points: 150 },
  { type: "precision", target: 30, instruction: "Precise bearing: 30\u00b0", detail: "Navigate to exactly 30\u00b0 NNE", timeLimit: 10, threshold: 8, points: 200 },
  { type: "precision", target: 60, instruction: "Precise bearing: 60\u00b0", detail: "Navigate to exactly 60\u00b0 ENE", timeLimit: 10, threshold: 8, points: 200 },
  { type: "precision", target: 120, instruction: "Precise bearing: 120\u00b0", detail: "Navigate to exactly 120\u00b0 ESE", timeLimit: 10, threshold: 8, points: 200 },
  { type: "precision", target: 150, instruction: "Precise bearing: 150\u00b0", detail: "Navigate to exactly 150\u00b0 SSE", timeLimit: 10, threshold: 8, points: 200 },
  { type: "precision", target: 210, instruction: "Precise bearing: 210\u00b0", detail: "Navigate to exactly 210\u00b0 SSW", timeLimit: 10, threshold: 8, points: 200 },
  { type: "precision", target: 240, instruction: "Precise bearing: 240\u00b0", detail: "Navigate to exactly 240\u00b0 WSW", timeLimit: 10, threshold: 8, points: 200 },
  { type: "precision", target: 300, instruction: "Precise bearing: 300\u00b0", detail: "Navigate to exactly 300\u00b0 WNW", timeLimit: 10, threshold: 8, points: 200 },
  { type: "precision", target: 330, instruction: "Precise bearing: 330\u00b0", detail: "Navigate to exactly 330\u00b0 NNW", timeLimit: 10, threshold: 8, points: 200 },
];

export const VOYAGE_ROUTES: VoyageRoute[] = [
  {
    name: "Caribbean Run",
    description: "A classic island-hopping route through the Caribbean.",
    legs: [
      { target: 90, name: "Depart East", detail: "Leave port heading East (90\u00b0)", timeLimit: 15, threshold: 15, points: 100 },
      { target: 135, name: "Southeast to Barbados", detail: "Turn Southeast to 135\u00b0", timeLimit: 12, threshold: 12, points: 150 },
      { target: 270, name: "West to Jamaica", detail: "Come about! Head West (270\u00b0)", timeLimit: 15, threshold: 15, points: 100 },
      { target: 315, name: "Northwest to Cuba", detail: "Bear Northwest to 315\u00b0", timeLimit: 12, threshold: 12, points: 150 },
      { target: 0, name: "North to Home", detail: "Final leg! Head North (0\u00b0)", timeLimit: 15, threshold: 15, points: 200 },
    ],
  },
  {
    name: "Mediterranean Crossing",
    description: "Navigate the ancient trade routes of the Mediterranean.",
    legs: [
      { target: 180, name: "South from Gibraltar", detail: "Head South into the strait (180\u00b0)", timeLimit: 15, threshold: 15, points: 100 },
      { target: 90, name: "East along the coast", detail: "Turn East along Africa (90\u00b0)", timeLimit: 15, threshold: 15, points: 100 },
      { target: 45, name: "Northeast to Sardinia", detail: "Bear NE towards Sardinia (45\u00b0)", timeLimit: 12, threshold: 12, points: 150 },
      { target: 90, name: "East to Greece", detail: "Continue East to Greece (90\u00b0)", timeLimit: 12, threshold: 12, points: 150 },
      { target: 0, name: "North to Adriatic", detail: "Turn North to the Adriatic (0\u00b0)", timeLimit: 12, threshold: 12, points: 150 },
      { target: 270, name: "West to Home Port", detail: "Return West to home (270\u00b0)", timeLimit: 15, threshold: 15, points: 200 },
    ],
  },
  {
    name: "Pacific Storm Chase",
    description: "A daring route through Pacific squalls - be quick and precise!",
    legs: [
      { target: 225, name: "Southwest departure", detail: "Head SW into open water (225\u00b0)", timeLimit: 10, threshold: 10, points: 200 },
      { target: 180, name: "South through the storm", detail: "Turn South, brace yourself! (180\u00b0)", timeLimit: 8, threshold: 10, points: 250 },
      { target: 90, name: "East - eye of the storm", detail: "Quick! Head East (90\u00b0)", timeLimit: 8, threshold: 10, points: 250 },
      { target: 0, name: "North to safety", detail: "Break North to clear skies (0\u00b0)", timeLimit: 8, threshold: 10, points: 250 },
      { target: 315, name: "NW to harbor", detail: "NW to safe harbor (315\u00b0)", timeLimit: 10, threshold: 10, points: 300 },
    ],
  },
];

export function generateQuickPlay(count = 5): Challenge[] {
  const shuffled = [...QUICK_PLAY_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function getRandomVoyage(): VoyageRoute {
  return VOYAGE_ROUTES[Math.floor(Math.random() * VOYAGE_ROUTES.length)];
}

export function calculateAccuracy(
  currentHeading: number,
  targetBearing: number,
  threshold: number
): number {
  const diff = Math.abs(angleDifference(currentHeading, targetBearing));
  if (diff <= threshold) {
    return Math.round(100 - (diff / threshold) * 100);
  }
  const maxDiff = 180;
  return Math.max(0, Math.round((1 - diff / maxDiff) * 50));
}

export function isOnTarget(
  currentHeading: number,
  targetBearing: number,
  threshold: number
): boolean {
  const diff = Math.abs(angleDifference(currentHeading, targetBearing));
  return diff <= threshold;
}

export function calculateBonus(
  timeRemaining: number,
  timeLimit: number,
  accuracy: number
): number {
  const timeBonus = Math.round((timeRemaining / timeLimit) * 50);
  const accuracyBonus = Math.round((accuracy / 100) * 50);
  return timeBonus + accuracyBonus;
}

export function getStarRating(scorePercent: number): number {
  if (scorePercent >= 90) return 3;
  if (scorePercent >= 60) return 2;
  if (scorePercent >= 30) return 1;
  return 0;
}

export function loadStats(): Stats {
  try {
    const data = localStorage.getItem("compass-challenge-stats");
    return data
      ? JSON.parse(data)
      : { bestScore: 0, challengesWon: 0, totalPlayed: 0 };
  } catch {
    return { bestScore: 0, challengesWon: 0, totalPlayed: 0 };
  }
}

export function saveStats(stats: Stats): void {
  try {
    localStorage.setItem("compass-challenge-stats", JSON.stringify(stats));
  } catch {
    // Ignore storage errors
  }
}

export function getSuccessMessage(): string {
  const messages = [
    "On target!", "Well navigated!", "Steady as she goes!",
    "Perfect heading!", "Aye aye, Captain!", "Spot on!",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getFailMessage(): string {
  const messages = [
    "Lost at sea!", "Off course!", "Man overboard!",
    "Time's up!", "Wrong heading!", "Adrift!",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
