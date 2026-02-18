import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const baseUrl = process.env.CINELINK_TEST_BASE_URL || "http://localhost:8099";
const artifactsDir = path.join(process.cwd(), "tests", "artifacts");
mkdirSync(artifactsDir, { recursive: true });

const LINKS = [
  {
    id: "mp4_archive",
    url: "https://archive.org/download/fullmetal-completo-pt-br/Fullmetal%20Alchemist%20-%20Epis%C3%B3dio%20001%20-%20Aqueles%20que%20desafiam%20o%20sol.ia.mp4",
    expectedSource: "html5"
  },
  {
    id: "mkv_archive",
    url: "https://archive.org/download/ma-fullmetal-alchemist-2009-bdrip-1920x1080-av1-opus/%5BMA%5D%20FULLMETAL%20ALCHEMIST%20%282009%29%20%5BBDRip%201920x1080%20AV1%20OPUS%5D/%5BMA%5D%20FULLMETAL%20ALCHEMIST%20%282009%29%2001%20%5BBDRip%201920x1080%20AV1%20OPUS%5D.mkv",
    expectedSource: "hls"
  },
  {
    id: "drive_file",
    url: "https://drive.google.com/file/d/1a1Xnrn3_hsettWdceMVC5TYIzKg-rc7N/view?usp=drive_link",
    expectedSource: "drive"
  },
  {
    id: "youtube",
    url: "https://www.youtube.com/watch?v=elyXcwunIYA",
    expectedSource: "youtube"
  }
];

const ANSI_RED = "\x1b[31m";
const ANSI_GREEN = "\x1b[32m";
const ANSI_YELLOW = "\x1b[33m";
const ANSI_RESET = "\x1b[0m";

async function jfetch(url, init) {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function waitPipeline(roomId, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { body } = await jfetch(`${baseUrl}/test/room/${encodeURIComponent(roomId)}/state`);
    const status = String(body?.state?.mediaPipelineStatus || "").toLowerCase();
    if (!status || status === "ready" || status === "failed") {
      return body?.state || {};
    }
    await new Promise((r) => setTimeout(r, 1400));
  }
  return { mediaPipelineStatus: "timeout", mediaPipelineMessage: "Timed out waiting for pipeline." };
}

async function run() {
  const report = {
    startedAt: new Date().toISOString(),
    baseUrl,
    links: [],
    errors: [],
    serverLogs: []
  };

  await jfetch(`${baseUrl}/test/cleanup`, { method: "POST" });

  for (const item of LINKS) {
    const boot = await jfetch(`${baseUrl}/test/room/bootstrap`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ roomName: `Real Link Test: ${item.id}`, mediaUrl: item.url })
    });
    const roomId = String(boot.body?.roomId || "");
    const state = roomId ? await waitPipeline(roomId) : {};
    const sourceType = String(state?.mediaSourceType || boot.body?.state?.mediaSourceType || "");
    const pipelineStatus = String(state?.mediaPipelineStatus || boot.body?.state?.mediaPipelineStatus || "");
    const okBoot = !!boot.body?.ok;
    const sourceMatch = !item.expectedSource || sourceType === item.expectedSource;
    const readyOrExpectedFail = pipelineStatus === "ready" || pipelineStatus === "failed" || pipelineStatus === "";
    const ok = okBoot && sourceMatch && readyOrExpectedFail;
    report.links.push({
      id: item.id,
      url: item.url,
      expectedSource: item.expectedSource,
      ok,
      bootstrapStatus: boot.status,
      bootstrapOk: okBoot,
      roomId,
      sourceType,
      resolvedMediaUrl: String(state?.resolvedMediaUrl || boot.body?.state?.resolvedMediaUrl || ""),
      pipelineStatus,
      pipelineMessage: String(state?.mediaPipelineMessage || boot.body?.state?.mediaPipelineMessage || ""),
      bootstrapErrors: boot.body?.errors || []
    });
    if (!ok) {
      report.errors.push(`${item.id}: bootstrapOk=${okBoot} sourceType=${sourceType} pipeline=${pipelineStatus}`);
    }
  }

  const recent = await jfetch(`${baseUrl}/test/logs/recent?limit=300`);
  report.serverLogs = recent.body?.items || [];
  report.finishedAt = new Date().toISOString();

  const outPath = path.join(artifactsDir, "real-links-results.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf-8");

  console.log(`${ANSI_YELLOW}[real-links] summary${ANSI_RESET}`);
  for (const entry of report.links) {
    const color = entry.ok ? ANSI_GREEN : ANSI_RED;
    console.log(
      `${color}${entry.id}${ANSI_RESET} source=${entry.sourceType || "-"} expected=${entry.expectedSource} pipeline=${entry.pipelineStatus || "-"}`
    );
    if (entry.pipelineMessage) {
      const msgColor = /failed|error|timeout|invalid/i.test(entry.pipelineMessage) ? ANSI_RED : ANSI_YELLOW;
      console.log(`${msgColor}  message: ${entry.pipelineMessage}${ANSI_RESET}`);
    }
  }

  if (report.errors.length) {
    console.error(`${ANSI_RED}[real-links] failed${ANSI_RESET}`, report.errors);
    process.exit(1);
  }
  console.log(`${ANSI_GREEN}[real-links] ok${ANSI_RESET}`);
}

run().catch((error) => {
  console.error(`${ANSI_RED}[real-links] exception${ANSI_RESET}`, String(error));
  process.exit(1);
});

