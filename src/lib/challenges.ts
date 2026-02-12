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
  { type: "cardinal", target: 0, instruction: "¡Encuentra el Norte!", detail: "Apunta tu dispositivo hacia el Norte (0°)", timeLimit: 15, threshold: 15, points: 100 },
  { type: "cardinal", target: 90, instruction: "¡Encuentra el Este!", detail: "Apunta tu dispositivo hacia el Este (90°)", timeLimit: 15, threshold: 15, points: 100 },
  { type: "cardinal", target: 180, instruction: "¡Encuentra el Sur!", detail: "Apunta tu dispositivo hacia el Sur (180°)", timeLimit: 15, threshold: 15, points: 100 },
  { type: "cardinal", target: 270, instruction: "¡Encuentra el Oeste!", detail: "Apunta tu dispositivo hacia el Oeste (270°)", timeLimit: 15, threshold: 15, points: 100 },
  { type: "bearing", target: 45, instruction: "¡Navega al Noreste!", detail: "Encuentra el rumbo 45° (NE)", timeLimit: 12, threshold: 12, points: 150 },
  { type: "bearing", target: 135, instruction: "¡Navega al Sureste!", detail: "Encuentra el rumbo 135° (SE)", timeLimit: 12, threshold: 12, points: 150 },
  { type: "bearing", target: 225, instruction: "¡Navega al Suroeste!", detail: "Encuentra el rumbo 225° (SO)", timeLimit: 12, threshold: 12, points: 150 },
  { type: "bearing", target: 315, instruction: "¡Navega al Noroeste!", detail: "Encuentra el rumbo 315° (NO)", timeLimit: 12, threshold: 12, points: 150 },
  { type: "precision", target: 30, instruction: "Rumbo preciso: 30°", detail: "Navega exactamente a 30° NNE", timeLimit: 10, threshold: 8, points: 200 },
  { type: "precision", target: 60, instruction: "Rumbo preciso: 60°", detail: "Navega exactamente a 60° ENE", timeLimit: 10, threshold: 8, points: 200 },
  { type: "precision", target: 120, instruction: "Rumbo preciso: 120°", detail: "Navega exactamente a 120° ESE", timeLimit: 10, threshold: 8, points: 200 },
  { type: "precision", target: 150, instruction: "Rumbo preciso: 150°", detail: "Navega exactamente a 150° SSE", timeLimit: 10, threshold: 8, points: 200 },
  { type: "precision", target: 210, instruction: "Rumbo preciso: 210°", detail: "Navega exactamente a 210° SSO", timeLimit: 10, threshold: 8, points: 200 },
  { type: "precision", target: 240, instruction: "Rumbo preciso: 240°", detail: "Navega exactamente a 240° OSO", timeLimit: 10, threshold: 8, points: 200 },
  { type: "precision", target: 300, instruction: "Rumbo preciso: 300°", detail: "Navega exactamente a 300° ONO", timeLimit: 10, threshold: 8, points: 200 },
  { type: "precision", target: 330, instruction: "Rumbo preciso: 330°", detail: "Navega exactamente a 330° NNO", timeLimit: 10, threshold: 8, points: 200 },
];

