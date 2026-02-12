# Music Scrobbler

A presentation-ready, feature-rich music analytics web app built with **React + Vite** that connects to **Last.fm** for listening history, optionally enriches artwork via **Spotify**, and supports **song recognition** through an **ACRCloud proxy backend**.

---

## 1) Project Overview

Music Scrobbler is a personal listening dashboard focused on:

- **Authentication with Last.fm** (OAuth token exchange flow).
- **Top charts** (artists, albums, tracks) by time period.
- **Statistics and trends** (daily patterns, tags, top entities).
- **Collage generation** (album/artist/track image grids exportable as PNG).
- **Friends/taste comparison** views.
- **Recommendations and discovery** workflows.
- **Listening goals and streak-like motivation UX**.
- **Audio recognition** (upload or record snippet and identify tracks via ACRCloud).
- **Optional analytics pipeline** in `backend/` for ingesting and aggregating local scrobble exports.

The frontend is the core product, while backend tooling is split into:

1. **Recognition proxy server** (`backend/server.js`) for secure ACRCloud credentials usage.
2. **CLI data pipeline** (`backend/cli.js` + `backend/src/*`) for local scrobble ingestion and analytics generation.

---

## 2) Tech Stack

### Frontend
- React 19
- React Router 7
- Vite 7
- Axios
- Recharts
- Lucide React icons
- Tailwind CSS (with PostCSS config present; app mixes utility classes + custom CSS)

### Backend / Tooling
- Node.js (ESM)
- Express 5
- Multer
- CORS
- Dotenv
- Axios + form-data

---

## 3) Repository Structure

```text
music-scrobbler/
├─ src/
│  ├─ components/        # Reusable UI blocks (charts, recognition cards, navbar, etc.)
│  ├─ pages/             # Route-level screens
│  ├─ services/          # API integrations (Last.fm, Spotify, recognition)
│  ├─ hooks/             # Custom React hooks (auth, theme)
│  ├─ utils/             # Helpers, cache, URL/image builders
│  ├─ config/            # Route definitions and nav metadata
│  ├─ store/             # Small local persistence helpers
│  ├─ App.jsx            # Main router + auth gating + onboarding/back-to-top UX
│  └─ main.jsx           # React entrypoint
├─ backend/
│  ├─ server.js          # ACRCloud proxy backend
│  ├─ cli.js             # CLI for ingest/build analytics
│  └─ src/               # Pipeline internals (schema, fs, analytics)
├─ public/
├─ index.html
├─ vite.config.js
├─ eslint.config.js
└─ README.md
```

---

## 4) Product Features (Presentation Talking Points)

## 4.1 Auth + Session Model
- Uses Last.fm auth URL redirect and callback token exchange.
- Session token and username are persisted in `localStorage`.
- Auth state is synchronized across tabs via the `storage` event.
- Unauthenticated users only see login; authenticated users unlock all feature routes.

## 4.2 Navigation + Route Architecture
- Central route metadata in `src/config/routes.js` drives:
  - router map,
  - navbar labels,
  - mobile labels,
  - descriptions.
- Supports onboarding modal and “back to top” utility button.

## 4.3 Charts Page
- Fetches top artists/albums/tracks from Last.fm for selected period.
- Caches chart results by user + tab + time-range.
- Fallback artwork strategy:
  1. Last.fm image,
  2. Spotify Client Credentials image lookup,
  3. empty state.
- Quick outbound links (Spotify/YouTube search URL helpers).

## 4.4 Statistics Page
- Aggregates recent tracks into:
  - activity trends,
  - weekday/hour distributions,
  - top artists by playcount,
  - weighted tag cloud.
- Uses Recharts for line, bar, and pie visualizations.
- Includes listening heatmap calendar component.

## 4.5 Collage Generator
- Builds image mosaics using Canvas.
- Supports collage type (artists/albums/tracks), time periods, grid sizes.
- Downloads final collage as PNG.
- Uses Spotify fallback when Last.fm image coverage is incomplete.

## 4.6 Discovery, Recommendations, Friends, Goals, Profile
- Modular route-based pages for exploration and engagement.
- Designed as complementary storytelling areas:
  - discovery of adjacent artists/songs,
  - recommendation surfacing,
  - social comparison,
  - progression and habit framing (goals).

## 4.7 Song Recognition (SonicID-style flow)
- Browser-side recording/upload + waveform visualization.
- Frontend posts audio multipart payload to recognition API.
- Backend signs ACRCloud requests server-side and returns normalized result fields.
- Handles timeout and API failure scenarios with user-facing errors.

## 4.8 Optional Local Analytics Pipeline
- CLI ingest command normalizes raw JSON array records.
- Persists canonical records as NDJSON.
- Build command computes totals, top artists/tracks, activity-by-day.
- Useful for demos where you want deterministic local analytics artifacts.

---

## 5) Route Map (UI Screens)

Authenticated routes:

- `/` — Home
- `/charts` — Charts
- `/statistics` — Statistics
- `/collage` — Collage Generator
- `/friends` — Friends comparison
- `/profile` — Profile
- `/recommendations` — Recommendations
- `/recognition` — Song recognition
- `/goals` — Listening goals
- `/discovery` — Discovery lab

Public route:

- `/callback` — OAuth callback token exchange

---

## 6) API Integrations

