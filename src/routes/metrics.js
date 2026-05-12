const router = require("express").Router();
const { VEHICLES, DRIVERS, TRIPS, MAINTENANCE_JOBS, GEOFENCES, ALERTS } = require("../data/seed");

router.get("/fleet", (req, res) => {
  const active = VEHICLES.filter((v) => v.status === "active").length;
  const idle = VEHICLES.filter((v) => v.status === "idle").length;
  const maintenance = VEHICLES.filter((v) => v.status === "maintenance").length;
  const avgFuel = Math.round(VEHICLES.reduce((a, v) => a + v.fuel, 0) / VEHICLES.length);
  const avgSpeed = Math.round(
    VEHICLES.filter((v) => v.speed > 0).reduce((a, v) => a + v.speed, 0) /
      Math.max(1, VEHICLES.filter((v) => v.speed > 0).length)
  );
  const depots = [...new Set(VEHICLES.map((v) => v.depot).filter(Boolean))].length;
  res.json({
    totalVehicles: VEHICLES.length,
    active,
    idle,
    maintenance,
    avgFuel,
    avgSpeed,
    totalDrivers: DRIVERS.length,
    driversOnDuty: DRIVERS.filter((d) => d.status === "on_duty").length,
    depots,
    openAlerts: ALERTS.filter((a) => !a.resolved).length,
  });
});

router.get("/operations", (req, res) => {
  const tripsByStatus = TRIPS.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const maintenanceByStatus = MAINTENANCE_JOBS.reduce((acc, j) => {
    acc[j.status] = (acc[j.status] || 0) + 1;
    return acc;
  }, {});
  res.json({
    tripsTotal: TRIPS.length,
    tripsByStatus,
    maintenanceTotal: MAINTENANCE_JOBS.length,
    maintenanceByStatus,
    geofencesTotal: GEOFENCES.length,
    revenueTotal: TRIPS.reduce((a, t) => a + (t.revenue || 0), 0),
  });
});

router.get("/speed-history", (req, res) => {
  const hours = Array.from({length:24},(_,i)=>({ hour: `${String(i).padStart(2,"0")}:00`, avgSpeed: Math.floor(20+Math.random()*60) }));
  res.json(hours);
});

router.get("/fuel-consumption", (req, res) => {
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=>({ day: d, liters: Math.floor(80+Math.random()*120) }));
  res.json(days);
});

router.get("/top-drivers", (req, res) => {
  const sorted = [...DRIVERS].sort((a,b)=>b.rating-a.rating);
  res.json(sorted.map(d=>({ id:d.id, name:d.name, rating:d.rating, trips:d.trips, hoursThisWeek:d.hoursThisWeek })));
});
module.exports = router;