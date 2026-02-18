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
  assignedWorkerUserId?: string;
  videoMapSpecifier?: string;
  audioMapSpecifier?: string;
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
const FFPROBE_BIN = (process.env.CINELINK_FFPROBE_PATH || "").trim();
const TRANSCODE_ENABLED = String(process.env.CINELINK_ENABLE_TRANSCODE || "").trim().toLowerCase() === "true";
const MEDIA_RUNTIME_DIR = path.resolve(process.cwd(), ".cinelink-media");
const MEDIA_HLS_DIR = path.join(MEDIA_RUNTIME_DIR, "hls");
const HLS_TTL_MS = 1000 * 60 * 60 * 6;
const CLEANUP_INTERVAL_MS = 1000 * 60 * 20;
const FAILED_RETRY_AFTER_MS = 1000 * 60 * 2;

const hlsJobs = new Map<string, HlsJobStatus>();
const workerBusyCount = new Map<string, number>();
const driveProbeCache = new Map<string, { kind: "mkv" | "unknown"; ts: number }>();
const DRIVE_PROBE_TTL_MS = 1000 * 60 * 5;
let mediaServerStarted = false;
let cleanupTimer: NodeJS.Timeout | null = null;
let ffmpegAvailableCache: boolean | null = null;
let ffmpegResolvedBin = FFMPEG_BIN;
let ffprobeResolvedBin = FFPROBE_BIN || "ffprobe";
let testHooks: TestHooks | null = null;

function logInfo(action: string, payload?: Record<string, unknown>): void {
  if (payload) {
    console.log(`[CineLink][${action}]`, payload);
    return;
  }
  console.log(`[CineLink][${action}]`);
}

function logError(action: string, payload?: Record<string, unknown>): void {
  if (payload) {
    console.error(`\x1b[31m[CineLink][${action}]\x1b[0m`, payload);
    return;
  }
  console.error(`\x1b[31m[CineLink][${action}]\x1b[0m`);
}

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
    logInfo("media-http", { listening: `http://localhost:${MEDIA_HTTP_PORT}` });
    addTestLog("test:server:ready", { baseUrl: getMediaBaseUrl() });
  });
  cleanupTimer = setInterval(() => {
    void cleanupOldTranscodes();
  }, CLEANUP_INTERVAL_MS);
}

export async function resolvePlaybackSource(mediaUrl: string): Promise<MediaResolveResult> {
  const sourceUrl = (mediaUrl || "").trim();
  const resolved = await resolvePlaybackSourceInternal(sourceUrl);
  if (!sourceUrl) {
    addTestLog("media:resolve:error", { reason: "empty_media_url" });
    return resolved;
  }
  if (resolved.sourceType === "hls") {
    addTestLog("media:resolve:start", { sourceType: "mkv", mediaUrl: sourceUrl });
  } else {
    addTestLog("media:resolve:ok", { sourceType: resolved.sourceType, mediaUrl: sourceUrl });
  }
  return resolved;
}

type PrewarmOptions = {
  roomId?: string;
  hostUserId?: string;
  participantUserIds?: string[];
};

export async function prewarmTranscodes(urls: string[], options?: PrewarmOptions): Promise<void> {
  if (!TRANSCODE_ENABLED) {
    return;
  }
  const uniqueUrls = Array.from(new Set((urls || []).map((value) => (value || "").trim()).filter(Boolean)));
  if (!uniqueUrls.length) {
    return;
  }
  const participants = Array.from(new Set((options?.participantUserIds || []).filter(Boolean)));
  const orderedWorkers = [
    ...(options?.hostUserId ? [options.hostUserId] : []),
    ...participants.filter((id) => id !== options?.hostUserId)
  ];

  addTestLog("media:prewarm:start", {
    roomId: options?.roomId || "",
    count: uniqueUrls.length,
    workers: orderedWorkers
  });

  for (const mediaUrl of uniqueUrls) {
    if (!isLikelyMkvUrl(mediaUrl)) {
      continue;
    }
    const assignedWorkerUserId = selectWorkerForJob(orderedWorkers);
    if (assignedWorkerUserId) {
      bumpWorkerBusy(assignedWorkerUserId, +1);
    }
    addTestLog("media:prewarm:queued", {
      roomId: options?.roomId || "",
      mediaUrl,
      assignedWorkerUserId: assignedWorkerUserId || ""
    });
    void resolvePlaybackSourceInternal(mediaUrl, { assignedWorkerUserId }).finally(() => {
      if (assignedWorkerUserId) {
        bumpWorkerBusy(assignedWorkerUserId, -1);
      }
    });
  }
}

