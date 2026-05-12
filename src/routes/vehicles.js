const router = require("express").Router();
const { paginateArray } = require("../utils/paginate");
let { VEHICLES } = require("../data/seed");

// GET /api/vehicles
router.get("/", (req, res) => {
  const { status, type, depot } = req.query;
  let list = [...VEHICLES];
  if (status) list = list.filter((v) => v.status === status);
  if (type) list = list.filter((v) => v.type === type);
  if (depot) list = list.filter((v) => v.depot === depot);
  const { data, page, limit, total, totalPages } = paginateArray(list, req, { defaultLimit: 25, maxLimit: 100 });
  res.json({ count: total, vehicles: data, pagination: { page, limit, total, totalPages } });
});

// GET /api/vehicles/:id
router.get("/:id", (req, res) => {
  const v = VEHICLES.find(v => v.id === req.params.id);
  if (!v) return res.status(404).json({ error: "Vehicle not found" });
  res.json(v);
});

// POST /api/vehicles
router.post("/", (req, res) => {
  const { plate, type, make, model, year } = req.body;
  if (!plate || !type || !make || !model) return res.status(400).json({ error: "plate, type, make, model required" });
  const vehicle = { id: "V" + String(VEHICLES.length + 1).padStart(3,"0"), plate, type, make, model, year: year || new Date().getFullYear(), status: "idle", driverId: null, lat: 40.7128, lng: -74.006, speed: 0, fuel: 100, odometer: 0, lastService: new Date().toISOString().split("T")[0], depot: req.body.depot || "Manhattan" };
  VEHICLES.push(vehicle);
  res.status(201).json(vehicle);
});

// PATCH /api/vehicles/:id
router.patch("/:id", (req, res) => {
  const idx = VEHICLES.findIndex(v => v.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Vehicle not found" });
  VEHICLES[idx] = { ...VEHICLES[idx], ...req.body, id: VEHICLES[idx].id };
  res.json(VEHICLES[idx]);
});

// DELETE /api/vehicles/:id
router.delete("/:id", (req, res) => {
  const idx = VEHICLES.findIndex(v => v.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Vehicle not found" });
  VEHICLES.splice(idx, 1);
  res.json({ message: "Vehicle deleted" });
});

// GET /api/vehicles/:id/history  — mock route history
router.get("/:id/history", (req, res) => {
  const v = VEHICLES.find(v => v.id === req.params.id);
  if (!v) return res.status(404).json({ error: "Vehicle not found" });
  const history = Array.from({ length: 10 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 600000).toISOString(),
    lat: v.lat + (Math.random() - 0.5) * 0.05,
    lng: v.lng + (Math.random() - 0.5) * 0.05,
    speed: Math.floor(Math.random() * 80),
    fuel: Math.max(10, v.fuel - i * 2),
  }));
  res.json({ vehicleId: v.id, history });
});

module.exports = router;