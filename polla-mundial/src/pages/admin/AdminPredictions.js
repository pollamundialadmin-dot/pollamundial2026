// src/pages/admin/AdminPredictions.js
import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { getAllPredictions, getUsers, getResults, getCachedMatches } from "../../utils/firestoreService";
import { calculatePoints } from "../../utils/points";

export default function AdminPredictions() {
  const [data,    setData]    = useState([]);
  const [matches, setMatches] = useState({});
  const [filter,  setFilter]  = useState("all"); // matchId
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [preds, users, results, ms] = await Promise.all([
        getAllPredictions(), getUsers(), getResults(), getCachedMatches(),
      ]);

      const userMap  = {};  users.forEach(u => { userMap[u.uid] = u; });
      const resMap   = {};  results.forEach(r => { resMap[String(r.matchId)] = r; });
      const matchMap = {};  ms.forEach(m => { matchMap[String(m.id)] = m; });

      const rows = preds.map(p => {
        const res = resMap[String(p.matchId)];
        const { total, breakdown } = res ? calculatePoints(p, res) : { total:0, breakdown:{} };
        return {
          ...p,
          user:  userMap[p.userId],
          match: matchMap[String(p.matchId)],
          res,
          earnedPts: total,
          breakdown,
        };
      });

      setData(rows);
      setMatches(matchMap);
      setLoading(false);
    }
    load();
  }, []);

  const matchOptions = [...new Set(data.map(d => String(d.matchId)))];
  const filtered = filter === "all" ? data : data.filter(d => String(d.matchId) === filter);

  // Agrupar por partido si "all"
  const grouped = {};
  filtered.forEach(row => {
    const key = String(row.matchId);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  });

  return (
    <>
      <Navbar />
      <div className="page">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12, marginBottom:24 }}>
          <div>
            <h1 className="section-title">Pronósticos</h1>
            <p className="section-subtitle">{data.length} pronósticos en total</p>
          </div>
          <select className="form-input" style={{ width:"auto" }} value={filter}
            onChange={e => setFilter(e.target.value)}>
            <option value="all">Todos los partidos</option>
            {matchOptions.map(id => {
              const m = matches[id];
              return (
                <option key={id} value={id}>
                  {m ? `${m.homeTeam?.shortName} vs ${m.awayTeam?.shortName}` : `Partido ${id}`}
                </option>
              );
            })}
          </select>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          Object.entries(grouped).map(([matchId, rows]) => {
            const m = matches[matchId];
            const res = rows[0]?.res;
            return (
              <div key={matchId} className="card mb-4">
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12, flexWrap:"wrap", gap:8 }}>
                  <h2 style={{ fontWeight:600, fontSize:15 }}>
                    {m ? `${m.homeTeam?.shortName} vs ${m.awayTeam?.shortName}` : `Partido ${matchId}`}
                  </h2>
                  {res ? (
                    <span className="badge badge-green">
                      Resultado: {res.homeGoals}–{res.awayGoals}
                      {res.corners != null && ` · ⛳${res.corners}`}
                      {res.cards   != null && ` · 🟨${res.cards}`}
                    </span>
                  ) : (
                    <span className="badge badge-gray">Sin resultado aún</span>
                  )}
                </div>

                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:"1px solid var(--border)" }}>
                      <th style={{ textAlign:"left", padding:"6px 8px", color:"var(--text-muted)", fontWeight:500, fontSize:11, textTransform:"uppercase" }}>Participante</th>
                      <th style={{ textAlign:"center", padding:"6px 8px", color:"var(--text-muted)", fontWeight:500, fontSize:11 }}>Marcador</th>
                      <th style={{ textAlign:"center", padding:"6px 8px", color:"var(--text-muted)", fontWeight:500, fontSize:11 }}>⛳</th>
                      <th style={{ textAlign:"center", padding:"6px 8px", color:"var(--text-muted)", fontWeight:500, fontSize:11 }}>🟨</th>
                      <th style={{ textAlign:"center", padding:"6px 8px", color:"var(--text-muted)", fontWeight:500, fontSize:11 }}>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.sort((a,b) => b.earnedPts - a.earnedPts).map(row => (
                      <tr key={row.id} style={{ borderBottom:"1px solid var(--border-dim)" }}>
                        <td style={{ padding:"8px 8px" }}>{row.user?.displayName || row.userId}</td>
                        <td style={{ textAlign:"center", fontFamily:"var(--font-display)", fontSize:"1.1rem" }}>
                          {row.homeGoals}–{row.awayGoals}
                        </td>
                        <td style={{ textAlign:"center", color:"var(--text-secondary)" }}>
                          {row.corners ?? "–"}
                        </td>
                        <td style={{ textAlign:"center", color:"var(--text-secondary)" }}>
                          {row.cards ?? "–"}
                        </td>
                        <td style={{ textAlign:"center" }}>
                          {res ? (
                            <span style={{ fontFamily:"var(--font-display)", fontSize:"1.1rem",
                              color: row.earnedPts > 0 ? "var(--green)" : "var(--text-muted)" }}>
                              +{row.earnedPts}
                            </span>
                          ) : "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
