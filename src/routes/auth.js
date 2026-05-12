const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { USERS } = require("../data/seed");
const JWT_SECRET = process.env.JWT_SECRET || "fleetiq-secret-2024";

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const user = USERS.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: "All fields required" });
  if (USERS.find(u => u.email === email)) return res.status(409).json({ error: "Email already in use" });
  const hashed = await bcrypt.hash(password, 10);
  const user = { id: require("uuid").v4(), email, password: hashed, role: "viewer", name };
  USERS.push(user);
  const token = jwt.sign({ id: user.id, email, role: "viewer", name }, JWT_SECRET, { expiresIn: "8h" });
  res.status(201).json({ token, user: { id: user.id, email, role: "viewer", name } });
});

// GET /api/auth/me
router.get("/me", require("../middleware/auth").authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;