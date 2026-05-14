// src/firebase.js
// ─────────────────────────────────────────────────────────────────────────────
// INSTRUCCIONES DE CONFIGURACIÓN:
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un proyecto nuevo → "polla-mundial-2026"
// 3. Ve a Configuración del proyecto → Aplicaciones web → Agregar app
// 4. Copia las credenciales y reemplaza los valores de REACT_APP_* en .env
// 5. En Firebase Console: activa Firestore, Authentication (email/password)
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId:     process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const app  = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db   = getFirestore(app);
export const auth = getAuth(app);
export default app;