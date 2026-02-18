import { Client, CommunityGuid } from "@rootsdk/server-app";
import { CineLinkServiceBase } from "@cinelink/gen-server";
import {
  AdvanceQueueRequest,
  DecideHostClaimRequest,
  FetchSubtitleRequest,
  FetchSubtitleResponse,
  GetRoomStateRequest,
  GetRoomStateResponse,
  LeaveRoomRequest,
  ListRoomsRequest,
  ListRoomsResponse,
  MutationResponse,
  PlaylistMutationRequest,
  PlaybackRequest,
  ReportSyncStatusRequest,
  HostStartSyncRequest,
  HostLaunchSyncRequest,
  MoveQueueItemRequest,
  RemoveQueueItemRequest,
  RequestHostClaimRequest,
  RoomState,
  RoomSummary,
  SearchSubtitlesRequest,
  SearchSubtitlesResponse,
  SetDurationRequest,
  SetHostRequest,
  SubtitleCandidate,
  SetRoomNameRequest,
  SetSubtitleRequest,
  SetViewerQueuePolicyRequest,
  SetMediaRequest,
  SetRateRequest
} from "@cinelink/gen-shared";
import { gunzipSync } from "zlib";
import AdmZip from "adm-zip";
import { prewarmTranscodes, releaseTranscodesForUrls, resolvePlaybackSource } from "./mediaPipeline";
import { addTestLog } from "./testDiagnostics";

const DEFAULT_RATE = 1;

type RoomCommunityMap = Map<string, CommunityGuid>;

export class CineLinkService extends CineLinkServiceBase {
  private readonly rooms = new Map<string, RoomState>();
  private readonly roomCommunities: RoomCommunityMap = new Map();
  private readonly roomPlaybackReports = new Map<string, Map<string, number>>();

  async listRooms(_request: ListRoomsRequest): Promise<ListRoomsResponse> {
    this.pruneEmptyRooms();
    const rooms = Array.from(this.rooms.values())
      .map((state) => this.toSummary(state))
      .sort((a, b) => Number(b.version - a.version));
    return { rooms };
  }

