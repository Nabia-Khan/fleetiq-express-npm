require("dotenv").config();
const path = require("path");
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");

const authRouter = require("./routes/auth");
const vehiclesRouter = require("./routes/vehicles");
const driversRouter = require("./routes/drivers");
const alertsRouter = require("./routes/alerts");
const metricsRouter = require("./routes/metrics");
const tripsRouter = require("./routes/trips");
const geofencesRouter = require("./routes/geofences");
const maintenanceRouter = require("./routes/maintenance");
const { authMiddleware } = require("./middleware/auth");
const { startGPSBroadcast } = require("./socket/gps");
const { mountStaticAssets } = require("./staticAssets");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET","POST"] } });

mountStaticAssets(app);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: [
          "'self'",
          "https://a.tile.openstreetmap.org",
          "https://b.tile.openstreetmap.org",
          "https://c.tile.openstreetmap.org",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "blob:",
          "https://a.tile.openstreetmap.org",
          "https://b.tile.openstreetmap.org",
          "https://c.tile.openstreetmap.org",
        ],
      },
    },
  })
);
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 800 }));

app.get("/api/info", (req, res) => res.json({
  name: "FleetIQ API",
  version: "1.0.0",
  description: "Scaled fleet tracking API with real-time GPS broadcast",
  endpoints: [
    "/api/auth",
    "/api/vehicles (query: page, limit, status, type, depot)",
    "/api/drivers (query: page, limit, status)",
    "/api/alerts (query: page, limit, resolved, severity)",
    "/api/trips (query: page, limit, vehicleId, driverId, status); /api/trips/stats/summary",
    "/api/geofences (query: page, limit, type); /api/geofences/stats/summary",
    "/api/maintenance (query: page, limit, vehicleId, status, type); /api/maintenance/stats/summary",
    "/api/metrics/fleet",
    "/api/metrics/operations",
    "/api/metrics/speed-history",
    "/api/metrics/fuel-consumption",
    "/api/metrics/top-drivers",
  ],
  websocket: "Socket.io — emit subscribe:fleet, listen for gps:update",
}));

app.use("/api/auth", authRouter);
app.use("/api/vehicles", authMiddleware, vehiclesRouter);
app.use("/api/drivers", authMiddleware, driversRouter);
app.use("/api/alerts", authMiddleware, alertsRouter);
app.use("/api/metrics", authMiddleware, metricsRouter);
app.use("/api/trips", authMiddleware, tripsRouter);
app.use("/api/geofences", authMiddleware, geofencesRouter);
app.use("/api/maintenance", authMiddleware, maintenanceRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("subscribe:fleet", () => socket.join("fleet"));
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

startGPSBroadcast(io);

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 4000;
  server.listen(PORT, () => console.log(`FleetIQ API running on http://localhost:${PORT}`));
}

module.exports = app;