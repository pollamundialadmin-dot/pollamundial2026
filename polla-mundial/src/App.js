// src/App.js
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Páginas Usuario
import LoginPage        from "./pages/LoginPage";
import DashboardPage    from "./pages/DashboardPage";
import PredictionsPage  from "./pages/PredictionsPage";
import LeaderboardPage  from "./pages/LeaderboardPage";
import HistoryPage      from "./pages/HistoryPage";

// Páginas Admin
import AdminDashboard   from "./pages/admin/AdminDashboard";
import AdminUsers       from "./pages/admin/AdminUsers";
import AdminResults     from "./pages/admin/AdminResults";
import AdminPredictions from "./pages/admin/AdminPredictions";
import AdminConfig      from "./pages/admin/AdminConfig";

import "./styles/global.css";

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function UserRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/admin" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/login" element={<LoginPage />} />

      {/* Usuario */}
      <Route path="/" element={<UserRoute><DashboardPage /></UserRoute>} />
      <Route path="/predictions" element={<UserRoute><PredictionsPage /></UserRoute>} />
      <Route path="/leaderboard" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />
      <Route path="/history" element={<UserRoute><HistoryPage /></UserRoute>} />

      {/* Admin */}
      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="/admin/results" element={<AdminRoute><AdminResults /></AdminRoute>} />
      <Route path="/admin/predictions" element={<AdminRoute><AdminPredictions /></AdminRoute>} />
      <Route path="/admin/config" element={<AdminRoute><AdminConfig /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--bg-card)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
            },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