  async getRoomState(request: GetRoomStateRequest, client: Client): Promise<GetRoomStateResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.rooms.get(roomId);
    if (!state) {
      serverLog("getRoomState:not-found", { roomId, actorUserId: client.userId });
      return { state: createDefaultRoomState("") };
    }
    const alreadyParticipant = state.participantUserIds.includes(client.userId);
    if (!alreadyParticipant) {
      addParticipant(state, client.userId);
    }
    this.roomCommunities.set(roomId, client.communityId);
    let changed = !alreadyParticipant;
    if (!state.hostUserId && state.participantUserIds.length > 0) {
      state.hostUserId = state.participantUserIds[0];
      state.pendingHostUserId = "";
      changed = true;
    }
    if (state.syncMode === "generic" && Number(state.syncLaunchAtMs || BigInt(0)) > 0) {
      const launchAt = Number(state.syncLaunchAtMs);
      if (Date.now() - launchAt > 12_000) {
        this.clearSyncState(state);
        changed = true;
      }
    }
    const pipelineChanged = await this.refreshMediaPipelineState(state);
    changed = changed || pipelineChanged;
    if (changed) {
      this.touchState(state);
      const action = !alreadyParticipant ? "participant:join" : (pipelineChanged ? "media:pipeline" : "state:refresh");
      await this.broadcastState(action, client.userId, state, client.communityId);
    }
    serverLog("getRoomState", { roomId, hostUserId: state.hostUserId, version: String(state.version) });
    return { state };
  }

  async leaveRoom(request: LeaveRoomRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    if (!roomId) {
      return this.reject("Room id is required.");
    }

    const state = this.rooms.get(roomId);
    if (!state) {
      return this.reject("Room not found.");
    }

    this.roomCommunities.set(roomId, client.communityId);
    const result = this.removeParticipantAndReassignHost(state, client.userId);
    if (!result.changed) {
      return this.acceptWithReason("You were not in this room.", state);
    }

    if (state.participantUserIds.length === 0) {
      void releaseTranscodesForUrls(
        [state.mediaUrl, ...(state.playlistUrls || []), ...(state.playlistHistoryUrls || [])],
        `room-deleted:${roomId}`
      );
      this.rooms.delete(roomId);
      this.roomCommunities.delete(roomId);
      this.roomPlaybackReports.delete(roomId);
      serverLog("room:deleted-empty", { roomId, action: "leaveRoom" });
      return this.acceptWithReason("Room left.", createDefaultRoomState(""));
    }

    this.touchState(state);
    await this.broadcastState(result.action, client.userId, state, client.communityId);
    return this.acceptWithReason("Room left.", state);
  }

  async setHost(request: SetHostRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    if (!roomId) {
      return this.reject("Room id is required.");
    }

    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);

    const requester = client.userId;
    const targetHost = request.hostUserId || requester;
    if (state.hostUserId && state.hostUserId !== requester) {
      return this.reject("Only current host can transfer host.", state);
    }

    state.hostUserId = targetHost;
    state.pendingHostUserId = "";
    this.touchState(state);
    await this.broadcastState("host:set", requester, state, client.communityId);
    return this.accept(state);
  }

  async setRoomName(request: SetRoomNameRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);

    const roomName = normalizeRoomName(request.roomName);
    if (!roomName) {
      return this.reject("Room name is required.", state);
    }

    if (state.hostUserId && state.hostUserId !== client.userId) {
      return this.reject("Only host can rename room.", state);
    }

    state.roomName = roomName;
    this.touchState(state);
    await this.broadcastState("room:rename", client.userId, state, client.communityId);
    return this.accept(state);
  }

  async setViewerQueuePolicy(request: SetViewerQueuePolicyRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);

    const auth = this.ensureHost(state, client.userId);
    if (auth) {
      return auth;
    }

    state.allowViewerQueueAdd = request.allowViewerQueueAdd;
    this.touchState(state);
    await this.broadcastState("queue:policy:set", client.userId, state, client.communityId);
    return this.acceptWithReason(
      request.allowViewerQueueAdd ? "Members can add to queue end." : "Only host can add to queue.",
      state
    );
  }

  async requestHostClaim(request: RequestHostClaimRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);

    if (!state.hostUserId) {
      state.hostUserId = client.userId;
      state.pendingHostUserId = "";
      this.touchState(state);
      await this.broadcastState("host:set", client.userId, state, client.communityId);
      return this.accept(state);
    }

    if (state.hostUserId === client.userId) {
      return this.accept(state);
    }

    if (state.pendingHostUserId && state.pendingHostUserId !== client.userId) {
      return this.reject("There is already a pending host claim.", state);
    }
    if (state.pendingHostUserId === client.userId) {
      return this.acceptWithReason("Your host claim is already pending.", state);
    }

    state.pendingHostUserId = client.userId;
    this.touchState(state);
    await this.broadcastState("host:claim-requested", client.userId, state, client.communityId);
    return this.acceptWithReason("Host claim requested. Waiting for approval.", state);
  }

  async decideHostClaim(request: DecideHostClaimRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);

    if (state.hostUserId !== client.userId) {
      return this.reject("Only current host can approve host claim.", state);
    }

    if (!state.pendingHostUserId || state.pendingHostUserId !== request.requesterUserId) {
      return this.reject("No matching host claim request found.", state);
    }

    if (request.approve) {
      state.hostUserId = request.requesterUserId;
      state.pendingHostUserId = "";
      this.touchState(state);
      await this.broadcastState("host:claim-approved", client.userId, state, client.communityId);
      return this.accept(state);
    }

    state.pendingHostUserId = "";
    this.touchState(state);
    await this.broadcastState("host:claim-rejected", client.userId, state, client.communityId);
    return this.acceptWithReason("Host claim rejected.", state);
  }

  async setMedia(request: SetMediaRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);

    const auth = this.ensureHost(state, client.userId);
    if (auth) {
      return auth;
    }

    const mediaBundle = await resolvePlayableMediaInputBundle(request.url);
    const expandedMediaUrls = mediaBundle.urls;
    if (!expandedMediaUrls.length) {
      return this.reject("Provide a valid http/https media URL.", state);
    }
    const mediaUrl = expandedMediaUrls[0];
    const playableError = await validatePlayableMediaUrl(mediaUrl);
    if (playableError) {
      return this.reject(playableError, state);
    }

    state.mediaUrl = mediaUrl;
    state.playlistHistoryUrls = [];
    state.playlistAddedByUserIds = [];
    state.playlistHistoryAddedByUserIds = [];
    state.currentMediaAddedByUserId = client.userId;
    state.playing = false;
    state.currentTimeSeconds = 0;
    state.playbackRate = DEFAULT_RATE;
    state.durationSeconds = 0;
    state.playlistUrls = expandedMediaUrls.slice(1);
    state.playlistAddedByUserIds = state.playlistUrls.map(() => client.userId);
    await this.refreshMediaPipelineState(state);
    if (mediaBundle.sourceName) {
      state.roomName = normalizeRoomName(mediaBundle.sourceName);
    }
    this.touchState(state);
    serverLog("media:set:applied", {
      roomId,
      actorUserId: client.userId,
      mediaUrl: state.mediaUrl,
      queuedFromBatch: state.playlistUrls.length,
      roomName: state.roomName
    });
    void prewarmTranscodes([state.mediaUrl, ...state.playlistUrls], {
      roomId,
      hostUserId: state.hostUserId,
      participantUserIds: state.participantUserIds
    });

    await this.broadcastState("media:set", client.userId, state, client.communityId);
    return this.accept(state);
  }

  async testBootstrapRoom(input: {
    roomId?: string;
    roomName?: string;
    hostUserId?: string;
    mediaUrl: string;
  }): Promise<{
    ok: boolean;
    roomId: string;
    state: RoomState;
    assertions: Array<{ name: string; ok: boolean; details?: string }>;
    errors: string[];
  }> {
    const roomId = normalizeRoomId(input.roomId || `test-${Math.random().toString(36).slice(2, 8)}`);
    const hostUserId = (input.hostUserId || "test-host").trim() || "test-host";
    const roomName = normalizeRoomName(input.roomName || roomId) || roomId;
    const assertions: Array<{ name: string; ok: boolean; details?: string }> = [];
    const errors: string[] = [];
    const testClient = this.makeTestClient(hostUserId);

    addTestLog("test:scenario:start", { scenario: "bootstrap", roomId, roomName, mediaUrl: input.mediaUrl });
    this.rooms.delete(roomId);
    this.roomCommunities.delete(roomId);
    this.roomPlaybackReports.delete(roomId);

    const hostResult = await this.setHost({ roomId, hostUserId }, testClient);
    assertions.push({ name: "host_set", ok: !!hostResult.accepted, details: hostResult.reason || "" });
    if (!hostResult.accepted) {
      errors.push(hostResult.reason || "setHost failed");
    }
    const roomNameResult = await this.setRoomName({ roomId, roomName }, testClient);
    assertions.push({ name: "room_renamed", ok: !!roomNameResult.accepted, details: roomNameResult.reason || "" });
    if (!roomNameResult.accepted) {
      errors.push(roomNameResult.reason || "setRoomName failed");
    }
    const mediaResult = await this.setMedia({ roomId, url: input.mediaUrl }, testClient);
    assertions.push({ name: "media_set", ok: !!mediaResult.accepted, details: mediaResult.reason || "" });
    if (!mediaResult.accepted) {
      errors.push(mediaResult.reason || "setMedia failed");
    }

    const state = this.rooms.get(roomId) || createDefaultRoomState(roomId);
    const ok = errors.length === 0;
    addTestLog(ok ? "test:scenario:ok" : "test:scenario:fail", { scenario: "bootstrap", roomId, errors });
    return { ok, roomId, state, assertions, errors };
  }

  async testApplyRoomActions(input: {
    roomId: string;
    actorUserId?: string;
    actions: Array<Record<string, unknown>>;
  }): Promise<{
    ok: boolean;
    state: RoomState;
    assertions: Array<{ name: string; ok: boolean; details?: string }>;
    errors: string[];
  }> {
    const roomId = normalizeRoomId(input.roomId);
    const actorUserId = (input.actorUserId || "test-host").trim() || "test-host";
    const assertions: Array<{ name: string; ok: boolean; details?: string }> = [];
    const errors: string[] = [];
    const testClient = this.makeTestClient(actorUserId);
    addTestLog("test:scenario:start", { scenario: "actions", roomId, count: input.actions.length });

    for (const action of input.actions) {
      const kind = String(action.type || "").trim().toLowerCase();
      let result: MutationResponse | undefined;
      try {
        switch (kind) {
          case "play":
            result = await this.play(
              { roomId, atSeconds: Number(action.atSeconds ?? 0) },
              testClient
            );
            break;
          case "pause":
            result = await this.pause(
              { roomId, atSeconds: Number(action.atSeconds ?? 0) },
              testClient
            );
            break;
          case "seek":
            result = await this.seek(
              { roomId, atSeconds: Number(action.atSeconds ?? 0) },
              testClient
            );
            break;
          case "setrate":
            result = await this.setRate(
              { roomId, playbackRate: Number(action.playbackRate ?? 1) },
              testClient
            );
            break;
          case "addqueuelast":
            result = await this.addQueueLast(
              { roomId, url: String(action.url || "") },
              testClient
            );
            break;
          case "advancequeue":
            result = await this.advanceQueue(
              { roomId, autoplay: Boolean(action.autoplay ?? true) },
              testClient
            );
            break;
          case "previousqueue":
            result = await this.previousQueue(
              { roomId, autoplay: Boolean(action.autoplay ?? true) },
              testClient
            );
            break;
          default:
            errors.push(`Unknown action type: ${kind}`);
            assertions.push({ name: `action:${kind}`, ok: false, details: "Unknown action" });
            continue;
        }
        const accepted = !!result?.accepted;
        assertions.push({ name: `action:${kind}`, ok: accepted, details: result?.reason || "" });
        if (!accepted) {
          errors.push(result?.reason || `Action failed: ${kind}`);
        }
      } catch (error) {
        const message = String(error);
        assertions.push({ name: `action:${kind}`, ok: false, details: message });
        errors.push(message);
      }
    }

    const state = this.rooms.get(roomId) || createDefaultRoomState(roomId);
    const ok = errors.length === 0;
    addTestLog(ok ? "test:scenario:ok" : "test:scenario:fail", { scenario: "actions", roomId, errors });
    return { ok, state, assertions, errors };
  }

  getTestRoomState(roomId: string): RoomState {
    const normalized = normalizeRoomId(roomId);
    return this.rooms.get(normalized) || createDefaultRoomState(normalized);
  }

  async testRefreshRoomState(roomId: string): Promise<RoomState> {
    const normalized = normalizeRoomId(roomId);
    const state = this.rooms.get(normalized);
    if (!state) {
      return createDefaultRoomState(normalized);
    }
    const changed = await this.refreshMediaPipelineState(state);
    if (changed) {
      this.touchState(state);
    }
    return state;
  }

  clearAllTestRooms(): { removedRooms: number } {
    const removedRooms = this.rooms.size;
    this.rooms.clear();
    this.roomCommunities.clear();
    this.roomPlaybackReports.clear();
    addTestLog("test:cleanup:rooms", { removedRooms });
    return { removedRooms };
  }

  async addQueueNext(request: PlaylistMutationRequest, client: Client): Promise<MutationResponse> {
    return this.addToQueue(request, client, "next");
  }

  async addQueueLast(request: PlaylistMutationRequest, client: Client): Promise<MutationResponse> {
    return this.addToQueue(request, client, "last");
  }

  async advanceQueue(request: AdvanceQueueRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);
    const auth = this.ensureHost(state, client.userId);
    if (auth) {
      return auth;
    }

    if (!state.playlistUrls.length) {
      state.playing = false;
      this.touchState(state);
      await this.broadcastState("queue:empty", client.userId, state, client.communityId);
      return this.acceptWithReason("Queue is empty.", state);
    }

    if (state.mediaUrl) {
      state.playlistHistoryUrls.push(state.mediaUrl);
      state.playlistHistoryAddedByUserIds.push(state.currentMediaAddedByUserId || state.hostUserId || "");
    }
    const nextUrl = state.playlistUrls.shift() || "";
    const nextAddedBy = state.playlistAddedByUserIds.shift() || "";
    state.mediaUrl = nextUrl;
    state.currentMediaAddedByUserId = nextAddedBy;
    state.currentTimeSeconds = 0;
    state.durationSeconds = 0;
    state.playing = request.autoplay;
    await this.refreshMediaPipelineState(state);
    void prewarmTranscodes([state.mediaUrl, ...state.playlistUrls], {
      roomId,
      hostUserId: state.hostUserId,
      participantUserIds: state.participantUserIds
    });
    this.touchState(state);
    await this.broadcastState("queue:advance", client.userId, state, client.communityId);
    return this.accept(state);
  }

  async previousQueue(request: AdvanceQueueRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);
    const auth = this.ensureHost(state, client.userId);
    if (auth) {
      return auth;
    }

    if (!state.playlistHistoryUrls.length) {
      return this.acceptWithReason("No previous item.", state);
    }

    if (state.mediaUrl) {
      state.playlistUrls.unshift(state.mediaUrl);
      state.playlistAddedByUserIds.unshift(state.currentMediaAddedByUserId || state.hostUserId || "");
    }

    const previousUrl = state.playlistHistoryUrls.pop() || "";
    const previousAddedBy = state.playlistHistoryAddedByUserIds.pop() || "";
    state.mediaUrl = previousUrl;
    state.currentMediaAddedByUserId = previousAddedBy;
    state.currentTimeSeconds = 0;
    state.durationSeconds = 0;
    state.playing = request.autoplay;
    await this.refreshMediaPipelineState(state);
    void prewarmTranscodes([state.mediaUrl, ...state.playlistUrls], {
      roomId,
      hostUserId: state.hostUserId,
      participantUserIds: state.participantUserIds
    });
    this.touchState(state);
    await this.broadcastState("queue:previous", client.userId, state, client.communityId);
    return this.accept(state);
  }

  async removeQueueItem(request: RemoveQueueItemRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);
    const auth = this.ensureHost(state, client.userId);
    if (auth) {
      return auth;
    }

    const index = Number(request.index);
    if (!Number.isInteger(index) || index < 0 || index >= state.playlistUrls.length) {
      return this.reject("Invalid queue index.", state);
    }
    const addedByUserId = state.playlistAddedByUserIds[index] || "";
    if (state.hostUserId !== client.userId && addedByUserId !== client.userId) {
      return this.reject("Only host or item owner can remove this queue item.", state);
    }

    state.playlistUrls.splice(index, 1);
    state.playlistAddedByUserIds.splice(index, 1);
    this.touchState(state);
    await this.broadcastState("queue:remove", client.userId, state, client.communityId);
    return this.accept(state);
  }

  async moveQueueItem(request: MoveQueueItemRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);
    const auth = this.ensureHost(state, client.userId);
    if (auth) {
      return auth;
    }

    const from = Number(request.fromIndex);
    const to = Number(request.toIndex);
    if (
      !Number.isInteger(from) || !Number.isInteger(to) ||
      from < 0 || to < 0 ||
      from >= state.playlistUrls.length || to >= state.playlistUrls.length
    ) {
      return this.reject("Invalid move index.", state);
    }

    if (from === to) {
      return this.accept(state);
    }

    const [item] = state.playlistUrls.splice(from, 1);
    const [addedBy] = state.playlistAddedByUserIds.splice(from, 1);
    state.playlistUrls.splice(to, 0, item);
    state.playlistAddedByUserIds.splice(to, 0, addedBy);
    this.touchState(state);
    await this.broadcastState("queue:move", client.userId, state, client.communityId);
    return this.accept(state);
  }

  async setDuration(request: SetDurationRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);

    const auth = this.ensureHost(state, client.userId);
    if (auth) {
      return auth;
    }

    state.durationSeconds = Math.max(0, request.durationSeconds);
    this.touchState(state);
    await this.broadcastState("duration:set", client.userId, state, client.communityId);
    return this.accept(state);
  }

  async play(request: PlaybackRequest, client: Client): Promise<MutationResponse> {
    return this.mutatePlayback("play", request, client, (state, at) => {
      state.playing = true;
      state.currentTimeSeconds = at;
    });
  }

  async pause(request: PlaybackRequest, client: Client): Promise<MutationResponse> {
    return this.mutatePlayback("pause", request, client, (state, at) => {
      state.playing = false;
      state.currentTimeSeconds = at;
    });
  }

  async seek(request: PlaybackRequest, client: Client): Promise<MutationResponse> {
    return this.mutatePlayback("seek", request, client, (state, at) => {
      state.currentTimeSeconds = at;
    });
  }

  async setRate(request: SetRateRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);
    const auth = this.ensureHost(state, client.userId);
    if (auth) {
      return auth;
    }

    state.playbackRate = clamp(request.playbackRate, 0.5, 2);
    this.touchState(state);
    await this.broadcastState("rate:set", client.userId, state, client.communityId);
    return this.accept(state);
  }

  async searchSubtitles(request: SearchSubtitlesRequest, _client: Client): Promise<SearchSubtitlesResponse> {
    const query = normalizeSubtitleQuery(request.query);
    if (!query) {
      serverLog("subtitle:search:blocked", { reason: "empty_query" });
      return { items: [], error: "Query is required." };
    }

    const normalized = normalizeSubtitleSearchInput(query, request.tvseries, request.season, request.episode);
    const language = toOpenSubtitlesLanguage(request.language);
    const candidates = buildSubtitleSearchCandidates(normalized.query);
    serverLog("subtitle:search:start", {
      query,
      normalizedQuery: normalized.query,
      language,
      tvseries: normalized.tvseries,
      season: normalized.season,
      episode: normalized.episode,
      candidates
    });

    try {
      const allItems: SubtitleCandidate[] = [];
      const seen = new Set<string>();
      for (const candidateQuery of candidates) {
        const pathPrimary = normalized.tvseries && normalized.season > 0 && normalized.episode > 0
          ? `searchonlytvseries-on/season-${normalized.season}/episode-${normalized.episode}/moviename-${encodeURIComponent(candidateQuery)}`
          : `searchonlymovies-on/moviename-${encodeURIComponent(candidateQuery)}`;
        const pathFallback = normalized.tvseries && normalized.season > 0 && normalized.episode > 0
          ? `searchonlymovies-on/moviename-${encodeURIComponent(candidateQuery)}`
          : `searchonlytvseries-on/season-${Math.max(1, normalized.season || 1)}/episode-${Math.max(1, normalized.episode || 1)}/moviename-${encodeURIComponent(candidateQuery)}`;

        for (const searchPath of [pathPrimary, pathFallback]) {
          const url = `https://www.opensubtitles.org/en/search/sublanguageid-${language}/${searchPath}/rss_2_00`;
          const response = await fetch(url, { headers: { "User-Agent": "CineLink/1.0 subtitle-search" } });
          if (!response.ok) {
            serverLog("subtitle:search:http-error", { status: response.status, url, candidateQuery });
            continue;
          }
          const xml = await response.text();
          const parsed = parseOpenSubtitlesRss(xml, candidateQuery);
          serverLog("subtitle:search:attempt", {
            candidateQuery,
            mode: searchPath.includes("searchonlytvseries-on") ? "tv" : "movie",
            resultCount: parsed.length
          });
          for (const item of parsed) {
            if (seen.has(item.downloadUrl)) {
              continue;
            }
            seen.add(item.downloadUrl);
            allItems.push(item);
          }
          if (allItems.length >= 12) {
            break;
          }
        }
        if (allItems.length >= 12) {
          break;
        }
      }
      const items = allItems.sort((a, b) => b.score - a.score).slice(0, 12);
      serverLog("subtitle:search:ok", {
        resultCount: items.length,
        first: items[0] ? { name: items[0].name, score: items[0].score, provider: items[0].provider } : null
      });
      return { items, error: "" };
    } catch (error) {
      serverLog("subtitle:search:error", { error: String(error), normalizedQuery: normalized.query });
      return { items: [], error: `Subtitle search failed: ${String(error)}` };
    }
  }

  async fetchSubtitle(request: FetchSubtitleRequest, _client: Client): Promise<FetchSubtitleResponse> {
    const url = normalizeUrl(request.downloadUrl);
    if (!url) {
      serverLog("subtitle:fetch:blocked", { reason: "invalid_url", rawUrl: request.downloadUrl });
      return { ok: false, name: "", vttText: "", error: "Provide a valid subtitle URL." };
    }
    serverLog("subtitle:fetch:start", { url });

    try {
      const response = await fetch(url, { headers: { "User-Agent": "CineLink/1.0 subtitle-fetch" } });
      if (!response.ok) {
        serverLog("subtitle:fetch:http-error", { status: response.status, url });
        return { ok: false, name: "", vttText: "", error: `Subtitle download failed: HTTP ${response.status}` };
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      const name = guessSubtitleName(url, response.headers.get("content-disposition"));
      serverLog("subtitle:fetch:downloaded", {
        url,
        name,
        bytes: bytes.length,
        contentType: response.headers.get("content-type")
      });
      const asText = decodeSubtitleBytes(bytes);
      if (!asText) {
        serverLog("subtitle:fetch:decode-failed", { url, name });
        return {
          ok: false,
          name,
          vttText: "",
          error: "Could not decode subtitle file. Compressed ZIP archives are not supported in this version."
        };
      }
      const vttText = toWebVtt(asText);
      serverLog("subtitle:fetch:ok", { url, name, vttLength: vttText.length });
      return { ok: true, name, vttText, error: "" };
    } catch (error) {
      serverLog("subtitle:fetch:error", { url, error: String(error) });
      return { ok: false, name: "", vttText: "", error: `Subtitle fetch failed: ${String(error)}` };
    }
  }

  async setSubtitle(request: SetSubtitleRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    if (!roomId) {
      return this.reject("Room id is required.");
    }
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);
    if (!state.participantUserIds.includes(client.userId)) {
      return this.reject("Join the room before setting subtitles.", state);
    }

    const nextLabel = (request.subtitleLabel || "").trim().slice(0, 120);
    const nextVtt = (request.subtitleVttText || "").trim();
    if (nextVtt.length > 350_000) {
      return this.reject("Subtitle is too large.", state);
    }

    state.subtitleLabel = nextLabel;
    state.subtitleVttText = nextVtt;
    this.touchState(state);
    await this.broadcastState(nextVtt ? "subtitle:set" : "subtitle:clear", client.userId, state, client.communityId);
    return this.acceptWithReason(nextVtt ? "Subtitle updated for room." : "Subtitle cleared for room.", state);
  }

  async reportSyncStatus(request: ReportSyncStatusRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    if (!roomId) {
      return this.reject("Room id is required.");
    }
    const state = this.rooms.get(roomId);
    if (!state) {
      return this.reject("Room not found.");
    }
    if (!state.participantUserIds.includes(client.userId)) {
      return this.reject("Join the room first.", state);
    }

    const at = Number.isFinite(request.currentTimeSeconds) ? Math.max(0, request.currentTimeSeconds) : 0;
    const byRoom = this.roomPlaybackReports.get(roomId) ?? new Map<string, number>();
    byRoom.set(client.userId, at);
    this.roomPlaybackReports.set(roomId, byRoom);

    const wasReady = state.syncReadyUserIds.includes(client.userId);
    const nextReady = !!request.ready;
    if (wasReady !== nextReady) {
      state.syncReadyUserIds = nextReady
        ? [...state.syncReadyUserIds, client.userId]
        : state.syncReadyUserIds.filter((id) => id !== client.userId);
      this.touchState(state);
    }
    return this.accept(state);
  }

  async hostStartSync(request: HostStartSyncRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);
    const auth = this.ensureHost(state, client.userId);
    if (auth) {
      return auth;
    }
    const mode = (request.mode || "").trim().toLowerCase();
    if (mode !== "youtube" && mode !== "generic") {
      return this.reject("Invalid sync mode.", state);
    }

    state.syncMode = mode;
    state.syncReadyUserIds = mode === "generic" ? [client.userId] : [];

    if (mode === "youtube") {
      const reports = this.roomPlaybackReports.get(roomId);
      const values: number[] = [];
      for (const participant of state.participantUserIds) {
        const reported = reports?.get(participant);
        if (Number.isFinite(reported)) {
          values.push(Math.max(0, reported || 0));
        }
      }
      const target = values.length ? Math.min(...values) : Math.max(0, state.currentTimeSeconds || 0);
      state.syncTargetSeconds = target;
      state.currentTimeSeconds = target;
      state.playing = false;
      state.syncLaunchAtMs = BigInt(Date.now() + 2200);
    } else {
      state.syncTargetSeconds = 0;
      state.syncLaunchAtMs = BigInt(0);
    }

    this.touchState(state);
    await this.broadcastState("sync:start", client.userId, state, client.communityId);
    return this.acceptWithReason(mode === "youtube" ? "YouTube sync started." : "Manual sync started.", state);
  }

  async hostLaunchSync(request: HostLaunchSyncRequest, client: Client): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);
    const auth = this.ensureHost(state, client.userId);
    if (auth) {
      return auth;
    }
    if (state.syncMode !== "generic") {
      return this.reject("Manual sync is not active.", state);
    }

    state.syncLaunchAtMs = BigInt(Date.now() + 2200);
    this.touchState(state);
    await this.broadcastState("sync:launch", client.userId, state, client.communityId);
    return this.acceptWithReason("Manual sync launch scheduled.", state);
  }

  onUserDetached(userId: string): void {
    for (const [roomId, state] of this.rooms.entries()) {
      const result = this.removeParticipantAndReassignHost(state, userId);
      if (!result.changed) {
        continue;
      }

      if (state.participantUserIds.length === 0) {
        void releaseTranscodesForUrls(
          [state.mediaUrl, ...(state.playlistUrls || []), ...(state.playlistHistoryUrls || [])],
          `room-deleted:${roomId}`
        );
        this.rooms.delete(roomId);
        this.roomCommunities.delete(roomId);
        this.roomPlaybackReports.delete(roomId);
        serverLog("room:deleted-empty", { roomId });
        continue;
      }

      this.touchState(state);
      const communityId = this.roomCommunities.get(state.roomId);
      if (communityId) {
        void this.broadcastState(result.action, userId, state, communityId);
      }
    }
  }

  private removeParticipantAndReassignHost(
    state: RoomState,
    userId: string
  ): { changed: boolean; action: string } {
    const reports = this.roomPlaybackReports.get(state.roomId);
    reports?.delete(userId);
    const beforeParticipants = state.participantUserIds.length;
    state.participantUserIds = state.participantUserIds.filter((id) => id !== userId);
    const hadReady = state.syncReadyUserIds.includes(userId);
    if (hadReady) {
      state.syncReadyUserIds = state.syncReadyUserIds.filter((id) => id !== userId);
    }
    const participantChanged = state.participantUserIds.length !== beforeParticipants;
    let action = "participant:left";

    if (state.hostUserId === userId) {
      // Transfer host to next participant in join order if one exists.
      state.hostUserId = state.participantUserIds[0] || "";
      state.pendingHostUserId = "";
      action = state.hostUserId ? "host:transferred" : "host:left";
      return { changed: true, action };
    }

    if (state.pendingHostUserId === userId) {
      state.pendingHostUserId = "";
      action = "host:claim-cleared";
      return { changed: true, action };
    }

    return { changed: participantChanged || hadReady, action };
  }

  private async mutatePlayback(
    action: string,
    request: PlaybackRequest,
    client: Client,
    mutation: (state: RoomState, at: number) => void
  ): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);
    const auth = this.ensureHost(state, client.userId);
    if (auth) {
      return auth;
    }

    mutation(state, Math.max(0, request.atSeconds));
    this.clearSyncState(state);
    this.touchState(state);
    await this.broadcastState(action, client.userId, state, client.communityId);
    return this.accept(state);
  }

  private clearSyncState(state: RoomState): void {
    state.syncMode = "";
    state.syncTargetSeconds = 0;
    state.syncLaunchAtMs = BigInt(0);
    state.syncReadyUserIds = [];
  }

  private async addToQueue(
    request: PlaylistMutationRequest,
    client: Client,
    position: "next" | "last"
  ): Promise<MutationResponse> {
    const roomId = normalizeRoomId(request.roomId);
    const state = this.getOrCreateRoom(roomId);
    addParticipant(state, client.userId);
    this.roomCommunities.set(roomId, client.communityId);
    const requesterIsHost = state.hostUserId === client.userId;
    if (!state.hostUserId) {
      return this.reject("Set a host first.", state);
    }
    if (!requesterIsHost) {
      if (position === "next") {
        return this.reject("Only host can add play-next items.", state);
      }
      if (!state.allowViewerQueueAdd) {
        return this.reject("Host has disabled queue adds for members.", state);
      }
    }

    const resolvedMediaUrls = await resolvePlayableMediaInputs(request.url);
    if (!resolvedMediaUrls.length) {
      return this.reject("Provide a valid http/https media URL.", state);
    }
    const playableError = await validatePlayableMediaUrl(resolvedMediaUrls[0]);
    if (playableError) {
      return this.reject(playableError, state);
    }

    if (position === "next") {
      // Keep the original order when inserted right after current media.
      for (const mediaUrl of [...resolvedMediaUrls].reverse()) {
        state.playlistUrls.unshift(mediaUrl);
        state.playlistAddedByUserIds.unshift(client.userId);
      }
      void prewarmTranscodes([state.mediaUrl, ...state.playlistUrls], {
        roomId,
        hostUserId: state.hostUserId,
        participantUserIds: state.participantUserIds
      });
      this.touchState(state);
      await this.broadcastState("queue:add-next", client.userId, state, client.communityId);
      return this.acceptWithReason(
        resolvedMediaUrls.length > 1
          ? `${resolvedMediaUrls.length} items added right after current video.`
          : "Added right after current video.",
        state
      );
    }

    for (const mediaUrl of resolvedMediaUrls) {
      state.playlistUrls.push(mediaUrl);
      state.playlistAddedByUserIds.push(client.userId);
    }
    void prewarmTranscodes([state.mediaUrl, ...state.playlistUrls], {
      roomId,
      hostUserId: state.hostUserId,
      participantUserIds: state.participantUserIds
    });
    this.touchState(state);
    await this.broadcastState("queue:add-last", client.userId, state, client.communityId);
    return this.acceptWithReason(
      resolvedMediaUrls.length > 1
        ? `${resolvedMediaUrls.length} items added to queue end.`
        : "Added to queue end.",
      state
    );
  }

  private ensureHost(state: RoomState, requester: string): MutationResponse | undefined {
    if (!state.hostUserId) {
      return this.reject("Set a host first.", state);
    }
    if (state.hostUserId !== requester) {
      return this.reject("Only host can control playback.", state);
    }
    return undefined;
  }

  private getOrCreateRoom(roomId: string): RoomState {
    const normalizedId = normalizeRoomId(roomId);
    if (!normalizedId) {
      return createDefaultRoomState("");
    }

    const existing = this.rooms.get(normalizedId);
    if (existing) {
      return existing;
    }

    const created = createDefaultRoomState(normalizedId);
    this.rooms.set(normalizedId, created);
    return created;
  }

  private async refreshMediaPipelineState(state: RoomState): Promise<boolean> {
    const mediaUrl = (state.mediaUrl || "").trim();
    const previousSourceType = (state.mediaSourceType || "").trim();
    const previousResolvedUrl = (state.resolvedMediaUrl || "").trim();
    const previousPipelineStatus = (state.mediaPipelineStatus || "").trim();
    const previousPipelineMessage = (state.mediaPipelineMessage || "").trim();

    if (!mediaUrl) {
      state.mediaSourceType = "";
      state.resolvedMediaUrl = "";
      state.mediaPipelineStatus = "";
      state.mediaPipelineMessage = "";
      return (
        previousSourceType !== "" ||
        previousResolvedUrl !== "" ||
        previousPipelineStatus !== "" ||
        previousPipelineMessage !== ""
      );
    }

    const resolved = await resolvePlaybackSource(mediaUrl);
    state.mediaSourceType = resolved.sourceType;
    state.resolvedMediaUrl = resolved.resolvedUrl;
    state.mediaPipelineStatus = resolved.pipelineStatus;
    state.mediaPipelineMessage = resolved.pipelineMessage;

    const changed =
      previousSourceType !== state.mediaSourceType ||
      previousResolvedUrl !== state.resolvedMediaUrl ||
      previousPipelineStatus !== state.mediaPipelineStatus ||
      previousPipelineMessage !== state.mediaPipelineMessage;
    if (changed) {
      const payload = {
        roomId: state.roomId,
        mediaUrl,
        sourceType: state.mediaSourceType,
        resolvedMediaUrl: state.resolvedMediaUrl,
        pipelineStatus: state.mediaPipelineStatus,
        pipelineMessage: state.mediaPipelineMessage
      };
      serverLog("media:engine:selected", payload);
      addTestLog("media:engine:selected", payload);
    }

    return changed;
  }

  private pruneEmptyRooms(): void {
    for (const [roomId, state] of this.rooms.entries()) {
      if ((state.participantUserIds || []).length === 0) {
        this.rooms.delete(roomId);
        this.roomCommunities.delete(roomId);
      }
    }
  }

  private toSummary(state: RoomState): RoomSummary {
    const duration = Math.max(0, state.durationSeconds);
    const percent = duration > 0 ? clamp((state.currentTimeSeconds / duration) * 100, 0, 100) : 0;
    const previewMediaUrl = state.mediaUrl || (state.playlistUrls?.[0] || "");
    return {
      roomId: state.roomId,
      roomName: state.roomName || state.roomId,
      previewMediaUrl,
      hostUserId: state.hostUserId,
      mediaUrl: state.mediaUrl,
      playing: state.playing,
      currentTimeSeconds: state.currentTimeSeconds,
      durationSeconds: duration,
      progressPercent: percent,
      participantUserIds: state.participantUserIds,
      version: state.version
    };
  }

  private touchState(state: RoomState): void {
    state.updatedAtMs = BigInt(Date.now());
    state.version = state.version + BigInt(1);
  }

  private async broadcastState(
    action: string,
    actorUserId: string,
    state: RoomState,
    communityId: CommunityGuid
  ): Promise<void> {
    // Testing mode: the generated BroadcastStateChanged endpoint is missing in this env.
    // Keep RPC mutations functional by skipping server-side broadcast fan-out.
    serverLog("broadcast:skipped", {
      action,
      roomId: state.roomId,
      actorUserId,
      communityId
    });
  }

  private accept(state: RoomState): MutationResponse {
    return { accepted: true, reason: "", state };
  }

  private acceptWithReason(reason: string, state: RoomState): MutationResponse {
    return { accepted: true, reason, state };
  }

  private reject(reason: string, state?: RoomState): MutationResponse {
    return { accepted: false, reason, state: state ?? createDefaultRoomState("") };
  }

  private makeTestClient(userId: string): Client {
    return {
      userId,
      communityId: "test-community" as CommunityGuid
    } as Client;
  }
}

