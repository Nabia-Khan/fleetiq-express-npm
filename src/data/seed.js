const { v4: uuidv4 } = require("uuid");

const DEMO_PW_HASH = "$2a$10$KtwLKr7Jr/JJUk3/SCtYieCA0UTIeAdzwZiKacrU6zOcZCG7YXr0W";

exports.USERS = [
  { id: uuidv4(), email: "admin@fleetiq.com", password: DEMO_PW_HASH, role: "admin", name: "Fleet Admin" },
  { id: uuidv4(), email: "manager@fleetiq.com", password: DEMO_PW_HASH, role: "manager", name: "Sarah Manager" },
  { id: uuidv4(), email: "dispatcher@fleetiq.com", password: DEMO_PW_HASH, role: "viewer", name: "Ops Dispatcher" },
];

const FIRST_NAMES = [
  "Marcus", "Jennifer", "Carlos", "Aisha", "Priya", "Noah", "Elena", "James", "Kate", "Viktor",
  "Rosa", "Jon", "Amy", "Luis", "Hana", "Yusuf", "Olivia", "Chen", "Diego", "Mira", "Alex",
  "Sam", "Jordan", "Taylor", "Morgan", "Riley", "Casey", "Quinn", "Blake", "Drew", "Reese",
  "Rowan", "Skyler", "Jamie", "Logan", "Parker",
];
const LAST_NAMES = [
  "Rivera", "Walsh", "Mendez", "Johnson", "Patel", "Lee", "Garcia", "Okafor", "Nguyen", "Ivanov",
  "Martinez", "Sato", "Thompson", "Hassan", "Chen", "Demir", "Park", "Silva", "Khan", "Burton",
  "Ali", "Nielsen", "Rossi", "Kowalski", "Otieno", "Yamato",
];

const VEHICLE_SPECS = [
  ["Truck", "Ford", "F-150"],
  ["Van", "Mercedes", "Sprinter"],
  ["Sedan", "Toyota", "Camry"],
  ["SUV", "Chevrolet", "Suburban"],
  ["Truck", "RAM", "1500"],
  ["Truck", "Volvo", "VNL"],
  ["Van", "Ford", "Transit"],
  ["Sedan", "Honda", "Accord"],
  ["SUV", "Toyota", "Highlander"],
  ["Truck", "Freightliner", "Cascadia"],
];

const VEHICLE_COUNT = 60;
const DRIVER_COUNT = 42;

const DRIVERS = [];
const driverStatuses = ["on_duty", "on_duty", "off_duty", "on_break", "on_duty"];
for (let i = 1; i <= DRIVER_COUNT; i++) {
  const fn = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
  const ln = LAST_NAMES[(i * 2) % LAST_NAMES.length];
  DRIVERS.push({
    id: "D" + String(i).padStart(3, "0"),
    name: `${fn} ${ln}`,
    license: i % 5 === 0 ? "CDL-A" : i % 3 === 0 ? "Class B" : "Class C",
    phone: `+1-212-555-${String(1000 + i).padStart(4, "0")}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@fleetiq.com`,
    status: driverStatuses[i % driverStatuses.length],
    vehicleId: "V" + String(((i - 1) % VEHICLE_COUNT) + 1).padStart(3, "0"),
    hoursThisWeek: 10 + (i * 3) % 35,
    rating: Math.round((40 + (i % 10)) / 10 * 10) / 10,
    trips: 200 + i * 37,
    joinDate: `20${String(15 + (i % 9)).padStart(2, "0")}-${String((i % 12) + 1).padStart(2, "0")}-10`,
  });
}

const VEHICLES = [];
const vehicleStatuses = ["active", "active", "idle", "active", "maintenance", "active", "idle"];
const depots = ["Brooklyn", "Queens", "Bronx", "Manhattan"];
for (let i = 1; i <= VEHICLE_COUNT; i++) {
  const [type, make, model] = VEHICLE_SPECS[(i - 1) % VEHICLE_SPECS.length];
  const status = vehicleStatuses[i % vehicleStatuses.length];
  const lat = 40.62 + (((i * 17) % 180) / 1000);
  const lng = -74.02 + (((i * 13) % 220) / 1000);
  const driverNum = ((i - 1) % DRIVER_COUNT) + 1;
  VEHICLES.push({
    id: "V" + String(i).padStart(3, "0"),
    plate: `NYC-${String(2000 + ((i * 17) % 8000)).padStart(4, "0")}`,
    type,
    make,
    model,
    year: 2019 + (i % 6),
    status,
    driverId: status === "maintenance" && i % 7 === 0 ? null : "D" + String(driverNum).padStart(3, "0"),
    lat,
    lng,
    speed: status === "active" ? 15 + ((i * 11) % 95) : 0,
    fuel: 25 + ((i * 7) % 75),
    odometer: 12000 + i * 2150,
    lastService: `2025-${String(((i - 1) % 12) + 1).padStart(2, "0")}-${String(((i - 1) % 27) + 1).padStart(2, "0")}`,
    depot: depots[i % depots.length],
  });
}

