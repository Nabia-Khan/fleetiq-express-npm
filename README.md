# FleetIQ — Fleet Tracker API
**Stack:** Express 4 · Socket.io · JWT · bcryptjs · npm

## What It Does
REST API for real-time fleet vehicle tracking. Authenticated endpoints for vehicle CRUD, driver management, alerts, and metrics. Socket.io broadcasts live GPS coordinates every 2 seconds to connected clients.

## Entry File
`src/server.js` — runs `server.listen(PORT)`

## API Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ✗ | Get JWT token |
| POST | `/api/auth/register` | ✗ | Create account |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/vehicles` | ✓ | List vehicles (filter: `?status=active&type=Truck`) |
| POST | `/api/vehicles` | ✓ | Create vehicle |
| PATCH | `/api/vehicles/:id` | ✓ | Update vehicle |
| DELETE | `/api/vehicles/:id` | ✓ | Delete vehicle |
| GET | `/api/vehicles/:id/history` | ✓ | GPS route history |
| GET | `/api/drivers` | ✓ | List drivers |
| POST | `/api/drivers` | ✓ | Create driver |
| GET | `/api/alerts` | ✓ | Alerts (filter: `?resolved=false&severity=high`) |
| PATCH | `/api/alerts/:id/resolve` | ✓ | Resolve alert |
| GET | `/api/metrics/fleet` | ✓ | Fleet summary stats |
| GET | `/api/metrics/speed-history` | ✓ | 24h speed data |
| GET | `/api/metrics/fuel-consumption` | ✓ | Weekly fuel data |

## WebSocket
Connect to the server and emit `subscribe:fleet` to join the GPS room. Listen for `gps:update` events (every 2s):
```json
{ "timestamp": "...", "vehicles": [{ "id": "V001", "lat": 40.71, "lng": -74.00, "speed": 52, "fuel": 78 }] }
```

## Commands
```bash
# Install
npm install

# Development with auto-reload (http://localhost:4000)
npm run dev

# Production start
npm start

# Run tests
npm test
```

## Node.js
- **Required:** Node **22.x** or **24.x** (`engines` in `package.json`)
- Local default: `22` (see `.nvmrc`) — run `nvm use` if you use nvm

## Production Notes
- Set a strong `JWT_SECRET` in `.env` — never use the default in production
- Data is in-memory (seed.js) — replace with a real database (PostgreSQL, MongoDB) for production
- Add `pm2` for process management: `pm2 start src/server.js --name fleetiq`

## Environment Variables
```env
PORT=4000
JWT_SECRET=your-strong-secret-here
NODE_ENV=production
```

## Demo Credentials
| Email | Password | Role |
|-------|----------|------|
| admin@fleetiq.com | password123 | admin |
| manager@fleetiq.com | password123 | manager |
