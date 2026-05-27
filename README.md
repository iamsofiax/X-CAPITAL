# X-CAPITAL

> A multi-rail capital execution system that connects **Public markets**, **Private equity**, **Structured products**, **Real-world commerce**, and **Infrastructure funding** — all through one interface.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Frontend (Next.js 14)               │  :3000
└────────────────────────┬────────────────────────────┘
                         │ REST / JSON
┌────────────────────────▼────────────────────────────┐
│                 Backend API (Node / Express)         │  :4000
│  Auth · Trading · Portfolio · Funds · Wallet         │
│  Commerce · Oracle · KYC                            │
│                     ┌───────┴──────────┐            │
│              Prisma ORM          ethers.js           │
└──────────┬──────────┴──────────────────┴────────────┘
           │                             │
┌──────────▼──────────┐    ┌─────────────▼────────────┐
│   PostgreSQL 16      │    │  Polygon / Ethereum Node  │
│   + Redis 7 (cache) │    │  (XCapitalToken, SPVFund) │
└─────────────────────┘    └──────────────────────────┘
           │
┌──────────▼──────────┐
│   AI Oracle (FastAPI│  :8000
│   GBM · LSTM · NLP  │
└─────────────────────┘
```

### Services

| Service | Stack | Port |
|---------|-------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS | 3000 |
| Backend API | Node.js 20, Express 4, TypeScript | 4000 |
| AI Oracle | Python 3.11, FastAPI, NumPy/SciPy | 8000 |
| Database | PostgreSQL 16 | 5432 |
| Cache | Redis 7 | 6379 |
| Blockchain | Solidity 0.8.20, Hardhat, OpenZeppelin | — |

---

## Quick Start

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (or Docker + Docker Compose v2)
- [Node.js 20+](https://nodejs.org) (for local blockchain development)
- [Python 3.11+](https://python.org) (optional, for standalone AI oracle)

### 1. Clone & configure

```bash
git clone https://github.com/iamsofiax/X-CAPITAL.git
cd X-CAPITAL
cp backend/.env.example backend/.env
# Fill in the required secrets in backend/.env
```

## Production hosting (Render)

Deploy the full stack (frontend + API + database) on **Render** with custom domain **xcapital.investments**:

See **[RENDER_DEPLOY.md](./RENDER_DEPLOY.md)** and use the included **`render.yaml`** blueprint.

For GitHub Pages–only frontend deploy, see **DEPLOY_10MIN.md**.

### 2. Start all services

```bash
docker compose up -d
```

This starts PostgreSQL, Redis, the backend, frontend, and AI Oracle in the correct order.

### 3. Open the app

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Frontend (Next.js) |
| http://localhost:4000/health | Backend health check |
| http://localhost:8000/health | AI Oracle health check |

---

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `REDIS_URL` | ✅ | Redis connection string |
| `JWT_SECRET` | ✅ | 32+ char secret for access tokens |
| `JWT_REFRESH_SECRET` | ✅ | 32+ char secret for refresh tokens |
| `ALPACA_API_KEY` | ✅ | Alpaca Securities API key |
| `ALPACA_API_SECRET` | ✅ | Alpaca Securities API secret |
| `ALPACA_BASE_URL` | ✅ | `https://paper-api.alpaca.markets` (paper) |
| `PERSONA_API_KEY` | ⚠️ | Persona KYC API key (required for KYC) |
| `AI_ORACLE_URL` | ⚠️ | AI Oracle service URL (`http://ai-oracle:8000/api/v1`) |
| `BLOCKCHAIN_RPC_URL` | ⚠️ | Polygon/Ethereum JSON-RPC URL |
| `DEPLOYER_PRIVATE_KEY` | ⚠️ | Blockchain deployer private key |
| `FRONTEND_URL` | ✅ | `http://localhost:3000` for CORS |

---

## Development

### Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### AI Oracle

```bash
cd ai-oracle
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Blockchain

```bash
cd blockchain
npm install

# Start a local Hardhat node
npm run node

# In another terminal, deploy contracts
npm run deploy:local
```

---

## Blockchain Contracts

| Contract | Description |
|----------|-------------|
| `XCapitalToken` | SEC Reg D/S/A+ compliant ERC-20 security token with whitelist, pause, and role-based access control |
| `SPVFund` | On-chain Special Purpose Vehicle — investors deposit USDC, receive proportional returns at maturity |
| `MockERC20` | Test-only USDC stub for local development |

### Deploying to Polygon Mumbai (testnet)

```bash
cd blockchain
cp .env.example .env   # add ALCHEMY_POLYGON_URL, DEPLOYER_PRIVATE_KEY, POLYGONSCAN_API_KEY
npm run deploy:mumbai
```

Deployed addresses are saved in `blockchain/deployments/<network>.json`.

---

## Project Structure

```
x-capital/
├── backend/               # Node.js / Express API
│   ├── prisma/            # Database schema + seed data
│   └── src/
│       ├── config/        # Env validation
│       ├── controllers/   # Route handlers
│       ├── middleware/    # Auth, rate limit, error handler
│       ├── routes/        # Express routers
│       └── services/      # Broker, blockchain, KYC, oracle
├── frontend/              # Next.js 14 App Router
│   └── src/
│       ├── app/           # Pages (dashboard, trading, portfolio…)
│       ├── components/    # Reusable UI components
│       ├── lib/           # API client, utilities
│       ├── store/         # Zustand global state
│       └── types/         # TypeScript interfaces
├── ai-oracle/             # Python FastAPI — GBM / forecasting
│   ├── models/            # forecasting.py (Monte Carlo, regression)
│   └── routes/            # oracle.py (5 endpoints)
├── blockchain/            # Hardhat + Solidity contracts
│   ├── contracts/         # XCapitalToken.sol, SPVFund.sol
│   └── scripts/           # deploy.ts
└── docker-compose.yml
```

---

## Rails Overview

| Rail | Assets | Mechanism |
|------|--------|-----------|
| **Public Markets** | Stocks, ETFs, Crypto | Alpaca broker API — real execution |
| **Private Equity** | SPV Funds (SPACE, AI, ENERGY, VENTURE) | On-chain USDC subscriptions via SPVFund.sol |
| **Security Tokens** | XCAP token | Reg D / S / A+ ERC-20 on Polygon |
| **Commerce** | Tesla, MacBook, NVIDIA | Buy product → automatically invest in linked ticker |
| **AI Oracle** | All supported symbols | GBM Monte Carlo + trend regression + sentiment analysis |

---

## License

Proprietary — All rights reserved. Not licensed for redistribution.
