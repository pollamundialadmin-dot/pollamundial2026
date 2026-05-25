import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuchar cambios de sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Obtener perfil desde Supabase
        const { data: prof } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        
        if (prof) {
          setProfile(prof);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    // Carga inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (email, password, displayName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          displayName,
          role: "user",
          paid: false,
          status: "pending_upload"
        }
      }
    });
    if (error) throw error;
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = profile?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, resetPassword, logout, isAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
