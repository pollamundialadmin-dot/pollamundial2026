// src/pages/admin/AdminDashboard.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { getUsers, getAllPredictions, getResults, getPotConfig } from "../../utils/firestoreService";
import { buildLeaderboard, calculatePrizes } from "../../utils/points";

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [users, preds, results, config] = await Promise.all([
        getUsers(), getAllPredictions(), getResults(), getPotConfig(),
      ]);
      const lb = buildLeaderboard(users, preds, results);
      const prizes = calculatePrizes(config.totalPot, config.commission, config.splits);
      setStats({ users, preds, results, config, lb, prizes });
      setLoading(false);
    }
    load();
  }, []);

  const fmtCOP = (n) => "$" + Math.round(n).toLocaleString("es-CO");
  const paid = stats?.users.filter(u => u.paid && u.role !== "admin").length || 0;

  return (
    <>
      <Navbar />
      <div className="page">
        <h1 className="section-title">Panel administrador</h1>
        <p className="section-subtitle">Resumen general de la polla</p>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            {/* Stats rápidas */}
            <div className="grid-4 mb-6">
              {[
                { label:"Participantes", value: stats.users.filter(u => u.role !== "admin").length, icon:"👥" },
                { label:"Han pagado",    value: paid, icon:"✅" },
                { label:"Pronósticos",  value: stats.preds.length, icon:"📝" },
                { label:"Resultados",   value: stats.results.length, icon:"⚽" },
              ].map(s => (
                <div key={s.label} className="card card-sm" style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"1.5rem", marginBottom:4 }}>{s.icon}</div>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:"1.8rem", color:"var(--green)" }}>{s.value}</div>
                  <div style={{ fontSize:12, color:"var(--text-muted)" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Bote */}
            <div className="card mb-6">
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:8 }}>
                <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.3rem", letterSpacing:1 }}>BOTE Y PREMIOS</h2>
                <Link to="/admin/config" className="btn btn-secondary btn-sm">Configurar</Link>
              </div>
              <div className="grid-4">
                <div>
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:2 }}>Bote total</div>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:"1.5rem" }}>{fmtCOP(stats.config.totalPot)}</div>
                </div>
                <div style={{ borderLeft:"1px solid var(--border)", paddingLeft:16 }}>
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:2 }}>🥇 1er puesto</div>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:"1.5rem", color:"var(--gold)" }}>{fmtCOP(stats.prizes.prizes[0])}</div>
                </div>
                <div style={{ borderLeft:"1px solid var(--border)", paddingLeft:16 }}>
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:2 }}>🥈 2do puesto</div>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:"1.5rem", color:"var(--silver)" }}>{fmtCOP(stats.prizes.prizes[1])}</div>
                </div>
                <div style={{ borderLeft:"1px solid var(--border)", paddingLeft:16 }}>
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:2 }}>🥉 3er puesto</div>
                  <div style={{ fontFamily:"var(--font-display)", fontSize:"1.5rem", color:"var(--bronze)" }}>{fmtCOP(stats.prizes.prizes[2])}</div>
                </div>
              </div>
              <div style={{ marginTop:12, fontSize:12, color:"var(--text-muted)" }}>
                Comisión organizadores: {fmtCOP(stats.prizes.commissionAmt)} ({stats.config.commission}%)
              </div>
            </div>

            {/* Top 3 */}
            <div className="card mb-6">
              <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.3rem", letterSpacing:1, marginBottom:16 }}>TOP 3 ACTUAL</h2>
              {stats.lb.slice(0, 3).map((entry) => (
                <div key={entry.uid} style={{ display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid var(--border-dim)" }}>
                  <span className={`pos-badge pos-${entry.position}`}>{entry.position}</span>
                  <span style={{ flex:1, fontWeight:500 }}>{entry.displayName}</span>
                  <span style={{ fontFamily:"var(--font-display)", fontSize:"1.3rem", color:"var(--green)" }}>{entry.points} pts</span>
                </div>
              ))}
            </div>

            {/* Accesos rápidos */}
            <div className="grid-3">
              {[
                { to:"/admin/users",       icon:"👥", label:"Gestionar usuarios",  desc:"Crear, editar, eliminar participantes" },
                { to:"/admin/results",     icon:"⚽", label:"Ingresar resultados", desc:"Actualizar marcadores y estadísticas" },
                { to:"/admin/predictions", icon:"📊", label:"Ver pronósticos",      desc:"Todos los pronósticos por partido" },
              ].map(item => (
                <Link key={item.to} to={item.to} style={{ textDecoration:"none" }}>
                  <div className="card card-hover">
                    <div style={{ fontSize:"2rem", marginBottom:8 }}>{item.icon}</div>
                    <div style={{ fontWeight:600, marginBottom:4 }}>{item.label}</div>
                    <div style={{ fontSize:13, color:"var(--text-secondary)" }}>{item.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
