import { spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "tests", "fixtures", "video");
mkdirSync(outDir, { recursive: true });

const ffmpeg = process.env.CINELINK_FFMPEG_PATH || "ffmpeg";

function run(args) {
  const result = spawnSync(ffmpeg, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`ffmpeg failed (${result.status})`);
  }
}

function ensure(name, args) {
  const target = path.join(outDir, name);
  if (existsSync(target)) {
    return;
  }
  run(args(target));
}

ensure("sample.mp4", (target) => [
  "-y",
  "-f", "lavfi", "-i", "testsrc=size=640x360:rate=30",
  "-f", "lavfi", "-i", "sine=frequency=1000:sample_rate=48000",
  "-t", "8",
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-movflags", "+faststart",
  target
]);

ensure("sample2.mp4", (target) => [
  "-y",
  "-f", "lavfi", "-i", "smptebars=size=640x360:rate=30",
  "-f", "lavfi", "-i", "sine=frequency=650:sample_rate=48000",
  "-t", "8",
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  "-movflags", "+faststart",
  target
]);

ensure("sample.webm", (target) => [
  "-y",
  "-f", "lavfi", "-i", "testsrc=size=640x360:rate=30",
  "-f", "lavfi", "-i", "sine=frequency=840:sample_rate=48000",
  "-t", "8",
  "-c:v", "libvpx-vp9",
  "-b:v", "900k",
  "-c:a", "libopus",
  target
]);

ensure("sample.mkv", (target) => [
  "-y",
  "-f", "lavfi", "-i", "testsrc=size=640x360:rate=30",
  "-f", "lavfi", "-i", "sine=frequency=420:sample_rate=48000",
  "-t", "8",
  "-c:v", "libx264",
  "-pix_fmt", "yuv420p",
  "-c:a", "aac",
  target
]);

console.log("[fixtures] ready at", outDir);

