import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
/**
 * @generated from protobuf message RoomState
 */
export interface RoomState {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: string host_user_id = 2
     */
    hostUserId: string;
    /**
     * @generated from protobuf field: string room_name = 12
     */
    roomName: string;
    /**
     * @generated from protobuf field: string media_url = 3
     */
    mediaUrl: string;
    /**
     * @generated from protobuf field: bool playing = 4
     */
    playing: boolean;
    /**
     * @generated from protobuf field: double current_time_seconds = 5
     */
    currentTimeSeconds: number;
    /**
     * @generated from protobuf field: double playback_rate = 6
     */
    playbackRate: number;
    /**
     * @generated from protobuf field: uint64 updated_at_ms = 7
     */
    updatedAtMs: bigint;
    /**
     * @generated from protobuf field: uint64 version = 8
     */
    version: bigint;
    /**
     * @generated from protobuf field: repeated string participant_user_ids = 9
     */
    participantUserIds: string[];
    /**
     * @generated from protobuf field: double duration_seconds = 10
     */
    durationSeconds: number;
    /**
     * @generated from protobuf field: string pending_host_user_id = 11
     */
    pendingHostUserId: string;
    /**
     * @generated from protobuf field: repeated string playlist_urls = 13
     */
    playlistUrls: string[];
    /**
     * @generated from protobuf field: repeated string playlist_history_urls = 14
     */
    playlistHistoryUrls: string[];
    /**
     * @generated from protobuf field: repeated string playlist_added_by_user_ids = 15
     */
    playlistAddedByUserIds: string[];
    /**
     * @generated from protobuf field: repeated string playlist_history_added_by_user_ids = 16
     */
    playlistHistoryAddedByUserIds: string[];
    /**
     * @generated from protobuf field: string current_media_added_by_user_id = 17
     */
    currentMediaAddedByUserId: string;
    /**
     * @generated from protobuf field: bool allow_viewer_queue_add = 18
     */
    allowViewerQueueAdd: boolean;
    /**
     * @generated from protobuf field: string subtitle_label = 19
     */
    subtitleLabel: string;
    /**
     * @generated from protobuf field: string subtitle_vtt_text = 20
     */
    subtitleVttText: string;
    /**
     * @generated from protobuf field: double sync_target_seconds = 21
     */
    syncTargetSeconds: number;
    /**
     * @generated from protobuf field: uint64 sync_launch_at_ms = 22
     */
    syncLaunchAtMs: bigint;
    /**
     * @generated from protobuf field: string sync_mode = 23
     */
    syncMode: string;
    /**
     * @generated from protobuf field: repeated string sync_ready_user_ids = 24
     */
    syncReadyUserIds: string[];
    /**
     * @generated from protobuf field: string media_source_type = 25
     */
    mediaSourceType: string;
    /**
     * @generated from protobuf field: string resolved_media_url = 26
     */
    resolvedMediaUrl: string;
    /**
     * @generated from protobuf field: string media_pipeline_status = 27
     */
    mediaPipelineStatus: string;
    /**
     * @generated from protobuf field: string media_pipeline_message = 28
     */
    mediaPipelineMessage: string;
}
/**
 * @generated from protobuf message GetRoomStateRequest
 */
export interface GetRoomStateRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
}
/**
 * @generated from protobuf message LeaveRoomRequest
 */
export interface LeaveRoomRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
}
/**
 * @generated from protobuf message GetRoomStateResponse
 */
export interface GetRoomStateResponse {
    /**
     * @generated from protobuf field: RoomState state = 1
     */
    state?: RoomState;
}
/**
 * @generated from protobuf message SetHostRequest
 */
export interface SetHostRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: string host_user_id = 2
     */
    hostUserId: string;
}
/**
 * @generated from protobuf message SetMediaRequest
 */
export interface SetMediaRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: string url = 2
     */
    url: string;
}
/**
 * @generated from protobuf message PlaylistMutationRequest
 */
