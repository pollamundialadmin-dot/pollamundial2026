// src/pages/admin/AdminResults.js
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import toast from "react-hot-toast";

import Navbar from "../../components/Navbar";
import {
  getCachedMatches,
  getResults,
  saveResult,
  setMatchLocked,
  setAllMatchesLocked,
} from "../../utils/firestoreService";
import { getAllMatches } from "../../utils/footballApi";

export default function AdminResults() {
  const [matches,  setMatches]  = useState([]);
  const [results,  setResults]  = useState({});
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState("pending");
  const [saving,   setSaving]   = useState({});
  const [locking,  setLocking]  = useState({});
  const [bulkLock, setBulkLock] = useState(false);
  
  const [startDate, setStartDate] = useState("");
  const [endDate,   setEndDate]   = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const loadResults = async () => {
    const res = await getResults();
    const map = {};
    (res || []).forEach(r => { map[String(r.matchId)] = r; });
    setResults(map);
  };

  const loadMatches = async () => {
    setLoading(true);
    try {
      let ms = await getCachedMatches();
      if (!ms || ms.length === 0) ms = await getAllMatches();
      const safe = Array.isArray(ms) ? ms : [];
      setMatches(safe.sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate)));
      await loadResults();
    } catch {
      toast.error("Error al cargar partidos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMatches(); }, []);

  const handleSave = async (matchId, data) => {
    setSaving(s => ({ ...s, [matchId]: true }));
    try {
      await saveResult(matchId, data);
      await setMatchLocked(matchId, true);
      await loadMatches();
      toast.success("Resultado guardado y apuestas cerradas ✓");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(s => ({ ...s, [matchId]: false }));
    }
  };

  const handleToggleLock = async (matchId, currentLocked) => {
    setLocking(s => ({ ...s, [matchId]: true }));
    try {
      await setMatchLocked(matchId, !currentLocked);
      await loadMatches();
      toast.success(currentLocked ? "Apuestas abiertas 🔓" : "Apuestas cerradas 🔒");
    } catch {
      toast.error("Error al cambiar estado");
    } finally {
      setLocking(s => ({ ...s, [matchId]: false }));
    }
  };

  const handleBulkLock = async (lock) => {
    setBulkLock(true);
    try {
      const ids = displayed.map(m => String(m.id));
      await setAllMatchesLocked(ids, lock);
      await loadMatches();
      toast.success(lock ? `${ids.length} partidos cerrados 🔒` : `${ids.length} partidos abiertos 🔓`);
    } catch {
      toast.error("Error al aplicar cambio masivo");
    } finally {
      setBulkLock(false);
    }
  };

  const displayed = (() => {
    let filtered = matches;

    // Filtros rápidos
    if (filter === "pending")  filtered = filtered.filter(m => !results[String(m.id)]);
    if (filter === "today") {
      const today = new Date().toISOString().split("T")[0];
      filtered = filtered.filter(m => m.utcDate?.startsWith(today));
    }
    if (filter === "locked")   filtered = filtered.filter(m => m.locked);
    if (filter === "unlocked") filtered = filtered.filter(m => !m.locked);

    // Filtro de rango de fechas
    if (startDate || endDate) {
      filtered = filtered.filter(m => {
        const matchDate = m.utcDate.split("T")[0];
        const afterStart = startDate ? matchDate >= startDate : true;
        const beforeEnd = endDate ? matchDate <= endDate : true;
        return afterStart && beforeEnd;
      });
    }

    // Filtro por nombre de país
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m => {
        const homeName = m.homeTeam?.name?.toLowerCase() || "";
        const awayName = m.awayTeam?.name?.toLowerCase() || "";
        const homeShort = m.homeTeam?.shortName?.toLowerCase() || "";
        const awayShort = m.awayTeam?.shortName?.toLowerCase() || "";
        return homeName.includes(q) || awayName.includes(q) || homeShort.includes(q) || awayShort.includes(q);
      });
    }

    return filtered;
  })();

  const lockedCount = matches.filter(m => m.locked).length;

  return (
    <>
      <Navbar />
      <div className="page">
        <div style={{ display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:16 }}>
          <div>
            <h1 className="section-title">Resultados</h1>
            <p className="section-subtitle">Administra partidos y apuestas del Mundial 2026</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4 mb-4">
          {[
            { label:"Total partidos",   val:matches.length,              color:"var(--text-primary)" },
            { label:"🔒 Cerrados",      val:lockedCount,                 color:"var(--red)" },
            { label:"🔓 Abiertos",      val:matches.length - lockedCount, color:"var(--green)" },
            { label:"✓ Con resultado",  val:Object.keys(results).length,  color:"var(--gold)" },
          ].map(s => (
            <div key={s.label} className="card card-sm" style={{ textAlign:"center" }}>
              <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:2 }}>{s.label}</div>
              <div style={{ fontFamily:"var(--font-display)", fontSize:"1.6rem", color:s.color }}>{s.val}</div>
            </div>
          ))}
        </div>

        {/* Controles de Búsqueda y Fechas */}
        <div className="card mb-4" style={{ padding: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className="form-label" style={{ fontSize: 12 }}>Buscar País</label>
              <input type="text" className="form-input" placeholder="Ej. Brasil, España..." 
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 12 }}>Desde</label>
              <input type="date" className="form-input" 
                value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 12 }}>Hasta</label>
              <input type="date" className="form-input" 
                value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            { (startDate || endDate || searchQuery) && (
              <button className="btn btn-secondary" style={{ height: 42 }} onClick={() => {
                setStartDate(""); setEndDate(""); setSearchQuery("");
              }}>Limpiar</button>
            )}
          </div>
        </div>

        {/* Controles */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:20, alignItems:"center" }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {[
              { key:"pending",  label:"Pendientes" },
              { key:"today",    label:"Hoy" },
              { key:"all",      label:"Todos" },
              { key:"locked",   label:"🔒 Cerrados" },
              { key:"unlocked", label:"🔓 Abiertos" },
            ].map(f => (
              <button key={f.key}
                className={`btn btn-sm ${filter === f.key ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFilter(f.key)}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:6 }}>
            <button className="btn btn-secondary btn-sm" disabled={bulkLock}
              onClick={() => handleBulkLock(false)}>
              🔓 Abrir todos
            </button>
            <button className="btn btn-danger btn-sm" disabled={bulkLock}
              onClick={() => handleBulkLock(true)}>
              🔒 Cerrar todos
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : displayed.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">✅</div>
            <p>No hay partidos para mostrar con este filtro.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {displayed.map(m => (
              <ResultRow
                key={m.id}
                match={m}
                existing={results[String(m.id)]}
                onSave={(data) => handleSave(String(m.id), data)}
                onToggleLock={() => handleToggleLock(String(m.id), m.locked)}
                isSaving={saving[String(m.id)]}
                isLocking={locking[String(m.id)]}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ResultRow({ match, existing, onSave, onToggleLock, isSaving, isLocking }) {
  const [homeGoals, setHomeGoals] = useState(existing?.homeGoals ?? "");
  const [awayGoals, setAwayGoals] = useState(existing?.awayGoals ?? "");
  const [corners,   setCorners]   = useState(existing?.corners   ?? "");
  const [cards,     setCards]     = useState(existing?.cards     ?? "");

  const localTime = format(new Date(match.utcDate), "d MMM · HH:mm", { locale: es });
  const isLocked  = !!match.locked;

  const handleSubmit = () => {
    if (homeGoals === "" || awayGoals === "") { toast.error("Ingresa el marcador"); return; }
    onSave({
      homeGoals: Number(homeGoals),
      awayGoals: Number(awayGoals),
      corners:   corners !== "" ? Number(corners) : null,
      cards:     cards   !== "" ? Number(cards)   : null,
    });
  };

  return (
    <div className="card" style={{
      borderLeft: existing
        ? "3px solid var(--green)"
        : isLocked
          ? "3px solid var(--red)"
          : "3px solid var(--text-muted)",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, flexWrap:"wrap", gap:8 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, fontWeight:600, fontSize:15 }}>
            {match.homeTeam?.crest && (
              <img src={match.homeTeam.crest} alt="" style={{ width:22, height:22, objectFit:"contain" }} />
            )}
            {match.homeTeam?.shortName || match.homeTeam?.name}
            <span style={{ color:"var(--text-muted)", fontWeight:400 }}>vs</span>
            {match.awayTeam?.shortName || match.awayTeam?.name}
            {match.awayTeam?.crest && (
              <img src={match.awayTeam.crest} alt="" style={{ width:22, height:22, objectFit:"contain" }} />
            )}
          </div>
          <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:3 }}>
            {localTime} · {match.stage?.replace(/_/g," ")}
          </div>
        </div>

        <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
          {existing && <span className="badge badge-green">✓ Resultado</span>}
          <span className={`badge ${isLocked ? "badge-red" : "badge-green"}`}>
            {isLocked ? "🔒 Cerrado" : "🔓 Abierto"}
          </span>
          <button
            className={`btn btn-sm ${isLocked ? "btn-secondary" : "btn-danger"}`}
            onClick={onToggleLock}
            disabled={isLocking}
            style={{ minWidth:120 }}
          >
            {isLocking ? "..." : isLocked ? "🔓 Abrir apuestas" : "🔒 Cerrar apuestas"}
          </button>
        </div>
      </div>

      <div style={{ display:"flex", gap:12, flexWrap:"wrap", alignItems:"flex-end" }}>
        {[
          { label:"⚽ Local",     val:homeGoals, set:setHomeGoals },
          { label:"⚽ Visitante", val:awayGoals, set:setAwayGoals },
          { label:"⛳ Córners",   val:corners,   set:setCorners   },
          { label:"🟨 Tarjetas",  val:cards,     set:setCards     },
        ].map(({ label, val, set }) => (
          <div key={label}>
            <label className="form-label">{label}</label>
            <input type="number" min={0} max={50} className="form-input" style={{ width:80 }}
              placeholder="0" value={val} onChange={e => set(e.target.value)} />
          </div>
        ))}
        <button className="btn btn-primary" onClick={handleSubmit} disabled={isSaving}
          style={{ alignSelf:"flex-end" }}>
          {isSaving ? "Guardando..." : existing ? "Actualizar" : "Guardar resultado"}
        </button>
      </div>
    </div>
  );
}