const path = require("path");
const express = require("express");

const publicDir = path.join(__dirname, "../public");
const nodeModules = path.join(__dirname, "../node_modules");

function sendCss(res, filePath) {
  res.type("text/css");
  res.sendFile(filePath);
}

function sendJs(res, filePath) {
  res.type("application/javascript");
  res.sendFile(filePath);
}

/** Mount static files; /api/static/* works when the proxy only forwards /api to Node (Cloudways). */
function mountStaticAssets(app) {
  const apiStatic = express.Router();

  apiStatic.get("/styles.css", (req, res) => sendCss(res, path.join(publicDir, "styles.css")));
  apiStatic.get("/leaflet.css", (req, res) => sendCss(res, path.join(nodeModules, "leaflet/dist/leaflet.css")));
  apiStatic.get("/chart.umd.js", (req, res) => sendJs(res, path.join(nodeModules, "chart.js/dist/chart.umd.js")));
  apiStatic.get("/leaflet.js", (req, res) => sendJs(res, path.join(nodeModules, "leaflet/dist/leaflet.js")));
  apiStatic.get("/socket.io.min.js", (req, res) =>
    sendJs(res, path.join(nodeModules, "socket.io/client-dist/socket.io.min.js"))
  );
  apiStatic.get("/app.js", (req, res) => sendJs(res, path.join(publicDir, "app.js")));

  app.use("/api/static", apiStatic);

  app.get("/styles.css", (req, res) => sendCss(res, path.join(publicDir, "styles.css")));
  app.get("/vendor/leaflet.css", (req, res) => sendCss(res, path.join(nodeModules, "leaflet/dist/leaflet.css")));
  app.get("/vendor/socket.io.min.js", (req, res) =>
    sendJs(res, path.join(nodeModules, "socket.io/client-dist/socket.io.min.js"))
  );
  app.get("/vendor/chart.umd.js", (req, res) => sendJs(res, path.join(nodeModules, "chart.js/dist/chart.umd.js")));
  app.get("/vendor/leaflet.js", (req, res) => sendJs(res, path.join(nodeModules, "leaflet/dist/leaflet.js")));

  app.use(express.static(publicDir));
}

module.exports = { mountStaticAssets, publicDir };