export interface PlaylistMutationRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: string url = 2
     */
    url: string;
}
/**
 * @generated from protobuf message AdvanceQueueRequest
 */
export interface AdvanceQueueRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: bool autoplay = 2
     */
    autoplay: boolean;
}
/**
 * @generated from protobuf message RemoveQueueItemRequest
 */
export interface RemoveQueueItemRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: uint32 index = 2
     */
    index: number;
}
/**
 * @generated from protobuf message MoveQueueItemRequest
 */
export interface MoveQueueItemRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: uint32 from_index = 2
     */
    fromIndex: number;
    /**
     * @generated from protobuf field: uint32 to_index = 3
     */
    toIndex: number;
}
/**
 * @generated from protobuf message SetRoomNameRequest
 */
export interface SetRoomNameRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: string room_name = 2
     */
    roomName: string;
}
/**
 * @generated from protobuf message SetViewerQueuePolicyRequest
 */
export interface SetViewerQueuePolicyRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: bool allow_viewer_queue_add = 2
     */
    allowViewerQueueAdd: boolean;
}
/**
 * @generated from protobuf message PlaybackRequest
 */
export interface PlaybackRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: double at_seconds = 2
     */
    atSeconds: number;
}
/**
 * @generated from protobuf message SetRateRequest
 */
export interface SetRateRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: double playback_rate = 2
     */
    playbackRate: number;
}
/**
 * @generated from protobuf message SetDurationRequest
 */
export interface SetDurationRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: double duration_seconds = 2
     */
    durationSeconds: number;
}
/**
 * @generated from protobuf message RequestHostClaimRequest
 */
export interface RequestHostClaimRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
}
/**
 * @generated from protobuf message DecideHostClaimRequest
 */
export interface DecideHostClaimRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: string requester_user_id = 2
     */
    requesterUserId: string;
    /**
     * @generated from protobuf field: bool approve = 3
     */
    approve: boolean;
}
/**
 * @generated from protobuf message ListRoomsRequest
 */
export interface ListRoomsRequest {
}
/**
 * @generated from protobuf message RoomSummary
 */
export interface RoomSummary {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: string room_name = 10
     */
    roomName: string;
    /**
     * @generated from protobuf field: string preview_media_url = 11
     */
    previewMediaUrl: string;
    /**
     * @generated from protobuf field: string host_user_id = 2
     */
    hostUserId: string;
    /**
     * @generated from protobuf field: string media_url = 3
     */
    mediaUrl: string;
    /**
     * @generated from protobuf field: bool playing = 4
     */
    playing: boolean;
    /**
     * @generated from protobuf field: double current_time_seconds = 5
     */
    currentTimeSeconds: number;
    /**
     * @generated from protobuf field: double duration_seconds = 6
     */
    durationSeconds: number;
    /**
     * @generated from protobuf field: double progress_percent = 7
     */
    progressPercent: number;
    /**
     * @generated from protobuf field: repeated string participant_user_ids = 8
     */
    participantUserIds: string[];
    /**
     * @generated from protobuf field: uint64 version = 9
     */
    version: bigint;
}
/**
 * @generated from protobuf message ListRoomsResponse
 */
export interface ListRoomsResponse {
    /**
     * @generated from protobuf field: repeated RoomSummary rooms = 1
     */
    rooms: RoomSummary[];
}
/**
 * @generated from protobuf message MutationResponse
 */
export interface MutationResponse {
    /**
     * @generated from protobuf field: bool accepted = 1
     */
    accepted: boolean;
    /**
     * @generated from protobuf field: string reason = 2
     */
    reason: string;
    /**
     * @generated from protobuf field: RoomState state = 3
     */
    state?: RoomState;
}
/**
 * @generated from protobuf message StateChangedEvent
 */
export interface StateChangedEvent {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: string action = 2
     */
    action: string;
    /**
     * @generated from protobuf field: string actor_user_id = 3
     */
    actorUserId: string;
    /**
     * @generated from protobuf field: RoomState state = 4
     */
    state?: RoomState;
}
/**
 * @generated from protobuf message SearchSubtitlesRequest
 */