export const cineLinkService = new CineLinkService();

function createDefaultRoomState(roomId: string): RoomState {
  return {
    roomId,
    hostUserId: "",
    roomName: roomId,
    mediaUrl: "",
    playing: false,
    currentTimeSeconds: 0,
    playbackRate: DEFAULT_RATE,
    updatedAtMs: BigInt(Date.now()),
    version: BigInt(0),
    participantUserIds: [],
    durationSeconds: 0,
    pendingHostUserId: "",
    playlistUrls: [],
    playlistHistoryUrls: [],
    playlistAddedByUserIds: [],
    playlistHistoryAddedByUserIds: [],
    currentMediaAddedByUserId: "",
    allowViewerQueueAdd: false,
    subtitleLabel: "",
    subtitleVttText: "",
    syncTargetSeconds: 0,
    syncLaunchAtMs: BigInt(0),
    syncMode: "",
    syncReadyUserIds: [],
    mediaSourceType: "",
    resolvedMediaUrl: "",
    mediaPipelineStatus: "",
    mediaPipelineMessage: ""
  };
}

function normalizeRoomId(value: string | undefined): string {
  return (value ?? "").trim().slice(0, 64);
}

function normalizeRoomName(value: string | undefined): string {
  return (value ?? "").trim().slice(0, 80);
}

