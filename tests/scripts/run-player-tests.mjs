import { spawn } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const artifactsDir = path.join(root, "tests", "artifacts");
mkdirSync(artifactsDir, { recursive: true });

const isWindows = process.platform === "win32";
const shellCmd = isWindows ? "cmd.exe" : "bash";

function spawnCommand(command, logName) {
  const logPath = path.join(artifactsDir, `${logName}.log`);
  const errPath = path.join(artifactsDir, `${logName}.err.log`);
  const out = createWriteStream(logPath, { flags: "a" });
  const err = createWriteStream(errPath, { flags: "a" });
  const args = isWindows ? ["/d", "/s", "/c", command] : ["-lc", command];
  const proc = spawn(shellCmd, args, {
    cwd: root,
    env: process.env
  });
  proc.stdout.pipe(out);
  proc.stderr.pipe(err);
  return proc;
}

async function waitFor(url, timeoutMs = 45_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return true;
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  return false;
}

async function runForeground(command) {
  await new Promise((resolve, reject) => {
    const args = isWindows ? ["/d", "/s", "/c", command] : ["-lc", command];
    const proc = spawn(shellCmd, args, { cwd: root, env: process.env, stdio: "inherit" });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`${command} failed (${code})`));
      }
    });
  });
}

async function runProcess(executable, args) {
  await new Promise((resolve, reject) => {
    const proc = spawn(executable, args, { cwd: root, env: process.env, stdio: "inherit" });
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`${executable} ${args.join(" ")} failed (${code})`));
      }
    });
  });
}

async function freeKnownPorts() {
  if (isWindows) {
    const ps = [
      "$ports = 8080,8081,8082,8090,8099,5173",
      "$conns = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue",
      "$pids = $conns | Where-Object { $ports -contains $_.LocalPort } | Select-Object -ExpandProperty OwningProcess -Unique",
      "if ($pids) { $pids | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"
    ].join("; ");
    await runProcess("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps]);
    return;
  }
  await runForeground(
    "for p in 8080 8081 8082 8090 8099 5173; do " +
      "(lsof -ti :$p 2>/dev/null || true) | xargs -r kill -9; " +
    "done"
  );
}

async function ensurePlaywrightBrowser() {
  await runForeground("npx playwright install chromium");
}

async function main() {
  const procs = [];
  try {
    await runForeground("npm run test:fixtures");
    await ensurePlaywrightBrowser();
    await freeKnownPorts();

    const server = spawnCommand("npm run server --workspace @cinelink/server", "server-test-player");
    procs.push(server);
    const serverReady = await waitFor("http://127.0.0.1:8099/test/health", 60_000);
    if (!serverReady) {
      throw new Error("Server test endpoint did not become ready");
    }

    await runForeground("npm run test:player:api");

    const client = spawnCommand("npm run client --workspace @cinelink/client -- --host 0.0.0.0 --port 5173", "client-test-player");
    procs.push(client);
    const clientReady = await waitFor("http://127.0.0.1:5173", 45_000);
    if (!clientReady) {
      throw new Error("Client did not become ready");
    }

    await runForeground("npm run test:player:e2e");
  } finally {
    for (const proc of procs.reverse()) {
      try {
        if (isWindows) {
          spawn("taskkill", ["/pid", String(proc.pid), "/t", "/f"], { stdio: "ignore" });
        } else {
          proc.kill("SIGTERM");
        }
      } catch {
        // ignore
      }
    }
  }
}

main().catch((error) => {
  console.error("[run-player-tests] failed:", String(error));
  process.exit(1);
});
