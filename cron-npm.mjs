/**
 * Dependency security audit — Cloudways cron setup:
 *   Type: npm
 *   Command: run cron-task
 *   Schedule: 0 2 * * *  (daily at 02:00)
 *
 * Requires in package.json: "cron-task": "node cron-npm.mjs"
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(appDir, "cron-npm.log");

try {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] npm audit started\n`);

  const result = execSync(`npm audit --json --prefix ${appDir} 2>/dev/null || true`, {
    encoding: "utf8",
  });
  const audit = JSON.parse(result);

  const total = audit.metadata?.vulnerabilities?.total ?? 0;
  const critical = audit.metadata?.vulnerabilities?.critical ?? 0;
  const high = audit.metadata?.vulnerabilities?.high ?? 0;
  const moderate = audit.metadata?.vulnerabilities?.moderate ?? 0;

  const line = `[${new Date().toISOString()}] Audit done | Total: ${total} | Critical: ${critical} | High: ${high} | Moderate: ${moderate}\n`;
  fs.appendFileSync(logFile, line);
  console.log(line.trim());

  if (critical > 0 || high > 0) {
    fs.appendFileSync(
      logFile,
      `[${new Date().toISOString()}] Action required — ${critical} critical, ${high} high vulnerabilities\n`
    );
  }
} catch (err) {
  fs.appendFileSync(logFile, `[${new Date().toISOString()}] Audit failed: ${err.message}\n`);
  process.exitCode = 1;
}
