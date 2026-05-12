const router = require("express").Router();
const { paginateArray } = require("../utils/paginate");
let { TRIPS, VEHICLES, DRIVERS } = require("../data/seed");

router.get("/stats/summary", (req, res) => {
  const byStatus = TRIPS.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  res.json({
    total: TRIPS.length,
    byStatus,
    revenueTotal: TRIPS.reduce((a, t) => a + (t.revenue || 0), 0),
    distanceTotalKm: TRIPS.reduce((a, t) => a + (t.distanceKm || 0), 0),
  });
});

router.get("/", (req, res) => {
  const { vehicleId, status, driverId } = req.query;
  let list = [...TRIPS];
  if (vehicleId) list = list.filter((t) => t.vehicleId === vehicleId);
  if (driverId) list = list.filter((t) => t.driverId === driverId);
  if (status) list = list.filter((t) => t.status === status);
  list.sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  const { data, page, limit, total, totalPages } = paginateArray(list, req, { defaultLimit: 20, maxLimit: 100 });
  res.json({ count: total, trips: data, pagination: { page, limit, total, totalPages } });
});

router.get("/:id", (req, res) => {
  const t = TRIPS.find((x) => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: "Trip not found" });
  res.json(t);
});

router.post("/", (req, res) => {
  const { vehicleId, driverId, origin, destination, status } = req.body;
  if (!vehicleId || !origin || !destination) {
    return res.status(400).json({ error: "vehicleId, origin, destination required" });
  }
  if (!VEHICLES.find((v) => v.id === vehicleId)) return res.status(400).json({ error: "Unknown vehicle" });
  if (driverId && !DRIVERS.find((d) => d.id === driverId)) return res.status(400).json({ error: "Unknown driver" });
  const st = status && ["scheduled", "active", "completed"].includes(status) ? status : "scheduled";
  const trip = {
    id: "T" + String(TRIPS.length + 1).padStart(5, "0"),
    vehicleId,
    driverId: driverId || null,
    origin,
    destination,
    status: st,
    startedAt: st === "scheduled" ? null : new Date().toISOString(),
    endedAt: null,
    distanceKm: 0,
    revenue: 0,
  };
  TRIPS.push(trip);
  res.status(201).json(trip);
});

router.patch("/:id", (req, res) => {
  const idx = TRIPS.findIndex((t) => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Trip not found" });
  const next = { ...TRIPS[idx], ...req.body, id: TRIPS[idx].id };
  if (next.status === "completed" && !next.endedAt) next.endedAt = new Date().toISOString();
  if (next.status === "active" && !next.startedAt) next.startedAt = new Date().toISOString();
  TRIPS[idx] = next;
  res.json(TRIPS[idx]);
});

module.exports = router;
