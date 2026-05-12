const router = require("express").Router();
const { paginateArray } = require("../utils/paginate");
let { DRIVERS } = require("../data/seed");

router.get("/", (req, res) => {
  const { status } = req.query;
  let list = status ? DRIVERS.filter((d) => d.status === status) : [...DRIVERS];
  list.sort((a, b) => a.name.localeCompare(b.name));
  const { data, page, limit, total, totalPages } = paginateArray(list, req, { defaultLimit: 25, maxLimit: 100 });
  res.json({ count: total, drivers: data, pagination: { page, limit, total, totalPages } });
});
router.get("/:id", (req, res) => {
  const d = DRIVERS.find(d => d.id === req.params.id);
  if (!d) return res.status(404).json({ error: "Driver not found" });
  res.json(d);
});
router.post("/", (req, res) => {
  const { name, license, phone, email } = req.body;
  if (!name || !license || !phone || !email) return res.status(400).json({ error: "All fields required" });
  const driver = { id: "D" + String(DRIVERS.length + 1).padStart(3,"0"), name, license, phone, email, status: "off_duty", vehicleId: null, hoursThisWeek: 0, rating: 5.0, trips: 0, joinDate: new Date().toISOString().split("T")[0] };
  DRIVERS.push(driver);
  res.status(201).json(driver);
});
router.patch("/:id", (req, res) => {
  const idx = DRIVERS.findIndex(d => d.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Driver not found" });
  DRIVERS[idx] = { ...DRIVERS[idx], ...req.body, id: DRIVERS[idx].id };
  res.json(DRIVERS[idx]);
});
module.exports = router;