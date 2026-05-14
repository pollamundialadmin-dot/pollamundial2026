// src/pages/LoginPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const { login }               = useAuth();
  const navigate                = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("¡Bienvenido!");
      navigate("/");
    } catch (err) {
      toast.error("Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
      padding:16, background:"var(--bg)",
    }}>
      <div style={{ width:"100%", maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <h1 style={{
            fontFamily:"var(--font-display)", fontSize:"3.5rem",
            letterSpacing:4, color:"var(--green)", lineHeight:1,
          }}>
            POLLA
          </h1>
          <p style={{
            fontFamily:"var(--font-display)", fontSize:"1.4rem",
            letterSpacing:6, color:"var(--text-secondary)", marginTop:4,
          }}>
            MUNDIAL 2026
          </p>
          <p style={{ color:"var(--text-muted)", fontSize:13, marginTop:10 }}>
            Ingresa con tu cuenta para hacer tus pronósticos
          </p>
        </div>

        {/* Card */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input
                type="email"
                className="form-input"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-block"
              style={{ marginTop:8 }}
              disabled={loading}
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        <p style={{ textAlign:"center", color:"var(--text-muted)", fontSize:12, marginTop:20 }}>
          ¿No tienes cuenta? Contacta al administrador para que te agregue.
        </p>
      </div>
    </div>
  );
}
