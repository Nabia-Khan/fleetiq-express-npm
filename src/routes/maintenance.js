const router = require("express").Router();
const { paginateArray } = require("../utils/paginate");
let { MAINTENANCE_JOBS, VEHICLES } = require("../data/seed");

router.get("/stats/summary", (req, res) => {
  const byStatus = MAINTENANCE_JOBS.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {});
  res.json({ total: MAINTENANCE_JOBS.length, byStatus });
});

router.get("/", (req, res) => {
  const { vehicleId, status, type } = req.query;
  let list = [...MAINTENANCE_JOBS];
  if (vehicleId) list = list.filter((j) => j.vehicleId === vehicleId);
  if (status) list = list.filter((j) => j.status === status);
  if (type) list = list.filter((j) => j.type === type);
  list.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const { data, page, limit, total, totalPages } = paginateArray(list, req, { defaultLimit: 20, maxLimit: 100 });
  res.json({ count: total, jobs: data, pagination: { page, limit, total, totalPages } });
});

router.get("/:id", (req, res) => {
  const j = MAINTENANCE_JOBS.find((x) => x.id === req.params.id);
  if (!j) return res.status(404).json({ error: "Maintenance job not found" });
  res.json(j);
});

router.post("/", (req, res) => {
  const { vehicleId, type, dueDate, notes, status } = req.body;
  if (!vehicleId || !type || !dueDate) return res.status(400).json({ error: "vehicleId, type, dueDate required" });
  if (!VEHICLES.find((v) => v.id === vehicleId)) return res.status(400).json({ error: "Unknown vehicle" });
  const st = status && ["open", "scheduled", "done"].includes(status) ? status : "scheduled";
  const job = {
    id: "M" + String(MAINTENANCE_JOBS.length + 1).padStart(4, "0"),
    vehicleId,
    type: String(type),
    dueDate: String(dueDate),
    status: st,
    odometerKm: Number(req.body.odometerKm) || 0,
    notes: notes ? String(notes) : "",
  };
  MAINTENANCE_JOBS.push(job);
  res.status(201).json(job);
});

router.patch("/:id", (req, res) => {
  const idx = MAINTENANCE_JOBS.findIndex((j) => j.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Maintenance job not found" });
  MAINTENANCE_JOBS[idx] = { ...MAINTENANCE_JOBS[idx], ...req.body, id: MAINTENANCE_JOBS[idx].id };
  res.json(MAINTENANCE_JOBS[idx]);
});

module.exports = router;
