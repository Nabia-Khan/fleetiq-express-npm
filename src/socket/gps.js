const { VEHICLES } = require("../data/seed");

exports.startGPSBroadcast = (io) => {
  setInterval(() => {
    const updates = VEHICLES
      .filter(v => v.status === "active")
      .map(v => {
        // Simulate movement
        v.lat += (Math.random() - 0.5) * 0.004;
        v.lng += (Math.random() - 0.5) * 0.004;
        v.speed = Math.max(0, Math.min(120, v.speed + (Math.random() - 0.5) * 10));
        v.fuel = Math.max(0, v.fuel - 0.01);
        return { id: v.id, plate: v.plate, lat: v.lat, lng: v.lng, speed: Math.round(v.speed), fuel: Math.round(v.fuel), status: v.status };
      });
    io.to("fleet").emit("gps:update", { timestamp: new Date().toISOString(), vehicles: updates });
  }, 2000);
};