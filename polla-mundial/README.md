# 🏆 Polla Mundial 2026

Aplicación web completa para organizar una polla futbolera del Mundial FIFA 2026.

---

## Stack tecnológico

| Capa | Tecnología | Costo |
|------|-----------|-------|
| Frontend | React 18 | Gratis |
| Base de datos | Firebase Firestore | Gratis (plan Spark) |
| Autenticación | Firebase Auth | Gratis |
| Hosting | Cloudflare Pages | Gratis |
| API de partidos | football-data.org | Gratis (10 req/min) |
| Dominio | Namecheap / Spaceship | ~$10–15 USD/año |

**Costo total estimado: ~$10–15 USD (solo el dominio)**

---

## Sistema de puntos

| Acierto | Puntos |
|---------|--------|
| Ganador correcto (o empate acertado) | **3 pts** |
| Marcador exacto | **+5 pts** (total 8 si también ganador) |
| Tiros de esquina exactos | **+2 pts** |
| Total de tarjetas exacto | **+2 pts** |
| **Todo exacto** | **12 pts** |

---

## Estructura de archivos

```
polla-mundial/
├── public/
│   ├── index.html
│   └── _redirects          ← routing SPA para Cloudflare Pages
├── src/
│   ├── App.js              ← rutas y protección de acceso
│   ├── index.js
│   ├── firebase.js         ← configuración Firebase
│   ├── context/
│   │   └── AuthContext.js  ← autenticación y rol
│   ├── pages/
│   │   ├── LoginPage.js
│   │   ├── DashboardPage.js     ← partidos del día + pronósticos
│   │   ├── PredictionsPage.js   ← todos los partidos del torneo
│   │   ├── LeaderboardPage.js   ← tabla de posiciones
│   │   ├── HistoryPage.js       ← historial personal
│   │   └── admin/
│   │       ├── AdminDashboard.js
│   │       ├── AdminUsers.js    ← crear/editar/eliminar usuarios
│   │       ├── AdminResults.js  ← ingresar resultados
│   │       ├── AdminPredictions.js
│   │       └── AdminConfig.js   ← bote y porcentajes
│   ├── components/
│   │   └── Navbar.js
│   ├── utils/
│   │   ├── footballApi.js       ← wrapper football-data.org
│   │   ├── firestoreService.js  ← todas las ops de Firestore
│   │   └── points.js            ← lógica de puntuación
│   └── styles/
│       └── global.css
├── firestore.rules         ← reglas de seguridad
├── .env.example            ← plantilla de variables de entorno
└── package.json
```

---

## ⚙️ Configuración paso a paso

### 1. Clonar e instalar

```bash
git clone <tu-repositorio>
cd polla-mundial
npm install
```

### 2. Configurar Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Crea proyecto → **"polla-mundial-2026"**
3. Activa **Firestore Database** (modo producción)
4. Activa **Authentication** → método **Correo/contraseña**
5. Ve a Configuración del proyecto → Aplicaciones web → Agregar
6. Copia las credenciales

### 3. Variables de entorno

```bash
cp .env.example .env
# Edita .env con tus credenciales de Firebase y football-data.org
```

### 4. Registrarse en football-data.org

1. Ve a [football-data.org](https://www.football-data.org/client/register)
2. Regístrate gratis → recibirás tu API key por correo
3. Agrega la key en `.env` como `REACT_APP_FOOTBALL_API_KEY`
4. El ID del Mundial 2026 es el código `WC` — confirmar cuando esté disponible

### 5. Configurar reglas de Firestore

1. En Firebase Console → Firestore → Reglas
2. Copia el contenido de `firestore.rules` y guarda

### 6. Crear el primer administrador

```bash
# Opción A: desde el Panel Admin de la app una vez arrancada
# Opción B: en Firebase Console → Firestore → Colección "users"
# Crea un documento con el UID del usuario y campo: role: "admin"
```

### 7. Correr en desarrollo

```bash
npm start
# Abre http://localhost:3000
```

### 8. Construir para producción

```bash
npm run build
# Genera carpeta /build lista para subir a Cloudflare Pages
```

---

## 🚀 Deploy en Cloudflare Pages (recomendado)

1. Sube el código a un repositorio de GitHub
2. Ve a [Cloudflare Pages](https://pages.cloudflare.com/)
3. Conecta tu repositorio de GitHub
4. Configuración de build:
   - **Build command:** `npm run build`
   - **Build output directory:** `build`
5. En **Variables de entorno**, agrega todas las de `.env`
6. Deploy → en 2 minutos tendrás tu URL gratis

---

## 💰 Calculadora de premios (ejemplo)

Para **30 participantes** con cupo de **$30.000 COP**:

| Concepto | Valor |
|----------|-------|
| Bote total | $900.000 |
| Comisión (15%) | $135.000 |
| Bote premios | $765.000 |
| 🥇 1er puesto (50%) | $382.500 |
| 🥈 2do puesto (30%) | $229.500 |
| 🥉 3er puesto (20%) | $153.000 |

---

## 📝 Notas importantes

- **Tarjetas y córners:** football-data.org plan gratuito no incluye estas estadísticas en tiempo real. Debes ingresarlas manualmente desde el **Panel Admin → Resultados** al finalizar cada partido.
- **Cierre de pronósticos:** actualmente los pronósticos se bloquean automáticamente cuando el partido pasa a estado `IN_PLAY`. Verifica que el administrador actualice los resultados oportunamente.
- **Zona horaria:** los horarios de la API vienen en UTC. La app los convierte automáticamente a la hora local del navegador del usuario.

---

## 🛠️ Próximas mejoras sugeridas

- [ ] Notificaciones push cuando se acerque un partido
- [ ] Exportar tabla de posiciones a PDF
- [ ] Estadísticas detalladas por usuario
- [ ] Sistema de grupos/ligas privadas
- [ ] Integración con Nequi/Bancolombia para confirmar pagos