function normalizeUrl(value: string | undefined): string | undefined {
  const raw = (value ?? "").trim();
  if (!raw || raw.length > 2048) {
    return undefined;
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }

    const driveDirectUrl = toGoogleDriveDirectMediaUrl(parsed);
    if (driveDirectUrl) {
      return driveDirectUrl;
    }

    const archiveDirectUrl = toArchiveDirectMediaUrl(parsed);
    if (archiveDirectUrl) {
      return archiveDirectUrl;
    }

    return parsed.toString();
  } catch {
    return undefined;
  }
}

async function resolvePlayableMediaInputs(value: string | undefined): Promise<string[]> {
  const bundle = await resolvePlayableMediaInputBundle(value);
  return bundle.urls;
}

async function resolvePlayableMediaInputBundle(value: string | undefined): Promise<{ urls: string[]; sourceName?: string }> {
  const primary = normalizeUrl(value);
  if (!primary) {
    return { urls: [] };
  }
  const ytPlaylistId = extractYouTubePlaylistId(primary);
  if (ytPlaylistId) {
    const ytPlaylist = await listYouTubePlaylistVideoUrls(ytPlaylistId);
    if (!ytPlaylist.urls.length) {
      return { urls: [] };
    }
    return { urls: ytPlaylist.urls, sourceName: ytPlaylist.playlistTitle };
  }
  const folderId = extractDriveFolderId(primary);
  if (!folderId) {
    const archiveResolved = await resolveArchivePreferredPlayableUrl(primary);
    return { urls: [await enrichMediaUrlLabel(archiveResolved)] };
  }
  const resourceKey = extractDriveResourceKey(primary);
  const parsedFolder = await listGoogleDriveFolderVideoUrls(folderId, resourceKey);
  if (!parsedFolder.urls.length) {
    return { urls: [] };
  }
  return {
    urls: await Promise.all(parsedFolder.urls.map((url) => enrichMediaUrlLabel(url))),
    sourceName: parsedFolder.folderName
  };
}

