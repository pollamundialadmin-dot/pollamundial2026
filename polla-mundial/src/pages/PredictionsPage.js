// src/pages/PredictionsPage.js
// Vista de todos los partidos del torneo para ingresar pronósticos
import React, { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { getAllMatches } from "../utils/footballApi";
import { getUserPredictions, savePrediction, cacheMatches } from "../utils/firestoreService";
import { useAuth } from "../context/AuthContext";

export default function PredictionsPage() {
  const { user }           = useAuth();
  const [matches, setMatches]     = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading]     = useState(true);
  const [groupBy, setGroupBy]     = useState("matchday"); // "matchday" | "stage"

  const loadPredictions = useCallback(async () => {
    const preds = await getUserPredictions(user.uid);
    const map = {};
    preds.forEach(p => { map[String(p.matchId)] = p; });
    setPredictions(map);
  }, [user.uid]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const ms = await getAllMatches();
        setMatches(ms);
        if (ms.length > 0) await cacheMatches(ms);
        await loadPredictions();
      } catch (e) {
        toast.error("Error al cargar partidos");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [loadPredictions]);

  // Agrupar partidos por jornada
  const grouped = {};
  matches.forEach(m => {
    const key = groupBy === "matchday"
      ? `Jornada ${m.matchday}`
      : (m.stage?.replace(/_/g," ") || "Fase de grupos");
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(m);
  });

  const pendingCount = matches.filter(m =>
    m.status !== "FINISHED" && !predictions[String(m.id)]
  ).length;

  return (
    <>
      <Navbar />
      <div className="page">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12, marginBottom:24 }}>
          <div>
            <h1 className="section-title">Todos los partidos</h1>
            <p className="section-subtitle">Ingresa tus pronósticos antes de cada partido</p>
          </div>
          <div style={{ display:"flex", gap:6, alignItems:"center" }}>
            {pendingCount > 0 && (
              <span className="badge badge-red">⚠ {pendingCount} sin pronóstico</span>
            )}
            <select
              className="form-input"
              style={{ width:"auto", padding:"6px 12px", fontSize:13 }}
              value={groupBy}
              onChange={e => setGroupBy(e.target.value)}
            >
              <option value="matchday">Por jornada</option>
              <option value="stage">Por fase</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          Object.entries(grouped).map(([group, ms]) => (
            <div key={group} style={{ marginBottom:28 }}>
              <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.3rem", color:"var(--text-secondary)", marginBottom:12, letterSpacing:1 }}>
                {group.toUpperCase()}
              </h2>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {ms.map(m => (
                  <MiniPredCard
                    key={m.id}
                    match={m}
                    prediction={predictions[String(m.id)]}
                    onSaved={loadPredictions}
                    userId={user.uid}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

function MiniPredCard({ match, prediction, onSaved, userId }) {
  const [editing, setEditing] = useState(false);
  const [homeGoals, setHomeGoals] = useState(prediction?.homeGoals ?? "");
  const [awayGoals, setAwayGoals] = useState(prediction?.awayGoals ?? "");
  const [corners,   setCorners]   = useState(prediction?.corners   ?? "");
  const [cards,     setCards]     = useState(prediction?.cards     ?? "");
  const [saving, setSaving]       = useState(false);

  const isLocked = match.status === "IN_PLAY" || match.status === "PAUSED" || match.status === "FINISHED";
  const localTime = format(new Date(match.utcDate), "d MMM · HH:mm", { locale: es });

  const handleSave = async () => {
    if (homeGoals === "" || awayGoals === "") { toast.error("Ingresa el marcador"); return; }
    setSaving(true);
    try {
      await savePrediction(userId, String(match.id), {
        homeGoals: Number(homeGoals),
        awayGoals: Number(awayGoals),
        corners:   corners !== "" ? Number(corners) : null,
        cards:     cards   !== "" ? Number(cards)   : null,
      });
      toast.success("Guardado ✓");
      setEditing(false);
      onSaved();
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  return (
    <div className={`card card-sm${prediction ? " has-prediction" : ""}`}
      style={{ borderLeft: prediction ? "3px solid var(--green)" : "3px solid transparent" }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
        {/* Equipos */}
        <div style={{ flex:1, minWidth:200 }}>
          <div style={{ fontWeight:600, fontSize:14 }}>
            {match.homeTeam.shortName} <span style={{ color:"var(--text-muted)" }}>vs</span> {match.awayTeam.shortName}
          </div>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>{localTime}</div>
        </div>

        {/* Estado / predicción */}
        {isLocked ? (
          <span className="badge badge-gray">
            {match.status === "FINISHED" ? `${match.score.home}–${match.score.away} · FIN` : "En juego"}
          </span>
        ) : prediction && !editing ? (
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span className="badge badge-green">
              {prediction.homeGoals}–{prediction.awayGoals}
              {prediction.corners != null && ` ⛳${prediction.corners}`}
              {prediction.cards   != null && ` 🟨${prediction.cards}`}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Editar</button>
          </div>
        ) : !isLocked && !editing ? (
          <button className="btn btn-primary btn-sm" onClick={() => setEditing(true)}>
            + Pronóstico
          </button>
        ) : null}
      </div>

      {editing && !isLocked && (
        <div style={{ marginTop:12, paddingTop:12, borderTop:"1px solid var(--border)" }}>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"flex-end" }}>
            <div>
              <label className="form-label">Marcador</label>
              <div className="score-input-row">
                <input type="number" min={0} max={20} className="score-input" style={{ width:52, fontSize:"1rem", padding:"6px" }}
                  value={homeGoals} onChange={e => setHomeGoals(e.target.value)} placeholder="0" />
                <span className="score-sep" style={{ fontSize:"1rem" }}>–</span>
                <input type="number" min={0} max={20} className="score-input" style={{ width:52, fontSize:"1rem", padding:"6px" }}
                  value={awayGoals} onChange={e => setAwayGoals(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div>
              <label className="form-label">⛳ Córners</label>
              <input type="number" min={0} max={30} className="form-input" style={{ width:72 }}
                placeholder="0" value={corners} onChange={e => setCorners(e.target.value)} />
            </div>
            <div>
              <label className="form-label">🟨 Tarjetas</label>
              <input type="number" min={0} max={20} className="form-input" style={{ width:72 }}
                placeholder="0" value={cards} onChange={e => setCards(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? "..." : "Guardar"}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
