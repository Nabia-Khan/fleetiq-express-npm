require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRouter = require("../src/routes/auth");
const vehiclesRouter = require("../src/routes/vehicles");
const driversRouter = require("../src/routes/drivers");
const alertsRouter = require("../src/routes/alerts");
const metricsRouter = require("../src/routes/metrics");
const tripsRouter = require("../src/routes/trips");
const geofencesRouter = require("../src/routes/geofences");
const maintenanceRouter = require("../src/routes/maintenance");
const { authMiddleware } = require("../src/middleware/auth");
const { mountStaticAssets } = require("../src/staticAssets");

const app = express();

mountStaticAssets(app);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        connectSrc: ["'self'", "https://*.tile.openstreetmap.org"],
        imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org"],
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

module.exports = app;
