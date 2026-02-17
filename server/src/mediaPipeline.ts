import { createHash } from "crypto";
import { spawn } from "child_process";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { createReadStream, existsSync, promises as fs } from "fs";
import path from "path";
import { Readable } from "stream";
import { addTestLog, clearTestLogs, getRecentTestLogs } from "./testDiagnostics";

export type MediaSourceType = "youtube" | "drive" | "html5" | "hls" | "unsupported";
export type MediaPipelineStatus = "pending" | "ready" | "failed";

type MediaResolveResult = {
  sourceType: MediaSourceType;
  resolvedUrl: string;
  pipelineStatus: MediaPipelineStatus;
  pipelineMessage: string;
};

type HlsJobStatus = {
  key: string;
  inputUrl: string;
  status: MediaPipelineStatus;
  message: string;
  outputDir: string;
  updatedAtMs: number;
};

type TestHooks = {
  testBootstrapRoom: (input: { roomId?: string; roomName?: string; hostUserId?: string; mediaUrl: string }) => Promise<{
    ok: boolean;
    roomId: string;
    state: any;
    assertions: Array<{ name: string; ok: boolean; details?: string }>;
    errors: string[];
  }>;
  testApplyRoomActions: (input: {
    roomId: string;
    actorUserId?: string;
    actions: Array<Record<string, unknown>>;
  }) => Promise<{
    ok: boolean;
    state: any;
    assertions: Array<{ name: string; ok: boolean; details?: string }>;
    errors: string[];
  }>;
  getTestRoomState: (roomId: string) => any;
  testRefreshRoomState: (roomId: string) => Promise<any>;
  clearAllTestRooms: () => { removedRooms: number };
};

const MEDIA_HTTP_PORT = Number(process.env.CINELINK_MEDIA_PORT || 8099);
const FFMPEG_BIN = (process.env.CINELINK_FFMPEG_PATH || "ffmpeg").trim() || "ffmpeg";
const MEDIA_RUNTIME_DIR = path.resolve(process.cwd(), ".cinelink-media");
const MEDIA_HLS_DIR = path.join(MEDIA_RUNTIME_DIR, "hls");
const HLS_TTL_MS = 1000 * 60 * 60 * 6;
const CLEANUP_INTERVAL_MS = 1000 * 60 * 20;
const FAILED_RETRY_AFTER_MS = 1000 * 60 * 2;

const hlsJobs = new Map<string, HlsJobStatus>();
let mediaServerStarted = false;
let cleanupTimer: NodeJS.Timeout | null = null;
let ffmpegAvailableCache: boolean | null = null;
let ffmpegResolvedBin = FFMPEG_BIN;
let testHooks: TestHooks | null = null;

export function startMediaPipelineServer(options?: { testHooks?: TestHooks }): void {
  if (mediaServerStarted) {
    return;
  }
  testHooks = options?.testHooks || null;
  mediaServerStarted = true;
  void ensureRuntimeDirs();
  const server = createServer((req, res) => {
    void handleRequest(req, res);
  });
  server.listen(MEDIA_HTTP_PORT, "0.0.0.0", () => {
    console.log(`[CineLink][media-http] listening on http://localhost:${MEDIA_HTTP_PORT}`);
    addTestLog("test:server:ready", { baseUrl: getMediaBaseUrl() });
  });
  cleanupTimer = setInterval(() => {
    void cleanupOldTranscodes();
  }, CLEANUP_INTERVAL_MS);
}

