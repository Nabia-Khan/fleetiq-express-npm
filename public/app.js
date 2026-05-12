(function () {
  const TOKEN_KEY = "fleetiq_token";
  const USER_KEY = "fleetiq_user";

  const loginPanel = document.getElementById("login-panel");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const userLine = document.getElementById("user-line");
  const logoutBtn = document.getElementById("logout-btn");
  const globalRefresh = document.getElementById("global-refresh");
  const navTabs = document.getElementById("nav-tabs");
  const metricsEl = document.getElementById("metrics");
  const alertsList = document.getElementById("alerts-list");
  const fleetJson = document.getElementById("fleet-json");
  const opsJson = document.getElementById("ops-json");
  const vehiclesBody = document.getElementById("vehicles-body");
  const refreshVehicles = document.getElementById("refresh-vehicles");
  const refreshMapBtn = document.getElementById("refresh-map");
  const socketStatus = document.getElementById("socket-status");

  const vehiclePagerLabel = document.getElementById("vehicle-pager-label");
  const vehiclePrev = document.getElementById("vehicle-prev");
  const vehicleNext = document.getElementById("vehicle-next");

  const panels = {
    overview: document.getElementById("panel-overview"),
    trips: document.getElementById("panel-trips"),
    geofences: document.getElementById("panel-geofences"),
    maintenance: document.getElementById("panel-maintenance"),
    drivers: document.getElementById("panel-drivers"),
  };

  const tripsSummaryJson = document.getElementById("trips-summary-json");
  const tripsBody = document.getElementById("trips-body");
  const tripPagerLabel = document.getElementById("trip-pager-label");
  const tripPrev = document.getElementById("trip-prev");
  const tripNext = document.getElementById("trip-next");
  const refreshTrips = document.getElementById("refresh-trips");

  const geofencesSummaryJson = document.getElementById("geofences-summary-json");
  const geofencesBody = document.getElementById("geofences-body");
  const geofencePagerLabel = document.getElementById("geofence-pager-label");
  const geofencePrev = document.getElementById("geofence-prev");
  const geofenceNext = document.getElementById("geofence-next");
  const refreshGeofences = document.getElementById("refresh-geofences");

  const maintenanceSummaryJson = document.getElementById("maintenance-summary-json");
  const maintenanceBody = document.getElementById("maintenance-body");
  const maintenancePagerLabel = document.getElementById("maintenance-pager-label");
  const maintenancePrev = document.getElementById("maintenance-prev");
  const maintenanceNext = document.getElementById("maintenance-next");
  const refreshMaintenance = document.getElementById("refresh-maintenance");

  const driversBody = document.getElementById("drivers-body");
  const driverPagerLabel = document.getElementById("driver-pager-label");
  const driverPrev = document.getElementById("driver-prev");
  const driverNext = document.getElementById("driver-next");
  const refreshDrivers = document.getElementById("refresh-drivers");

  let socket = null;
  const vehicleRows = new Map();

  let currentTab = "overview";

  let vehiclePage = 1;
  const vehicleLimit = 25;
  let vehicleTotalPages = 1;

  let tripPage = 1;
  const tripLimit = 20;
  let tripTotalPages = 1;

  let geofencePage = 1;
  const geofenceLimit = 20;
  let geofenceTotalPages = 1;

  let maintenancePage = 1;
  const maintenanceLimit = 20;
  let maintenanceTotalPages = 1;

  let driverPage = 1;
  const driverLimit = 25;
  let driverTotalPages = 1;

  let chartSpeed = null;
  let chartSpeedHistory = null;
  let chartFuel = null;
  let chartOps = null;
  let chartTripsTab = null;
  let chartsInited = false;

  let fleetMap = null;
  let markersLayer = null;
  let geofenceLayer = null;
  const vehicleMarkerById = new Map();
  let mapInited = false;

  const liveLabels = [];
  const liveSpeeds = [];

  function chartTextColors() {
    return { grid: "rgba(139, 156, 179, 0.2)", tick: "#8b9cb3" };
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function getUser() {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || "null");
    } catch {
      return null;
    }
  }

  async function api(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    const token = getToken();
    if (token) headers.Authorization = "Bearer " + token;
    if (options.body && typeof options.body === "object" && !(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }
    const res = await fetch(path, { ...options, headers });
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { raw: text };
    }
    if (!res.ok) throw new Error(data.error || res.statusText || "Request failed");
    return data;
  }

  function setPager(labelEl, prevBtn, nextBtn, page, totalPages) {
    labelEl.textContent = totalPages ? `Page ${page} of ${totalPages}` : "No data";
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages || totalPages === 0;
  }

  function teardownViz() {
    if (chartSpeed) {
      chartSpeed.destroy();
      chartSpeed = null;
    }
    if (chartSpeedHistory) {
      chartSpeedHistory.destroy();
      chartSpeedHistory = null;
    }
    if (chartFuel) {
      chartFuel.destroy();
      chartFuel = null;
    }
    if (chartOps) {
      chartOps.destroy();
      chartOps = null;
    }
    if (chartTripsTab) {
      chartTripsTab.destroy();
      chartTripsTab = null;
    }
    chartsInited = false;
    liveLabels.length = 0;
    liveSpeeds.length = 0;

    if (fleetMap) {
      fleetMap.remove();
      fleetMap = null;
    }
    markersLayer = null;
    geofenceLayer = null;
    vehicleMarkerById.clear();
    mapInited = false;
  }

  function showLogin() {
    loginPanel.hidden = false;
    dashboard.hidden = true;
    teardownViz();
    if (socket) {
      socket.disconnect();
      socket = null;
    }
    socketStatus.textContent = "Socket: offline";
    socketStatus.classList.remove("live");
  }

  function showDashboard(user) {
    loginPanel.hidden = true;
    dashboard.hidden = false;
    userLine.textContent = user ? `${user.name} (${user.email})` : "";
    connectSocket();
  }

  function initCharts() {
    const Chart = window.Chart;
    if (!Chart || chartsInited) return;
    chartsInited = true;
    const { grid, tick } = chartTextColors();

    const common = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: tick } } },
    };

    const elLive = document.getElementById("chart-live-speed");
    if (elLive) {
      chartSpeed = new Chart(elLive.getContext("2d"), {
        type: "line",
        data: {
          labels: [],
          datasets: [
            {
              label: "Avg speed (broadcast units)",
              data: [],
              borderColor: "#3d8bfd",
              backgroundColor: "rgba(61, 139, 253, 0.15)",
              fill: true,
              tension: 0.25,
            },
          ],
        },
        options: {
          ...common,
          scales: {
            x: { ticks: { color: tick, maxTicksLimit: 10 }, grid: { color: grid } },
            y: { beginAtZero: true, suggestedMax: 100, ticks: { color: tick }, grid: { color: grid } },
          },
        },
      });
    }

    const elHist = document.getElementById("chart-speed-history");
    if (elHist) {
      chartSpeedHistory = new Chart(elHist.getContext("2d"), {
        type: "bar",
        data: { labels: [], datasets: [{ label: "Avg speed", data: [], backgroundColor: "rgba(61, 139, 253, 0.55)" }] },
        options: {
          ...common,
          scales: {
            x: { ticks: { color: tick }, grid: { display: false } },
            y: { beginAtZero: true, ticks: { color: tick }, grid: { color: grid } },
          },
        },
      });
    }

    const elFuel = document.getElementById("chart-fuel");
    if (elFuel) {
      chartFuel = new Chart(elFuel.getContext("2d"), {
        type: "line",
        data: {
          labels: [],
          datasets: [{ label: "Liters (model)", data: [], borderColor: "#4ade80", tension: 0.2, fill: true, backgroundColor: "rgba(74, 222, 128, 0.12)" }],
        },
        options: {
          ...common,
          scales: {
            x: { ticks: { color: tick }, grid: { color: grid } },
            y: { beginAtZero: true, ticks: { color: tick }, grid: { color: grid } },
          },
        },
      });
    }

    const elOps = document.getElementById("chart-trips-doughnut");
    if (elOps) {
      chartOps = new Chart(elOps.getContext("2d"), {
        type: "doughnut",
        data: { labels: [], datasets: [{ data: [], backgroundColor: ["#3d8bfd", "#a78bfa", "#fbbf24", "#f87171", "#34d399"] }] },
        options: { ...common, plugins: { ...common.plugins, legend: { position: "bottom", labels: { color: tick } } } },
      });
    }
  }

  function initMap() {
    const L = window.L;
    if (!L || mapInited) return;
    const el = document.getElementById("fleet-map");
    if (!el) return;
    fleetMap = L.map("fleet-map", { scrollWheelZoom: false }).setView([40.7128, -74.006], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(fleetMap);
    markersLayer = L.layerGroup().addTo(fleetMap);
    geofenceLayer = L.layerGroup().addTo(fleetMap);
    mapInited = true;
  }

  function queueMapInvalidate() {
    if (!fleetMap) return;
    requestAnimationFrame(() => {
      fleetMap.invalidateSize();
      setTimeout(() => fleetMap.invalidateSize(), 280);
    });
  }

  function updateLiveChartFromGps(payload) {
    if (!chartSpeed || !payload.vehicles || !payload.vehicles.length) return;
    const avg = payload.vehicles.reduce((a, v) => a + v.speed, 0) / payload.vehicles.length;
    const t = new Date(payload.timestamp || Date.now()).toLocaleTimeString();
    liveLabels.push(t);
    liveSpeeds.push(avg);
    const maxPts = 36;
    while (liveLabels.length > maxPts) {
      liveLabels.shift();
      liveSpeeds.shift();
    }
    chartSpeed.data.labels = [...liveLabels];
    chartSpeed.data.datasets[0].data = [...liveSpeeds];
    chartSpeed.update("none");
  }

  function updateMapMarkersFromGps(payload) {
    if (!payload.vehicles) return;
    for (const u of payload.vehicles) {
      const m = vehicleMarkerById.get(u.id);
      if (m) m.setLatLng([u.lat, u.lng]);
    }
  }

  async function refreshStaticChartsFromApis() {
    const Chart = window.Chart;
    if (!Chart) return;
    initCharts();

    try {
      const [speedHist, fuel, ops] = await Promise.all([
        api("/api/metrics/speed-history"),
        api("/api/metrics/fuel-consumption"),
        api("/api/metrics/operations"),
      ]);

      if (chartSpeedHistory && speedHist) {
        chartSpeedHistory.data.labels = speedHist.map((h) => h.hour);
        chartSpeedHistory.data.datasets[0].data = speedHist.map((h) => h.avgSpeed);
        chartSpeedHistory.update();
      }

      if (chartFuel && fuel) {
        chartFuel.data.labels = fuel.map((d) => d.day);
        chartFuel.data.datasets[0].data = fuel.map((d) => d.liters);
        chartFuel.update();
      }

      if (chartOps && ops.tripsByStatus) {
        const labels = Object.keys(ops.tripsByStatus);
        chartOps.data.labels = labels;
        chartOps.data.datasets[0].data = labels.map((k) => ops.tripsByStatus[k]);
        chartOps.update();
      }
    } catch (e) {
      console.error(e);
    }
  }

  function renderTripsTabChart(summary) {
    const Chart = window.Chart;
    if (!Chart || !summary || !summary.byStatus) return;
    const ctx = document.getElementById("chart-trips-tab");
    if (!ctx) return;
    const labels = Object.keys(summary.byStatus);
    const values = labels.map((k) => summary.byStatus[k]);
    const { tick } = chartTextColors();
    if (chartTripsTab) chartTripsTab.destroy();
    chartTripsTab = new Chart(ctx.getContext("2d"), {
      type: "bar",
      data: {
        labels,
        datasets: [{ label: "Trips", data: values, backgroundColor: "rgba(167, 139, 250, 0.65)" }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: tick }, grid: { color: "rgba(139, 156, 179, 0.15)" } },
          y: { beginAtZero: true, ticks: { color: tick }, grid: { color: "rgba(139, 156, 179, 0.15)" } },
        },
      },
    });
  }

  async function loadMapLayers() {
    const L = window.L;
    if (!L) return;
    initMap();
    if (!fleetMap || !markersLayer || !geofenceLayer) return;

    try {
      const [active, geos] = await Promise.all([
        api("/api/vehicles?status=active&limit=100&page=1"),
        api("/api/geofences?limit=50&page=1"),
      ]);

      markersLayer.clearLayers();
      vehicleMarkerById.clear();

      for (const v of active.vehicles || []) {
        const color = v.speed > 70 ? "#f87171" : v.speed > 40 ? "#fbbf24" : "#4ade80";
        const m = L.circleMarker([v.lat, v.lng], {
          radius: 8,
          color,
          fillColor: color,
          fillOpacity: 0.88,
          weight: 1,
        });
        m.bindPopup(`<strong>${escapeHtml(v.plate)}</strong><br/>${escapeHtml(v.make)} ${escapeHtml(v.model)}<br/>Speed ${escapeHtml(String(v.speed))}`);
        m.addTo(markersLayer);
        vehicleMarkerById.set(v.id, m);
      }

      geofenceLayer.clearLayers();
      for (const g of geos.geofences || []) {
        const fill =
          g.type === "hazard" ? "rgba(248, 113, 113, 0.12)" : g.type === "warehouse" ? "rgba(167, 139, 250, 0.12)" : "rgba(61, 139, 253, 0.1)";
        L.circle([g.centerLat, g.centerLng], {
          radius: g.radiusM,
          color: "#8b9cb3",
          weight: 1,
          fillColor: fill,
          fillOpacity: 0.35,
        })
          .bindTooltip(escapeHtml(g.name))
          .addTo(geofenceLayer);
      }

      fitMapBounds();
    } catch (e) {
      console.error(e);
    }
  }

  function fitMapBounds() {
    const L = window.L;
    if (!fleetMap || !markersLayer || !L) return;
    const layers = [];
    markersLayer.eachLayer((l) => layers.push(l));
    if (geofenceLayer) geofenceLayer.eachLayer((l) => layers.push(l));
    if (!layers.length) return;
    const fg = L.featureGroup(layers);
    fleetMap.fitBounds(fg.getBounds().pad(0.12));
  }

  async function syncDashboardViz() {
    initCharts();
    initMap();
    await refreshStaticChartsFromApis();
    await loadMapLayers();
    queueMapInvalidate();
  }

  function connectSocket() {
    if (socket) socket.disconnect();
    socketStatus.textContent = "Socket: connecting…";
    socketStatus.classList.remove("live");
    socket = io({ transports: ["websocket", "polling"] });
    socket.on("connect", () => {
      socketStatus.textContent = "Socket: connected";
      socketStatus.classList.add("live");
      socket.emit("subscribe:fleet");
    });
    socket.on("disconnect", () => {
      socketStatus.textContent = "Socket: disconnected";
      socketStatus.classList.remove("live");
    });
    socket.on("connect_error", () => {
      socketStatus.textContent = "Socket: error";
      socketStatus.classList.remove("live");
    });
    socket.on("gps:update", (payload) => {
      if (!payload || !Array.isArray(payload.vehicles)) return;
      for (const u of payload.vehicles) {
        const row = vehicleRows.get(u.id);
        if (!row) continue;
        row.lat.textContent = u.lat.toFixed(4);
        row.lng.textContent = u.lng.toFixed(4);
        row.speed.textContent = String(u.speed);
        row.fuel.textContent = String(u.fuel);
      }
      updateLiveChartFromGps(payload);
      updateMapMarkersFromGps(payload);
    });
  }

  function renderMetrics(fleet) {
    const items = [
      ["Vehicles", fleet.totalVehicles],
      ["Active", fleet.active],
      ["Idle", fleet.idle],
      ["Maintenance", fleet.maintenance],
      ["Avg fuel %", fleet.avgFuel],
      ["Avg speed", fleet.avgSpeed],
      ["Drivers", fleet.totalDrivers],
      ["On duty", fleet.driversOnDuty],
    ];
    if (fleet.depots != null) items.push(["Depot regions", fleet.depots]);
    if (fleet.openAlerts != null) items.push(["Open alerts", fleet.openAlerts]);
    metricsEl.innerHTML = items
      .map(
        ([label, value]) =>
          `<div class="metric"><div class="value">${escapeHtml(String(value))}</div><div class="label">${escapeHtml(label)}</div></div>`
      )
      .join("");
  }

  function renderAlerts(alerts) {
    if (!alerts.length) {
      alertsList.innerHTML = '<li class="muted">No alerts</li>';
      return;
    }
    alertsList.innerHTML = alerts
      .map(
        (a) =>
          `<li><span class="sev">${escapeHtml(a.severity)}</span> · ${escapeHtml(a.message)}<div class="muted">${escapeHtml(a.vehicleId)} · ${escapeHtml(a.type)}</div></li>`
      )
      .join("");
  }

  function renderVehicles(vehicles) {
    vehiclesBody.innerHTML = "";
    vehicleRows.clear();
    for (const v of vehicles) {
      const tr = document.createElement("tr");
      const lat = document.createElement("td");
      const lng = document.createElement("td");
      const speed = document.createElement("td");
      const fuel = document.createElement("td");
      lat.textContent = Number(v.lat).toFixed(4);
      lng.textContent = Number(v.lng).toFixed(4);
      speed.textContent = String(Math.round(v.speed));
      fuel.textContent = String(Math.round(v.fuel));
      const depot = v.depot ? escapeHtml(v.depot) : "—";
      tr.innerHTML = `<td>${escapeHtml(v.plate)}</td><td>${escapeHtml(v.make)} ${escapeHtml(v.model)}</td><td>${depot}</td><td>${escapeHtml(v.status)}</td>`;
      tr.appendChild(lat);
      tr.appendChild(lng);
      tr.appendChild(speed);
      tr.appendChild(fuel);
      vehiclesBody.appendChild(tr);
      vehicleRows.set(v.id, { lat, lng, speed, fuel });
    }
  }

  function renderTripsTable(trips) {
    tripsBody.innerHTML = trips
      .map(
        (t) =>
          `<tr><td>${escapeHtml(t.id)}</td><td>${escapeHtml(t.vehicleId)}</td><td>${escapeHtml(t.driverId || "—")}</td><td>${escapeHtml(t.origin)} → ${escapeHtml(t.destination)}</td><td>${escapeHtml(t.status)}</td><td>${escapeHtml(String(t.distanceKm))}</td><td>${escapeHtml(String(t.revenue))}</td></tr>`
      )
      .join("");
  }

  function renderGeofencesTable(rows) {
    geofencesBody.innerHTML = rows
      .map(
        (g) =>
          `<tr><td>${escapeHtml(g.id)}</td><td>${escapeHtml(g.name)}</td><td>${escapeHtml(g.type)}</td><td>${escapeHtml(String(g.radiusM))}</td><td>${Number(g.centerLat).toFixed(4)}</td><td>${Number(g.centerLng).toFixed(4)}</td></tr>`
      )
      .join("");
  }

  function renderMaintenanceTable(jobs) {
    maintenanceBody.innerHTML = jobs
      .map(
        (j) =>
          `<tr><td>${escapeHtml(j.id)}</td><td>${escapeHtml(j.vehicleId)}</td><td>${escapeHtml(j.type)}</td><td>${escapeHtml(j.dueDate)}</td><td>${escapeHtml(j.status)}</td><td>${escapeHtml(String(j.odometerKm))}</td></tr>`
      )
      .join("");
  }

  function renderDriversTable(drivers) {
    driversBody.innerHTML = drivers
      .map(
        (d) =>
          `<tr><td>${escapeHtml(d.id)}</td><td>${escapeHtml(d.name)}</td><td>${escapeHtml(d.status)}</td><td>${escapeHtml(d.vehicleId || "—")}</td><td>${escapeHtml(String(d.rating))}</td><td>${escapeHtml(String(d.trips))}</td></tr>`
      )
      .join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  async function loadOverview() {
    const [fleet, ops, alertsRes, vehiclesRes] = await Promise.all([
      api("/api/metrics/fleet"),
      api("/api/metrics/operations"),
      api("/api/alerts?limit=12&page=1"),
      api(`/api/vehicles?limit=${vehicleLimit}&page=${vehiclePage}`),
    ]);
    fleetJson.textContent = JSON.stringify(fleet, null, 2);
    opsJson.textContent = JSON.stringify(ops, null, 2);
    renderMetrics(fleet);
    renderAlerts(alertsRes.alerts || []);
    renderVehicles(vehiclesRes.vehicles || []);
    vehicleTotalPages = vehiclesRes.pagination?.totalPages || 1;
    setPager(vehiclePagerLabel, vehiclePrev, vehicleNext, vehiclePage, vehicleTotalPages);
    if (socket && socket.connected) socket.emit("subscribe:fleet");
  }

  async function loadTripsPanel() {
    const [summary, listRes] = await Promise.all([
      api("/api/trips/stats/summary"),
      api(`/api/trips?limit=${tripLimit}&page=${tripPage}`),
    ]);
    tripsSummaryJson.textContent = JSON.stringify(summary, null, 2);
    renderTripsTable(listRes.trips || []);
    tripTotalPages = listRes.pagination?.totalPages || 1;
    setPager(tripPagerLabel, tripPrev, tripNext, tripPage, tripTotalPages);
    renderTripsTabChart(summary);
    queueMapInvalidate();
  }

  async function loadGeofencesPanel() {
    const [summary, listRes] = await Promise.all([
      api("/api/geofences/stats/summary"),
      api(`/api/geofences?limit=${geofenceLimit}&page=${geofencePage}`),
    ]);
    geofencesSummaryJson.textContent = JSON.stringify(summary, null, 2);
    renderGeofencesTable(listRes.geofences || []);
    geofenceTotalPages = listRes.pagination?.totalPages || 1;
    setPager(geofencePagerLabel, geofencePrev, geofenceNext, geofencePage, geofenceTotalPages);
  }

  async function loadMaintenancePanel() {
    const [summary, listRes] = await Promise.all([
      api("/api/maintenance/stats/summary"),
      api(`/api/maintenance?limit=${maintenanceLimit}&page=${maintenancePage}`),
    ]);
    maintenanceSummaryJson.textContent = JSON.stringify(summary, null, 2);
    renderMaintenanceTable(listRes.jobs || []);
    maintenanceTotalPages = listRes.pagination?.totalPages || 1;
    setPager(maintenancePagerLabel, maintenancePrev, maintenanceNext, maintenancePage, maintenanceTotalPages);
  }

  async function loadDriversPanel() {
    const listRes = await api(`/api/drivers?limit=${driverLimit}&page=${driverPage}`);
    renderDriversTable(listRes.drivers || []);
    driverTotalPages = listRes.pagination?.totalPages || 1;
    setPager(driverPagerLabel, driverPrev, driverNext, driverPage, driverTotalPages);
  }

  async function switchTab(name) {
    currentTab = name;
    navTabs.querySelectorAll(".tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === name);
    });
    Object.keys(panels).forEach((key) => {
      panels[key].hidden = key !== name;
    });
    try {
      if (name === "overview") {
        await loadOverview();
        await syncDashboardViz();
      } else if (name === "trips") {
        await loadTripsPanel();
      } else if (name === "geofences") {
        await loadGeofencesPanel();
      } else if (name === "maintenance") {
        await loadMaintenancePanel();
      } else if (name === "drivers") {
        await loadDriversPanel();
      }
    } catch (e) {
      console.error(e);
    }
    queueMapInvalidate();
  }

  async function refreshEverything() {
    globalRefresh.disabled = true;
    try {
      await syncDashboardViz();
      if (currentTab === "overview") await loadOverview();
      else if (currentTab === "trips") await loadTripsPanel();
      else if (currentTab === "geofences") await loadGeofencesPanel();
      else if (currentTab === "maintenance") await loadMaintenancePanel();
      else if (currentTab === "drivers") await loadDriversPanel();
    } catch (e) {
      console.error(e);
    } finally {
      globalRefresh.disabled = false;
    }
    queueMapInvalidate();
  }

  navTabs.addEventListener("click", (e) => {
    const btn = e.target.closest(".tab");
    if (!btn || !btn.dataset.tab) return;
    switchTab(btn.dataset.tab);
  });

  vehiclePrev.addEventListener("click", async () => {
    vehiclePage = Math.max(1, vehiclePage - 1);
    await loadOverview().catch(console.error);
  });
  vehicleNext.addEventListener("click", async () => {
    vehiclePage = Math.min(vehicleTotalPages, vehiclePage + 1);
    await loadOverview().catch(console.error);
  });

  tripPrev.addEventListener("click", () => {
    tripPage = Math.max(1, tripPage - 1);
    loadTripsPanel().catch(console.error);
  });
  tripNext.addEventListener("click", () => {
    tripPage = Math.min(tripTotalPages, tripPage + 1);
    loadTripsPanel().catch(console.error);
  });

  geofencePrev.addEventListener("click", () => {
    geofencePage = Math.max(1, geofencePage - 1);
    loadGeofencesPanel().catch(console.error);
  });
  geofenceNext.addEventListener("click", () => {
    geofencePage = Math.min(geofenceTotalPages, geofencePage + 1);
    loadGeofencesPanel().catch(console.error);
  });

  maintenancePrev.addEventListener("click", () => {
    maintenancePage = Math.max(1, maintenancePage - 1);
    loadMaintenancePanel().catch(console.error);
  });
  maintenanceNext.addEventListener("click", () => {
    maintenancePage = Math.min(maintenanceTotalPages, maintenancePage + 1);
    loadMaintenancePanel().catch(console.error);
  });

  driverPrev.addEventListener("click", () => {
    driverPage = Math.max(1, driverPage - 1);
    loadDriversPanel().catch(console.error);
  });
  driverNext.addEventListener("click", () => {
    driverPage = Math.min(driverTotalPages, driverPage + 1);
    loadDriversPanel().catch(console.error);
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.hidden = true;
    const fd = new FormData(loginForm);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    try {
      const data = await api("/api/auth/login", { method: "POST", body: { email, password } });
      setSession(data.token, data.user);
      showDashboard(data.user);
      vehiclePage = tripPage = geofencePage = maintenancePage = driverPage = 1;
      await switchTab("overview");
    } catch (err) {
      loginError.textContent = err.message;
      loginError.hidden = false;
    }
  });

  logoutBtn.addEventListener("click", () => {
    clearSession();
    showLogin();
  });

  globalRefresh.addEventListener("click", () => refreshEverything());

  refreshVehicles.addEventListener("click", async () => {
    await loadOverview().catch(console.error);
    await syncDashboardViz().catch(console.error);
  });
  refreshMapBtn.addEventListener("click", () => {
    fitMapBounds();
    queueMapInvalidate();
  });
  refreshTrips.addEventListener("click", () => loadTripsPanel().catch(console.error));
  refreshGeofences.addEventListener("click", () => loadGeofencesPanel().catch(console.error));
  refreshMaintenance.addEventListener("click", () => loadMaintenancePanel().catch(console.error));
  refreshDrivers.addEventListener("click", () => loadDriversPanel().catch(console.error));

  const token = getToken();
  const user = getUser();
  if (token && user) {
    showDashboard(user);
    switchTab("overview").catch(console.error);
  } else {
    showLogin();
  }
})();