export async function releaseTranscodesForUrls(urls: string[], reason = "manual-release"): Promise<void> {
  if (!TRANSCODE_ENABLED) {
    return;
  }
  const uniqueUrls = Array.from(new Set((urls || []).map((value) => (value || "").trim()).filter(Boolean)));
  for (const mediaUrl of uniqueUrls) {
    if (!isLikelyMkvUrl(mediaUrl)) {
      continue;
    }
    const key = buildHlsKey(mediaUrl);
    const job = hlsJobs.get(key);
    try {
      if (job?.outputDir) {
        await fs.rm(job.outputDir, { recursive: true, force: true });
      } else {
        const fallbackOutputDir = path.join(MEDIA_HLS_DIR, key);
        await fs.rm(fallbackOutputDir, { recursive: true, force: true });
      }
    } catch {
      // ignore cleanup errors
    }
    hlsJobs.delete(key);
    addTestLog("media:transcode:released", { key, mediaUrl, reason });
  }
}

function selectWorkerForJob(orderedWorkers: string[]): string | undefined {
  if (!orderedWorkers.length) {
    return undefined;
  }
  for (const userId of orderedWorkers) {
    const busy = workerBusyCount.get(userId) || 0;
    if (busy <= 0) {
      return userId;
    }
  }
  return orderedWorkers[0];
}

function bumpWorkerBusy(userId: string, delta: number): void {
  const next = Math.max(0, (workerBusyCount.get(userId) || 0) + delta);
  if (next <= 0) {
    workerBusyCount.delete(userId);
    return;
  }
  workerBusyCount.set(userId, next);
}

function buildHlsKey(inputUrl: string): string {
  return createHash("sha1").update(inputUrl).digest("hex").slice(0, 20);
}

