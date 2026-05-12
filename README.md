# FleetIQ — Fleet Tracker API (Express + npm)

REST API with Socket.io real-time GPS broadcast for fleet vehicle tracking.

## Features
- JWT auth (login/register/me)
- Vehicle CRUD + GPS position + route history
- Driver CRUD + duty status
- Alert system (maintenance, fuel, speed)
- Fleet metrics & analytics endpoints
- **Socket.io real-time GPS broadcast** every 2s

## Setup
```bash
npm install
cp .env.example .env
npm run dev      # http://localhost:4000
```

## Demo credentials
- Email: admin@fleetiq.com / Password: password123

## Key Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Get JWT token |
| GET | /api/vehicles | List vehicles |
| GET | /api/vehicles/:id/history | GPS route history |
| GET | /api/metrics/fleet | Fleet summary stats |
| WS | subscribe "fleet" room | Real-time GPS updates |