async function resolveArchivePreferredPlayableUrl(urlValue: string): Promise<string> {
  const raw = (urlValue || "").trim();
  if (!raw) {
    return urlValue;
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return urlValue;
  }
  const host = parsed.hostname.toLowerCase();
  const isArchiveHost = host === "archive.org" || host.endsWith(".archive.org");
  if (!isArchiveHost) {
    return urlValue;
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  const isDownload = parts[0] === "download";
  if (!isDownload) {
    return urlValue;
  }
  const identifier = parts[1] || "";
  if (!identifier) {
    return urlValue;
  }
  const directFilePath = parts.length > 2 ? parts.slice(2).join("/") : "";
  const directFilePathDecoded = decodeArchivePath(directFilePath);
  const directFileLower = directFilePathDecoded.toLowerCase();
  const directFileIsMkv = /\.mkv$/i.test(directFilePathDecoded);
  const preferredEpisode = extractPreferredEpisodeFromPath(directFilePathDecoded);
  const directLooksLikeDubCompanion = looksLikeArchiveDubCompanion(directFileLower);

  // If the user provided a concrete archive file path, preserve it by default.
  // We only auto-pick another candidate for known problematic companion/dub paths.
  if (directFilePath && !directLooksLikeDubCompanion) {
    return urlValue;
  }

  try {
    const metadataResp = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`, {
      headers: { "User-Agent": "CineLink/1.0 archive-mkv-fallback" }
    });
    if (!metadataResp.ok) {
      return urlValue;
    }
    const metadata = await metadataResp.json() as { files?: Array<{ name?: string; format?: string; size?: string | number }> };
    const files = Array.isArray(metadata.files) ? metadata.files : [];
    const videoFiles = files.filter((file) => {
      const name = (file.name || "").trim().toLowerCase();
      if (!name || name.endsWith("/")) {
        return false;
      }
      if (/\.(mp4|m4v|webm|mov|mkv)$/i.test(name)) {
        return true;
      }
      const format = (file.format || "").toLowerCase();
      return format.includes("mpeg4") || format.includes("h.264") || format.includes("matroska") || format.includes("webm");
    });
    if (!videoFiles.length) {
      return urlValue;
    }

    const scoreFile = (file: { name?: string; format?: string; size?: string | number }): number => {
      const name = (file.name || "").toLowerCase();
      const format = (file.format || "").toLowerCase();
      const sizeBytes = Number(file.size || 0);
      const sizeMb = Number.isFinite(sizeBytes) && sizeBytes > 0 ? sizeBytes / (1024 * 1024) : 0;
      let score = 0;
      if (/\.mp4$/i.test(name)) {
        score += 130;
      } else if (/\.m4v$/i.test(name)) {
        score += 120;
      } else if (/\.webm$/i.test(name)) {
        score += 110;
      } else if (/\.mov$/i.test(name)) {
        score += 90;
      } else if (/\.mkv$/i.test(name)) {
        score += 20;
      }
      if (format.includes("h.264") || format.includes("mpeg4")) {
        score += 40;
      } else if (format.includes("webm")) {
        score += 25;
      } else if (format.includes("matroska")) {
        score += 5;
      }
      // Prefer full episode files over tiny dubbed-audio companions.
      score += Math.min(320, Math.round(sizeMb / 2));
      if (name.includes("/rus sound/") || name.includes("\\rus sound\\")) {
        score -= 420;
      }
      if (name.includes("[anidub]") || name.includes("[get smart]") || name.includes("[mca]") || name.includes("[св-дубль]")) {
        score -= 160;
      }
      if (preferredEpisode !== null) {
        const episodeRe = new RegExp(`\\)\\s*0?${preferredEpisode}\\s*\\[`);
        if (episodeRe.test(name)) {
          score += 220;
        }
      }
      if (directFilePathDecoded && name.endsWith(directFileLower)) {
        const directLooksLikeDubAudio = looksLikeArchiveDubCompanion(directFileLower);
        score += directFileIsMkv ? (directLooksLikeDubAudio ? 0 : 1200) : 220;
      }
      return score;
    };

    const sorted = [...videoFiles].sort((a, b) => scoreFile(b) - scoreFile(a));
    serverLog("media:archive:candidate-picked", {
      identifier,
      top: sorted.slice(0, 3).map((file) => ({ name: file.name || "", score: scoreFile(file), size: file.size || "" }))
    });
    const best = sorted[0];
    if (!best?.name) {
      return urlValue;
    }
    const picked = best.name
      .split("/")
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    const resolved = `https://archive.org/download/${encodeURIComponent(identifier)}/${picked}`;
    if (resolved !== raw) {
      serverLog("media:archive:fallback-picked", { identifier, from: raw, to: resolved });
    }
    return resolved;
  } catch (error) {
    serverLog("media:archive:fallback-error", { identifier, error: String(error) });
    return urlValue;
  }
}

function decodeArchivePath(value: string): string {
  if (!value) {
    return "";
  }
  return value
    .split("/")
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join("/");
}

function looksLikeArchiveDubCompanion(lowerPath: string): boolean {
  return (
    lowerPath.includes("/rus sound/")
    || lowerPath.includes("\\rus sound\\")
    || lowerPath.includes("[anidub]")
    || lowerPath.includes("[get smart]")
    || lowerPath.includes("[mca]")
    || lowerPath.includes("[св-дубль]")
  );
}

function extractPreferredEpisodeFromPath(pathValue: string): number | null {
  const value = (pathValue || "").trim();
  if (!value) {
    return null;
  }
  const exact = value.match(/\)\s*(\d{1,3})\s*\[/);
  if (exact) {
    const n = Number(exact[1]);
    return Number.isInteger(n) ? n : null;
  }
  return null;
}

function extractYouTubePlaylistId(urlValue: string): string | undefined {
  try {
    const parsed = new URL(urlValue);
    const host = parsed.hostname.toLowerCase();
    const isYouTubeHost = host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be";
    if (!isYouTubeHost) {
      return undefined;
    }
    const list = (parsed.searchParams.get("list") || "").trim();
    if (!list) {
      return undefined;
    }
    return /^[A-Za-z0-9_-]{8,}$/.test(list) ? list : undefined;
  } catch {
    return undefined;
  }
}

async function listYouTubePlaylistVideoUrls(playlistId: string): Promise<{ urls: string[]; playlistTitle?: string }> {
  const feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;
  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent": "CineLink/1.0 youtube-playlist-parser"
    }
  });
  if (!response.ok) {
    serverLog("media:yt-playlist:http-error", { playlistId, status: response.status });
    return { urls: [] };
  }
  const xml = await response.text();
  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/gi) || [];
  const urls: string[] = [];
  for (const entry of entries) {
    const videoId = (entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/i)?.[1] || "").trim();
    if (!videoId) {
      continue;
    }
    const titleRaw = (entry.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
    const title = decodeXmlEntities(titleRaw).replace(/\s+/g, " ").trim();
    const watchUrl = new URL("https://www.youtube.com/watch");
    watchUrl.searchParams.set("v", videoId);
    watchUrl.searchParams.set("list", playlistId);
    if (title) {
      watchUrl.searchParams.set("cinelink_name", title.slice(0, 160));
    }
    urls.push(watchUrl.toString());
  }

  const rawFeedTitle = (xml.match(/<feed[\s\S]*?<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
  let playlistTitle = decodeXmlEntities(rawFeedTitle).replace(/\s+/g, " ").trim();
  playlistTitle = playlistTitle.replace(/\s*-\s*YouTube\s*$/i, "").replace(/\s*videos?\s*$/i, "").trim();

  serverLog("media:yt-playlist:parsed", { playlistId, count: urls.length, playlistTitle: playlistTitle || "" });
  return { urls, playlistTitle: playlistTitle || undefined };
}

function normalizeSubtitleQuery(value: string | undefined): string {
  return (value || "").trim().slice(0, 120);
}

function buildSubtitleSearchCandidates(query: string): string[] {
  const base = (query || "").trim();
  if (!base) {
    return [];
  }
  const variants = new Set<string>();
  variants.add(base);
  variants.add(base.replace(/\(\d{4}\)/g, " ").replace(/\s+/g, " ").trim());
  variants.add(base.replace(/\b\d{1,3}\b/g, " ").replace(/\s+/g, " ").trim());
  variants.add(base.split(" ").slice(0, 4).join(" ").trim());
  variants.add(base.split(" ").slice(0, 3).join(" ").trim());
  variants.add(base.split(" ").slice(0, 2).join(" ").trim());
  const noNoise = base
    .replace(/\[[^\]]*]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (noNoise) {
    variants.add(noNoise);
  }
  return Array.from(variants).filter((item) => item.length >= 3).slice(0, 6);
}

function normalizeSubtitleSearchInput(
  rawQuery: string,
  tvseries: boolean,
  season: number,
  episode: number
): { query: string; tvseries: boolean; season: number; episode: number } {
  let query = rawQuery;
  query = query.replace(/%[0-9a-f]{2}/gi, " ");
  query = query.replace(/\[[^\]]*]/g, " ");
  query = query.replace(/\[[^\]]*$/g, " ");
  query = query.replace(/\([^)]*(?:x264|x265|h264|h265|1080|720|bdrip|webrip|aac|hevc)[^)]*\)/gi, " ");
  query = query.replace(/\b\d{3,4}x\d{3,4}\b/gi, " ");
  query = query.replace(/\b(?:bdrip|webrip|bluray|x264|x265|hevc|h264|aac|dualaudio|dual audio|1080p|720p)\b/gi, " ");
  query = query.replace(/\b(?:av1|opus|ddp|dts|10bit|8bit)\b/gi, " ");
  query = query.replace(/[_\.]+/g, " ");
  query = query.replace(/\.\.\.+/g, " ");
  query = query.replace(/\s+\[[^\]]*$/g, " ");
  query = query.replace(/\s+[A-Za-z]$/g, " ");
  query = query.replace(/\s+/g, " ").trim();

  let normalizedTvseries = tvseries;
  let normalizedSeason = season;
  let normalizedEpisode = episode;

  if (!normalizedTvseries || normalizedSeason <= 0 || normalizedEpisode <= 0) {
    const sxe = query.match(/\bs(\d{1,2})\s*e(\d{1,3})\b/i);
    if (sxe) {
      normalizedTvseries = true;
      normalizedSeason = Number(sxe[1] || 0);
      normalizedEpisode = Number(sxe[2] || 0);
      query = query.replace(sxe[0], " ").replace(/\s+/g, " ").trim();
    }
  }

  if ((!normalizedTvseries || normalizedEpisode <= 0) && /\(\d{4}\)\s*\d{1,3}\b/.test(query)) {
    const animeEp = query.match(/\((\d{4})\)\s*(\d{1,3})\b/);
    if (animeEp) {
      normalizedTvseries = true;
      normalizedSeason = normalizedSeason > 0 ? normalizedSeason : 1;
      normalizedEpisode = Number(animeEp[2] || 0);
      query = query.replace(animeEp[0], " ").replace(/\s+/g, " ").trim();
    }
  }

  return {
    query: query.slice(0, 120),
    tvseries: normalizedTvseries,
    season: normalizedSeason,
    episode: normalizedEpisode
  };
}

