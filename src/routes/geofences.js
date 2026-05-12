const router = require("express").Router();
const { paginateArray } = require("../utils/paginate");
let { GEOFENCES } = require("../data/seed");

router.get("/stats/summary", (req, res) => {
  const byType = GEOFENCES.reduce((acc, g) => {
    acc[g.type] = (acc[g.type] || 0) + 1;
    return acc;
  }, {});
  res.json({ total: GEOFENCES.length, byType });
});

router.get("/", (req, res) => {
  const { type } = req.query;
  let list = [...GEOFENCES];
  if (type) list = list.filter((g) => g.type === type);
  list.sort((a, b) => a.name.localeCompare(b.name));
  const { data, page, limit, total, totalPages } = paginateArray(list, req, { defaultLimit: 20, maxLimit: 100 });
  res.json({ count: total, geofences: data, pagination: { page, limit, total, totalPages } });
});

router.get("/:id", (req, res) => {
  const g = GEOFENCES.find((x) => x.id === req.params.id);
  if (!g) return res.status(404).json({ error: "Geofence not found" });
  res.json(g);
});

router.post("/", (req, res) => {
  const { name, centerLat, centerLng, radiusM, type } = req.body;
  if (name == null || centerLat == null || centerLng == null || radiusM == null) {
    return res.status(400).json({ error: "name, centerLat, centerLng, radiusM required" });
  }
  const gType = type && ["depot", "warehouse", "hazard"].includes(type) ? type : "depot";
  const geofence = {
    id: "GF" + String(GEOFENCES.length + 1).padStart(3, "0"),
    name: String(name),
    centerLat: Number(centerLat),
    centerLng: Number(centerLng),
    radiusM: Number(radiusM),
    type: gType,
  };
  GEOFENCES.push(geofence);
  res.status(201).json(geofence);
});

router.patch("/:id", (req, res) => {
  const idx = GEOFENCES.findIndex((g) => g.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Geofence not found" });
  GEOFENCES[idx] = { ...GEOFENCES[idx], ...req.body, id: GEOFENCES[idx].id };
  res.json(GEOFENCES[idx]);
});

router.delete("/:id", (req, res) => {
  const idx = GEOFENCES.findIndex((g) => g.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Geofence not found" });
  GEOFENCES.splice(idx, 1);
  res.json({ message: "Geofence deleted" });
});

module.exports = router;
