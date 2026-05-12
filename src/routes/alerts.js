const router = require("express").Router();
const { paginateArray } = require("../utils/paginate");
let { ALERTS } = require("../data/seed");
router.get("/", (req, res) => {
  const { resolved, severity } = req.query;
  let list = [...ALERTS];
  if (resolved !== undefined) list = list.filter((a) => a.resolved === (resolved === "true"));
  if (severity) list = list.filter((a) => a.severity === severity);
  list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  const { data, page, limit, total, totalPages } = paginateArray(list, req, { defaultLimit: 20, maxLimit: 100 });
  res.json({ count: total, alerts: data, pagination: { page, limit, total, totalPages } });
});
router.post("/", (req, res) => {
  const { vehicleId, type, severity, message } = req.body;
  if (!vehicleId || !type || !severity || !message) return res.status(400).json({ error: "All fields required" });
  const alert = { id: "A" + String(ALERTS.length + 1).padStart(4, "0"), vehicleId, type, severity, message, timestamp: new Date().toISOString(), resolved: false };
  ALERTS.push(alert);
  res.status(201).json(alert);
});
router.patch("/:id/resolve", (req, res) => {
  const alert = ALERTS.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });
  alert.resolved = true;
  alert.resolvedAt = new Date().toISOString();
  res.json(alert);
});
module.exports = router;