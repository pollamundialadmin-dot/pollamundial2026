// src/pages/admin/AdminUsers.js
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Navbar from "../../components/Navbar";
import {
  getUsers, createUserProfile, updateUserProfile, deleteUserProfile,
} from "../../utils/supabaseService";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, secondaryAuth } from "../../firebase";

const EMPTY_FORM = { displayName:"", email:"", password:"", role:"user", paid:false };

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState(null); // uid si edita, null si crea
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [saving,  setSaving]  = useState(false);


  const load = async () => {
    setLoading(true);
    setUsers(await getUsers());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY_FORM); setEditing(null); setModal(true); };
  const openEdit   = (u) => {
    setForm({ displayName: u.displayName, email: u.email, password:"", role: u.role, paid: u.paid });
    setEditing(u.uid);
    setModal(true);
  };

  const handleSave = async () => {
    if (!form.displayName || !form.email) { toast.error("Nombre y correo son obligatorios"); return; }
    setSaving(true);
    try {
      if (editing) {
        // Actualizar perfil existente (no cambia contraseña desde aquí por seguridad)
        await updateUserProfile(editing, {
          displayName: form.displayName,
          role:        form.role,
          paid:        form.paid,
        });
        toast.success("Usuario actualizado");
      } else {
        // Crear usuario en Firebase Auth + Firestore
        if (!form.password || form.password.length < 6) {
          toast.error("La contraseña debe tener al menos 6 caracteres"); setSaving(false); return;
        }
        // Usamos secondaryAuth para no cerrar la sesión del admin
        const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
        
        await createUserProfile(cred.user.uid, {
          displayName: form.displayName,
          email:       form.email,
          role:        form.role,
          paid:        form.paid,
        });

        // Cerramos la sesión secundaria que Firebase abre automáticamente
        await signOut(secondaryAuth);
        
        toast.success("Usuario creado ✓");
      }
      setModal(false);
      await load();
    } catch (e) {
      toast.error(e.message || "Error al guardar usuario");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (uid, name) => {
    if (!window.confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return;
    await deleteUserProfile(uid);
    toast.success("Usuario eliminado");
    await load();
  };

  const participants = users.filter(u => u.role !== "admin");
  const paidCount    = participants.filter(u => u.paid).length;

  return (
    <>
      <Navbar />
      <div className="page">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", flexWrap:"wrap", gap:12, marginBottom:24 }}>
          <div>
            <h1 className="section-title">Usuarios</h1>
            <p className="section-subtitle">{participants.length} participantes · {paidCount} han pagado</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ Agregar usuario</button>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="card" style={{ padding:0, overflow:"hidden" }}>
            <table className="leaderboard">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Pagó</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.uid}>
                    <td style={{ fontWeight:500 }}>{u.displayName}</td>
                    <td style={{ color:"var(--text-secondary)", fontSize:13 }}>{u.email}</td>
                    <td>
                      <span className={u.role === "admin" ? "badge badge-gold" : "badge badge-gray"}>
                        {u.role === "admin" ? "Admin" : "Jugador"}
                      </span>
                    </td>
                    <td>
                      <span className={u.role === "admin" ? "badge badge-gray" : u.paid ? "badge badge-green" : "badge badge-red"}>
                        {u.role === "admin" ? "N/A" : u.paid ? "✓ Pagó" : "✗ Pendiente"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:"flex", gap:6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(u)}>Editar</button>
                        {u.role !== "admin" && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.uid, u.displayName)}>
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:"1.4rem", marginBottom:20, letterSpacing:1 }}>
              {editing ? "EDITAR USUARIO" : "NUEVO USUARIO"}
            </h2>

            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input className="form-input" value={form.displayName}
                onChange={e => setForm({...form, displayName:e.target.value})} placeholder="Juan García" />
            </div>

            {!editing && (
              <div className="form-group">
                <label className="form-label">Correo electrónico</label>
                <input type="email" className="form-input" value={form.email}
                  onChange={e => setForm({...form, email:e.target.value})} placeholder="juan@correo.com" />
              </div>
            )}

            {!editing && (
              <div className="form-group">
                <label className="form-label">Contraseña inicial</label>
                <input type="password" className="form-input" value={form.password}
                  onChange={e => setForm({...form, password:e.target.value})} placeholder="Mínimo 6 caracteres" />
              </div>
            )}

            <div className="grid-2 mb-4">
              <div>
                <label className="form-label">Rol</label>
                <select className="form-input" value={form.role}
                  onChange={e => setForm({...form, role:e.target.value})}>
                  <option value="user">Jugador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div>
                <label className="form-label">Estado de pago</label>
                <select className="form-input" value={form.paid ? "true" : "false"}
                  onChange={e => setForm({...form, paid: e.target.value === "true"})}>
                  <option value="false">Pendiente</option>
                  <option value="true">Pagó ✓</option>
                </select>
              </div>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={handleSave} disabled={saving}>
                {saving ? "Guardando..." : editing ? "Actualizar" : "Crear usuario"}
              </button>
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
