import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";

import Navbar from "../components/Navbar";

import {
  getAllMatches, // 👈 IMPORTANTE: usamos worker completo
} from "../utils/footballApi";

import {
  savePrediction,
  getUserPredictions,
  cacheMatches,
} from "../utils/firestoreService";

import { useAuth } from "../context/AuthContext";

/* ─────────────────────────────────────────────
   Helpers
──────────────────────────────────────────── */

function extractMatches(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.matches)) return res.matches;
  if (Array.isArray(res?.data?.matches)) return res.data.matches;
  return [];
}

function isToday(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

function isFuture(dateStr) {
  return new Date(dateStr) > new Date();
}

/* ─────────────────────────────────────────────
   Prediction Form
──────────────────────────────────────────── */

function PredictionForm({ match, existing, onSaved }) {
  const { user } = useAuth();

  const [homeGoals, setHomeGoals] = useState(existing?.homeGoals ?? "");
  const [awayGoals, setAwayGoals] = useState(existing?.awayGoals ?? "");
  const [corners, setCorners] = useState(existing?.corners ?? "");
  const [cards, setCards] = useState(existing?.cards ?? "");
  const [saving, setSaving] = useState(false);

  const isFinished = match.status === "FINISHED";

  const handleSave = async () => {
    if (homeGoals === "" || awayGoals === "") {
      toast.error("Ingresa el marcador");
      return;
    }

    setSaving(true);

    try {
      await savePrediction(user.uid, String(match.id), {
        homeGoals: Number(homeGoals),
        awayGoals: Number(awayGoals),
        corners: corners !== "" ? Number(corners) : null,
        cards: cards !== "" ? Number(cards) : null,
      });

      toast.success("Pronóstico guardado ✓");
      onSaved();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (isFinished) {
    return (
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        <span className="badge badge-gray">Partido finalizado</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div className="score-input-row">
        <input
          type="number"
          value={homeGoals}
          onChange={(e) => setHomeGoals(e.target.value)}
          className="score-input"
        />
        <span className="score-sep">–</span>
        <input
          type="number"
          value={awayGoals}
          onChange={(e) => setAwayGoals(e.target.value)}
          className="score-input"
        />
      </div>

      <button
        className="btn btn-primary btn-block"
        style={{ marginTop: 14 }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Guardando..." : "Guardar pronóstico"}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Match Card
──────────────────────────────────────────── */

function MatchCard({ match }) {
  const isFinished = match.status === "FINISHED";
  const isLive = match.status === "LIVE" || match.status === "IN_PLAY";

  return (
    <div className="match-card fade-in" style={{ cursor: "default" }}>
      <div className="flex justify-between items-center mb-3">
        <div className="match-stage">{match.stage} {match.group && `· ${match.group}`}</div>
        {isFinished ? (
          <span className="badge badge-gray">Fin</span>
        ) : isLive ? (
          <span className="badge badge-red">● Vivo</span>
        ) : (
          <span className="badge badge-blue">Próx</span>
        )}
      </div>

      <div className="match-teams">
        <div className="team-block">
          {match.homeTeam.crest ? (
            <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="team-crest" />
          ) : (
            <div className="team-crest-placeholder">{match.homeTeam.name?.charAt(0)}</div>
          )}
          <div className="team-name">{match.homeTeam.shortName || match.homeTeam.name}</div>
        </div>

        <div className="match-vs">
          {isFinished || isLive ? (
            <div className="match-score-display" style={{ fontSize: "1.5rem" }}>
              {match.score.home ?? 0}–{match.score.away ?? 0}
            </div>
          ) : (
            "VS"
          )}
        </div>

        <div className="team-block">
          {match.awayTeam.crest ? (
            <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="team-crest" />
          ) : (
            <div className="team-crest-placeholder">{match.awayTeam.name?.charAt(0)}</div>
          )}
          <div className="team-name">{match.awayTeam.shortName || match.awayTeam.name}</div>
        </div>
      </div>

      <div className="match-time">
        {format(new Date(match.utcDate), "eee d MMM · HH:mm", { locale: es })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   DASHBOARD
──────────────────────────────────────────── */

export default function DashboardPage() {
  const { user } = useAuth();

  const [matches, setMatches] = useState([]);
  const [view, setView] = useState("today"); // today | future | all
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getAllMatches(); // 👈 worker
      const ms = extractMatches(res);

      setMatches(ms);

      if (ms.length > 0) {
        await cacheMatches(ms);
      }
    } catch {
      toast.error("Error cargando partidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /* ─────────────────────────────
     FILTROS
  ───────────────────────────── */

  const filteredMatches = matches.filter((m) => {
    if (view === "today") return isToday(m.utcDate);
    if (view === "future") return isFuture(m.utcDate);
    return true;
  });

  return (
    <>
      <Navbar />

      <div className="page">
        <h1 className="section-title">Partidos</h1>

        {/* BOTONES */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setView("today")}
            className={`btn btn-sm ${view === "today" ? "btn-primary" : "btn-secondary"}`}
          >
            Hoy
          </button>

          <button
            onClick={() => setView("future")}
            className={`btn btn-sm ${view === "future" ? "btn-primary" : "btn-secondary"}`}
          >
            Futuros
          </button>

          <button
            onClick={() => setView("all")}
            className={`btn btn-sm ${view === "all" ? "btn-primary" : "btn-secondary"}`}
          >
            Todos
          </button>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
            <p>Cargando partidos...</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🏟</div>
            <p>No hay partidos para mostrar en esta sección</p>
          </div>
        ) : (
          <div className="grid-3">
            {filteredMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}