export async function resolvePlaybackSource(mediaUrl: string): Promise<MediaResolveResult> {
  const sourceUrl = (mediaUrl || "").trim();
  if (!sourceUrl) {
    addTestLog("media:resolve:error", { reason: "empty_media_url" });
    return {
      sourceType: "unsupported",
      resolvedUrl: "",
      pipelineStatus: "failed",
      pipelineMessage: "Empty media URL."
    };
  }

  if (getYouTubeVideoId(sourceUrl)) {
    addTestLog("media:resolve:ok", { sourceType: "youtube", mediaUrl: sourceUrl });
    return {
      sourceType: "youtube",
      resolvedUrl: sourceUrl,
      pipelineStatus: "ready",
      pipelineMessage: ""
    };
  }

  if (isHlsManifestUrl(sourceUrl)) {
    addTestLog("media:resolve:ok", { sourceType: "hls", mediaUrl: sourceUrl });
    return {
      sourceType: "hls",
      resolvedUrl: sourceUrl,
      pipelineStatus: "ready",
      pipelineMessage: ""
    };
  }

  if (isGoogleDriveUrl(sourceUrl)) {
    addTestLog("media:resolve:ok", { sourceType: "drive", mediaUrl: sourceUrl });
    return {
      sourceType: "drive",
      resolvedUrl: `${getMediaBaseUrl()}/media/drive?url=${encodeURIComponent(sourceUrl)}`,
      pipelineStatus: "ready",
      pipelineMessage: ""
    };
  }

  if (isLikelyMkvUrl(sourceUrl)) {
    addTestLog("media:resolve:start", { sourceType: "mkv", mediaUrl: sourceUrl });
    return ensureHlsFromMkv(sourceUrl);
  }

  addTestLog("media:resolve:ok", { sourceType: "html5", mediaUrl: sourceUrl });
  return {
    sourceType: "html5",
    resolvedUrl: sourceUrl,
    pipelineStatus: "ready",
    pipelineMessage: ""
  };
}

function getMediaBaseUrl(): string {
  return `http://localhost:${MEDIA_HTTP_PORT}`;
}

function getYouTubeVideoId(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === "youtu.be") {
      return parsed.pathname.replace("/", "") || undefined;
    }
    if (host.includes("youtube.com")) {
      return parsed.searchParams.get("v") || parsed.pathname.match(/\/embed\/([^/?]+)/i)?.[1] || undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function isGoogleDriveUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "drive.google.com" || host.endsWith(".drive.google.com") || host === "drive.usercontent.google.com";
  } catch {
    return false;
  }
}

function isHlsManifestUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith(".m3u8");
  } catch {
    return false;
  }
}

function isLikelyMkvUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.endsWith(".mkv");
  } catch {
    return /\.mkv(\?|$)/i.test(url);
  }
}

async function ensureHlsFromMkv(inputUrl: string): Promise<MediaResolveResult> {
  const ffmpegAvailable = await ensureFfmpegAvailable();
  if (!ffmpegAvailable) {
    addTestLog("media:transcode:failed", { reason: "ffmpeg_missing", inputUrl });
    return {
      sourceType: "hls",
      resolvedUrl: "",
      pipelineStatus: "failed",
      pipelineMessage: `FFmpeg not found (${FFMPEG_BIN}). Install ffmpeg and ensure it is in PATH, or set CINELINK_FFMPEG_PATH.`
    };
  }

  const key = createHash("sha1").update(inputUrl).digest("hex").slice(0, 20);
  const outputDir = path.join(MEDIA_HLS_DIR, key);
  const manifestPath = path.join(outputDir, "master.m3u8");
  const manifestUrl = `${getMediaBaseUrl()}/media/hls/${encodeURIComponent(key)}/master.m3u8`;

  const existing = hlsJobs.get(key);
  if (existing?.status === "ready") {
    addTestLog("media:transcode:cache-hit", { key });
    return {
      sourceType: "hls",
      resolvedUrl: manifestUrl,
      pipelineStatus: "ready",
      pipelineMessage: existing.message
    };
  }
  if (existing?.status === "pending") {
    addTestLog("media:transcode:pending", { key });
    return {
      sourceType: "hls",
      resolvedUrl: manifestUrl,
      pipelineStatus: "pending",
      pipelineMessage: existing.message || "Preparing HLS stream..."
    };
  }
  if (existing?.status === "failed") {
    if (Date.now() - existing.updatedAtMs < FAILED_RETRY_AFTER_MS) {
      addTestLog("media:transcode:failed-cached", { key, message: existing.message });
      return {
        sourceType: "hls",
        resolvedUrl: manifestUrl,
        pipelineStatus: "failed",
        pipelineMessage: existing.message || "HLS transcode failed."
      };
    }
  }

  if (await fileExists(manifestPath)) {
    addTestLog("media:transcode:manifest-cache", { key });
    hlsJobs.set(key, {
      key,
      inputUrl,
      status: "ready",
      message: "",
      outputDir,
      updatedAtMs: Date.now()
    });
    return {
      sourceType: "hls",
      resolvedUrl: manifestUrl,
      pipelineStatus: "ready",
      pipelineMessage: ""
    };
  }

  const job: HlsJobStatus = {
    key,
    inputUrl,
    status: "pending",
    message: "Preparing HLS stream...",
    outputDir,
    updatedAtMs: Date.now()
  };
  hlsJobs.set(key, job);
  void startTranscodeJob(job);

  return {
    sourceType: "hls",
    resolvedUrl: manifestUrl,
    pipelineStatus: "pending",
    pipelineMessage: job.message
  };
}

