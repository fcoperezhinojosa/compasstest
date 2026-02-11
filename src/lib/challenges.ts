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

// =========================================
// SAILING SCHOOL MODE (Educational)
// Based on: "Diseño de un juego móvil educativo
// de navegación a vela" pedagogical framework
// =========================================

export type SailingDifficulty = "beginner" | "intermediate" | "advanced";

export type PointOfSail =
  | "ceñida"     // Close-hauled ~45° from wind
  | "través"     // Beam reach ~90° from wind
  | "largo"      // Broad reach ~135° from wind
  | "popa";      // Running ~180° from wind

export interface PointOfSailInfo {
  name: PointOfSail;
  label: string;           // English display name
  angleFromWind: number;   // Angle relative to wind source
  description: string;     // What this point of sail means
  tip: string;             // Educational tip shown after challenge
}

export const POINTS_OF_SAIL: Record<PointOfSail, PointOfSailInfo> = {
  "ceñida": {
    name: "ceñida",
    label: "Close-Hauled (Ceñida)",
    angleFromWind: 45,
    description: "Sailing as close to the wind as possible (~45°). Requires zigzag tacking to go upwind.",
    tip: "Close-hauled (ceñida) is the closest angle you can sail toward the wind. Sailors zigzag (tack) to travel upwind since you can't sail directly into the wind!",
  },
  "través": {
    name: "través",
    label: "Beam Reach (Través)",
    angleFromWind: 90,
    description: "Wind blows from the side (~90°). Good speed and stability.",
    tip: "Beam reach (través) means the wind hits your boat from the side at 90°. This is often the fastest and most stable point of sail!",
  },
  "largo": {
    name: "largo",
    label: "Broad Reach (Largo)",
    angleFromWind: 135,
    description: "Wind comes from behind at an angle (~135°). Fast sailing.",
    tip: "Broad reach (largo) is sailing with the wind coming from behind at an angle. It's fast sailing — but watch for an accidental jibe (trasluchada)!",
  },
  "popa": {
    name: "popa",
    label: "Running (Popa)",
    angleFromWind: 180,
    description: "Wind blows directly from behind (~180°). Less speed from sail lift.",
    tip: "Running (popa) means the wind pushes from directly behind. The sails can't generate lift, so speed is actually lower than a broad reach. Be careful of jibing!",
  },
};

export interface WindChallenge {
  pointOfSail: PointOfSail;
  windDirection: number;     // absolute degrees where wind blows FROM
  windLabel: string;
  targetBearing: number;     // absolute bearing the player must achieve
  tack: "starboard" | "port"; // which side the wind hits
  timeLimit: number;
  threshold: number;
  points: number;
  instruction: string;
  detail: string;
  sailingTip: string;        // educational tip shown after challenge
  difficulty: SailingDifficulty;
}

function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

const DIRECTION_NAMES: Record<number, string> = {
  0: "North", 45: "Northeast", 90: "East", 135: "Southeast",
  180: "South", 225: "Southwest", 270: "West", 315: "Northwest",
};

function getWindLabel(deg: number): string {
  return DIRECTION_NAMES[normalizeAngle(deg)] || `${normalizeAngle(deg)}°`;
}

// Difficulty settings
const DIFFICULTY_CONFIG: Record<SailingDifficulty, {
  points: PointOfSail[];
  threshold: number;
  timeLimit: number;
  basePoints: number;
  showTarget: boolean;   // whether to show the exact target bearing as hint
}> = {
  beginner: {
    points: ["través", "popa"],
    threshold: 20,
    timeLimit: 20,
    basePoints: 150,
    showTarget: true,
  },
  intermediate: {
    points: ["ceñida", "través", "largo", "popa"],
    threshold: 15,
    timeLimit: 15,
    basePoints: 200,
    showTarget: true,
  },
  advanced: {
    points: ["ceñida", "través", "largo", "popa"],
    threshold: 10,
    timeLimit: 12,
    basePoints: 250,
    showTarget: false,
  },
};

export function generateWindChallenge(difficulty: SailingDifficulty = "beginner"): WindChallenge {
  const config = DIFFICULTY_CONFIG[difficulty];

  // Random wind direction from 8 compass points
  const windDirs = [0, 45, 90, 135, 180, 225, 270, 315];
  const windFrom = windDirs[Math.floor(Math.random() * windDirs.length)];

  // Random point of sail for this difficulty
  const pos = config.points[Math.floor(Math.random() * config.points.length)];
  const posInfo = POINTS_OF_SAIL[pos];

  // Random tack (starboard or port)
  const tack: "starboard" | "port" = Math.random() > 0.5 ? "starboard" : "port";

  // Calculate target bearing:
  // Wind FROM windFrom means wind blows toward (windFrom + 180)
  // Starboard tack: wind hits right side → boat heading = windFrom + angle
  // Port tack: wind hits left side → boat heading = windFrom - angle
  // For popa (180°), both tacks give same result
  const angleOffset = posInfo.angleFromWind;
  const targetBearing = normalizeAngle(
    tack === "starboard"
      ? windFrom + angleOffset
      : windFrom - angleOffset
  );

  // Build the instruction text
  const tackLabel = tack === "starboard" ? "starboard tack" : "port tack";
  const targetHint = config.showTarget ? ` → ${Math.round(targetBearing)}°` : "";
  const windName = getWindLabel(windFrom);

  return {
    pointOfSail: pos,
    windDirection: windFrom,
    windLabel: windName,
    targetBearing,
    tack,
    timeLimit: config.timeLimit,
    threshold: config.threshold,
    points: config.basePoints,
    instruction: `Sail ${posInfo.label}!`,
    detail: `Wind from ${windName} — ${tackLabel}${targetHint}`,
    sailingTip: posInfo.tip,
    difficulty,
  };
}

export function generateWindChallenges(
  count = 5,
  difficulty: SailingDifficulty = "beginner"
): WindChallenge[] {
  const challenges: WindChallenge[] = [];
  // Ensure variety: try not to repeat the same point of sail consecutively
  let lastPos: PointOfSail | null = null;
  for (let i = 0; i < count; i++) {
    let ch: WindChallenge;
    let attempts = 0;
    do {
      ch = generateWindChallenge(difficulty);
      attempts++;
    } while (ch.pointOfSail === lastPos && attempts < 10);
    lastPos = ch.pointOfSail;
    challenges.push(ch);
  }
  return challenges;
}

export function getWindTarget(challenge: WindChallenge): number {
  return challenge.targetBearing;
}

// Tutorial content for the sailing school
export const SAILING_TUTORIAL_STEPS = [
  {
    icon: "💨",
    title: "Read the Wind",
    text: "The cyan arrow on the compass shows where the wind blows FROM. Reading the wind is the first skill every sailor learns.",
  },
  {
    icon: "⛵",
    title: "Points of Sail",
    text: "Your angle relative to the wind determines your 'point of sail': Ceñida (45°), Través (90°), Largo (135°), or Popa (180°).",
  },
  {
    icon: "🧭",
    title: "Find the Heading",
    text: "Calculate the correct bearing from the wind direction + point of sail angle, then rotate your device to match!",
  },
  {
    icon: "⭐",
    title: "Hold Steady",
    text: "Keep your heading steady for 1.2 seconds to lock in. Accuracy and speed earn bonus points. Good luck, Captain!",
  },
];
