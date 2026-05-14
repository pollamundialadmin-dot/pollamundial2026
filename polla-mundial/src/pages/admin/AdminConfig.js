// src/pages/admin/AdminConfig.js
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";
import { getPotConfig, savePotConfig } from "../../utils/firestoreService";
import { calculatePrizes } from "../../utils/points";

export default function AdminConfig() {
  const [config,  setConfig]  = useState({ totalPot:0, commission:15, splits:[50,30,20], currency:"COP" });
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPotConfig().then(c => { setConfig(c); setLoading(false); });
  }, []);

  const prizes  = calculatePrizes(config.totalPot, config.commission, config.splits);
  const fmtCOP  = (n) => "$" + Math.round(n).toLocaleString("es-CO");
  const splitSum = config.splits.reduce((a,b) => a+b, 0);

  const setSplit = (i, val) => {
    const s = [...config.splits];
    s[i] = Number(val);
    setConfig({...config, splits: s});
  };

  const handleSave = async () => {
    if (splitSum !== 100) { toast.error("Los porcentajes de premio deben sumar exactamente 100%"); return; }
    setSaving(true);
    try {
      await savePotConfig(config);
      toast.success("Configuración guardada ✓");
    } catch { toast.error("Error al guardar"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Navbar />
      <div className="page" style={{ maxWidth:640 }}>
        <h1 className="section-title">Configuración del bote</h1>
        <p className="section-subtitle">Define el valor del bote y la distribución de premios</p>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <>
            <div className="card mb-4">
              <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.2rem", letterSpacing:1, marginBottom:16 }}>BOTE Y COMISIÓN</h2>

              <div className="form-group">
                <label className="form-label">Bote total recaudado (COP)</label>
                <input type="number" className="form-input"
                  value={config.totalPot}
                  onChange={e => setConfig({...config, totalPot: Number(e.target.value)})}
                  placeholder="ej. 900000" />
                <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:4 }}>
                  Ingresa el total acumulado de todos los cupos pagados.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Comisión organizadores (%)</label>
                <input type="number" className="form-input" min={0} max={50}
                  value={config.commission}
                  onChange={e => setConfig({...config, commission: Number(e.target.value)})} />
              </div>
            </div>

            <div className="card mb-4">
              <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.2rem", letterSpacing:1, marginBottom:6 }}>
                DISTRIBUCIÓN DE PREMIOS
              </h2>
              <p style={{ fontSize:12, color:"var(--text-muted)", marginBottom:16 }}>
                Porcentajes del bote neto (después de comisión). Deben sumar 100%.
              </p>

              {["🥇 1er puesto","🥈 2do puesto","🥉 3er puesto"].map((label, i) => (
                <div className="form-group" key={i}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <label className="form-label">{label}</label>
                    <span style={{ fontSize:13, color:"var(--green)", fontWeight:600 }}>
                      {fmtCOP(prizes.prizes[i])}
                    </span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <input type="range" min={0} max={100} value={config.splits[i]}
                      onChange={e => setSplit(i, e.target.value)}
                      style={{ flex:1, accentColor:"var(--green)" }} />
                    <input type="number" className="form-input" style={{ width:72 }}
                      min={0} max={100} value={config.splits[i]}
                      onChange={e => setSplit(i, e.target.value)} />
                    <span style={{ color:"var(--text-muted)", fontSize:13, minWidth:16 }}>%</span>
                  </div>
                </div>
              ))}

              <div style={{
                padding:"10px 14px", borderRadius:8, marginTop:4,
                background: splitSum === 100 ? "var(--green-dim)" : "var(--red-dim)",
                color: splitSum === 100 ? "var(--green)" : "var(--red)",
                fontSize:13, fontWeight:500,
              }}>
                {splitSum === 100
                  ? `✓ Los porcentajes suman 100%`
                  : `⚠ Los porcentajes suman ${splitSum}% — deben ser exactamente 100%`}
              </div>
            </div>

            {/* Resumen */}
            <div className="card mb-6">
              <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.2rem", letterSpacing:1, marginBottom:16 }}>RESUMEN</h2>
              <div className="grid-3">
                {[
                  { label:"Bote total",     val: fmtCOP(config.totalPot),       color:"var(--text-primary)" },
                  { label:"Comisión org.",  val: fmtCOP(prizes.commissionAmt),  color:"var(--blue)" },
                  { label:"Bote premios",   val: fmtCOP(prizes.prizePot),       color:"var(--green)" },
                ].map(item => (
                  <div key={item.label} className="card card-sm" style={{ textAlign:"center" }}>
                    <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:4 }}>{item.label}</div>
                    <div style={{ fontFamily:"var(--font-display)", fontSize:"1.4rem", color:item.color }}>{item.val}</div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-primary btn-block" onClick={handleSave} disabled={saving || splitSum !== 100}>
              {saving ? "Guardando..." : "Guardar configuración"}
            </button>
          </>
        )}
      </div>
    </>
  );
}
