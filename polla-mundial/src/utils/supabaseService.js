import { supabase } from "../supabase";
import { translateCountry, translateStage, translateGroup } from "./translations";

// ── USUARIOS ────────────────────────────────────────────────────────────────

export async function getUsers() {
  const { data, error } = await supabase.from("users").select("*");
  if (error) throw error;
  // Mapeamos para compatibilidad con código anterior (uid -> id)
  return data.map(u => ({ ...u, uid: u.id }));
}

export async function getUserProfile(uid) {
  const { data, error } = await supabase.from("users").select("*").eq("id", uid).single();
  if (error) return null;
  return { ...data, uid: data.id };
}

export async function createUserProfile(uid, profileData) {
  const { error } = await supabase.from("users").insert({
    id: uid,
    display_name: profileData.displayName,
    email: profileData.email,
    role: profileData.role || "user",
    paid: profileData.paid || false,
    status: profileData.status || "approved"
  });
  if (error) throw error;
}

export async function updateUserProfile(uid, profileData) {
  const updates = {};
  if (profileData.displayName !== undefined) updates.display_name = profileData.displayName;
  if (profileData.role !== undefined) updates.role = profileData.role;
  if (profileData.paid !== undefined) updates.paid = profileData.paid;
  if (profileData.status !== undefined) updates.status = profileData.status;

  const { error } = await supabase.from("users").update(updates).eq("id", uid);
  if (error) throw error;
}

export async function deleteUserProfile(uid) {
  // Primero borrar auth.users requiere admin api, por ahora solo borramos el perfil publico o usamos API del servidor
  // Asumiendo RLS permite borrar:
  const { error } = await supabase.from("users").delete().eq("id", uid);
  if (error) throw error;
}

export async function getPendingUsers() {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("status", "pending_approval");
  if (error) throw error;
  return data.map(u => ({ ...u, uid: u.id, displayName: u.display_name }));
}

export async function approveUser(uid) {
  const { error } = await supabase
    .from("users")
    .update({ status: "approved", paid: true, receipt_url: null })
    .eq("id", uid);
  if (error) throw error;
}

// ── PREDICCIONES ─────────────────────────────────────────────────────────────

