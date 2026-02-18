import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const baseUrl = process.env.CINELINK_TEST_BASE_URL || "http://localhost:8099";
const artifactsDir = path.join(process.cwd(), "tests", "artifacts");
mkdirSync(artifactsDir, { recursive: true });

const report = {
  startedAt: new Date().toISOString(),
  baseUrl,
  checks: [],
  errors: []
};

async function jfetch(url, init) {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function check(name, ok, details = "") {
  report.checks.push({ name, ok, details });
  if (!ok) {
    report.errors.push(`${name}: ${details}`);
  }
}

async function waitForPipeline(roomId, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { body } = await jfetch(`${baseUrl}/test/room/${encodeURIComponent(roomId)}/state`);
    const status = String(body?.state?.mediaPipelineStatus || "").toLowerCase();
    if (status === "ready") {
      return { ok: true, state: body.state };
    }
    if (status === "failed") {
      return { ok: false, state: body.state, reason: body?.state?.mediaPipelineMessage || "pipeline failed" };
    }
    await new Promise((r) => setTimeout(r, 1200));
  }
  return { ok: false, reason: "pipeline_timeout" };
}

try {
  const health = await jfetch(`${baseUrl}/test/health`);
  check("health_200", health.status === 200, `status=${health.status}`);
  check("health_ok", !!health.body?.ok, JSON.stringify(health.body));

  const mediaHealth = await jfetch(`${baseUrl}/test/media/health`);
  check("media_health_200", mediaHealth.status === 200, `status=${mediaHealth.status}`);

  const bootstrap = await jfetch(`${baseUrl}/test/room/bootstrap`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      roomName: "API Playback Test",
      mediaUrl: `${baseUrl}/test/fixtures/video/sample.mp4`
    })
  });
  check("bootstrap_ok", !!bootstrap.body?.ok, JSON.stringify(bootstrap.body));
  const roomId = String(bootstrap.body?.roomId || "");
  check("bootstrap_room_id", !!roomId, roomId || "missing roomId");

  const actions = await jfetch(`${baseUrl}/test/room/actions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      roomId,
      actions: [
        { type: "play", atSeconds: 0 },
        { type: "seek", atSeconds: 3.5 },
        { type: "pause", atSeconds: 4.1 },
        { type: "setRate", playbackRate: 1.25 },
        { type: "addQueueLast", url: `${baseUrl}/test/fixtures/video/sample2.mp4` },
        { type: "advanceQueue", autoplay: true },
        { type: "previousQueue", autoplay: false }
      ]
    })
  });
  check("actions_ok", !!actions.body?.ok, JSON.stringify(actions.body));

  const mkvBootstrap = await jfetch(`${baseUrl}/test/room/bootstrap`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      roomName: "MKV Pipeline Test",
      mediaUrl: `${baseUrl}/test/fixtures/video/sample.mkv`
    })
  });
  check("mkv_bootstrap_ok", !!mkvBootstrap.body?.ok, JSON.stringify(mkvBootstrap.body));
  const mkvRoomId = String(mkvBootstrap.body?.roomId || "");
  check("mkv_bootstrap_room_id", !!mkvRoomId, mkvRoomId || "missing roomId");

  const pipelineResult = await waitForPipeline(mkvRoomId);
  check("mkv_pipeline_ready", !!pipelineResult.ok, pipelineResult.reason || "");
  if (pipelineResult.ok) {
    check(
      "mkv_resolved_is_m3u8",
      /\.m3u8(\?|$)/i.test(String(pipelineResult.state?.resolvedMediaUrl || "")),
      String(pipelineResult.state?.resolvedMediaUrl || "")
    );
  }

  const recentLogs = await jfetch(`${baseUrl}/test/logs/recent?limit=200`);
  const engineLogFound = Array.isArray(recentLogs.body?.items)
    && recentLogs.body.items.some((item) => String(item?.tag || "") === "media:engine:selected");
  check("server_engine_log_present", engineLogFound, "expected media:engine:selected in /test/logs/recent");
  report.serverLogs = recentLogs.body?.items || [];
} catch (error) {
  check("runner_exception", false, String(error));
  try {
    const recentLogs = await jfetch(`${baseUrl}/test/logs/recent?limit=200`);
    report.serverLogs = recentLogs.body?.items || [];
  } catch {
    report.serverLogs = [];
  }
}

report.finishedAt = new Date().toISOString();
writeFileSync(path.join(artifactsDir, "api-results.json"), JSON.stringify(report, null, 2), "utf-8");

if (report.errors.length) {
  console.error("[player-tests] failed", report.errors);
  process.exit(1);
}
console.log("[player-tests] ok");