const ALERTS = [];
const alertTypes = ["fuel", "speed", "maintenance", "idle", "route_deviation"];
const alertSev = ["high", "medium", "low"];
for (let i = 1; i <= 48; i++) {
  const vid = "V" + String(((i * 3) % VEHICLE_COUNT) + 1).padStart(3, "0");
  ALERTS.push({
    id: "A" + String(i).padStart(4, "0"),
    vehicleId: vid,
    type: alertTypes[i % alertTypes.length],
    severity: alertSev[i % alertSev.length],
    message: `Fleet scale demo alert #${i}`,
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    resolved: i % 4 === 0,
  });
}

const TRIPS = [];
const tripStatuses = ["completed", "completed", "active", "scheduled"];
let tripSeq = 1;
for (let v = 1; v <= VEHICLE_COUNT; v++) {
  const tripsPerV = 2 + (v % 3);
  for (let t = 0; t < tripsPerV; t++) {
    const vid = "V" + String(v).padStart(3, "0");
    const st = tripStatuses[(tripSeq + t) % tripStatuses.length];
    TRIPS.push({
      id: "T" + String(tripSeq).padStart(5, "0"),
      vehicleId: vid,
      driverId: "D" + String(((v - 1) % DRIVER_COUNT) + 1).padStart(3, "0"),
      origin: `Hub ${(v % 5) + 1}`,
      destination: `Stop ${v}-${t + 1}`,
      status: st,
      startedAt: new Date(Date.now() - tripSeq * 7200000).toISOString(),
      endedAt: st === "completed" ? new Date(Date.now() - tripSeq * 7000000).toISOString() : null,
      distanceKm: 5 + (tripSeq % 120),
      revenue: Math.round(80 + (tripSeq % 400) * 2.5),
    });
    tripSeq++;
  }
}

const GEOFENCE_NAMES = [
  "North Depot", "JFK Zone", "LGA Buffer", "Brooklyn Hub", "Queens Yard", "Bronx Transfer",
  "NJ Crossing", "Manhattan South", "Harlem North", "SI Ferry Zone", "Expressway A12",
  "Cold Chain Hub", "Hazmat Ring", "Customer DC",
];
const GEOFENCES = GEOFENCE_NAMES.map((name, i) => ({
  id: "GF" + String(i + 1).padStart(3, "0"),
  name,
  centerLat: 40.65 + (((i * 21) % 200) / 1000),
  centerLng: -74.2 + (((i * 18) % 250) / 1000),
  radiusM: 400 + ((i * 137) % 2500),
  type: i % 5 === 0 ? "hazard" : i % 3 === 0 ? "warehouse" : "depot",
}));

const MAINTENANCE_JOBS = [];
const jobTypes = ["oil_change", "brake_inspection", "dot_inspection", "tire_rotation", "battery"];
const jobStatuses = ["open", "scheduled", "done", "scheduled", "open"];
for (let i = 1; i <= 40; i++) {
  const vid = "V" + String(((i * 5) % VEHICLE_COUNT) + 1).padStart(3, "0");
  const jobStatus = jobStatuses[i % jobStatuses.length];
  MAINTENANCE_JOBS.push({
    id: "M" + String(i).padStart(4, "0"),
    vehicleId: vid,
    type: jobTypes[i % jobTypes.length],
    dueDate: `2026-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 26) + 1).padStart(2, "0")}`,
    status: jobStatus,
    odometerKm: 20000 + i * 3400,
    notes: jobStatus === "done" ? "Closed in shop" : "Follow OEM interval",
  });
}

exports.DRIVERS = DRIVERS;
exports.VEHICLES = VEHICLES;
exports.ALERTS = ALERTS;
exports.TRIPS = TRIPS;
exports.GEOFENCES = GEOFENCES;
exports.MAINTENANCE_JOBS = MAINTENANCE_JOBS;
