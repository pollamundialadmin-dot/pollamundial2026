import { translateCountry, translateStage, translateGroup } from "./translations";

// ─────────────────────────────────────────────
// SOLO WORKER (PRODUCCIÓN)
// NO usa football-data directo
// ─────────────────────────────────────────────

const BASE_URL = process.env.REACT_APP_WORKER_URL;
const COMPETITION = process.env.REACT_APP_COMPETITION_ID || "2000";

if (!BASE_URL) {
  console.warn("⚠️ REACT_APP_WORKER_URL no está definido en .env");
}

/**
 * FETCH CENTRAL (via Worker)
 */
async function apiFetch(path) {
  if (!BASE_URL) {
    throw new Error("Falta REACT_APP_WORKER_URL en .env");
  }

  const url = `${BASE_URL}?path=${encodeURIComponent(path)}`;

  const res = await fetch(url);
  const json = await res.json().catch(() => null);

  if (!res.ok || !json) {
    throw new Error(json?.error || `API Error ${res.status}`);
  }

  // Si el worker envuelve la respuesta
  if (json.success !== undefined) {
    if (!json.success) {
      throw new Error(json.error || "Error en Worker API");
    }
    return json.data;
  }

  // Si el worker devuelve la respuesta directa de la API
  return json;
}

/**
 * 🔥 PARTIDOS DE HOY
 */
export async function getTodayMatches() {
  const today = new Date().toISOString().split("T")[0];

  const data = await apiFetch(
    `/competitions/${COMPETITION}/matches?dateFrom=${today}&dateTo=${today}&status=SCHEDULED,LIVE,IN_PLAY,PAUSED,FINISHED`
  );

  return (data?.matches || []).map(formatMatch);
}

/**
 * 🔥 TODOS LOS PARTIDOS
 */
export async function getAllMatches() {
  const data = await apiFetch(
    `/competitions/${COMPETITION}/matches`
  );

  return (data?.matches || []).map(formatMatch);
}

/**
 * 🔥 PARTIDO POR ID
 */
export async function getMatch(matchId) {
  const data = await apiFetch(`/matches/${matchId}`);
  return formatMatch(data);
}

/**
 * 🔥 FORMATO UNIFICADO (UI FRIENDLY)
 */
function formatMatch(m) {
  if (!m) return null;

  return {
    id: m.id,
    utcDate: m.utcDate,
    status: m.status,
    matchday: m.matchday,
    stage: translateStage(m.stage),
    group: translateGroup(m.group),

    homeTeam: {
      id: m.homeTeam?.id,
      name: translateCountry(m.homeTeam?.name),
      shortName: translateCountry(m.homeTeam?.shortName || m.homeTeam?.name),
      crest: m.homeTeam?.crest || null,
    },

    awayTeam: {
      id: m.awayTeam?.id,
      name: translateCountry(m.awayTeam?.name),
      shortName: translateCountry(m.awayTeam?.shortName || m.awayTeam?.name),
      crest: m.awayTeam?.crest || null,
    },

    score: {
      home: m.score?.fullTime?.home ?? null,
      away: m.score?.fullTime?.away ?? null,
    },

    // placeholders (puedes expandir luego)
    corners: null,
    cards: null,
  };
}