export const VOYAGE_ROUTES: VoyageRoute[] = [
  {
    name: "Ruta del Caribe",
    description: "Una ruta clásica de isla en isla por el Caribe.",
    legs: [
      { target: 90, name: "Partida al Este", detail: "Zarpa rumbo al Este (90°)", timeLimit: 15, threshold: 15, points: 100 },
      { target: 135, name: "Sureste hacia Barbados", detail: "Vira al Sureste a 135°", timeLimit: 12, threshold: 12, points: 150 },
      { target: 270, name: "Oeste hacia Jamaica", detail: "¡Virada! Rumbo al Oeste (270°)", timeLimit: 15, threshold: 15, points: 100 },
      { target: 315, name: "Noroeste hacia Cuba", detail: "Rumbo Noroeste a 315°", timeLimit: 12, threshold: 12, points: 150 },
      { target: 0, name: "Norte a casa", detail: "¡Última etapa! Rumbo Norte (0°)", timeLimit: 15, threshold: 15, points: 200 },
    ],
  },
  {
    name: "Travesía del Mediterráneo",
    description: "Navega las antiguas rutas comerciales del Mediterráneo.",
    legs: [
      { target: 180, name: "Sur desde Gibraltar", detail: "Rumbo Sur hacia el estrecho (180°)", timeLimit: 15, threshold: 15, points: 100 },
      { target: 90, name: "Este por la costa", detail: "Vira al Este bordeando África (90°)", timeLimit: 15, threshold: 15, points: 100 },
      { target: 45, name: "Noreste hacia Cerdeña", detail: "Rumbo NE hacia Cerdeña (45°)", timeLimit: 12, threshold: 12, points: 150 },
      { target: 90, name: "Este hacia Grecia", detail: "Continúa al Este hacia Grecia (90°)", timeLimit: 12, threshold: 12, points: 150 },
      { target: 0, name: "Norte al Adriático", detail: "Vira al Norte hacia el Adriático (0°)", timeLimit: 12, threshold: 12, points: 150 },
      { target: 270, name: "Oeste a puerto", detail: "Regresa al Oeste a puerto (270°)", timeLimit: 15, threshold: 15, points: 200 },
    ],
  },
  {
    name: "Temporal del Pacífico",
    description: "Una ruta atrevida entre temporales del Pacífico. ¡Sé rápido y preciso!",
    legs: [
      { target: 225, name: "Partida al Suroeste", detail: "Rumbo SO a mar abierto (225°)", timeLimit: 10, threshold: 10, points: 200 },
      { target: 180, name: "Sur entre la tormenta", detail: "Vira al Sur, ¡agárrate! (180°)", timeLimit: 8, threshold: 10, points: 250 },
      { target: 90, name: "Este - ojo del temporal", detail: "¡Rápido! Rumbo Este (90°)", timeLimit: 8, threshold: 10, points: 250 },
      { target: 0, name: "Norte a salvo", detail: "Rumbo Norte a cielos despejados (0°)", timeLimit: 8, threshold: 10, points: 250 },
      { target: 315, name: "NO hacia el puerto", detail: "Rumbo NO al puerto seguro (315°)", timeLimit: 10, threshold: 10, points: 300 },
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
    "¡En el blanco!", "¡Bien navegado!", "¡Rumbo firme!",
    "¡Rumbo perfecto!", "¡A la orden, Capitán!", "¡Perfecto!",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function getFailMessage(): string {
  const messages = [
    "¡Perdido en el mar!", "¡Fuera de rumbo!", "¡Hombre al agua!",
    "¡Se acabó el tiempo!", "¡Rumbo equivocado!", "¡A la deriva!",
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
  label: string;           // Nombre visible
  angleFromWind: number;   // Ángulo respecto al viento
  description: string;     // Descripción del rumbo de vela
  tip: string;             // Consejo educativo mostrado tras el desafío
}

export const POINTS_OF_SAIL: Record<PointOfSail, PointOfSailInfo> = {
  "ceñida": {
    name: "ceñida",
    label: "Ceñida",
    angleFromWind: 45,
    description: "Navegando lo más cerca posible del viento (~45°). Requiere bordadas en zigzag para avanzar contra el viento.",
    tip: "La ceñida es el ángulo más cerrado al que puedes navegar respecto al viento. ¡Los navegantes hacen bordadas (zigzag) porque no se puede navegar directamente contra el viento!",
  },
  "través": {
    name: "través",
    label: "Través",
    angleFromWind: 90,
    description: "El viento sopla de costado (~90°). Buena velocidad y estabilidad.",
    tip: "El través significa que el viento llega a tu barco de costado a 90°. ¡Es a menudo el rumbo más rápido y estable de todos!",
  },
  "largo": {
    name: "largo",
    label: "Largo",
    angleFromWind: 135,
    description: "El viento llega desde atrás en ángulo (~135°). Navegación rápida.",
    tip: "El largo es navegar con el viento viniendo desde atrás en ángulo. Es una navegación rápida, ¡pero cuidado con una trasluchada accidental!",
  },
  "popa": {
    name: "popa",
    label: "Popa",
    angleFromWind: 180,
    description: "El viento sopla directamente desde atrás (~180°). Menor velocidad por falta de sustentación en las velas.",
    tip: "Navegar en popa significa que el viento empuja directamente desde atrás. Las velas no generan sustentación, así que la velocidad es menor que a un largo. ¡Cuidado con las trasluchadas!",
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
  0: "Norte", 45: "Noreste", 90: "Este", 135: "Sureste",
  180: "Sur", 225: "Suroeste", 270: "Oeste", 315: "Noroeste",
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

  const tackLabel = tack === "starboard" ? "amura de estribor" : "amura de babor";
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
    instruction: `¡Navega a ${posInfo.label}!`,
    detail: `Viento del ${windName} — ${tackLabel}${targetHint}`,
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
    title: "Lee el viento",
    text: "La flecha cian en la brújula indica de dónde sopla el viento. Leer el viento es lo primero que aprende todo navegante.",
  },
  {
    icon: "⛵",
    title: "Rumbos de vela",
    text: "Tu ángulo respecto al viento determina tu rumbo de vela: Ceñida (45°), Través (90°), Largo (135°) o Popa (180°).",
  },
  {
    icon: "🧭",
    title: "Encuentra el rumbo",
    text: "Calcula el rumbo correcto a partir de la dirección del viento + el ángulo del rumbo de vela, ¡y gira tu dispositivo para coincidir!",
  },
  {
    icon: "⭐",
    title: "Mantén el rumbo",
    text: "Mantén el rumbo estable durante 1,2 segundos para fijarlo. La precisión y la velocidad dan puntos extra. ¡Buena suerte, Capitán!",
  },
];
