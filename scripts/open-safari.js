import { spawn } from "child_process";
import http from "http";

const PORT = 3000;
const URL = `http://localhost:${PORT}`;

function isServerRunning() {
  return new Promise((resolve) => {
    const req = http.get(URL, (res) => {
      resolve(true);
      res.resume();
    });
    req.on("error", () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function openSafari(targetUrl) {
  spawn("open", ["-a", "Safari", targetUrl], { stdio: "ignore" });
}

async function start() {
  const alreadyRunning = await isServerRunning();
  if (alreadyRunning) {
    console.log(`[Safari] Dev server is already running at ${URL}.`);
    console.log(`[Safari] Launching macOS Safari...`);
    openSafari(URL);
    return;
  }

  console.log(`[Safari] Dev server not running. Starting Vite on port ${PORT}...`);
  const vite = spawn("npx", ["vite", "--port", String(PORT)], {
    stdio: "inherit",
  });

  // Poll until Vite is ready
  let opened = false;
  const pollTimer = setInterval(async () => {
    if (await isServerRunning()) {
      clearInterval(pollTimer);
      if (!opened) {
        opened = true;
        console.log(`\n[Safari] Dev server ready! Launching macOS Safari at ${URL}...\n`);
        openSafari(URL);
      }
    }
  }, 300);

  // Safety timeout: 10s
  setTimeout(() => {
    clearInterval(pollTimer);
    if (!opened) {
      console.warn(`[Safari] Could not confirm server readiness within 10s.`);
    }
  }, 10000);

  vite.on("exit", (code) => {
    clearInterval(pollTimer);
    process.exit(code || 0);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
