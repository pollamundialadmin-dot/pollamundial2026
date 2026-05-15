// src/pages/LeaderboardPage.js
import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getUsers, getAllPredictions, getResults, getPotConfig } from "../utils/firestoreService";
import { buildLeaderboard, calculatePrizes } from "../utils/points";
import { useAuth } from "../context/AuthContext";

export default function LeaderboardPage() {
  const { user }     = useAuth();
  const [table, setTable]   = useState([]);
  const [prizes, setPrizes] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [users, preds, results, config] = await Promise.all([
        getUsers(), getAllPredictions(), getResults(), getPotConfig(),
      ]);
      const lb = buildLeaderboard(users, preds, results);
      setTable(lb);
      const p = calculatePrizes(config.totalPot, config.commission, config.splits);
      setPrizes({ ...p, config });
      setLoading(false);
    }
    load();
  }, []);

  const posBadgeClass = (pos) => {
    if (pos === 1) return "pos-badge pos-1";
    if (pos === 2) return "pos-badge pos-2";
    if (pos === 3) return "pos-badge pos-3";
    return "pos-badge pos-n";
  };

  const fmtCOP = (n) => "$" + Math.round(n).toLocaleString("es-CO");

  const posStatus = (pos) => {
    if (pos.prevPosition > pos.position) return <span style={{color: "green", fontSize: "1rem"}}>↑</span>;
    if (pos.prevPosition < pos.position) return <span style={{color: "red", fontSize: "1rem"}}>↓</span>;
    return <span style={{color: "yellow", fontSize: "1.5rem"}}>=</span>;
  }

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="mb-6">
          <h1 className="section-title">Tabla de posiciones</h1>
          <p className="section-subtitle">Actualizada en tiempo real al ingresar resultados</p>
        </div>

        {/* Premio cards */}
        {prizes && prizes.config.totalPot > 0 && (
          <div className="grid-3 mb-6">
            {[0,1,2].map((i) => (
              <div key={i} className="card card-sm" style={{
                borderTop: `2px solid ${["var(--gold)","var(--silver)","var(--bronze)"][i]}`
              }}>
                <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>
                  {["🥇 1er puesto","🥈 2do puesto","🥉 3er puesto"][i]}
                </div>
                <div style={{ fontFamily:"var(--font-display)", fontSize:"1.5rem", color:["var(--gold)","var(--silver)","var(--bronze)"][i] }}>
                  {fmtCOP(prizes.prizes[i])}
                </div>
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:2 }}>
                  {prizes.config.splits[i]}% del bote
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabla */}
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : table.length === 0 ? (
          <div className="empty"><div className="empty-icon">📊</div><p>Aún no hay puntos registrados.</p></div>
        ) : (
          <div className="card" style={{ padding:0, overflow:"hidden" }}>
            <table className="leaderboard">
              <thead>
                <tr>
                  <th>#</th>
                  <th></th>
                  <th>Participante</th>
                  <th>Puntos</th>
                  <th className="hide-mobile">Ganadores</th>
                  <th>Exactos</th>
                  <th>Córners</th>
                  <th>Tarjetas</th>
                </tr>
              </thead>
              <tbody>
                {table.map((entry) => (
                  <tr
                    key={entry.uid}
                    style={entry.uid === user?.uid ? { background:"var(--green-dim)" } : {}}
                  >
                    <td>
                      <span className={posBadgeClass(entry.position)}>
                        {entry.position}
                      </span>
                    </td>
                    <td>
                      <span>{posStatus(entry)}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: entry.uid === user?.uid ? 600 : 400 }}>
                        {entry.displayName}
                      </span>
                      {entry.uid === user?.uid && (
                        <span className="badge badge-green" style={{ marginLeft:6, fontSize:10 }}>Tú</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily:"var(--font-display)", fontSize:"1.2rem", color:"var(--green)" }}>
                        {entry.points}
                      </span>
                    </td>
                    <td>{entry.breakdown.winner}</td>
                    <td>{entry.breakdown.exactScore}</td>
                    <td>{entry.breakdown.exactCorners}</td>
                    <td>{entry.breakdown.exactCards}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Leyenda de puntos */}
        <div className="card mt-6">
          <p style={{ fontSize:12, fontWeight:600, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>
            Sistema de puntos
          </p>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {[
              ["⚽ Ganador correcto","3 pts"],
              ["🎯 Marcador exacto","+ 5 pts"],
              ["⛳ Córners exactos","+ 2 pts"],
              ["🟨 Tarjetas exactas","+ 2 pts"],
              ["🏆 Todo exacto","12 pts"],
            ].map(([label, pts]) => (
              <div key={label} className="stat-chip">
                {label}: <strong>{pts}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