export interface SearchSubtitlesRequest {
    /**
     * @generated from protobuf field: string query = 1
     */
    query: string;
    /**
     * @generated from protobuf field: string language = 2
     */
    language: string;
    /**
     * @generated from protobuf field: bool tvseries = 3
     */
    tvseries: boolean;
    /**
     * @generated from protobuf field: uint32 season = 4
     */
    season: number;
    /**
     * @generated from protobuf field: uint32 episode = 5
     */
    episode: number;
}
/**
 * @generated from protobuf message SubtitleCandidate
 */
export interface SubtitleCandidate {
    /**
     * @generated from protobuf field: string id = 1
     */
    id: string;
    /**
     * @generated from protobuf field: string provider = 2
     */
    provider: string;
    /**
     * @generated from protobuf field: string name = 3
     */
    name: string;
    /**
     * @generated from protobuf field: string download_url = 4
     */
    downloadUrl: string;
    /**
     * @generated from protobuf field: int32 score = 5
     */
    score: number;
}
/**
 * @generated from protobuf message SearchSubtitlesResponse
 */
export interface SearchSubtitlesResponse {
    /**
     * @generated from protobuf field: repeated SubtitleCandidate items = 1
     */
    items: SubtitleCandidate[];
    /**
     * @generated from protobuf field: string error = 2
     */
    error: string;
}
/**
 * @generated from protobuf message FetchSubtitleRequest
 */
export interface FetchSubtitleRequest {
    /**
     * @generated from protobuf field: string download_url = 1
     */
    downloadUrl: string;
}
/**
 * @generated from protobuf message FetchSubtitleResponse
 */
export interface FetchSubtitleResponse {
    /**
     * @generated from protobuf field: bool ok = 1
     */
    ok: boolean;
    /**
     * @generated from protobuf field: string name = 2
     */
    name: string;
    /**
     * @generated from protobuf field: string vtt_text = 3
     */
    vttText: string;
    /**
     * @generated from protobuf field: string error = 4
     */
    error: string;
}
/**
 * @generated from protobuf message SetSubtitleRequest
 */
export interface SetSubtitleRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: string subtitle_label = 2
     */
    subtitleLabel: string;
    /**
     * @generated from protobuf field: string subtitle_vtt_text = 3
     */
    subtitleVttText: string;
}
/**
 * @generated from protobuf message ReportSyncStatusRequest
 */
export interface ReportSyncStatusRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: double current_time_seconds = 2
     */
    currentTimeSeconds: number;
    /**
     * @generated from protobuf field: bool ready = 3
     */
    ready: boolean;
}
/**
 * @generated from protobuf message HostStartSyncRequest
 */
export interface HostStartSyncRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
    /**
     * @generated from protobuf field: string mode = 2
     */
    mode: string;
}
/**
 * @generated from protobuf message HostLaunchSyncRequest
 */
