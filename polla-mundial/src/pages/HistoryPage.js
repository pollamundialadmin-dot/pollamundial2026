// src/pages/HistoryPage.js
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Navbar from "../components/Navbar";
import { getUserPredictions, getResults, getCachedMatches } from "../utils/firestoreService";
import { calculatePoints } from "../utils/points";
import { useAuth } from "../context/AuthContext";

export default function HistoryPage() {
  const { user }         = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [preds, results, matches] = await Promise.all([
        getUserPredictions(user.uid),
        getResults(),
        getCachedMatches(),
      ]);

      const resMap   = {};
      results.forEach(r => { resMap[String(r.matchId)] = r; });

      const matchMap = {};
      matches.forEach(m => { matchMap[String(m.id)] = m; });

      let pts = 0;
      const rows = preds.map(pred => {
        const res   = resMap[String(pred.matchId)];
        const match = matchMap[String(pred.matchId)];
        const { total: earnedPts, breakdown } = res
          ? calculatePoints(pred, res)
          : { total: 0, breakdown: {} };
        pts += earnedPts;
        return { pred, res, match, earnedPts, breakdown };
      }).sort((a, b) => {
        const da = a.match?.utcDate || "";
        const db2 = b.match?.utcDate || "";
        return db2.localeCompare(da);
      });

      setItems(rows);
      setTotal(pts);
      setLoading(false);
    }
    load();
  }, [user.uid]);

  return (
    <>
      <Navbar />
      <div className="page">
        <div className="mb-6" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 className="section-title">Mi historial</h1>
            <p className="section-subtitle">Todos tus pronósticos y puntos obtenidos</p>
          </div>
          <div className="card card-sm" style={{ textAlign:"center" }}>
            <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:2 }}>Total puntos</div>
            <div style={{ fontFamily:"var(--font-display)", fontSize:"2rem", color:"var(--green)" }}>{total}</div>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : items.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <p>Aún no tienes pronósticos registrados.</p>
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {items.map(({ pred, res, match, earnedPts, breakdown }) => (
              <div key={pred.id} className="card card-sm">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:8 }}>
                  {/* Partido */}
                  <div>
                    <div style={{ fontWeight:600, fontSize:14, marginBottom:2 }}>
                      {match
                        ? `${match.homeTeam?.shortName} vs ${match.awayTeam?.shortName}`
                        : `Partido #${pred.matchId}`}
                    </div>
                    {match && (
                      <div style={{ fontSize:12, color:"var(--text-muted)" }}>
                        {format(new Date(match.utcDate), "d MMM · HH:mm", { locale: es })}
                      </div>
                    )}
                  </div>

                  {/* Puntos */}
                  {res && (
                    <span style={{
                      fontFamily:"var(--font-display)", fontSize:"1.5rem",
                      color: earnedPts > 0 ? "var(--green)" : "var(--text-muted)",
                    }}>
                      +{earnedPts} pts
                    </span>
                  )}
                </div>

                <hr className="divider" style={{ margin:"10px 0" }} />

                <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:13 }}>
                  <div>
                    <span style={{ color:"var(--text-muted)" }}>Tu pronóstico: </span>
                    <strong>{pred.homeGoals} – {pred.awayGoals}</strong>
                    {pred.corners != null && <span style={{ color:"var(--text-muted)" }}> · ⛳ {pred.corners}</span>}
                    {pred.cards   != null && <span style={{ color:"var(--text-muted)" }}> · 🟨 {pred.cards}</span>}
                  </div>
                  {res ? (
                    <div>
                      <span style={{ color:"var(--text-muted)" }}>Resultado real: </span>
                      <strong>{res.homeGoals} – {res.awayGoals}</strong>
                      {res.corners != null && <span style={{ color:"var(--text-muted)" }}> · ⛳ {res.corners}</span>}
                      {res.cards   != null && <span style={{ color:"var(--text-muted)" }}> · 🟨 {res.cards}</span>}
                    </div>
                  ) : (
                    <span className="badge badge-gray">Pendiente de resultado</span>
                  )}
                </div>

                {/* Breakdown de puntos */}
                {res && earnedPts > 0 && (
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
                    {breakdown.winner      > 0 && <span className="badge badge-green">⚽ Ganador +{breakdown.winner}</span>}
                    {breakdown.exactScore  > 0 && <span className="badge badge-gold">🎯 Exacto +{breakdown.exactScore}</span>}
                    {breakdown.exactCorners > 0 && <span className="badge badge-blue">⛳ Córners +{breakdown.exactCorners}</span>}
                    {breakdown.exactCards  > 0 && <span className="badge badge-blue">🟨 Tarjetas +{breakdown.exactCards}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
