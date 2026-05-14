// functions/index.js
// ─────────────────────────────────────────────────────────────────────────────
// Proxy para football-data.org
// Resuelve el problema de CORS: el navegador no puede llamar la API directamente,
// pero esta Cloud Function sí puede (corre en servidor).
// ─────────────────────────────────────────────────────────────────────────────

const functions = require("firebase-functions");
const fetch     = require("node-fetch");
const cors      = require("cors")({ origin: true });

const BASE_URL = "https://api.football-data.org/v4";

// Lee la API key desde la configuración de Firebase Functions
// La configuras con: firebase functions:config:set football.apikey="TU_KEY"
function getApiKey() {
  try {
    return functions.config().football.apikey;
  } catch {
    return process.env.FOOTBALL_API_KEY || "";
  }
}

/**
 * Función genérica proxy — recibe el path como query param
 * Ejemplo: /footballProxy?path=/competitions/2000/matches?dateFrom=2026-05-14
 */
exports.footballProxy = functions
  .region("us-central1")
  .https.onRequest((req, res) => {
    cors(req, res, async () => {
      try {
        const path = req.query.path;
        if (!path) {
          return res.status(400).json({ error: "Falta el parámetro 'path'" });
        }

        const url = `${BASE_URL}${path}`;
        const apiRes = await fetch(url, {
          headers: {
            "X-Auth-Token": getApiKey(),
          },
        });

        const data = await apiRes.json();

        if (!apiRes.ok) {
          return res.status(apiRes.status).json(data);
        }

        // Cache de 5 minutos para no agotar el límite de 10 req/min
        res.set("Cache-Control", "public, max-age=300, s-maxage=300");
        return res.status(200).json(data);
      } catch (err) {
        console.error("footballProxy error:", err);
        return res.status(500).json({ error: "Error interno del proxy" });
      }
    });
  });
