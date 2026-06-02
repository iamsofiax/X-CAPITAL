# X-CAPITAL — Codebase Overview (Server “How to open/run”)

## Summary
X-CAPITAL is a multi-service system that exposes a **REST + WS-capable backend API** (Node/Express + TypeScript) to a **Next.js frontend**, backed by **PostgreSQL (Prisma)** and **Redis (cache)**. It also calls a separate **AI Oracle** service (Python/FastAPI) for forecasting and trading signals. In production, all external traffic is routed through **Nginx (HTTPS)** to the **frontend (Next.js)** and **backend (Express)**, while Docker Compose wires the internal service-to-service networking.

## Architecture
**Primary pattern:** Docker Compose “microservices” topology (frontend, backend, oracle) with shared infra (postgres, redis) and reverse proxy (nginx).

**Major subsystems**
- **Frontend (Next.js)**: UI served to users; configured with `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_WS_URL`.
- **Backend API (Express)**: Authentication, trading, portfolio, funds, wallet, oracle, commerce, KYC (via controllers + services). Serves `/api/v1/*` and `/health`.
- **AI Oracle (FastAPI)**: forecasting + signals; backend uses it via `AI_ORACLE_URL`.
- **Infra**
  - **PostgreSQL 16**: relational persistence via Prisma.
  - **Redis 7**: caching layer (and possibly rate-limiting/session-like caching depending on implementation).

**Technology stack**
- Backend: Node.js + Express + TypeScript + Prisma + ethers.js
- Frontend: Next.js 14 + React + Zustand
- Oracle: Python FastAPI + scientific stack (NumPy/SciPy implied by README)
- Orchestration: Docker Compose; reverse proxy: nginx

**Execution start / entry points**
- Backend process starts at `backend/src/server.ts`, which:
  1) loads env (`dotenv/config`)
  2) connects to Postgres (`connectDatabase()`)
  3) calls `app.listen(env.PORT)`
  4) attaches graceful shutdown handlers and unhandled rejection handling
- Express app wiring is in `backend/src/app.ts`, which:
  1) sets security middleware (helmet), CORS, compression, JSON body parsing
  2) installs rate limiting on `/api/`
  3) exposes `GET /health`
  4) mounts `routes` at `/api/v1`
  5) installs 404 handler and a shared `errorHandler`

## Directory Structure
This repo is a monorepo; the key runtime parts are:

```
project-root/
├── backend/                 # Express API (Node/TypeScript)
│   ├── src/app.ts           # Express middleware + route mounting
│   ├── src/server.ts       # DB connect + app.listen + graceful shutdown
│   └── prisma/             # Prisma schema + seed
├── frontend/                # Next.js web app
│   └── src/app/            # App Router pages (dashboard, trading, etc.)
├── ai-oracle/               # FastAPI service for forecasting/signals
│   ├── main.py
│   └── routes/
└── docker-compose*.yml     # Orchestrates postgres/redis/backend/frontend/oracle(+nginx in prod)
```

## Key Abstractions (server-side “what matters for running it”)

### Express Application
- **File**: `backend/src/app.ts`
- **Responsibility**: Defines middleware chain, CORS/security, mounts API routes, and provides health/404/error endpoints.
- **Interface (key behavior)**:
  - `app.get('/health', ...)`: simple liveness endpoint used by deploy checks
  - `app.use('/api/v1', routes)`: central API router mount point
  - `app.use('/api/', apiRateLimit)`: rate limit boundary
- **Lifecycle**: Created once when module loads; used by `backend/src/server.ts`.
- **Used by**: `backend/src/server.ts` via `import app from './app'`.

### Backend Bootstrap / Runtime Entry
- **File**: `backend/src/server.ts`
- **Responsibility**: Start-up orchestration (connect DB first), start listening, and graceful shutdown.
- **Interface (key behavior)**:
  - `connectDatabase()` before `app.listen()`
  - `SIGTERM`/`SIGINT` handler closes HTTP server then `disconnectDatabase()`
  - `process.on('unhandledRejection', ...)` logs + triggers shutdown
- **Lifecycle**: process lifetime for the backend container.