## 6.1 Last.fm (`src/services/lastfm.js`)
- Centralized wrapper around Last.fm REST endpoints.
- Includes client-side MD5 signature logic for signed methods (session exchange).
- Stores session credentials in `localStorage`.
- Exposes methods consumed by pages (recent tracks, top artists, tags, etc.).

## 6.2 Spotify (`src/services/spotify.js`)
- Uses Client Credentials flow for image enrichment.
- Token cache in memory + localStorage with expiry handling.
- Image cache by search key to reduce repeated API hits.

## 6.3 Recognition API (`src/services/recognition.js`)
- Sends `multipart/form-data` audio file to backend endpoint.
- Timeout-aware request and normalized response shape for UI consumption.

---

## 7) Backend Details

## 7.1 Recognition Server (`backend/server.js`)
Responsibilities:
- CORS handling and frontend origin allow-list.
- Audio file upload parsing via multer (memory storage, 10MB cap).
- ACRCloud signature generation (HMAC SHA1).
- Request proxying to `https://<ACR_HOST>/v1/identify`.
- Response normalization and robust error mapping.
- Health and root info endpoints.

Default port: `3001` (configurable via `PORT`).

## 7.2 CLI Analytics (`backend/cli.js` + `backend/src/*`)
Commands:
- `ingest <path-to-json>`: validate/normalize and append NDJSON records.
- `build`: read ingested NDJSON and compute analytics output JSON.

Generated artifacts:
- `backend/data/scrobbles.ndjson`
- `backend/out/analytics.json`

---

## 8) Environment Variables

Create `.env` for frontend and backend runtime values.

### 8.1 Frontend (Vite)

| Variable | Required | Purpose |
|---|---|---|
| `VITE_LASTFM_API_KEY` | Yes | Last.fm API access |
| `VITE_LASTFM_SHARED_SECRET` | Yes | Last.fm signed auth methods |
| `VITE_SPOTIFY_CLIENT_ID` | Optional | Spotify image fallback |
| `VITE_SPOTIFY_CLIENT_SECRET` | Optional | Spotify image fallback |
| `VITE_ACR_ACCESS_KEY` | Optional* | Frontend-side proxy config variant |
| `VITE_ACR_ACCESS_SECRET` | Optional* | Frontend-side proxy config variant |
| `VITE_ACR_HOST` | Optional | Host used by Vite proxy path rewrite |
| `VITE_ACR_SCHEME` | Optional | `http` or `https` for proxy target |
| `VITE_RECOGNITION_API_URL` | Optional | Recognition backend base URL (default `http://localhost:3001`) |

> `*` Main production-safe setup is backend env vars; avoid exposing ACR secrets in browser contexts.

### 8.2 Backend (`backend/server.js`)

| Variable | Required | Purpose |
|---|---|---|
| `ACR_ACCESS_KEY` | Yes | ACRCloud access key |
| `ACR_ACCESS_SECRET` | Yes | ACRCloud access secret |
| `ACR_HOST` | Optional | ACRCloud region host |
| `PORT` | Optional | Backend listening port |
| `FRONTEND_URL` | Optional | Comma-separated CORS allow-list |

---

## 9) Scripts

| Script | Command | Description |
|---|---|---|
| Dev server | `npm run dev` | Start Vite frontend |
| Build | `npm run build` | Production frontend build |
| Lint | `npm run lint` | ESLint checks |
| Preview | `npm run preview` | Serve build output locally |
| Backend ingest | `npm run backend:ingest -- <file>` | Ingest JSON scrobbles file |
| Backend build | `npm run backend:build` | Build analytics JSON from ingested data |
| Recognition backend | `npm run acr:proxy` | Run Express ACR recognition server |

---

## 10) Local Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Add environment variables in `.env`.
3. Start frontend:
   ```bash
   npm run dev
   ```
4. (If using recognition) start backend in another terminal:
   ```bash
   npm run acr:proxy
   ```
5. Open Vite URL shown in terminal.

---

## 11) Architecture Notes for Presentation

- **Separation of concerns:**
  - UI pages/components (`src/pages`, `src/components`),
  - API connectors (`src/services`),
  - domain helpers (`src/utils`),
  - backend-specific logic (`backend`).
- **Performance-minded behavior:**
  - client caching for charts and Spotify token/image lookups,
  - selective data fetching by route and time range.
- **Reliability patterns:**
  - graceful fallback to cached data,
  - explicit error messages,
  - request timeouts,
  - health endpoint for backend operational checks.
- **Demo friendliness:**
  - deterministic CLI analytics artifacts,
  - presentable multi-page UX with many data narratives.

---

## 12) Current Limitations / Improvement Backlog

- No formal automated test suite is currently included.
- Last.fm signing uses client-side secret handling; production-hardening would move all signed auth methods server-side.
- `src/services/yooutube.js` exists but is empty (likely placeholder/typo artifact).
- Mixed styling approaches (custom CSS, inline styles, utility classes) can be unified for long-term maintainability.

---

## 13) Suggested Presentation Narrative (5–10 min)

1. **Problem statement:** music listeners want richer self-analytics than raw play history.
2. **Solution overview:** one dashboard for behavior, discovery, social comparison, and recognition.
3. **Live walkthrough:** login → charts → statistics → collage export → recognition.
4. **Technical deep dive:** route-driven architecture, service abstractions, caching strategy, backend proxy security model.
5. **Scalability path:** move auth/signing server-side, add persistence/API layer, add CI + tests.

---

## 14) License / Attribution

No explicit license file is currently present in this repository. Add one before open distribution.