export async function savePrediction(userId, matchId, predData) {
  const id = `${userId}_${matchId}`;
  const { error } = await supabase.from("predictions").upsert({
    id,
    user_id: userId,
    match_id: String(matchId),
    home_goals: predData.homeGoals,
    away_goals: predData.awayGoals,
    corners: predData.corners,
    cards: predData.cards,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

export async function getUserPredictions(userId) {
  const { data, error } = await supabase.from("predictions").select("*").eq("user_id", userId);
  if (error) throw error;
  return data.map(d => ({
    id: d.id,
    userId: d.user_id,
    matchId: d.match_id,
    homeGoals: d.home_goals,
    awayGoals: d.away_goals,
    corners: d.corners,
    cards: d.cards
  }));
}

export async function getAllPredictions() {
  const { data, error } = await supabase.from("predictions").select("*");
  if (error) throw error;
  return data.map(d => ({
    id: d.id,
    userId: d.user_id,
    matchId: d.match_id,
    homeGoals: d.home_goals,
    awayGoals: d.away_goals,
    corners: d.corners,
    cards: d.cards
  }));
}

export async function getPrediction(userId, matchId) {
  const id = `${userId}_${matchId}`;
  const { data, error } = await supabase.from("predictions").select("*").eq("id", id).single();
  if (error) return null;
  return {
    id: data.id,
    userId: data.user_id,
    matchId: data.match_id,
    homeGoals: data.home_goals,
    awayGoals: data.away_goals,
    corners: data.corners,
    cards: data.cards
  };
}

// ── RESULTADOS ───────────────────────────────────────────────────────────────

export async function saveResult(matchId, resultData) {
  const { error } = await supabase.from("results").upsert({
    match_id: String(matchId),
    home_goals: resultData.homeGoals,
    away_goals: resultData.awayGoals,
    corners: resultData.corners,
    cards: resultData.cards,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}

export async function getResults() {
  const { data, error } = await supabase.from("results").select("*");
  if (error) throw error;
  return data.map(d => ({
    matchId: d.match_id,
    homeGoals: d.home_goals,
    awayGoals: d.away_goals,
    corners: d.corners,
    cards: d.cards
  }));
}

export async function getResult(matchId) {
  const { data, error } = await supabase.from("results").select("*").eq("match_id", String(matchId)).single();
  if (error) return null;
  return {
    matchId: data.match_id,
    homeGoals: data.home_goals,
    awayGoals: data.away_goals,
    corners: data.corners,
    cards: data.cards
  };
}

// ── PARTIDOS CACHE ────────────────────────────────────────────────────────────

export async function cacheMatches(matches) {
  const rows = matches.map(m => ({
    id: String(m.id),
    data: m
  }));
  const { error } = await supabase.from("matches_cache").upsert(rows);
  if (error) throw error;
}

export async function getCachedMatches() {
  const { data, error } = await supabase.from("matches_cache").select("*");
  if (error) throw error;
  
  return data.map(d => {
    const match = d.data;
    match.locked = d.locked;
    if (match.homeTeam) {
      match.homeTeam.name = translateCountry(match.homeTeam.name);
      match.homeTeam.shortName = translateCountry(match.homeTeam.shortName);
    }
    if (match.awayTeam) {
      match.awayTeam.name = translateCountry(match.awayTeam.name);
      match.awayTeam.shortName = translateCountry(match.awayTeam.shortName);
    }
    if (match.stage) match.stage = translateStage(match.stage);
    if (match.group) match.group = translateGroup(match.group);
    return match;
  });
}

export async function setMatchLocked(matchId, locked) {
  const { error } = await supabase.from("matches_cache").update({ locked }).eq("id", String(matchId));
  if (error) throw error;
}

export async function setAllMatchesLocked(matchIds, locked) {
  const { error } = await supabase.from("matches_cache").update({ locked }).in("id", matchIds);
  if (error) throw error;
}

// ── CONFIGURACIÓN DEL BOTE ───────────────────────────────────────────────────

export async function getPotConfig() {
  const { data, error } = await supabase.from("config").select("*").eq("id", "pot").single();
  if (error || !data) return { totalPot: 0, commission: 15, splits: [50, 30, 20], currency: "COP" };
  return {
    totalPot: data.total_pot,
    commission: data.commission,
    splits: data.splits,
    currency: data.currency
  };
}

export async function savePotConfig(config) {
  const { error } = await supabase.from("config").upsert({
    id: "pot",
    total_pot: config.totalPot,
    commission: config.commission,
    splits: config.splits,
    currency: config.currency
  });
  if (error) throw error;
}

// ── SUSCRIPCIONES (Ya no requeridas fuertemente pero dejemos dummy para no romper UI)

export function subscribeToResults(callback) {
  const channel = supabase.channel('results_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, payload => {
      getResults().then(callback);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}

export function subscribeToUserPredictions(userId, callback) {
  const channel = supabase.channel(`preds_${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions', filter: `user_id=eq.${userId}` }, payload => {
      getUserPredictions(userId).then(callback);
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// ── STORAGE UPLOAD ──────────────────────────────────────────────────────────

export async function uploadReceiptBase64(uid, base64String) {
  // Convertimos base64 (ej: data:image/jpeg;base64,.....) a Blob
  const base64Data = base64String.split(",")[1];
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: "image/jpeg" });
  const fileName = `receipt_${uid}_${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("receipts")
    .upload(fileName, blob, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from("receipts").getPublicUrl(fileName);

  // Actualizamos el usuario
  const { error } = await supabase
    .from("users")
    .update({ status: "pending_approval", receipt_url: publicUrl })
    .eq("id", uid);
    
  if (error) throw error;
}