async function resolvePlaybackSourceInternal(
  mediaUrl: string,
  options?: { assignedWorkerUserId?: string }
): Promise<MediaResolveResult> {
  const sourceUrl = (mediaUrl || "").trim();
  if (!sourceUrl) {
    return {
      sourceType: "unsupported",
      resolvedUrl: "",
      pipelineStatus: "failed",
      pipelineMessage: "Empty media URL."
    };
  }
  if (getYouTubeVideoId(sourceUrl)) {
    return {
      sourceType: "youtube",
      resolvedUrl: sourceUrl,
      pipelineStatus: "ready",
      pipelineMessage: ""
    };
  }
  if (isHlsManifestUrl(sourceUrl)) {
    return {
      sourceType: "hls",
      resolvedUrl: sourceUrl,
      pipelineStatus: "ready",
      pipelineMessage: ""
    };
  }
  if (isGoogleDriveUrl(sourceUrl)) {
    const proxyUrl = `${getMediaBaseUrl()}/media/drive?url=${encodeURIComponent(sourceUrl)}`;
    if (!TRANSCODE_ENABLED) {
      addTestLog("media:resolve:transcode-disabled", { sourceType: "drive", mediaUrl: sourceUrl });
      return {
        sourceType: "drive",
        resolvedUrl: proxyUrl,
        pipelineStatus: "ready",
        pipelineMessage: ""
      };
    }
    const driveKind = await detectDriveContainerKind(sourceUrl);
    if (driveKind === "mkv") {
      addTestLog("media:drive:detected-mkv", { mediaUrl: sourceUrl, proxyUrl });
      return ensureHlsFromMkv(proxyUrl, options);
    }
    return {
      sourceType: "drive",
      resolvedUrl: proxyUrl,
      pipelineStatus: "ready",
      pipelineMessage: ""
    };
  }
  if (isLikelyMkvUrl(sourceUrl)) {
    if (!TRANSCODE_ENABLED) {
      addTestLog("media:resolve:transcode-disabled", { sourceType: "mkv", mediaUrl: sourceUrl });
      return {
        sourceType: "html5",
        resolvedUrl: sourceUrl,
        pipelineStatus: "ready",
        pipelineMessage: ""
      };
    }
    return ensureHlsFromMkv(sourceUrl, options);
  }
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

async function ensureHlsFromMkv(
  inputUrl: string,
  options?: { assignedWorkerUserId?: string }
): Promise<MediaResolveResult> {
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

  const key = buildHlsKey(inputUrl);
  const outputDir = path.join(MEDIA_HLS_DIR, key);
  const manifestPath = path.join(outputDir, "master.m3u8");
  const manifestUrl = `${getMediaBaseUrl()}/media/hls/${encodeURIComponent(key)}/master.m3u8`;

  const existing = hlsJobs.get(key);
  if (existing?.status === "ready") {
    const validCached = await verifyHlsOutputHasVideo(outputDir);
    if (validCached === true) {
      addTestLog("media:transcode:cache-hit", { key });
      return {
        sourceType: "hls",
        resolvedUrl: manifestUrl,
        pipelineStatus: "ready",
        pipelineMessage: existing.message
      };
    }
    hlsJobs.delete(key);
    await fs.rm(outputDir, { recursive: true, force: true });
    addTestLog("media:transcode:cache-invalid", { key, reason: "audio_only_or_unreadable" });
    logError("media:transcode:cache-invalid", { key, reason: "audio_only_or_unreadable" });
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
    const validCached = await verifyHlsOutputHasVideo(outputDir);
    if (validCached === true) {
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
    await fs.rm(outputDir, { recursive: true, force: true });
    addTestLog("media:transcode:cache-invalid", { key, reason: "manifest_without_video" });
    logError("media:transcode:cache-invalid", { key, reason: "manifest_without_video" });
  }

  const job: HlsJobStatus = {
    key,
    inputUrl,
    status: "pending",
    message: "Preparing HLS stream...",
    outputDir,
    updatedAtMs: Date.now(),
    assignedWorkerUserId: options?.assignedWorkerUserId
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
  const streamMaps = await probePreferredStreamMaps(job.inputUrl);
  if (streamMaps.videoMapSpecifier) {
    job.videoMapSpecifier = streamMaps.videoMapSpecifier;
  }
  if (streamMaps.audioMapSpecifier) {
    job.audioMapSpecifier = streamMaps.audioMapSpecifier;
  }
  const hasVideo = await probeInputHasVideo(job.inputUrl);
  if (hasVideo === false) {
    job.status = "failed";
    job.message = "Input has no decodable video stream for HLS transcode.";
    job.updatedAtMs = Date.now();
    addTestLog("media:transcode:failed", { key: job.key, reason: "no_video_stream" });
    console.log("[CineLink][media:transcode:failed]", { key: job.key, reason: "no_video_stream" });
    return;
  }
  const inputDurationSeconds = await probeInputDurationSeconds(job.inputUrl);
  const inputVideoHeight = await probeInputVideoHeight(job.inputUrl);
  const profileHeights = buildProgressiveHeights(inputVideoHeight);
  const readyHeights: number[] = [];

  logInfo("media:transcode:start", {
    key: job.key,
    inputUrl: job.inputUrl,
    profileHeights,
    assignedWorkerUserId: job.assignedWorkerUserId || ""
  });
  addTestLog("media:transcode:start", {
    key: job.key,
    inputUrl: job.inputUrl,
    profileHeights,
    assignedWorkerUserId: job.assignedWorkerUserId || ""
  });

  for (let i = 0; i < profileHeights.length; i += 1) {
    const height = profileHeights[i];
    const stageName = `${height}p`;
    job.message = i === 0
      ? `Preparing HLS stream (${stageName})...`
      : `Improving quality (${stageName})...`;
    job.updatedAtMs = Date.now();

    const variantResult = await transcodeHlsVariant(job, height, inputDurationSeconds, stageName);
    if (!variantResult.ok) {
      job.status = "failed";
      job.message = variantResult.message || "HLS transcode failed.";
      job.updatedAtMs = Date.now();
      logError("media:transcode:failed", { key: job.key, stage: stageName, reason: job.message });
      addTestLog("media:transcode:failed", { key: job.key, stage: stageName, reason: job.message });
      return;
    }

    readyHeights.push(height);
    await writeMasterManifest(job.outputDir, readyHeights);
    const outputHasVideo = await verifyHlsOutputHasVideo(job.outputDir);
    if (outputHasVideo !== true) {
      job.status = "failed";
      job.message = "Transcode produced HLS without a decodable video stream.";
      job.updatedAtMs = Date.now();
      logError("media:transcode:failed", { key: job.key, reason: "audio_only_output", stage: stageName });
      addTestLog("media:transcode:failed", { key: job.key, reason: "audio_only_output", stage: stageName });
      return;
    }

    job.status = "ready";
    job.updatedAtMs = Date.now();
    if (i === 0) {
      job.message = `Playing at ${height}p. Improving quality in background...`;
      addTestLog("media:transcode:first-ready", { key: job.key, height });
      logInfo("media:transcode:first-ready", { key: job.key, height });
    } else if (i < profileHeights.length - 1) {
      job.message = `Quality updated: ${height}p. Preparing next...`;
      addTestLog("media:transcode:quality-updated", { key: job.key, height });
      logInfo("media:transcode:quality-updated", { key: job.key, height });
    } else {
      job.message = "";
      addTestLog("media:transcode:ready", { key: job.key, manifest: path.join(job.outputDir, "master.m3u8"), height });
      logInfo("media:transcode:ready", { key: job.key, manifest: path.join(job.outputDir, "master.m3u8"), height });
    }
  }
}

function extractFfmpegEncodedTimeSeconds(stderrChunk: string): number | null {
  const match = stderrChunk.match(/time=(\d{2}):(\d{2}):(\d{2}(?:\.\d+)?)/);
  if (!match) {
    return null;
  }
  const hh = Number(match[1] || "0");
  const mm = Number(match[2] || "0");
  const ss = Number(match[3] || "0");
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || !Number.isFinite(ss)) {
    return null;
  }
  return hh * 3600 + mm * 60 + ss;
}

function buildProgressiveHeights(inputVideoHeight: number | null): number[] {
  const ordered = [480, 720, 1080];
  if (!inputVideoHeight || inputVideoHeight <= 0) {
    return ordered;
  }
  const filtered = ordered.filter((h) => h <= inputVideoHeight);
  if (!filtered.length) {
    return [Math.max(240, inputVideoHeight)];
  }
  return filtered;
}

function getVariantName(height: number): string {
  return `${height}p`;
}

function getVariantPlaylistPath(outputDir: string, height: number): string {
  return path.join(outputDir, `${getVariantName(height)}.m3u8`);
}

function getVariantSegmentPattern(outputDir: string, height: number): string {
  return path.join(outputDir, `${getVariantName(height)}_%05d.ts`);
}

function estimateVariantBandwidth(height: number): number {
  if (height >= 1080) {
    return 5_800_000;
  }
  if (height >= 720) {
    return 3_000_000;
  }
  return 1_400_000;
}

async function writeMasterManifest(outputDir: string, readyHeights: number[]): Promise<void> {
  const sorted = [...readyHeights].sort((a, b) => a - b);
  const lines: string[] = ["#EXTM3U", "#EXT-X-VERSION:3"];
  for (const height of sorted) {
    const width = Math.max(2, Math.round((height * 16) / 9 / 2) * 2);
    lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=${estimateVariantBandwidth(height)},RESOLUTION=${width}x${height}`);
    lines.push(`${getVariantName(height)}.m3u8`);
  }
  lines.push("");
  await fs.writeFile(path.join(outputDir, "master.m3u8"), lines.join("\n"), "utf-8");
}

async function transcodeHlsVariant(
  job: HlsJobStatus,
  height: number,
  inputDurationSeconds: number | null,
  stageName: string
): Promise<{ ok: boolean; message?: string }> {
  const variantPlaylistPath = getVariantPlaylistPath(job.outputDir, height);
  const baseArgs = [
    "-hide_banner",
    "-y",
    "-i",
    job.inputUrl
  ];
  const mapVideo = job.videoMapSpecifier || "0:v:0?";
  const mapAudio = job.audioMapSpecifier || "0:a:0?";
  const transcodeCore = [
    "-map",
    mapVideo,
    "-map",
    mapAudio,
    "-sn",
    "-dn",
    "-vf",
    `scale=-2:${height},format=yuv420p`,
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "22",
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
    getVariantSegmentPattern(job.outputDir, height),
    variantPlaylistPath
  ];
  const args = [...baseArgs, ...transcodeCore];
  const runFfmpeg = (ffArgs: string[]) => new Promise<{ ok: boolean; message?: string }>((resolve) => {
    const child = spawn(ffmpegResolvedBin, ffArgs, { stdio: ["ignore", "ignore", "pipe"] });
    let stderrTail = "";
    let lastProgressBucket = -1;
    child.stderr.on("data", (chunk) => {
      const text = String(chunk || "");
      if (text) {
        stderrTail = `${stderrTail}\n${text}`.slice(-4000);
      }
      const encodedAt = extractFfmpegEncodedTimeSeconds(text);
      if (encodedAt !== null) {
        job.updatedAtMs = Date.now();
        if (inputDurationSeconds && inputDurationSeconds > 0) {
          const pct = Math.max(0, Math.min(99, Math.floor((encodedAt / inputDurationSeconds) * 100)));
          job.message = `Preparing HLS stream (${stageName})... ${pct}%`;
          const bucket = Math.floor(pct / 5);
          if (bucket > lastProgressBucket) {
            lastProgressBucket = bucket;
            addTestLog("media:transcode:progress", { key: job.key, stage: stageName, percent: pct });
          }
        }
      }
    });
    child.on("error", (error) => {
      resolve({ ok: false, message: `Transcode spawn failed: ${String(error)}` });
    });
    child.on("close", async (code) => {
      if (code !== 0) {
        const compact = stderrTail
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(-12)
          .join(" | ");
        resolve({
          ok: false,
          message: compact ? `ffmpeg exited with code ${code}: ${compact}` : `ffmpeg exited with code ${code}`
        });
        return;
      }
      const exists = await fileExists(variantPlaylistPath);
      resolve(exists ? { ok: true } : { ok: false, message: `Missing variant playlist (${stageName}).` });
    });
  });
  let result = await runFfmpeg(args);
  if (!result.ok) {
    const retryArgs = [
      ...baseArgs,
      "-map",
      mapVideo,
      "-sn",
      "-dn",
      "-an",
      "-vf",
      `scale=-2:${height},format=yuv420p`,
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "22",
      "-f",
      "hls",
      "-hls_time",
      "6",
      "-hls_playlist_type",
      "vod",
      "-hls_segment_filename",
      getVariantSegmentPattern(job.outputDir, height),
      variantPlaylistPath
    ];
    addTestLog("media:transcode:retry-video-only", { key: job.key, stage: stageName, height, mapVideo });
    result = await runFfmpeg(retryArgs);
  }
  return result;
}

async function verifyHlsOutputHasVideo(outputDir: string): Promise<boolean | null> {
  const manifestPath = path.join(outputDir, "master.m3u8");
  if (!(await fileExists(manifestPath))) {
    return false;
  }
  try {
    const firstSegmentPath = await resolveFirstSegmentPathFromManifest(manifestPath, outputDir, 2);
    if (!firstSegmentPath) {
      return false;
    }
    return await probeInputHasVideo(firstSegmentPath);
  } catch {
    return null;
  }
}

async function resolveFirstSegmentPathFromManifest(
  manifestPath: string,
  baseDir: string,
  depth: number
): Promise<string | null> {
  if (depth < 0) {
    return null;
  }
  const text = await fs.readFile(manifestPath, "utf-8");
  const firstEntry = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => !!line && !line.startsWith("#"));
  if (!firstEntry) {
    return null;
  }
  const candidate = path.join(baseDir, firstEntry);
  if (candidate.toLowerCase().endsWith(".m3u8")) {
    return await resolveFirstSegmentPathFromManifest(candidate, path.dirname(candidate), depth - 1);
  }
  return candidate;
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
  ffprobeResolvedBin = resolveFfprobeExecutablePath(ffmpegResolvedBin);
  ffmpegAvailableCache = await new Promise<boolean>((resolve) => {
    const child = spawn(ffmpegResolvedBin, ["-version"], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("close", (code) => resolve(code === 0));
  });
  if (!ffmpegAvailableCache) {
    logError("media:ffmpeg:missing", { ffmpeg: ffmpegResolvedBin });
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
      logInfo("media:ffmpeg:autodetected", { ffmpeg: picked });
      return picked;
    }
  } catch {
    // ignore scan errors
  }
  return FFMPEG_BIN;
}

function resolveFfprobeExecutablePath(ffmpegPath: string): string {
  if (FFPROBE_BIN) {
    return FFPROBE_BIN;
  }
  const lower = ffmpegPath.toLowerCase();
  if (lower.endsWith("ffmpeg.exe")) {
    return `${ffmpegPath.slice(0, -10)}ffprobe.exe`;
  }
  if (lower.endsWith("ffmpeg")) {
    return `${ffmpegPath.slice(0, -6)}ffprobe`;
  }
  return "ffprobe";
}

async function probeInputHasVideo(inputUrl: string): Promise<boolean | null> {
  return await new Promise<boolean | null>((resolve) => {
    const args = ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=index", "-of", "csv=p=0", inputUrl];
    const child = spawn(ffprobeResolvedBin, args, { stdio: ["ignore", "pipe", "ignore"] });
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    });
    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      if (code !== 0) {
        resolve(null);
        return;
      }
      const out = Buffer.concat(chunks).toString("utf-8").trim();
      resolve(!!out);
    });
  });
}

async function probeInputDurationSeconds(inputUrl: string): Promise<number | null> {
  return await new Promise<number | null>((resolve) => {
    const args = ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", inputUrl];
    const child = spawn(ffprobeResolvedBin, args, { stdio: ["ignore", "pipe", "ignore"] });
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    });
    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      if (code !== 0) {
        resolve(null);
        return;
      }
      const out = Buffer.concat(chunks).toString("utf-8").trim();
      const value = Number(out);
      resolve(Number.isFinite(value) && value > 0 ? value : null);
    });
  });
}

async function probeInputVideoHeight(inputUrl: string): Promise<number | null> {
  return await new Promise<number | null>((resolve) => {
    const args = ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=height", "-of", "csv=p=0", inputUrl];
    const child = spawn(ffprobeResolvedBin, args, { stdio: ["ignore", "pipe", "ignore"] });
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    });
    child.on("error", () => resolve(null));
    child.on("close", (code) => {
      if (code !== 0) {
        resolve(null);
        return;
      }
      const out = Buffer.concat(chunks).toString("utf-8").trim();
      const value = Number(out);
      resolve(Number.isFinite(value) && value > 0 ? value : null);
    });
  });
}

async function probePreferredStreamMaps(inputUrl: string): Promise<{ videoMapSpecifier?: string; audioMapSpecifier?: string }> {
  return await new Promise<{ videoMapSpecifier?: string; audioMapSpecifier?: string }>((resolve) => {
    const args = ["-v", "error", "-show_streams", "-of", "json", inputUrl];
    const child = spawn(ffprobeResolvedBin, args, { stdio: ["ignore", "pipe", "ignore"] });
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    });
    child.on("error", () => resolve({}));
    child.on("close", (code) => {
      if (code !== 0) {
        resolve({});
        return;
      }
      try {
        const json = JSON.parse(Buffer.concat(chunks).toString("utf-8")) as {
          streams?: Array<{ codec_type?: string; index?: number; disposition?: { attached_pic?: number } }>;
        };
        const streams = Array.isArray(json.streams) ? json.streams : [];
        const videoStream = streams.find((s) => s.codec_type === "video" && Number(s.disposition?.attached_pic || 0) !== 1);
        const audioStream = streams.find((s) => s.codec_type === "audio");
        const out: { videoMapSpecifier?: string; audioMapSpecifier?: string } = {};
        if (Number.isInteger(videoStream?.index)) {
          out.videoMapSpecifier = `0:${Number(videoStream!.index)}`;
        }
        if (Number.isInteger(audioStream?.index)) {
          out.audioMapSpecifier = `0:${Number(audioStream!.index)}?`;
        }
        resolve(out);
      } catch {
        resolve({});
      }
    });
  });
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
    const method = req.method === "HEAD" ? "HEAD" : "GET";
    const upstream = await fetchBestDriveResponse(targetUrl, method, range);
    if (!upstream) {
      addTestLog("media:drive:proxy:failed", { targetUrl, reason: "no_binary_response" });
      sendJson(res, 415, {
        error: "Google Drive did not return a direct media response (binary stream).",
        details: { targetUrl }
      });
      return;
    }
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

async function fetchBestDriveResponse(targetUrl: string, method: "GET" | "HEAD", rangeHeader?: string): Promise<Response | null> {
  const tried: Array<{ url: string; status: number; contentType: string }> = [];
  const queue = buildDriveCandidateUrls(targetUrl);
  const seen = new Set<string>();
  const maxAttempts = 18;

  for (let attempts = 0; queue.length && attempts < maxAttempts; attempts += 1) {
    const candidate = queue.shift()!;
    if (!candidate || seen.has(candidate)) {
      continue;
    }
    seen.add(candidate);

    try {
      // For HEAD probes, prefer a lightweight GET so we can parse Drive HTML confirm pages.
      const effectiveMethod: "GET" | "HEAD" = method === "HEAD" ? "GET" : method;
      const headers: Record<string, string> = {};
      if (rangeHeader) {
        headers.Range = rangeHeader;
      } else if (effectiveMethod === "GET" && method === "HEAD") {
        headers.Range = "bytes=0-0";
      }
      const response = await fetch(candidate, {
        method: effectiveMethod,
        redirect: "follow",
        headers: Object.keys(headers).length ? headers : undefined
      });
      const finalUrl = response.url || candidate;
      const contentType = (response.headers.get("content-type") || "").toLowerCase();
      tried.push({ url: finalUrl, status: response.status, contentType });

      const htmlInterstitial = contentType.includes("text/html");
      if (response.ok && !htmlInterstitial) {
        addTestLog("media:drive:proxy:selected", {
          url: finalUrl,
          status: response.status,
          contentType,
          attempts: attempts + 1
        });
        return response;
      }

      if (response.ok && htmlInterstitial && effectiveMethod === "GET") {
        const htmlBody = await response.text();
        const followUps = extractDriveFollowUpUrls(finalUrl, htmlBody);
        if (followUps.length) {
          addTestLog("media:drive:proxy:html-followups", {
            url: finalUrl,
            count: followUps.length
          });
          for (const next of followUps) {
            if (!seen.has(next)) {
              queue.push(next);
            }
          }
        }
      }
    } catch {
      // try next candidate
    }
  }
  addTestLog("media:drive:proxy:attempts", { targetUrl, tried });
  return null;
}

function buildDriveCandidateUrls(urlValue: string): string[] {
  const out: string[] = [];
  const raw = (urlValue || "").trim();
  if (raw) {
    out.push(raw);
  }
  const fileId = extractDriveFileId(raw);
  if (!fileId) {
    return uniqueStrings(out);
  }
  const uc = new URL("https://drive.google.com/uc");
  uc.searchParams.set("export", "download");
  uc.searchParams.set("confirm", "t");
  uc.searchParams.set("id", fileId);
  out.push(uc.toString());
  const userContent = new URL("https://drive.usercontent.google.com/download");
  userContent.searchParams.set("export", "download");
  userContent.searchParams.set("confirm", "t");
  userContent.searchParams.set("id", fileId);
  out.push(userContent.toString());
  return uniqueStrings(out);
}

function extractDriveFollowUpUrls(baseUrl: string, htmlBody: string): string[] {
  const out: string[] = [];
  const decoded = decodeHtmlEntities(htmlBody || "");
  const base = safeUrl(baseUrl);

  const formAction = decoded.match(/<form[^>]*id=["']download-form["'][^>]*action=["']([^"']+)["']/i)?.[1] || "";
  if (formAction) {
    const actionUrl = toAbsoluteUrl(base, formAction);
    if (actionUrl) {
      try {
        const follow = new URL(actionUrl);
        const hiddenInputs = [...decoded.matchAll(/<input[^>]*type=["']hidden["'][^>]*name=["']([^"']+)["'][^>]*value=["']([^"']*)["']/gi)];
        for (const match of hiddenInputs) {
          const key = (match[1] || "").trim();
          const value = (match[2] || "").trim();
          if (key) {
            follow.searchParams.set(key, value);
          }
        }
        out.push(follow.toString());
      } catch {
        // ignore invalid form action
      }
    }
  }

  const hrefRegex = /href=(["'])(.*?)\1/gi;
  let hrefMatch: RegExpExecArray | null = null;
  while ((hrefMatch = hrefRegex.exec(decoded)) !== null) {
    const href = (hrefMatch[2] || "").trim();
    if (!href) {
      continue;
    }
    if (!/confirm=|export=download|\/uc\?|drive\.usercontent\.google\.com\/download/i.test(href)) {
      continue;
    }
    const normalized = toAbsoluteUrl(base, href);
    if (normalized) {
      out.push(normalized);
    }
  }

  const escapedUrlRegex = /https?:\\\/\\\/[^"']+/gi;
  const directUrlRegex = /https?:\/\/[^"'\s<]+/gi;
  const urlMatches = [decoded.match(escapedUrlRegex) || [], decoded.match(directUrlRegex) || []];
  for (const group of urlMatches) {
    for (const raw of group) {
      const unescaped = raw.replace(/\\\//g, "/");
      if (!/confirm=|export=download|drive\.usercontent\.google\.com\/download/i.test(unescaped)) {
        continue;
      }
      const normalized = toAbsoluteUrl(base, unescaped);
      if (normalized) {
        out.push(normalized);
      }
    }
  }

  return uniqueStrings(out);
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&#x3d;/gi, "=")
    .replace(/&#61;/g, "=")
    .replace(/&#x26;/gi, "&")
    .replace(/&#38;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function safeUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function toAbsoluteUrl(base: URL | null, value: string): string | undefined {
  try {
    if (/^https?:\/\//i.test(value)) {
      return new URL(value).toString();
    }
    if (value.startsWith("//")) {
      return `https:${value}`;
    }
    if (!base) {
      return undefined;
    }
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
}

function extractDriveFileId(urlValue: string): string | undefined {
  try {
    const parsed = new URL(urlValue);
    const fromQuery = (parsed.searchParams.get("id") || "").trim();
    if (fromQuery) {
      return fromQuery;
    }
    const fromPath = parsed.pathname.match(/\/file\/d\/([^/]+)/i)?.[1] || "";
    return fromPath.trim() || undefined;
  } catch {
    return undefined;
  }
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => !!value)));
}

async function detectDriveContainerKind(urlValue: string): Promise<"mkv" | "unknown"> {
  const key = (urlValue || "").trim();
  if (!key) {
    return "unknown";
  }
  const cached = driveProbeCache.get(key);
  if (cached && (Date.now() - cached.ts) < DRIVE_PROBE_TTL_MS) {
    return cached.kind;
  }
  try {
    const response = await fetchBestDriveResponse(key, "GET", "bytes=0-4095");
    if (!response?.ok) {
      driveProbeCache.set(key, { kind: "unknown", ts: Date.now() });
      return "unknown";
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    // Matroska/WEBM EBML header
    const isMkv = bytes.length >= 4
      && bytes[0] === 0x1a
      && bytes[1] === 0x45
      && bytes[2] === 0xdf
      && bytes[3] === 0xa3;
    const kind: "mkv" | "unknown" = isMkv ? "mkv" : "unknown";
    driveProbeCache.set(key, { kind, ts: Date.now() });
    return kind;
  } catch {
    driveProbeCache.set(key, { kind: "unknown", ts: Date.now() });
    return "unknown";
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
