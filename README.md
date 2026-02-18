# CineLink

CineLink is a watch party platform for synchronized playback, shared queue, host control, subtitles, and a glass-style UI (dark/light).

## Overview

This repository is a monorepo with:

- `client/`: React + Vite app
- `server/`: RootSDK service
- `networking/`: generated shared/client/server contracts

## Features

- Room create/join flow
- Shared playback sync (`play`, `pause`, `seek`, `rate`)
- Shared playlist with next/previous/history
- Media input support:
  - direct URLs (`mp4`, `webm`, `mov`, `m4v`, `mkv`)
  - Archive.org links
  - Google Drive links (proxied by server)
  - YouTube links (via Plyr provider)
- Subtitles:
  - search and load in popup
  - local upload (`.srt`, `.vtt`) per user
  - local timing offset (`-0.1`, `-1`, `+0.1`, `+1`, reset)
  - embedded track selection when browser exposes tracks
- Audio track selection (when available)
- Responsive UI for desktop/mobile

## Player stack

- Universal player UI is based on **Plyr**.
- HLS playback is supported via **hls.js** when source is `.m3u8`.
- Current default mode is **lightweight**: server-side transcode is disabled unless explicitly enabled.

## Server-side transcode mode (optional)

By default, MKV->HLS transcode is disabled.

- Default: disabled (`CINELINK_ENABLE_TRANSCODE` not set)
- Enable explicitly:

```powershell
$env:CINELINK_ENABLE_TRANSCODE='true'
```

If you enable transcode, make sure `ffmpeg` is available in `PATH` or set:

```powershell
$env:CINELINK_FFMPEG_PATH='C:\path\to\ffmpeg.exe'
```

## Requirements

- Node.js `>=22`
- npm `>=10`

## Install

```bash
npm install
```

## Run (dev)

Terminal 1 (server):

```bash
npm run server --workspace @cinelink/server
```

Terminal 2 (client):

```bash
npm run client --workspace @cinelink/client
```

## Build

Full build:

```bash
npm run build
```

Per workspace:

```bash
npm run build --workspace @cinelink/server
npm run build --workspace @cinelink/client
```

## Test commands

Generate fixtures:

```bash
npm run test:fixtures
```

Player API tests:

```bash
npm run test:player:api
```

Real links smoke test:

```bash
npm run test:player:links
```

Playwright E2E:

```bash
npm run test:player:e2e
```

All player tests:

```bash
npm run test:player
```

## Ports

- `8080` ClientMessage WS
- `8082` ClientUpdate WS
- `8081` OutOfBandServices
- `8090` DevAppHostService
- `8099` Media HTTP (proxy/pipeline endpoints)

If you get `EADDRINUSE`, kill old listeners.

PowerShell helper:

```powershell
$ports = 8080,8082,8081,8090,8099
$pids = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $ports -contains $_.LocalPort } |
  Select-Object -ExpandProperty OwningProcess -Unique
if ($pids) { $pids | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
```

## Notes

- Browser codec support varies by platform/browser.
- Some MKV files can play directly in one browser and fail in another.
- Drive links must be publicly accessible to be playable.