function toOpenSubtitlesLanguage(raw: string | undefined): string {
  const language = (raw || "").trim().toLowerCase();
  if (language === "all" || language === "*") {
    return "all";
  }
  if (language.startsWith("pt")) {
    return "por";
  }
  if (language.startsWith("es")) {
    return "spa";
  }
  if (language.startsWith("fr")) {
    return "fre";
  }
  if (language.startsWith("de")) {
    return "ger";
  }
  if (language.startsWith("it")) {
    return "ita";
  }
  return "eng";
}

function parseOpenSubtitlesRss(xml: string, query: string): SubtitleCandidate[] {
  const out: SubtitleCandidate[] = [];
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const title = decodeXmlEntities(extractTag(item, "title") || "");
    const enclosureTag = item.match(/<enclosure\b[^>]*>/i)?.[0] || "";
    const downloadUrl = decodeXmlEntities(extractAttribute(enclosureTag, "url") || "");
    if (!downloadUrl) {
      continue;
    }
    const score = similarityScore(query, title);
    out.push({
      id: `${index + 1}`,
      provider: "opensubtitles",
      name: title || `Subtitle ${index + 1}`,
      downloadUrl,
      score
    });
  }
  return out.sort((a, b) => b.score - a.score);
}

function extractTag(xmlItem: string, tagName: string): string | undefined {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
  return xmlItem.match(regex)?.[1];
}