async function startTranscodeJob(job: HlsJobStatus): Promise<void> {
  await ensureRuntimeDirs();
  await fs.mkdir(job.outputDir, { recursive: true });
  const args = [
    "-hide_banner",
    "-y",
    "-i",
    job.inputUrl,
    "-map",
    "0:v:0",
    "-map",
    "0:a:0?",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "21",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-f",
    "hls",
    "-hls_time",
    "6",
    "-hls_playlist_type",
    "vod",
    "-hls_segment_filename",
    path.join(job.outputDir, "segment_%05d.ts"),
    path.join(job.outputDir, "master.m3u8")
  ];

  console.log("[CineLink][media:transcode:start]", { key: job.key, inputUrl: job.inputUrl });
  addTestLog("media:transcode:start", { key: job.key, inputUrl: job.inputUrl });
  const child = spawn(ffmpegResolvedBin, args, { stdio: ["ignore", "ignore", "pipe"] });
  let stderrTail = "";
  child.stderr.on("data", (chunk) => {
    const text = String(chunk || "");
    if (text) {
      stderrTail = `${stderrTail}\n${text}`.slice(-4000);
    }
    if (text.includes("time=")) {
      job.updatedAtMs = Date.now();
    }
  });

  child.on("error", (error) => {
    job.status = "failed";
    job.message = `Transcode spawn failed: ${String(error)}. Ensure ffmpeg is installed and in PATH.`;
    job.updatedAtMs = Date.now();
    console.log("[CineLink][media:transcode:failed]", { key: job.key, error: String(error) });
    addTestLog("media:transcode:failed", { key: job.key, error: String(error) });
  });

  child.on("close", async (code) => {
    if (code !== 0) {
      job.status = "failed";
      const compact = stderrTail
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(-6)
        .join(" | ");
      job.message = compact
        ? `ffmpeg exited with code ${code}: ${compact}`
        : `ffmpeg exited with code ${code}`;
      job.updatedAtMs = Date.now();
      console.log("[CineLink][media:transcode:failed]", { key: job.key, code });
      addTestLog("media:transcode:failed", { key: job.key, code: String(code), stderr: compact });
      return;
    }
    const manifest = path.join(job.outputDir, "master.m3u8");
    if (!(await fileExists(manifest))) {
      job.status = "failed";
      job.message = "Transcode completed but no HLS manifest was generated.";
      job.updatedAtMs = Date.now();
      console.log("[CineLink][media:transcode:failed]", { key: job.key, reason: "manifest_missing" });
      addTestLog("media:transcode:failed", { key: job.key, reason: "manifest_missing" });
      return;
    }
    job.status = "ready";
    job.message = "";
    job.updatedAtMs = Date.now();
    console.log("[CineLink][media:transcode:ready]", { key: job.key, manifest });
    addTestLog("media:transcode:ready", { key: job.key, manifest });
  });
}

async function ensureRuntimeDirs(): Promise<void> {
  await fs.mkdir(MEDIA_HLS_DIR, { recursive: true });
}

async function fileExists(value: string): Promise<boolean> {
  try {
    await fs.access(value);
    return true;
  } catch {
    return false;
  }
}

