/**
 * Disk usage check — Cloudways cron setup:
 *   Type: npm
 *   Command: run cron-disk
 *   Schedule: 0 3 * * *  (daily at 03:00)
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(appDir, "cron-disk.log");

const output = execSync("df -h /", { encoding: "utf8" });
const line = `[${new Date().toISOString()}]\n${output}\n`;

fs.appendFileSync(logFile, line);
console.log(line.trim());