### Docker Compose Wiring (dev vs prod)
- **Files**:
  - `docker-compose.yml` (dev/simple orchestration)
  - `docker-compose.prod.yml` (production with nginx)
- **Responsibility**: Defines networking, environment variables, ports/expose, and internal dependencies.
- **Key behaviors**:
  - `backend` depends on healthy `postgres` and `redis` (in both prod and dev)
  - `backend` gets:
    - `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `FRONTEND_URL`
    - in prod: `AI_ORACLE_URL` pointing to the internal service name `http://ai-oracle:8000`
  - `ai-oracle` runs on port `8000` internally and is reachable as `ai-oracle:8000` from the backend (via compose network)

## Data Flow (server open/use)
1. User opens the app in browser:
   - In production: `https://xcapital.investments` hits **nginx** (`docker-compose.prod.yml` -> nginx).
   - Nginx routes to **frontend** and/or **backend** depending on configured rules in `nginx.conf`.
2. Frontend communicates with backend using:
   - REST base URL: `NEXT_PUBLIC_API_URL=https://xcapital.investments/api/v1`
   - WebSocket URL: `NEXT_PUBLIC_WS_URL=wss://xcapital.investments`
3. Backend receives API requests at:
   - `backend/src/app.ts` mounts `routes` at `/api/v1`
4. Backend calls AI Oracle where needed:
   - `backend` uses `AI_ORACLE_URL` (prod env) = `http://ai-oracle:8000`
   - AI Oracle runs separately as `ai-oracle` service in Docker Compose.
5. Persistence and caching:
   - Postgres is connected on backend startup (`connectDatabase()` in `backend/src/server.ts`)
   - Redis is configured via `REDIS_URL` env var for caching/rate limiting (specific usage is in services/middleware not yet inspected in this session).

## Non-Obvious Behaviors & Design Decisions
- **DB connection gating at startup**: The backend connects to Postgres *before* it starts listening (`connectDatabase()` happens before `app.listen()`). This avoids serving requests that would immediately fail due to DB unavailability.
- **CORS is pinned to `env.FRONTEND_URL`**: The Express app allows CORS only for `env.FRONTEND_URL` and enables `credentials: true`. If you “open the server” without matching this env var, browser requests will fail even if the API is reachable.
- **Production uses `expose` rather than `ports`** for backend/frontend**: In `docker-compose.prod.yml`, backend and frontend don’t publish ports directly to the host; nginx is the entry point. So “open the server” in prod means “use nginx/443”, not `localhost:4000` or `localhost:3000`.
- **Internal service discovery via service name**: `AI_ORACLE_URL` is set to `http://ai-oracle:8000` (not localhost). That only works inside the Docker network—an important detail when running components individually.

## Module Reference (server-focused)
| File | Purpose |
|------|---------|
| `backend/src/server.ts` | Backend container entry: connect DB, start Express, handle shutdown/rejections |
| `backend/src/app.ts` | Express middleware setup: CORS/security/rate-limit/health + `/api/v1` route mount |
| `docker-compose.yml` | Dev orchestration: postgres + redis + backend + frontend + ai-oracle |
| `docker-compose.prod.yml` | Production orchestration: adds nginx TLS reverse proxy + uses internal service URLs |

## Suggested Reading Order (to understand “open/run the server” quickly)
1. `backend/src/server.ts` — where the backend process actually starts
2. `backend/src/app.ts` — what endpoints exist and how requests are shaped (CORS, rate-limit, `/health`, `/api/v1`)
3. `docker-compose.prod.yml` — where traffic goes in production (nginx entrypoint, internal URLs)
4. `nginx.conf` — how paths like `/api` and `/` are routed (not read in this session, but next)
5. `backend/src/routes/index.ts` (not read yet) — to confirm each API surface mounted under `/api/v1`

## Practical: “Open the server here” (what to use)
- **Production**: open `https://xcapital.investments` (nginx entrypoint). Backend is not meant to be opened directly on `:4000` from the public internet.
- **Health checks** (useful after startup):
  - Backend health: `GET /health` on the backend container; public equivalent is typically via nginx path forwarding for `/health` if configured.
  - AI Oracle health: `/health` on port `8000` (per README), accessed internally as `ai-oracle:8000` from backend.