async function ensureFfmpegAvailable(): Promise<boolean> {
  if (ffmpegAvailableCache !== null) {
    return ffmpegAvailableCache;
  }
  ffmpegResolvedBin = await resolveFfmpegExecutablePath();
  ffmpegAvailableCache = await new Promise<boolean>((resolve) => {
    const child = spawn(ffmpegResolvedBin, ["-version"], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
  if (!ffmpegAvailableCache) {
    console.log("[CineLink][media:ffmpeg:missing]", { ffmpeg: ffmpegResolvedBin });
    addTestLog("media:ffmpeg:missing", { ffmpeg: ffmpegResolvedBin });
  }
  return ffmpegAvailableCache;
}

async function resolveFfmpegExecutablePath(): Promise<string> {
  if (FFMPEG_BIN && FFMPEG_BIN !== "ffmpeg") {
    return FFMPEG_BIN;
  }
  const localAppData = process.env.LOCALAPPDATA || "";
  if (!localAppData) {
    return FFMPEG_BIN;
  }
  const wingetPackages = path.join(localAppData, "Microsoft", "WinGet", "Packages");
  try {
    const matches: string[] = [];
    await walkFindFfmpeg(wingetPackages, matches, 6);
    if (matches.length) {
      matches.sort((a, b) => b.length - a.length);
      const picked = matches[0];
      console.log("[CineLink][media:ffmpeg:autodetected]", { ffmpeg: picked });
      return picked;
    }
  } catch {
    // ignore scan errors
  }
  return FFMPEG_BIN;
}

async function walkFindFfmpeg(dir: string, matches: string[], maxDepth: number): Promise<void> {
  if (maxDepth < 0 || matches.length > 4) {
    return;
  }
  let entries: Array<{ name: string; isDirectory: () => boolean }>;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true }) as Array<{ name: string; isDirectory: () => boolean }>;
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkFindFfmpeg(full, matches, maxDepth - 1);
      continue;
    }
    if (entry.name.toLowerCase() === "ffmpeg.exe") {
      matches.push(full);
    }
  }
}

