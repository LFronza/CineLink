# CineLink

Plataforma de watch party para assistir em sala com sincronização de playback, playlist compartilhada, controle de host, subtítulos e interface glass (dark/light).

![CineLink Hero](docs/images/cinelink-hero.png)

![CineLink Logo](docs/images/cinelink-logo-glow.png)

## Visao geral

O CineLink permite criar salas, entrar por link/codigo, compartilhar midias e assistir junto em tempo real.  
O projeto esta organizado como monorepo com `client`, `server` e contratos gerados em `networking`.

## Principais recursos

- Salas com criacao/entrada rapida
- Sincronizacao de `play/pause/seek/rate` entre participantes
- Playlist compartilhada com avancar/anterior e historico
- Integracao com:
  - links diretos (`mp4/webm/mov/m4v`)
  - Archive.org
  - Google Drive (fallback por iframe para compatibilidade)
  - YouTube (video/playlist)
- Subtitulos:
  - busca e carga por popup
  - upload local (`.srt/.vtt`) por usuario
  - ajuste de tempo (`-0.1`, `-1`, `+0.1`, `+1`, reset)
  - selecao de faixas embutidas quando expostas pelo browser
- Tema dark/light com visual liquid glass
- Layout responsivo para mobile

## Estrutura do projeto

```text
.
├─ client/       # App React + Vite
├─ server/       # Servico CineLink (RootSDK)
├─ networking/   # Contratos/protocolos gerados
├─ package.json  # Workspaces
└─ clean.js
```

## Requisitos

- Node.js `>= 22`
- npm `>= 10`

## Instalacao

```bash
npm install
```

## Como rodar (dev)

Terminal 1 (server):

```bash
npm run server --workspace @cinelink/server
```

Terminal 2 (client):

```bash
npm run client --workspace @cinelink/client
```

## Build

Build completo:

```bash
npm run build
```

Build por workspace:

```bash
npm run build --workspace @cinelink/server
npm run build --workspace @cinelink/client
```

## Portas usadas

- `8080` ClientMessage WS
- `8082` ClientUpdate WS
- `8081` OutOfBandServices
- `8090` DevAppHostService

Se receber `EADDRINUSE`, finalize processos antigos antes de subir novamente.

PowerShell:

```powershell
$ports = 8080,8082,8081,8090
$pids = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $ports -contains $_.LocalPort } |
  Select-Object -ExpandProperty OwningProcess -Unique
if ($pids) { $pids | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }
```

## Fluxo rapido de uso

1. Criar sala no Lobby
2. Definir URL de midia
3. Compartilhar link da sala
4. Controlar playback (host)
5. Gerenciar playlist e subtitulos conforme necessario

## Notas de compatibilidade

- Alguns MKVs podem nao decodificar no browser (codec/container).  
  Quando isso ocorre, o app aplica fallback para manter reproduzibilidade.
- Google Drive pode exigir modo iframe para reproduzir de forma confiavel.
- Se um recurso nao abrir diretamente, valide:
  - acesso publico do arquivo
  - CORS/range requests
  - codec suportado no navegador

## Imagens do README

As imagens acima devem estar em:

- `docs/images/cinelink-hero.png`
- `docs/images/cinelink-logo-glow.png`

## Licenca

Definir a licenca oficial do projeto (ex.: MIT) quando publicar.

