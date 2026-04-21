# Start Commands

## Install Dependencies

```bash
# Root
npm install

# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

## Production (Single Command)

```bash
# 1. Build frontend + backend
npm run build

# 2. Start the combined server (serves frontend + API on one port)
npm start
```

The app will be available at **http://localhost:5001**
- Frontend (React) is served as static files by Express
- API routes are available at `/api/*`
- WebSocket at `/ws`

## Development (Separate Servers)

```bash
# Backend (from /backend) — http://localhost:5001
npm run dev:backend

# Frontend (from /frontend) — http://localhost:5173 with proxy to backend
npm run dev:frontend
```

## Database

```bash
# Push schema to database (from /backend)
npm run db:push

# Open Drizzle Studio (from /backend)
npm run db:studio
```

## Test & Lint

```bash
# From root
npm test && npm run lint
```
