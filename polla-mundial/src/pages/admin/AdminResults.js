import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";

import Navbar from "../../components/Navbar";

import {
  getCachedMatches,
  getResults,
  saveResult,
} from "../../utils/firestoreService";

import {
  getAllMatches,
} from "../../utils/footballApi";

export default function AdminResults() {
  const [matches, setMatches] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending"); // 👈 mejor default
  const [saving, setSaving] = useState({});

  const loadResults = async () => {
    const res = await getResults();

    const map = {};
    (res || []).forEach(r => {
      map[String(r.matchId)] = r;
    });

    setResults(map);
  };

  const loadMatches = async () => {
    setLoading(true);

    try {
      // 🔥 SIEMPRE TRAE TODO EL TORNEO
      let ms = await getCachedMatches();

      if (!ms || ms.length === 0) {
        ms = await getAllMatches();
      }

      const safeMatches = Array.isArray(ms) ? ms : [];

      setMatches(
        safeMatches.sort(
          (a, b) => new Date(a.utcDate) - new Date(b.utcDate)
        )
      );

      await loadResults();
    } catch (e) {
      toast.error("Error al cargar partidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleSave = async (matchId, data) => {
    setSaving(s => ({ ...s, [matchId]: true }));

    try {
      await saveResult(matchId, data);
      await loadResults();
      toast.success("Resultado guardado ✓");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(s => ({ ...s, [matchId]: false }));
    }
  };

  const filteredMatches = () => {
    if (filter === "all") return matches;

    if (filter === "pending") {
      return matches.filter(m => !results[String(m.id)]);
    }

    if (filter === "today") {
      const today = new Date().toISOString().split("T")[0];
      return matches.filter(m =>
        m.utcDate?.startsWith(today)
      );
    }

    return matches;
  };

  const displayed = filteredMatches();

  return (
    <>
      <Navbar />

      <div className="page">
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 24
        }}>
          <div>
            <h1 className="section-title">Ingresar resultados</h1>
            <p className="section-subtitle">
              Administra todos los partidos del Mundial 2026
            </p>
          </div>

          <div style={{ display: "flex", gap: 8, padding: "22px" }}>
            {["pending", "all", "today"].map(f => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFilter(f)}
              >
                {f === "pending"
                  ? "Pendientes"
                  : f === "all"
                  ? "Todos"
                  : "Hoy"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">⚽</div>
            <p>No hay partidos para mostrar</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {displayed.map(m => (
              <ResultRow
                key={m.id}
                match={m}
                existing={results[String(m.id)]}
                onSave={(data) => handleSave(String(m.id), data)}
                isSaving={saving[String(m.id)]}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ResultRow({ match, existing, onSave, isSaving }) {
  const [homeGoals, setHomeGoals] = useState(existing?.homeGoals ?? "");
  const [awayGoals, setAwayGoals] = useState(existing?.awayGoals ?? "");
  const [corners, setCorners] = useState(existing?.corners ?? "");
  const [cards, setCards] = useState(existing?.cards ?? "");

  const localTime = format(
    new Date(match.utcDate),
    "d MMM · HH:mm",
    { locale: es }
  );

  const handleSubmit = () => {
    if (homeGoals === "" || awayGoals === "") {
      toast.error("Ingresa el marcador");
      return;
    }

    onSave({
      homeGoals: Number(homeGoals),
      awayGoals: Number(awayGoals),
      corners: corners !== "" ? Number(corners) : null,
      cards: cards !== "" ? Number(cards) : null,
    });
  };

  return (
    <div className="card" style={{
      borderLeft: existing
        ? "3px solid var(--green)"
        : "3px solid var(--text-muted)"
    }}>
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
          <img src={match.homeTeam.crest} alt={match.homeTeam.name} className="team-crest" style={{ marginRight: '50px' }} />{match.homeTeam?.shortName || match.homeTeam?.name}
          <span style={{ margin: "0 8px", color: "var(--text-muted)" }}>vs</span>
          {match.awayTeam?.shortName || match.awayTeam?.name}
          <img src={match.awayTeam.crest} alt={match.awayTeam.name} className="team-crest" style={{ marginLeft: '50px' }} />
        </div>

        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {localTime} · {match.stage?.replace(/_/g, " ")}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input
          type="number"
          className="form-input"
          placeholder="Goles local"
          value={homeGoals}
          onChange={e => setHomeGoals(e.target.value)}
        />

        <input
          type="number"
          className="form-input"
          placeholder="Goles visita"
          value={awayGoals}
          onChange={e => setAwayGoals(e.target.value)}
        />

        <input
          type="number"
          className="form-input"
          placeholder="Córners"
          value={corners}
          onChange={e => setCorners(e.target.value)}
        />

        <input
          type="number"
          className="form-input"
          placeholder="Tarjetas"
          value={cards}
          onChange={e => setCards(e.target.value)}
        />

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={isSaving}
        >
          {isSaving ? "Guardando..." : existing ? "Actualizar" : "Guardar"}
        </button>
      </div>
    </div>
  );
}