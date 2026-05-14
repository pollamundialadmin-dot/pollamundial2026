// src/utils/firestoreService.js
// ─────────────────────────────────────────────────────────────────────────────
// Todas las operaciones con Firestore centralizadas aquí.
//
// Colecciones:
//   users/          { displayName, email, role, paid, createdAt }
//   matches/        { id, utcDate, homeTeam, awayTeam, status, … }
//   predictions/    { userId, matchId, homeGoals, awayGoals, corners, cards, createdAt }
//   results/        { matchId, homeGoals, awayGoals, corners, cards, updatedAt }
//   config/pot      { totalPot, commission, splits[3], currency }
// ─────────────────────────────────────────────────────────────────────────────

import {
  collection, doc, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, serverTimestamp, onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";

// ── USUARIOS ────────────────────────────────────────────────────────────────

export async function getUsers() {
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { uid: snap.id, ...snap.data() } : null;
}

/** Admin crea un usuario en Firestore (el Auth lo crea por separado con Admin SDK o Cloud Function) */
export async function createUserProfile(uid, data) {
  await setDoc(doc(db, "users", uid), {
    ...data,
    role:      data.role || "user",
    paid:      data.paid || false,
    createdAt: serverTimestamp(),
  });
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, "users", uid), data);
}

export async function deleteUserProfile(uid) {
  await deleteDoc(doc(db, "users", uid));
}

// ── PREDICCIONES ─────────────────────────────────────────────────────────────

/** Guarda o actualiza la predicción de un usuario para un partido */
export async function savePrediction(userId, matchId, predData) {
  const id   = `${userId}_${matchId}`;
  await setDoc(doc(db, "predictions", id), {
    userId,
    matchId,
    ...predData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

/** Obtiene todas las predicciones de un usuario */
export async function getUserPredictions(userId) {
  const q    = query(collection(db, "predictions"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Obtiene TODAS las predicciones (solo admin) */
export async function getAllPredictions() {
  const snap = await getDocs(collection(db, "predictions"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Predicción específica de usuario + partido */
export async function getPrediction(userId, matchId) {
  const snap = await getDoc(doc(db, "predictions", `${userId}_${matchId}`));
  return snap.exists() ? snap.data() : null;
}

// ── RESULTADOS ───────────────────────────────────────────────────────────────

export async function saveResult(matchId, resultData) {
  await setDoc(doc(db, "results", String(matchId)), {
    matchId,
    ...resultData,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}

export async function getResults() {
  const snap = await getDocs(collection(db, "results"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getResult(matchId) {
  const snap = await getDoc(doc(db, "results", String(matchId)));
  return snap.exists() ? snap.data() : null;
}

// ── PARTIDOS CACHE ────────────────────────────────────────────────────────────
// Guardamos los partidos en Firestore para no depender 100% de la API externa

export async function cacheMatches(matches) {
  const promises = matches.map((m) =>
    setDoc(doc(db, "matches", String(m.id)), m, { merge: true })
  );
  await Promise.all(promises);
}

export async function getCachedMatches() {
  const snap = await getDocs(collection(db, "matches"));
  return snap.docs.map((d) => ({ ...d.data() }));
}

// ── CONFIGURACIÓN DEL BOTE ───────────────────────────────────────────────────

export async function getPotConfig() {
  const snap = await getDoc(doc(db, "config", "pot"));
  return snap.exists()
    ? snap.data()
    : { totalPot: 0, commission: 15, splits: [50, 30, 20], currency: "COP" };
}

export async function savePotConfig(config) {
  await setDoc(doc(db, "config", "pot"), config, { merge: true });
}

// ── SUSCRIPCIONES EN TIEMPO REAL ─────────────────────────────────────────────

/** Escucha cambios en resultados en tiempo real */
export function subscribeToResults(callback) {
  return onSnapshot(collection(db, "results"), (snap) => {
    const results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(results);
  });
}

/** Escucha cambios en predicciones de un usuario */
export function subscribeToUserPredictions(userId, callback) {
  const q = query(collection(db, "predictions"), where("userId", "==", userId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}
