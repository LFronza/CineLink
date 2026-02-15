import { AdvanceQueueRequest, DecideHostClaimRequest, FetchSubtitleRequest, FetchSubtitleResponse, GetRoomStateRequest, GetRoomStateResponse, LeaveRoomRequest, ListRoomsRequest, ListRoomsResponse, MoveQueueItemRequest, MutationResponse, PlaybackRequest, PlaylistMutationRequest, RemoveQueueItemRequest, RequestHostClaimRequest, SearchSubtitlesRequest, SearchSubtitlesResponse, SetDurationRequest, SetHostRequest, SetMediaRequest, SetRateRequest, SetRoomNameRequest, SetSubtitleRequest, SetViewerQueuePolicyRequest, StateChangedEvent } from "@cinelink/gen-shared";
import { RootClientService, TypedEventEmitter } from "@rootsdk/client-app";
export declare enum CineLinkServiceClientEvent {
    StateChanged = "broadcastStateChanged"
}
export type CineLinkServiceClientEvents = {
    'broadcastStateChanged': (event: StateChangedEvent) => void;
};
declare const CineLinkServiceClient_base: new () => TypedEventEmitter<CineLinkServiceClientEvents>;
export declare class CineLinkServiceClient extends CineLinkServiceClient_base implements RootClientService {
    constructor();
    get ClientServiceName(): string;
    listRooms(request: ListRoomsRequest): Promise<ListRoomsResponse>;
    getRoomState(request: GetRoomStateRequest): Promise<GetRoomStateResponse>;
    leaveRoom(request: LeaveRoomRequest): Promise<MutationResponse>;
    setHost(request: SetHostRequest): Promise<MutationResponse>;
    setRoomName(request: SetRoomNameRequest): Promise<MutationResponse>;
    setViewerQueuePolicy(request: SetViewerQueuePolicyRequest): Promise<MutationResponse>;
    requestHostClaim(request: RequestHostClaimRequest): Promise<MutationResponse>;
    decideHostClaim(request: DecideHostClaimRequest): Promise<MutationResponse>;
    setMedia(request: SetMediaRequest): Promise<MutationResponse>;
    addQueueNext(request: PlaylistMutationRequest): Promise<MutationResponse>;
    addQueueLast(request: PlaylistMutationRequest): Promise<MutationResponse>;
    advanceQueue(request: AdvanceQueueRequest): Promise<MutationResponse>;
    previousQueue(request: AdvanceQueueRequest): Promise<MutationResponse>;
    removeQueueItem(request: RemoveQueueItemRequest): Promise<MutationResponse>;
    moveQueueItem(request: MoveQueueItemRequest): Promise<MutationResponse>;
    setDuration(request: SetDurationRequest): Promise<MutationResponse>;
    play(request: PlaybackRequest): Promise<MutationResponse>;
    pause(request: PlaybackRequest): Promise<MutationResponse>;
    seek(request: PlaybackRequest): Promise<MutationResponse>;
    setRate(request: SetRateRequest): Promise<MutationResponse>;
    searchSubtitles(request: SearchSubtitlesRequest): Promise<SearchSubtitlesResponse>;
    fetchSubtitle(request: FetchSubtitleRequest): Promise<FetchSubtitleResponse>;
    setSubtitle(request: SetSubtitleRequest): Promise<MutationResponse>;
    private __register;
}
export declare const cineLinkServiceClient: CineLinkServiceClient;
export {};