async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const reqUrl = req.url || "/";
  const parsed = new URL(reqUrl, "http://localhost");
  if (parsed.pathname === "/health") {
    sendJson(res, 200, { ok: true });
    return;
  }
  if (parsed.pathname === "/test/health") {
    sendJson(res, 200, {
      ok: true,
      scenario: "health",
      assertions: [{ name: "server_alive", ok: true }],
      errors: [],
      metrics: { nowMs: Date.now() }
    });
    return;
  }
  if (parsed.pathname === "/test/media/health") {
    const ffmpegReady = await ensureFfmpegAvailable();
    const ffmpegVersion = ffmpegReady ? await getFfmpegVersion() : "";
    sendJson(res, 200, {
      ok: ffmpegReady,
      scenario: "media-health",
      assertions: [
        {
          name: "ffmpeg_available",
          ok: ffmpegReady,
          details: ffmpegReady ? ffmpegResolvedBin : "ffmpeg not found"
        }
      ],
      errors: ffmpegReady ? [] : [`FFmpeg not found (${ffmpegResolvedBin})`],
      metrics: {
        ffmpegBin: ffmpegResolvedBin,
        ffmpegVersion
      }
    });
    return;
  }
  if (parsed.pathname === "/test/logs/recent") {
    const limit = Number(parsed.searchParams.get("limit") || "150");
    const items = getRecentTestLogs(limit);
    sendJson(res, 200, {
      ok: true,
      scenario: "logs-recent",
      assertions: [{ name: "logs_loaded", ok: true }],
      errors: [],
      metrics: { count: items.length },
      items
    });
    return;
  }
  if (parsed.pathname === "/test/cleanup" && req.method === "POST") {
    const cleared = testHooks?.clearAllTestRooms?.() || { removedRooms: 0 };
    clearTestLogs();
    sendJson(res, 200, {
      ok: true,
      scenario: "cleanup",
      assertions: [{ name: "rooms_cleared", ok: true, details: String(cleared.removedRooms) }],
      errors: [],
      metrics: { removedRooms: cleared.removedRooms }
    });
    return;
  }
  if (parsed.pathname === "/test/room/bootstrap" && req.method === "POST") {
    if (!testHooks) {
      sendJson(res, 503, { ok: false, error: "Test hooks unavailable" });
      return;
    }
    const body = await readJsonBody(req);
    const mediaUrl = String(body?.mediaUrl || `${getMediaBaseUrl()}/test/fixtures/video/sample.mp4`).trim();
    const roomName = String(body?.roomName || "Playback Test Room").trim();
    const roomId = String(body?.roomId || "").trim();
    const hostUserId = String(body?.hostUserId || "test-host").trim();
    const result = await testHooks.testBootstrapRoom({ roomId, roomName, hostUserId, mediaUrl });
    sendJson(res, 200, {
      ok: result.ok,
      scenario: "bootstrap",
      roomId: result.roomId,
      assertions: result.assertions,
      errors: result.errors,
      metrics: { nowMs: Date.now() },
      state: toTestStateSnapshot(result.state)
    });
    return;
  }
  if (parsed.pathname === "/test/room/actions" && req.method === "POST") {
    if (!testHooks) {
      sendJson(res, 503, { ok: false, error: "Test hooks unavailable" });
      return;
    }
    const body = await readJsonBody(req);
    const roomId = String(body?.roomId || "").trim();
    const actorUserId = String(body?.actorUserId || "test-host").trim();
    const actions = Array.isArray(body?.actions) ? body.actions as Array<Record<string, unknown>> : [];
    const result = await testHooks.testApplyRoomActions({ roomId, actorUserId, actions });
    sendJson(res, 200, {
      ok: result.ok,
      scenario: "room-actions",
      assertions: result.assertions,
      errors: result.errors,
      metrics: { actionCount: actions.length },
      state: toTestStateSnapshot(result.state)
    });
    return;
  }
  const roomStateMatch = parsed.pathname.match(/^\/test\/room\/([^/]+)\/state$/i);
  if (roomStateMatch && req.method === "GET") {
    if (!testHooks) {
      sendJson(res, 503, { ok: false, error: "Test hooks unavailable" });
      return;
    }
    const roomId = decodeURIComponent(roomStateMatch[1] || "").trim();
    const state = await testHooks.testRefreshRoomState(roomId);
    sendJson(res, 200, {
      ok: !!state.roomId,
      scenario: "room-state",
      assertions: [{ name: "room_state_loaded", ok: !!state.roomId }],
      errors: state.roomId ? [] : [`Room not found: ${roomId}`],
      metrics: { nowMs: Date.now() },
      state: toTestStateSnapshot(state)
    });
    return;
  }
  const fixtureMatch = parsed.pathname.match(/^\/test\/fixtures\/video\/([^/]+)$/i);
  if (fixtureMatch && (req.method === "GET" || req.method === "HEAD")) {
    const name = sanitizePathSegment(decodeURIComponent(fixtureMatch[1] || ""));
    if (!name) {
      sendJson(res, 400, { ok: false, error: "Invalid fixture path" });
      return;
    }
    await serveFixtureVideo(name, req, res);
    return;
  }
  if (parsed.pathname.startsWith("/media/hls/")) {
    await serveHlsFile(parsed.pathname, res);
    return;
  }
  if (parsed.pathname === "/media/drive") {
    await proxyDrive(req, res, parsed.searchParams.get("url") || "");
    return;
  }
  sendJson(res, 404, { error: "Not found" });
}

async function serveHlsFile(pathname: string, res: ServerResponse): Promise<void> {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 4) {
    sendJson(res, 400, { error: "Invalid HLS path" });
    return;
  }
  const key = sanitizePathSegment(segments[2]);
  const fileName = sanitizePathSegment(segments.slice(3).join("/"));
  if (!key || !fileName) {
    sendJson(res, 400, { error: "Invalid HLS key or file name" });
    return;
  }
  const fullPath = path.join(MEDIA_HLS_DIR, key, fileName);
  if (!(await fileExists(fullPath))) {
    sendJson(res, 404, { error: "HLS file not found" });
    return;
  }
  const stat = await fs.stat(fullPath);
  const contentType = fileName.endsWith(".m3u8")
    ? "application/vnd.apple.mpegurl"
    : fileName.endsWith(".ts")
      ? "video/mp2t"
      : "application/octet-stream";

  res.statusCode = 200;
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", String(stat.size));
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "public, max-age=1800");
  const stream = createReadStream(fullPath);
  stream.pipe(res);
}

