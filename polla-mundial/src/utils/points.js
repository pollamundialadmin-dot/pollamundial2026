// src/utils/points.js
// ─────────────────────────────────────────────────────────────────────────────
// SISTEMA DE PUNTOS
// ─────────────────────────────────────────────────────────────────────────────
// Ganador correcto (o empate acertado)   → 3 pts
// Marcador exacto                        → 5 pts adicionales  (total 8 si también ganador)
// Tiros de esquina exactos               → 2 pts
// Total de tarjetas exacto               → 2 pts
// ─────────────────────────────────────────────────────────────────────────────

export const POINT_RULES = {
  WINNER:         3,
  EXACT_SCORE:    5,
  EXACT_CORNERS:  2,
  EXACT_CARDS:    2,
};

/**
 * Calcula el resultado (ganador) a partir del marcador.
 * @returns "home" | "away" | "draw"
 */
export function getOutcome(homeGoals, awayGoals) {
  if (homeGoals > awayGoals) return "home";
  if (awayGoals > homeGoals) return "away";
  return "draw";
}

/**
 * Calcula los puntos obtenidos por una predicción.
 *
 * @param {Object} prediction  - { homeGoals, awayGoals, corners, cards }
 * @param {Object} result      - { homeGoals, awayGoals, corners, cards }
 * @returns {Object} { total, breakdown }
 */
export function calculatePoints(prediction, result) {
  const breakdown = {
    winner:       0,
    exactScore:   0,
    exactCorners: 0,
    exactCards:   0,
  };

  if (!prediction || !result) return { total: 0, breakdown };

  const predOutcome   = getOutcome(prediction.homeGoals, prediction.awayGoals);
  const resultOutcome = getOutcome(result.homeGoals,     result.awayGoals);

  // Ganador
  if (predOutcome === resultOutcome) {
    breakdown.winner = POINT_RULES.WINNER;
  }

  // Marcador exacto (implica ganador correcto, suma encima)
  if (
    prediction.homeGoals === result.homeGoals &&
    prediction.awayGoals === result.awayGoals
  ) {
    breakdown.exactScore = POINT_RULES.EXACT_SCORE;
  }

  // Tiros de esquina exactos
  if (
    prediction.corners !== undefined &&
    result.corners      !== undefined &&
    prediction.corners  === result.corners
  ) {
    breakdown.exactCorners = POINT_RULES.EXACT_CORNERS;
  }

  // Tarjetas exactas
  if (
    prediction.cards !== undefined &&
    result.cards      !== undefined &&
    prediction.cards  === result.cards
  ) {
    breakdown.exactCards = POINT_RULES.EXACT_CARDS;
  }

  const total =
    breakdown.winner +
    breakdown.exactScore +
    breakdown.exactCorners +
    breakdown.exactCards;

  return { total, breakdown };
}

/**
 * Recalcula la tabla de posiciones completa.
 * @param {Array} users       - [{ uid, displayName }]
 * @param {Array} predictions - [{ userId, matchId, ...pred }]
 * @param {Array} results     - [{ matchId, ...result }]
 * @returns {Array} tabla ordenada desc por puntos
 */
export function buildLeaderboard(users, predictions, results) {
  const resultMap = {};
  results.forEach((r) => { resultMap[r.matchId] = r; });

  const scoreMap = {};
  users.forEach((u) => {
    scoreMap[u.uid] = { uid: u.uid, displayName: u.displayName, points: 0, breakdown: { winner: 0, exactScore: 0, exactCorners: 0, exactCards: 0 } };
  });

  predictions.forEach((pred) => {
    const res = resultMap[pred.matchId];
    if (!res || !scoreMap[pred.userId]) return;

    const { total, breakdown } = calculatePoints(pred, res);
    scoreMap[pred.userId].points += total;
    Object.keys(breakdown).forEach((k) => {
      scoreMap[pred.userId].breakdown[k] += breakdown[k];
    });
  });

  return Object.values(scoreMap)
    .sort((a, b) => b.points - a.points)
    .map((entry, i) => ({ ...entry, position: i + 1 }));
}

/**
 * Calcula los premios en pesos para los 3 primeros.
 * @param {number} totalPot  - bote total recaudado
 * @param {number} commission - % comisión organizadores (0–100)
 * @param {Array}  splits     - [p1%, p2%, p3%] que suman 100
 */
export function calculatePrizes(totalPot, commission, splits = [50, 30, 20]) {
  const commissionAmt = totalPot * (commission / 100);
  const prizePot      = totalPot - commissionAmt;
  return {
    commissionAmt,
    prizePot,
    prizes: splits.map((pct) => prizePot * (pct / 100)),
  };
}
