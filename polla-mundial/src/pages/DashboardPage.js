// src/pages/DashboardPage.js
import React, { useEffect, useState, useCallback } from "react";
import { format, isToday, isFuture, isPast } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { getTodayMatches, getAllMatches } from "../utils/footballApi";
import { savePrediction, getUserPredictions, cacheMatches, getCachedMatches } from "../utils/supabaseService";
import { useAuth } from "../context/AuthContext";

// ── Formulario de pronóstico ──────────────────────────────────────────────────
function PredictionForm({ match, existing, onSaved }) {
  const { user } = useAuth();
  const [homeGoals, setHomeGoals] = useState(existing?.homeGoals ?? "");
  const [awayGoals, setAwayGoals] = useState(existing?.awayGoals ?? "");
  const [corners,   setCorners]   = useState(existing?.corners   ?? "");
  const [cards,     setCards]     = useState(existing?.cards     ?? "");
  const [saving,    setSaving]    = useState(false);

  const isFinished = match.status === "FINISHED";
  const isLocked   = !!match.locked || isFinished;

  const handleSave = async () => {
    if (homeGoals === "" || awayGoals === "") {
      toast.error("Ingresa el marcador"); return;
    }
    setSaving(true);
    try {
      await savePrediction(user.uid, String(match.id), {
        homeGoals: Number(homeGoals),
        awayGoals: Number(awayGoals),
        corners:   corners !== "" ? Number(corners) : null,
        cards:     cards   !== "" ? Number(cards)   : null,
      });
      toast.success("Pronóstico guardado ✓");
      onSaved();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (isLocked) {
    return (
      <div style={{ textAlign:"center", padding:"8px 0" }}>
        <span className={`badge ${isFinished ? "badge-gray" : "badge-red"}`}>
          {isFinished ? "Partido finalizado" : "🔒 Apuestas cerradas"}
        </span>
        {existing && (
          <p style={{ fontSize:12, color:"var(--text-secondary)", marginTop:6 }}>
            Tu pronóstico: <strong>{existing.homeGoals} – {existing.awayGoals}</strong>
            {existing.corners != null && ` · ⛳ ${existing.corners}`}
            {existing.cards   != null && ` · 🟨 ${existing.cards}`}
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop:16 }}>
      <p className="form-label" style={{ textAlign:"center", marginBottom:8 }}>Marcador final</p>
      <div className="score-input-row">
        <input type="number" min={0} max={20} className="score-input"
          value={homeGoals} onChange={e => setHomeGoals(e.target.value)} placeholder="0" />
        <span className="score-sep">–</span>
        <input type="number" min={0} max={20} className="score-input"
          value={awayGoals} onChange={e => setAwayGoals(e.target.value)} placeholder="0" />
      </div>
      <div className="grid-2" style={{ marginTop:12, gap:8 }}>
        <div>
          <label className="form-label">⛳ Tiros de esquina</label>
          <input type="number" min={0} max={30} className="form-input"
            placeholder="ej. 8" value={corners} onChange={e => setCorners(e.target.value)} />
        </div>
        <div>
          <label className="form-label">🟨 Total tarjetas</label>
          <input type="number" min={0} max={20} className="form-input"
            placeholder="ej. 4" value={cards} onChange={e => setCards(e.target.value)} />
        </div>
      </div>
      <button className="btn btn-primary btn-block" style={{ marginTop:14 }}
        onClick={handleSave} disabled={saving}>
        {saving ? "Guardando..." : existing ? "Actualizar pronóstico" : "Guardar pronóstico"}
      </button>
    </div>
  );
}

// ── Tarjeta de partido ────────────────────────────────────────────────────────
function MatchCard({ match, prediction, onPredSaved, tab }) {
  const [open, setOpen] = useState(false);
  const localTime = format(new Date(match.utcDate), "HH:mm", { locale: es });
  const localDate = format(new Date(match.utcDate), "EEEE d MMM", { locale: es });
  const hasPred   = !!prediction;
  const isLocked  = !!match.locked || match.status === "FINISHED";
  const isToday_  = isToday(new Date(match.utcDate));

  return (
    <div className={`match-card fade-in${hasPred ? " has-prediction" : ""}`}
      style={{ borderLeft: isLocked && !hasPred ? "3px solid var(--red)" : hasPred ? undefined : undefined }}>

      {/* Cabecera */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:11, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:1 }}>
            {match.stage?.replace(/_/g," ")} {match.group ? `· ${match.group}` : ""}
          </span>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {/* Fecha solo en tabs futuros/cerrados */}
          {!isToday_ && (
            <span style={{ fontSize:11, color:"var(--text-muted)", textTransform:"capitalize" }}>
              {localDate}
            </span>
          )}
          <span style={{ fontSize:13, color:"var(--text-secondary)" }}>🕐 {localTime}</span>
          {hasPred  && <span className="badge badge-green">✓ Listo</span>}
          {isLocked && !match.status === "FINISHED" && <span className="badge badge-red">🔒</span>}
        </div>
      </div>

      {/* Equipos */}
      <div className="match-teams">
        <div className="team-block">
          {match.homeTeam.crest
            ? <img className="team-crest" src={match.homeTeam.crest} alt={match.homeTeam.name} />
            : <div className="team-crest-placeholder">⚽</div>}
          <div className="team-name">{match.homeTeam.shortName}</div>
        </div>

        <div style={{ textAlign:"center" }}>
          {match.status === "FINISHED"
            ? <div className="match-score-display">{match.score.home} – {match.score.away}</div>
            : match.locked
              ? <div style={{ textAlign:"center" }}>
                  <div className="match-vs" style={{ color:"var(--red)", fontSize:"1.1rem" }}>🔒</div>
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>Cerrado</div>
                </div>
              : <div className="match-vs">VS</div>
          }
        </div>

        <div className="team-block">
          {match.awayTeam.crest
            ? <img className="team-crest" src={match.awayTeam.crest} alt={match.awayTeam.name} />
            : <div className="team-crest-placeholder">⚽</div>}
          <div className="team-name">{match.awayTeam.shortName}</div>
        </div>
      </div>

      {/* Botón / estado */}
      {!isLocked ? (
        <button className="btn btn-secondary btn-block btn-sm" style={{ marginTop:14 }}
          onClick={() => setOpen(!open)}>
          {open ? "Cerrar" : hasPred ? "Editar pronóstico" : "Ingresar pronóstico"}
        </button>
      ) : (
        <div style={{ marginTop:12 }}>
          <PredictionForm match={match} existing={prediction} onSaved={() => { setOpen(false); onPredSaved(); }} />
        </div>
      )}

      {open && !isLocked && (
        <PredictionForm match={match} existing={prediction}
          onSaved={() => { setOpen(false); onPredSaved(); }} />
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const [allMatches,  setAllMatches]  = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState("today"); // "today" | "upcoming" | "closed"

  const today = format(new Date(), "EEEE d 'de' MMMM", { locale: es });

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
        // Carga todos los partidos del torneo
        let ms = [];
        try {
          ms = await getAllMatches();
        } catch {
          // Si falla la API, usa caché de Firestore
          ms = await getCachedMatches();
        }

        // Merge con estado de bloqueo de Firestore
        const cached = await getCachedMatches();
        const lockMap = {};
        cached.forEach(c => { lockMap[String(c.id)] = c.locked; });
        const msWithLock = ms.map(m => ({
          ...m,
          locked: lockMap[String(m.id)] ?? false,
        }));

        setAllMatches(msWithLock.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate)));
        if (ms.length > 0) await cacheMatches(ms);
        await loadPredictions();
      } catch (e) {
        toast.error("Error al cargar partidos.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [loadPredictions]);

  // ── Filtros por tab ─────────────────────────────────────────────────────────
  const now = new Date();

  const todayMatches = allMatches.filter(m => isToday(new Date(m.utcDate)));

  const upcomingMatches = allMatches.filter(m => {
    const d = new Date(m.utcDate);
    return isFuture(d) && !isToday(d) && m.status !== "FINISHED";
  });

  const closedMatches = allMatches.filter(m =>
    m.locked || m.status === "FINISHED" || (isPast(new Date(m.utcDate)) && !isToday(new Date(m.utcDate)))
  );

  const tabData = { today: todayMatches, upcoming: upcomingMatches, closed: closedMatches };
  const displayed = tabData[tab] || [];

  // Agrupar próximos por fecha
  const grouped = {};
  if (tab === "upcoming" || tab === "closed") {
    displayed.forEach(m => {
      const key = format(new Date(m.utcDate), "EEEE d 'de' MMMM", { locale: es });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(m);
    });
  }

  const pendingToday    = todayMatches.filter(m => !predictions[String(m.id)] && !m.locked && m.status !== "FINISHED").length;
  const pendingUpcoming = upcomingMatches.filter(m => !predictions[String(m.id)] && !m.locked).length;

  const tabs = [
    { key:"today",    label:"Hoy",       count: todayMatches.length,    pending: pendingToday },
    { key:"upcoming", label:"Próximos",  count: upcomingMatches.length, pending: pendingUpcoming },
    { key:"closed",   label:"Cerrados",  count: closedMatches.length,   pending: 0 },
  ];

  return (
    <>
      <Navbar />
      <div className="page">

        {/* Header */}
        <div style={{ marginBottom:20 }}>
          <h1 className="section-title">Mis pronósticos</h1>
          <p className="section-subtitle" style={{ textTransform:"capitalize" }}>{today}</p>
        </div>

        {/* Tabs */}
        <div style={{
          display:"flex", gap:0,
          background:"var(--bg-card)", border:"1px solid var(--border)",
          borderRadius:"var(--radius-md)", padding:4,
          marginBottom:24, width:"fit-content",
        }}>
          {tabs.map(t => (
            <button key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display:"flex", alignItems:"center", gap:6,
                padding:"8px 18px", borderRadius:"var(--radius-sm)",
                border:"none", cursor:"pointer", fontSize:13, fontWeight:500,
                transition:"var(--transition)",
                background: tab === t.key ? "var(--green)" : "transparent",
                color: tab === t.key ? "#000" : "var(--text-secondary)",
              }}>
              {t.label}
              <span style={{
                fontSize:11, padding:"1px 6px", borderRadius:99, fontWeight:700,
                background: tab === t.key ? "rgba(0,0,0,0.2)" : "var(--bg-card-2)",
                color: tab === t.key ? "#000" : "var(--text-muted)",
              }}>
                {t.count}
              </span>
              {t.pending > 0 && (
                <span style={{
                  fontSize:10, padding:"1px 5px", borderRadius:99,
                  background:"var(--red)", color:"#fff", fontWeight:700,
                }}>
                  {t.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contenido */}
        {loading ? (
          <div className="loading-center">
            <div className="spinner" />
            <span>Cargando partidos...</span>
          </div>
        ) : displayed.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">
              {tab === "today" ? "⚽" : tab === "upcoming" ? "📅" : "🔒"}
            </div>
            <p>
              {tab === "today"    && "No hay partidos programados para hoy."}
              {tab === "upcoming" && "No hay partidos próximos disponibles."}
              {tab === "closed"   && "No hay partidos cerrados aún."}
            </p>
          </div>
        ) : tab === "today" ? (
          // Hoy — lista simple
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {displayed.map(m => (
              <MatchCard key={m.id} match={m} tab={tab}
                prediction={predictions[String(m.id)]}
                onPredSaved={loadPredictions} />
            ))}
          </div>
        ) : (
          // Próximos / Cerrados — agrupados por fecha
          Object.entries(grouped).map(([date, ms]) => (
            <div key={date} style={{ marginBottom:28 }}>
              <h2 style={{
                fontFamily:"var(--font-display)", fontSize:"1.1rem",
                color:"var(--text-secondary)", letterSpacing:1,
                textTransform:"capitalize", marginBottom:12,
                paddingBottom:8, borderBottom:"1px solid var(--border)",
              }}>
                📅 {date}
                <span style={{ fontSize:12, fontWeight:400, marginLeft:10, color:"var(--text-muted)" }}>
                  {ms.filter(m => predictions[String(m.id)]).length}/{ms.length} pronósticos
                </span>
              </h2>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {ms.map(m => (
                  <MatchCard key={m.id} match={m} tab={tab}
                    prediction={predictions[String(m.id)]}
                    onPredSaved={loadPredictions} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}