async function serveFixtureVideo(fileName: string, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const root = resolveFixturesVideoDir();
  const fullPath = path.join(root, fileName);
  if (!(await fileExists(fullPath))) {
    sendJson(res, 404, { ok: false, error: `Fixture not found: ${fileName}` });
    return;
  }
  const stat = await fs.stat(fullPath);
  const lower = fileName.toLowerCase();
  const contentType = lower.endsWith(".mp4")
    ? "video/mp4"
    : lower.endsWith(".webm")
      ? "video/webm"
      : lower.endsWith(".mkv")
        ? "video/x-matroska"
        : "application/octet-stream";
  res.statusCode = 200;
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Length", String(stat.size));
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Cache-Control", "public, max-age=120");
  if (req.method === "HEAD") {
    res.end();
    return;
  }
  createReadStream(fullPath).pipe(res);
}

function resolveFixturesVideoDir(): string {
  const cwd = process.cwd();
  const direct = path.resolve(cwd, "tests", "fixtures", "video");
  const parent = path.resolve(cwd, "..", "tests", "fixtures", "video");
  if (existsSync(direct)) {
    return direct;
  }
  return parent;
}

async function proxyDrive(req: IncomingMessage, res: ServerResponse, targetUrl: string): Promise<void> {
  if (!targetUrl) {
    sendJson(res, 400, { error: "Missing drive URL" });
    return;
  }
  try {
    const range = req.headers.range;
    const upstream = await fetch(targetUrl, {
      method: req.method === "HEAD" ? "HEAD" : "GET",
      redirect: "follow",
      headers: range ? { Range: range } : undefined
    });
    res.statusCode = upstream.status;
    copyHeader(upstream, res, "content-type");
    copyHeader(upstream, res, "content-length");
    copyHeader(upstream, res, "content-range");
    copyHeader(upstream, res, "accept-ranges");
    copyHeader(upstream, res, "content-disposition");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges, Content-Type");
    if (req.method === "HEAD" || !upstream.body) {
      res.end();
      return;
    }
    const stream = Readable.fromWeb(upstream.body as any);
    stream.pipe(res);
  } catch (error) {
    sendJson(res, 502, { error: `Drive proxy failed: ${String(error)}` });
  }
}

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  if (!chunks.length) {
    return {};
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf-8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function copyHeader(upstream: Response, res: ServerResponse, headerName: string): void {
  const value = upstream.headers.get(headerName);
  if (value) {
    res.setHeader(headerName, value);
  }
}

function sendJson(res: ServerResponse, status: number, payload: Record<string, unknown>): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(payload));
}

function toTestStateSnapshot(state: any): Record<string, unknown> {
  return {
    roomId: state.roomId || "",
    roomName: state.roomName || "",
    mediaUrl: state.mediaUrl || "",
    resolvedMediaUrl: state.resolvedMediaUrl || "",
    mediaSourceType: state.mediaSourceType || "",
    mediaPipelineStatus: state.mediaPipelineStatus || "",
    mediaPipelineMessage: state.mediaPipelineMessage || "",
    playing: !!state.playing,
    currentTimeSeconds: Number(state.currentTimeSeconds || 0),
    playbackRate: Number(state.playbackRate || 1),
    durationSeconds: Number(state.durationSeconds || 0),
    hostUserId: state.hostUserId || "",
    participantUserIds: Array.isArray(state.participantUserIds) ? state.participantUserIds : [],
    playlistUrls: Array.isArray(state.playlistUrls) ? state.playlistUrls : []
  };
}

function sanitizePathSegment(value: string): string | undefined {
  const cleaned = (value || "").trim();
  if (!cleaned || cleaned.includes("..") || cleaned.includes("\\") || cleaned.includes("\0")) {
    return undefined;
  }
  return cleaned;
}

async function cleanupOldTranscodes(): Promise<void> {
  const now = Date.now();
  for (const [key, job] of hlsJobs.entries()) {
    if (now - job.updatedAtMs < HLS_TTL_MS) {
      continue;
    }
    try {
      await fs.rm(job.outputDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
    hlsJobs.delete(key);
  }
}

async function getFfmpegVersion(): Promise<string> {
  return await new Promise<string>((resolve) => {
    const child = spawn(ffmpegResolvedBin, ["-version"], { stdio: ["ignore", "pipe", "ignore"] });
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    });
    child.on("error", () => resolve(""));
    child.on("close", () => {
      const firstLine = Buffer.concat(chunks).toString("utf-8").split("\n")[0] || "";
      resolve(firstLine.trim());
    });
  });
}