export interface HostLaunchSyncRequest {
    /**
     * @generated from protobuf field: string room_id = 1
     */
    roomId: string;
}
declare class RoomState$Type extends MessageType<RoomState> {
    constructor();
    create(value?: PartialMessage<RoomState>): RoomState;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: RoomState): RoomState;
    internalBinaryWrite(message: RoomState, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message RoomState
 */
export declare const RoomState: RoomState$Type;
declare class GetRoomStateRequest$Type extends MessageType<GetRoomStateRequest> {
    constructor();
    create(value?: PartialMessage<GetRoomStateRequest>): GetRoomStateRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: GetRoomStateRequest): GetRoomStateRequest;
    internalBinaryWrite(message: GetRoomStateRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message GetRoomStateRequest
 */
export declare const GetRoomStateRequest: GetRoomStateRequest$Type;
declare class LeaveRoomRequest$Type extends MessageType<LeaveRoomRequest> {
    constructor();
    create(value?: PartialMessage<LeaveRoomRequest>): LeaveRoomRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: LeaveRoomRequest): LeaveRoomRequest;
    internalBinaryWrite(message: LeaveRoomRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message LeaveRoomRequest
 */
export declare const LeaveRoomRequest: LeaveRoomRequest$Type;
declare class GetRoomStateResponse$Type extends MessageType<GetRoomStateResponse> {
    constructor();
    create(value?: PartialMessage<GetRoomStateResponse>): GetRoomStateResponse;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: GetRoomStateResponse): GetRoomStateResponse;
    internalBinaryWrite(message: GetRoomStateResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message GetRoomStateResponse
 */
export declare const GetRoomStateResponse: GetRoomStateResponse$Type;
declare class SetHostRequest$Type extends MessageType<SetHostRequest> {
    constructor();
    create(value?: PartialMessage<SetHostRequest>): SetHostRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: SetHostRequest): SetHostRequest;
    internalBinaryWrite(message: SetHostRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message SetHostRequest
 */
export declare const SetHostRequest: SetHostRequest$Type;
declare class SetMediaRequest$Type extends MessageType<SetMediaRequest> {
    constructor();
    create(value?: PartialMessage<SetMediaRequest>): SetMediaRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: SetMediaRequest): SetMediaRequest;
    internalBinaryWrite(message: SetMediaRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message SetMediaRequest
 */
export declare const SetMediaRequest: SetMediaRequest$Type;
declare class PlaylistMutationRequest$Type extends MessageType<PlaylistMutationRequest> {
    constructor();
    create(value?: PartialMessage<PlaylistMutationRequest>): PlaylistMutationRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: PlaylistMutationRequest): PlaylistMutationRequest;
    internalBinaryWrite(message: PlaylistMutationRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message PlaylistMutationRequest
 */
export declare const PlaylistMutationRequest: PlaylistMutationRequest$Type;
declare class AdvanceQueueRequest$Type extends MessageType<AdvanceQueueRequest> {
    constructor();
    create(value?: PartialMessage<AdvanceQueueRequest>): AdvanceQueueRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: AdvanceQueueRequest): AdvanceQueueRequest;
    internalBinaryWrite(message: AdvanceQueueRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message AdvanceQueueRequest
 */
export declare const AdvanceQueueRequest: AdvanceQueueRequest$Type;
declare class RemoveQueueItemRequest$Type extends MessageType<RemoveQueueItemRequest> {
    constructor();
    create(value?: PartialMessage<RemoveQueueItemRequest>): RemoveQueueItemRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: RemoveQueueItemRequest): RemoveQueueItemRequest;
    internalBinaryWrite(message: RemoveQueueItemRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message RemoveQueueItemRequest
 */
export declare const RemoveQueueItemRequest: RemoveQueueItemRequest$Type;
declare class MoveQueueItemRequest$Type extends MessageType<MoveQueueItemRequest> {
    constructor();
    create(value?: PartialMessage<MoveQueueItemRequest>): MoveQueueItemRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: MoveQueueItemRequest): MoveQueueItemRequest;
    internalBinaryWrite(message: MoveQueueItemRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message MoveQueueItemRequest
 */
export declare const MoveQueueItemRequest: MoveQueueItemRequest$Type;
declare class SetRoomNameRequest$Type extends MessageType<SetRoomNameRequest> {
    constructor();
    create(value?: PartialMessage<SetRoomNameRequest>): SetRoomNameRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: SetRoomNameRequest): SetRoomNameRequest;
    internalBinaryWrite(message: SetRoomNameRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message SetRoomNameRequest
 */
export declare const SetRoomNameRequest: SetRoomNameRequest$Type;
declare class SetViewerQueuePolicyRequest$Type extends MessageType<SetViewerQueuePolicyRequest> {
    constructor();
    create(value?: PartialMessage<SetViewerQueuePolicyRequest>): SetViewerQueuePolicyRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: SetViewerQueuePolicyRequest): SetViewerQueuePolicyRequest;
    internalBinaryWrite(message: SetViewerQueuePolicyRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message SetViewerQueuePolicyRequest
 */
export declare const SetViewerQueuePolicyRequest: SetViewerQueuePolicyRequest$Type;
declare class PlaybackRequest$Type extends MessageType<PlaybackRequest> {
    constructor();
    create(value?: PartialMessage<PlaybackRequest>): PlaybackRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: PlaybackRequest): PlaybackRequest;
    internalBinaryWrite(message: PlaybackRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message PlaybackRequest
 */
export declare const PlaybackRequest: PlaybackRequest$Type;
declare class SetRateRequest$Type extends MessageType<SetRateRequest> {
    constructor();
    create(value?: PartialMessage<SetRateRequest>): SetRateRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: SetRateRequest): SetRateRequest;
    internalBinaryWrite(message: SetRateRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message SetRateRequest
 */
export declare const SetRateRequest: SetRateRequest$Type;
declare class SetDurationRequest$Type extends MessageType<SetDurationRequest> {
    constructor();
    create(value?: PartialMessage<SetDurationRequest>): SetDurationRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: SetDurationRequest): SetDurationRequest;
    internalBinaryWrite(message: SetDurationRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message SetDurationRequest
 */
export declare const SetDurationRequest: SetDurationRequest$Type;
declare class RequestHostClaimRequest$Type extends MessageType<RequestHostClaimRequest> {
    constructor();
    create(value?: PartialMessage<RequestHostClaimRequest>): RequestHostClaimRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: RequestHostClaimRequest): RequestHostClaimRequest;
    internalBinaryWrite(message: RequestHostClaimRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message RequestHostClaimRequest
 */
export declare const RequestHostClaimRequest: RequestHostClaimRequest$Type;
declare class DecideHostClaimRequest$Type extends MessageType<DecideHostClaimRequest> {
    constructor();
    create(value?: PartialMessage<DecideHostClaimRequest>): DecideHostClaimRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: DecideHostClaimRequest): DecideHostClaimRequest;
    internalBinaryWrite(message: DecideHostClaimRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message DecideHostClaimRequest
 */
export declare const DecideHostClaimRequest: DecideHostClaimRequest$Type;
declare class ListRoomsRequest$Type extends MessageType<ListRoomsRequest> {
    constructor();
    create(value?: PartialMessage<ListRoomsRequest>): ListRoomsRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ListRoomsRequest): ListRoomsRequest;
    internalBinaryWrite(message: ListRoomsRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message ListRoomsRequest
 */
export declare const ListRoomsRequest: ListRoomsRequest$Type;
declare class RoomSummary$Type extends MessageType<RoomSummary> {
    constructor();
    create(value?: PartialMessage<RoomSummary>): RoomSummary;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: RoomSummary): RoomSummary;
    internalBinaryWrite(message: RoomSummary, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message RoomSummary
 */
export declare const RoomSummary: RoomSummary$Type;
declare class ListRoomsResponse$Type extends MessageType<ListRoomsResponse> {
    constructor();
    create(value?: PartialMessage<ListRoomsResponse>): ListRoomsResponse;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ListRoomsResponse): ListRoomsResponse;
    internalBinaryWrite(message: ListRoomsResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message ListRoomsResponse
 */
export declare const ListRoomsResponse: ListRoomsResponse$Type;
declare class MutationResponse$Type extends MessageType<MutationResponse> {
    constructor();
    create(value?: PartialMessage<MutationResponse>): MutationResponse;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: MutationResponse): MutationResponse;
    internalBinaryWrite(message: MutationResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message MutationResponse
 */
export declare const MutationResponse: MutationResponse$Type;
declare class StateChangedEvent$Type extends MessageType<StateChangedEvent> {
    constructor();
    create(value?: PartialMessage<StateChangedEvent>): StateChangedEvent;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: StateChangedEvent): StateChangedEvent;
    internalBinaryWrite(message: StateChangedEvent, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message StateChangedEvent
 */
export declare const StateChangedEvent: StateChangedEvent$Type;
declare class SearchSubtitlesRequest$Type extends MessageType<SearchSubtitlesRequest> {
    constructor();
    create(value?: PartialMessage<SearchSubtitlesRequest>): SearchSubtitlesRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: SearchSubtitlesRequest): SearchSubtitlesRequest;
    internalBinaryWrite(message: SearchSubtitlesRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message SearchSubtitlesRequest
 */
export declare const SearchSubtitlesRequest: SearchSubtitlesRequest$Type;
declare class SubtitleCandidate$Type extends MessageType<SubtitleCandidate> {
    constructor();
    create(value?: PartialMessage<SubtitleCandidate>): SubtitleCandidate;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: SubtitleCandidate): SubtitleCandidate;
    internalBinaryWrite(message: SubtitleCandidate, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message SubtitleCandidate
 */
export declare const SubtitleCandidate: SubtitleCandidate$Type;
declare class SearchSubtitlesResponse$Type extends MessageType<SearchSubtitlesResponse> {
    constructor();
    create(value?: PartialMessage<SearchSubtitlesResponse>): SearchSubtitlesResponse;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: SearchSubtitlesResponse): SearchSubtitlesResponse;
    internalBinaryWrite(message: SearchSubtitlesResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message SearchSubtitlesResponse
 */
export declare const SearchSubtitlesResponse: SearchSubtitlesResponse$Type;
declare class FetchSubtitleRequest$Type extends MessageType<FetchSubtitleRequest> {
    constructor();
    create(value?: PartialMessage<FetchSubtitleRequest>): FetchSubtitleRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: FetchSubtitleRequest): FetchSubtitleRequest;
    internalBinaryWrite(message: FetchSubtitleRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message FetchSubtitleRequest
 */
export declare const FetchSubtitleRequest: FetchSubtitleRequest$Type;
declare class FetchSubtitleResponse$Type extends MessageType<FetchSubtitleResponse> {
    constructor();
    create(value?: PartialMessage<FetchSubtitleResponse>): FetchSubtitleResponse;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: FetchSubtitleResponse): FetchSubtitleResponse;
    internalBinaryWrite(message: FetchSubtitleResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message FetchSubtitleResponse
 */
export declare const FetchSubtitleResponse: FetchSubtitleResponse$Type;
declare class SetSubtitleRequest$Type extends MessageType<SetSubtitleRequest> {
    constructor();
    create(value?: PartialMessage<SetSubtitleRequest>): SetSubtitleRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: SetSubtitleRequest): SetSubtitleRequest;
    internalBinaryWrite(message: SetSubtitleRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message SetSubtitleRequest
 */
export declare const SetSubtitleRequest: SetSubtitleRequest$Type;
declare class ReportSyncStatusRequest$Type extends MessageType<ReportSyncStatusRequest> {
    constructor();
    create(value?: PartialMessage<ReportSyncStatusRequest>): ReportSyncStatusRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ReportSyncStatusRequest): ReportSyncStatusRequest;
    internalBinaryWrite(message: ReportSyncStatusRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message ReportSyncStatusRequest
 */
export declare const ReportSyncStatusRequest: ReportSyncStatusRequest$Type;
declare class HostStartSyncRequest$Type extends MessageType<HostStartSyncRequest> {
    constructor();
    create(value?: PartialMessage<HostStartSyncRequest>): HostStartSyncRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: HostStartSyncRequest): HostStartSyncRequest;
    internalBinaryWrite(message: HostStartSyncRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message HostStartSyncRequest
 */
export declare const HostStartSyncRequest: HostStartSyncRequest$Type;
declare class HostLaunchSyncRequest$Type extends MessageType<HostLaunchSyncRequest> {
    constructor();
    create(value?: PartialMessage<HostLaunchSyncRequest>): HostLaunchSyncRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: HostLaunchSyncRequest): HostLaunchSyncRequest;
    internalBinaryWrite(message: HostLaunchSyncRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message HostLaunchSyncRequest
 */
export declare const HostLaunchSyncRequest: HostLaunchSyncRequest$Type;
export {};
