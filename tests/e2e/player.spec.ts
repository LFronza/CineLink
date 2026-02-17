import { expect, test } from "@playwright/test";

const testApiBase = process.env.CINELINK_TEST_BASE_URL || "http://localhost:8099";

test("playback controls with Plyr engine", async ({ page, request }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  const bootstrap = await request.post(`${testApiBase}/test/room/bootstrap`, {
    data: {
      roomName: "E2E Room",
      mediaUrl: `${testApiBase}/test/fixtures/video/sample.mp4`
    }
  });
  expect(bootstrap.ok()).toBeTruthy();
  const bootBody = await bootstrap.json();
  expect(bootBody.ok).toBeTruthy();
  const roomId = String(bootBody.roomId || "");
  expect(roomId.length).toBeGreaterThan(0);
  const roomName = String(bootBody?.state?.roomName || "E2E Room");

  await page.goto("/");
  await page.waitForSelector("text=Lobby", { timeout: 30_000 });
  await page.getByText(roomName, { exact: false }).first().click();
  await page.waitForSelector("text=Now Playing:", { timeout: 30_000 });

  const video = page.locator("video").first();
  await expect(video).toBeVisible();

  await page.evaluate(() => {
    const v = document.querySelector("video") as HTMLVideoElement | null;
    if (v) {
      void v.play();
    }
  });
  await page.waitForTimeout(1800);
  const t1 = await page.evaluate(() => {
    const v = document.querySelector("video") as HTMLVideoElement | null;
    return v ? Number(v.currentTime || 0) : 0;
  });
  expect(t1).toBeGreaterThan(0.3);

  await page.evaluate(() => {
    const v = document.querySelector("video") as HTMLVideoElement | null;
    if (v) {
      v.pause();
    }
  });
  const pausedAt = await page.evaluate(() => {
    const v = document.querySelector("video") as HTMLVideoElement | null;
    return v ? Number(v.currentTime || 0) : 0;
  });
  await page.waitForTimeout(1200);
  const pausedAtLater = await page.evaluate(() => {
    const v = document.querySelector("video") as HTMLVideoElement | null;
    return v ? Number(v.currentTime || 0) : 0;
  });
  expect(Math.abs(pausedAtLater - pausedAt)).toBeLessThan(1.0);

  await page.evaluate(() => {
    const v = document.querySelector("video") as HTMLVideoElement | null;
    if (v) {
      v.currentTime = 2;
    }
  });
  const seeked = await page.evaluate(() => {
    const v = document.querySelector("video") as HTMLVideoElement | null;
    return v ? Number(v.currentTime || 0) : 0;
  });
  expect(seeked).toBeGreaterThan(1.5);

  const act = await request.post(`${testApiBase}/test/room/actions`, {
    data: {
      roomId,
      actions: [
        { type: "addQueueLast", url: `${testApiBase}/test/fixtures/video/sample2.mp4` },
        { type: "advanceQueue", autoplay: false }
      ]
    }
  });
  expect(act.ok()).toBeTruthy();
  await page.waitForTimeout(1600);
  await expect(page.getByText(/Now Playing:/)).toBeVisible();

  const fatalErrors = consoleErrors.filter((line) =>
    /(media:error|hls.*fatal|plyr initialization failed)/i.test(line)
  );
  expect(fatalErrors, fatalErrors.join("\n")).toHaveLength(0);
});