function extractAttribute(tag: string, attributeName: string): string | undefined {
  const regex = new RegExp(`${attributeName}=\"([^\"]+)\"`, "i");
  return tag.match(regex)?.[1];
}

function decodeXmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'");
}

function similarityScore(query: string, candidate: string): number {
  const queryTokens = tokenize(query);
  const candidateTokens = tokenize(candidate);
  if (!queryTokens.length || !candidateTokens.length) {
    return 0;
  }
  let match = 0;
  for (const token of queryTokens) {
    if (candidateTokens.includes(token)) {
      match += 1;
    }
  }
  return Math.round((match / queryTokens.length) * 100);
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((item) => item.length > 1);
}

function guessSubtitleName(url: string, contentDisposition: string | null): string {
  const fromHeader = contentDisposition?.match(/filename\*?=(?:UTF-8''|\"?)([^\";]+)/i)?.[1];
  if (fromHeader) {
    return decodeURIComponent(fromHeader.replace(/\"/g, "").trim());
  }
  try {
    const parsed = new URL(url);
    const tail = parsed.pathname.split("/").filter(Boolean).pop() || "subtitle";
    return decodeURIComponent(tail);
  } catch {
    return "subtitle";
  }
}

function decodeSubtitleBytes(bytes: Buffer): string {
  if (!bytes.length) {
    return "";
  }
  if (bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
    try {
      return gunzipSync(bytes).toString("utf-8");
    } catch {
      return "";
    }
  }
  if (bytes.length > 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
    serverLog("subtitle:zip:detected", { bytes: bytes.length });
    return extractSubtitleFromZip(bytes);
  }
  return bytes.toString("utf-8");
}

function extractSubtitleFromZip(bytes: Buffer): string {
  try {
    const zip = new AdmZip(bytes);
    const entries = zip.getEntries().filter((entry) => !entry.isDirectory);
    serverLog("subtitle:zip:entries", { count: entries.length, names: entries.map((e) => e.entryName) });
    if (!entries.length) {
      return "";
    }

    const byPriority = [...entries].sort((a, b) => scoreSubtitleEntry(b.entryName) - scoreSubtitleEntry(a.entryName));
    const picked = byPriority.find((entry) => scoreSubtitleEntry(entry.entryName) > 0);
    if (!picked) {
      serverLog("subtitle:zip:no-supported-entry", { names: entries.map((e) => e.entryName) });
      return "";
    }
    const data = picked.getData();
    if (!data || !data.length) {
      serverLog("subtitle:zip:empty-entry", { name: picked.entryName });
      return "";
    }
    const finalText = decodeSubtitleTextSmart(data);
    serverLog("subtitle:zip:picked", {
      name: picked.entryName,
      bytes: data.length,
      score: scoreSubtitleTextQuality(finalText)
    });
    return finalText;
  } catch {
    serverLog("subtitle:zip:parse-error", { bytes: bytes.length });
    return "";
  }
}

function scoreSubtitleEntry(fileName: string): number {
  const name = (fileName || "").toLowerCase();
  if (name.endsWith(".vtt")) {
    return 5;
  }
  if (name.endsWith(".srt")) {
    return 4;
  }
  if (name.endsWith(".ass") || name.endsWith(".ssa")) {
    return 3;
  }
  if (name.endsWith(".sub")) {
    return 2;
  }
  if (name.endsWith(".txt")) {
    return 1;
  }
  return 0;
}

function looksLikeSubtitleText(value: string): boolean {
  if (!value || value.length < 16) {
    return false;
  }
  const hasTiming = /(\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3})/.test(value);
  const hasLines = value.includes("\n");
  return hasTiming && hasLines;
}

function decodeSubtitleTextSmart(data: Buffer): string {
  const candidates: Array<{ label: string; text: string }> = [];
  candidates.push({ label: "utf8", text: data.toString("utf-8") });
  candidates.push({ label: "latin1", text: data.toString("latin1") });
  try {
    const decoder = new TextDecoder("windows-1252");
    candidates.push({ label: "windows-1252", text: decoder.decode(data) });
  } catch {
    // ignore if runtime doesn't support this decoder
  }

  let best = "";
  let bestScore = -1;
  let bestLabel = "";
  for (const candidate of candidates) {
    const score = scoreSubtitleTextQuality(candidate.text);
    if (score > bestScore) {
      best = candidate.text;
      bestScore = score;
      bestLabel = candidate.label;
    }
  }
  serverLog("subtitle:zip:decode-choice", { chosen: bestLabel, score: bestScore });
  return best;
}

function scoreSubtitleTextQuality(value: string): number {
  if (!value) {
    return 0;
  }
  let score = 0;
  if (looksLikeSubtitleText(value)) {
    score += 100;
  }
  const replacementCount = (value.match(/\uFFFD/g) || []).length;
  score -= replacementCount * 8;
  const weirdCount = (value.match(/[ÃÂ�]/g) || []).length;
  score -= weirdCount * 2;
  const portugueseChars = (value.match(/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/g) || []).length;
  score += Math.min(portugueseChars, 30);
  const timingCount = (value.match(/\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}/g) || []).length;
  score += Math.min(timingCount, 40);
  return score;
}

function toWebVtt(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (normalized.startsWith("WEBVTT")) {
    return normalized;
  }
  const body = normalized.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  return `WEBVTT\n\n${body}\n`;
}

async function validatePlayableMediaUrl(url: string): Promise<string | undefined> {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const isGoogleDrive = host === "drive.google.com" || host.endsWith(".drive.google.com") || host === "drive.usercontent.google.com";
    if (!isGoogleDrive) {
      return undefined;
    }

    const response = await fetch(url, { method: "HEAD", redirect: "follow" });
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    const finalUrl = response.url || url;
    serverLog("media:validate:drive", {
      requestedUrl: url,
      finalUrl,
      status: response.status,
      contentType
    });

    if (!response.ok) {
      return `Google Drive link failed (HTTP ${response.status}).`;
    }
    if (contentType.includes("text/html")) {
      serverLog("media:validate:drive:html-allowed", {
        requestedUrl: url,
        finalUrl
      });
      return undefined;
    }
    return undefined;
  } catch (error) {
    serverLog("media:validate:error", { url, error: String(error) });
    return undefined;
  }
}

function toGoogleDriveDirectMediaUrl(url: URL): string | undefined {
  const hostname = url.hostname.toLowerCase();
  const isDriveHost = hostname === "drive.google.com" || hostname.endsWith(".drive.google.com");
  if (!isDriveHost) {
    return undefined;
  }

  const fileIdFromPath = extractDriveFileId(url.pathname);
  const fileIdFromQuery = sanitizeDriveFileId(url.searchParams.get("id"));
  const fileId = fileIdFromPath ?? fileIdFromQuery;
  if (!fileId) {
    return undefined;
  }

  const direct = new URL("https://drive.google.com/uc");
  direct.searchParams.set("export", "download");
  direct.searchParams.set("id", fileId);

  const resourceKey = url.searchParams.get("resourcekey");
  if (resourceKey) {
    direct.searchParams.set("resourcekey", resourceKey);
  }

  return direct.toString();
}

function toGoogleDriveDirectMediaUrlFromFileId(fileId: string, resourceKey?: string): string {
  const direct = new URL("https://drive.google.com/uc");
  direct.searchParams.set("export", "download");
  direct.searchParams.set("id", fileId);
  if (resourceKey) {
    direct.searchParams.set("resourcekey", resourceKey);
  }
  return direct.toString();
}

function extractDriveFolderId(urlValue: string): string | undefined {
  try {
    const parsed = new URL(urlValue);
    const host = parsed.hostname.toLowerCase();
    if (!(host === "drive.google.com" || host.endsWith(".drive.google.com"))) {
      return undefined;
    }
    const match = parsed.pathname.match(/\/drive\/folders\/([^/?#]+)/i);
    return sanitizeDriveFileId(match?.[1] || "");
  } catch {
    return undefined;
  }
}

function extractDriveResourceKey(urlValue: string): string | undefined {
  try {
    const parsed = new URL(urlValue);
    return (parsed.searchParams.get("resourcekey") || "").trim() || undefined;
  } catch {
    return undefined;
  }
}

async function listGoogleDriveFolderVideoUrls(folderId: string, resourceKey?: string): Promise<{ urls: string[]; folderName?: string }> {
  const folderUrl = new URL(`https://drive.google.com/drive/folders/${folderId}`);
  if (resourceKey) {
    folderUrl.searchParams.set("resourcekey", resourceKey);
  }
  folderUrl.searchParams.set("usp", "sharing");
  folderUrl.searchParams.set("hl", "en");

  const response = await fetch(folderUrl.toString(), {
    redirect: "follow",
    headers: {
      "User-Agent": "CineLink/1.0 drive-folder-parser"
    }
  });
  if (!response.ok) {
    serverLog("media:drive-folder:http-error", { folderId, status: response.status });
    return { urls: [] };
  }
  const html = await response.text();
  const folderName = extractDriveFolderNameFromHtml(html);
  const decoded = decodeHtmlEntities(html);
  const regex = /\[null,"([A-Za-z0-9_-]{10,})"\][\s\S]{0,260}?"(video\/[^"]+)"/gim;
  const seen = new Set<string>();
  const out: string[] = [];

  let match: RegExpExecArray | null = regex.exec(decoded);
  while (match) {
    const fileId = sanitizeDriveFileId(match[1] || "");
    const mime = (match[2] || "").toLowerCase();
    if (fileId && mime.startsWith("video/") && !seen.has(fileId)) {
      seen.add(fileId);
      const detectedName = extractDriveVideoNameNear(decoded, match.index);
      const direct = new URL(toGoogleDriveDirectMediaUrlFromFileId(fileId));
      if (detectedName) {
        direct.searchParams.set("cinelink_name", detectedName.slice(0, 160));
      }
      out.push(direct.toString());
    }
    match = regex.exec(decoded);
  }

  serverLog("media:drive-folder:parsed", { folderId, count: out.length, folderName: folderName || "" });
  return { urls: out, folderName };
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractDriveFolderNameFromHtml(html: string): string | undefined {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (!titleMatch?.[1]) {
    return undefined;
  }
  const decodedTitle = decodeHtmlEntities(titleMatch[1]).replace(/\s+/g, " ").trim();
  if (!decodedTitle) {
    return undefined;
  }
  const cleaned = decodedTitle.replace(/\s*-\s*Google Drive\s*$/i, "").trim();
  return cleaned || undefined;
}

function extractDriveVideoNameNear(decodedHtml: string, index: number): string | undefined {
  const start = Math.max(0, index - 220);
  const end = Math.min(decodedHtml.length, index + 1400);
  const chunk = decodedHtml.slice(start, end);
  const candidates = Array.from(chunk.matchAll(/"([^"]+\.(?:mkv|mp4|webm|mov|m4v))"/gi))
    .map((item) => (item[1] || "").trim())
    .filter((name) => !!name);
  if (!candidates.length) {
    return undefined;
  }
  // Prefer the most descriptive string if there are repeats in metadata blocks.
  const best = candidates.sort((a, b) => b.length - a.length)[0];
  return best?.replace(/\s+/g, " ").trim() || undefined;
}

async function enrichMediaUrlLabel(urlValue: string): Promise<string> {
  const url = urlValue.trim();
  if (!url) {
    return urlValue;
  }
  try {
    const parsed = new URL(url);
    if (!isGoogleDriveDirectDownloadUrl(parsed)) {
      return urlValue;
    }
    const response = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (!response.ok) {
      return urlValue;
    }
    const contentLength = parsePositiveInt(response.headers.get("content-length"));
    if (contentLength !== undefined) {
      parsed.searchParams.set("cinelink_size", String(contentLength));
    }
    const fileName = parseFileNameFromContentDisposition(response.headers.get("content-disposition"));
    if (fileName) {
      parsed.searchParams.set("cinelink_name", fileName.slice(0, 160));
    }
    return parsed.toString();
  } catch {
    return urlValue;
  }
}

function parsePositiveInt(raw: string | null): number | undefined {
  if (!raw) {
    return undefined;
  }
  const value = Number(raw.trim());
  if (!Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return Math.floor(value);
}

function isGoogleDriveDirectDownloadUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  if (host === "drive.usercontent.google.com") {
    return url.pathname === "/download";
  }
  if (host === "drive.google.com" || host.endsWith(".drive.google.com")) {
    return url.pathname === "/uc" && !!sanitizeDriveFileId(url.searchParams.get("id"));
  }
  return false;
}

function parseFileNameFromContentDisposition(raw: string | null): string | undefined {
  if (!raw) {
    return undefined;
  }

  const utf8Match = raw.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    const decoded = safeDecodeURIComponent(utf8Match[1].trim().replace(/^"(.*)"$/, "$1"));
    return sanitizeFileName(decoded);
  }

  const fallbackMatch = raw.match(/filename\s*=\s*([^;]+)/i);
  if (fallbackMatch?.[1]) {
    const value = fallbackMatch[1].trim().replace(/^"(.*)"$/, "$1");
    return sanitizeFileName(value);
  }

  return undefined;
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function sanitizeFileName(value: string): string | undefined {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/\s+/g, " ");
}

function extractDriveFileId(pathname: string): string | undefined {
  const directMatch = pathname.match(/\/file\/d\/([^/]+)/i);
  if (directMatch?.[1]) {
    return sanitizeDriveFileId(directMatch[1]);
  }
  return undefined;
}

function sanitizeDriveFileId(value: string | null | undefined): string | undefined {
  const raw = (value ?? "").trim();
  if (!raw) {
    return undefined;
  }
  const valid = /^[a-zA-Z0-9_-]{10,}$/.test(raw);
  return valid ? raw : undefined;
}

function toArchiveDirectMediaUrl(url: URL): string | undefined {
  const hostname = url.hostname.toLowerCase();
  const isArchiveHost = hostname === "archive.org" || hostname.endsWith(".archive.org");
  if (!isArchiveHost) {
    return undefined;
  }
  if (url.pathname.startsWith("/details/")) {
    return `https://archive.org${url.pathname.replace("/details/", "/download/")}`;
  }
  return undefined;
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, value));
}

function addParticipant(state: RoomState, userId: string): void {
  if (!userId) {
    return;
  }
  if (!state.participantUserIds.includes(userId)) {
    state.participantUserIds.push(userId);
  }
}

function serverLog(action: string, payload: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  const line = `[CineLink][${timestamp}] ${action}`;
  const isErrorLike = /(error|failed|reject|invalid|timeout)/i.test(action);
  if (isErrorLike) {
    console.error(`\x1b[31m${line}\x1b[0m`, payload);
    return;
  }
  console.log(line, payload);
}
