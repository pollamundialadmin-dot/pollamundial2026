// src/components/Navbar.js
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import StyledSwal from "../utils/swalConfig";

export default function Navbar() {
  const { profile, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await StyledSwal.fire({
      title: "¿CERRAR SESIÓN?",
      text: "¿Estás seguro que deseas salir de la aplicación?",
      icon: "question",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
      showCancelButton: true,
    });

    if (result.isConfirmed) {
      await logout();
      toast.success("Sesión cerrada");
      navigate("/login");
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          GOLAZO<span>MUNDIAL</span>
        </NavLink>

        {isAdmin ? (
          <>
            <NavLink to="/admin" className="nav-link" end>Panel</NavLink>
            <NavLink to="/admin/users" className="nav-link">Usuarios</NavLink>
            <NavLink to="/admin/results" className="nav-link">Resultados</NavLink>
            <NavLink to="/admin/predictions" className="nav-link">Pronósticos</NavLink>
            <NavLink to="/admin/config" className="nav-link">Config</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/" className="nav-link" end>Partidos</NavLink>
            <NavLink to="/leaderboard" className="nav-link">Tabla</NavLink>
            <NavLink to="/history" className="nav-link">Mi historial</NavLink>
          </>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" }}>
          <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {profile?.displayName || "Usuario"}
          </span>
          {isAdmin && <span className="nav-badge">ADMIN</span>}
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}
