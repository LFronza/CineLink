import { Client } from "@rootsdk/server-app";
import { CineLinkServiceBase } from "@cinelink/gen-server";
import { AdvanceQueueRequest, DecideHostClaimRequest, FetchSubtitleRequest, FetchSubtitleResponse, GetRoomStateRequest, GetRoomStateResponse, LeaveRoomRequest, ListRoomsRequest, ListRoomsResponse, MutationResponse, PlaylistMutationRequest, PlaybackRequest, ReportSyncStatusRequest, HostStartSyncRequest, HostLaunchSyncRequest, MoveQueueItemRequest, RemoveQueueItemRequest, RequestHostClaimRequest, RoomState, SearchSubtitlesRequest, SearchSubtitlesResponse, SetDurationRequest, SetHostRequest, SetRoomNameRequest, SetSubtitleRequest, SetViewerQueuePolicyRequest, SetMediaRequest, SetRateRequest } from "@cinelink/gen-shared";
export declare class CineLinkService extends CineLinkServiceBase {
    private readonly rooms;
    private readonly roomCommunities;
    private readonly roomPlaybackReports;
    listRooms(_request: ListRoomsRequest): Promise<ListRoomsResponse>;
    getRoomState(request: GetRoomStateRequest, client: Client): Promise<GetRoomStateResponse>;
    leaveRoom(request: LeaveRoomRequest, client: Client): Promise<MutationResponse>;
    setHost(request: SetHostRequest, client: Client): Promise<MutationResponse>;
    setRoomName(request: SetRoomNameRequest, client: Client): Promise<MutationResponse>;
    setViewerQueuePolicy(request: SetViewerQueuePolicyRequest, client: Client): Promise<MutationResponse>;
    requestHostClaim(request: RequestHostClaimRequest, client: Client): Promise<MutationResponse>;
    decideHostClaim(request: DecideHostClaimRequest, client: Client): Promise<MutationResponse>;
    setMedia(request: SetMediaRequest, client: Client): Promise<MutationResponse>;
    testBootstrapRoom(input: {
        roomId?: string;
        roomName?: string;
        hostUserId?: string;
        mediaUrl: string;
    }): Promise<{
        ok: boolean;
        roomId: string;
        state: RoomState;
        assertions: Array<{
            name: string;
            ok: boolean;
            details?: string;
        }>;
        errors: string[];
    }>;
    testApplyRoomActions(input: {
        roomId: string;
        actorUserId?: string;
        actions: Array<Record<string, unknown>>;
    }): Promise<{
        ok: boolean;
        state: RoomState;
        assertions: Array<{
            name: string;
            ok: boolean;
            details?: string;
        }>;
        errors: string[];
    }>;
    getTestRoomState(roomId: string): RoomState;
    testRefreshRoomState(roomId: string): Promise<RoomState>;
    clearAllTestRooms(): {
        removedRooms: number;
    };
    addQueueNext(request: PlaylistMutationRequest, client: Client): Promise<MutationResponse>;
    addQueueLast(request: PlaylistMutationRequest, client: Client): Promise<MutationResponse>;
    advanceQueue(request: AdvanceQueueRequest, client: Client): Promise<MutationResponse>;
    previousQueue(request: AdvanceQueueRequest, client: Client): Promise<MutationResponse>;
    removeQueueItem(request: RemoveQueueItemRequest, client: Client): Promise<MutationResponse>;
    moveQueueItem(request: MoveQueueItemRequest, client: Client): Promise<MutationResponse>;
    setDuration(request: SetDurationRequest, client: Client): Promise<MutationResponse>;
    play(request: PlaybackRequest, client: Client): Promise<MutationResponse>;
    pause(request: PlaybackRequest, client: Client): Promise<MutationResponse>;
    seek(request: PlaybackRequest, client: Client): Promise<MutationResponse>;
    setRate(request: SetRateRequest, client: Client): Promise<MutationResponse>;
    searchSubtitles(request: SearchSubtitlesRequest, _client: Client): Promise<SearchSubtitlesResponse>;
    fetchSubtitle(request: FetchSubtitleRequest, _client: Client): Promise<FetchSubtitleResponse>;
    setSubtitle(request: SetSubtitleRequest, client: Client): Promise<MutationResponse>;
    reportSyncStatus(request: ReportSyncStatusRequest, client: Client): Promise<MutationResponse>;
    hostStartSync(request: HostStartSyncRequest, client: Client): Promise<MutationResponse>;
    hostLaunchSync(request: HostLaunchSyncRequest, client: Client): Promise<MutationResponse>;
    onUserDetached(userId: string): void;
    private removeParticipantAndReassignHost;
    private mutatePlayback;
    private clearSyncState;
    private addToQueue;
    private ensureHost;
    private getOrCreateRoom;
    private refreshMediaPipelineState;
    private pruneEmptyRooms;
    private toSummary;
    private touchState;
    private broadcastState;
    private accept;
    private acceptWithReason;
    private reject;
    private makeTestClient;
}
export declare const cineLinkService: CineLinkService;
