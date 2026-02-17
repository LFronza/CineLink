import { WireType } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
// @generated message type with reflection information, may provide speed optimized methods
class RoomState$Type extends MessageType {
    constructor() {
        super("RoomState", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "host_user_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 12, name: "room_name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "media_url", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "playing", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 5, name: "current_time_seconds", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 6, name: "playback_rate", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 7, name: "updated_at_ms", kind: "scalar", T: 4 /*ScalarType.UINT64*/, L: 0 /*LongType.BIGINT*/ },
            { no: 8, name: "version", kind: "scalar", T: 4 /*ScalarType.UINT64*/, L: 0 /*LongType.BIGINT*/ },
            { no: 9, name: "participant_user_ids", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 10, name: "duration_seconds", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 11, name: "pending_host_user_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 13, name: "playlist_urls", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 14, name: "playlist_history_urls", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 15, name: "playlist_added_by_user_ids", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 16, name: "playlist_history_added_by_user_ids", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 17, name: "current_media_added_by_user_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 18, name: "allow_viewer_queue_add", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 19, name: "subtitle_label", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 20, name: "subtitle_vtt_text", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 21, name: "sync_target_seconds", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 22, name: "sync_launch_at_ms", kind: "scalar", T: 4 /*ScalarType.UINT64*/, L: 0 /*LongType.BIGINT*/ },
            { no: 23, name: "sync_mode", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 24, name: "sync_ready_user_ids", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 25, name: "media_source_type", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 26, name: "resolved_media_url", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 27, name: "media_pipeline_status", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 28, name: "media_pipeline_message", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.hostUserId = "";
        message.roomName = "";
        message.mediaUrl = "";
        message.playing = false;
        message.currentTimeSeconds = 0;
        message.playbackRate = 0;
        message.updatedAtMs = 0n;
        message.version = 0n;
        message.participantUserIds = [];
        message.durationSeconds = 0;
        message.pendingHostUserId = "";
        message.playlistUrls = [];
        message.playlistHistoryUrls = [];
        message.playlistAddedByUserIds = [];
        message.playlistHistoryAddedByUserIds = [];
        message.currentMediaAddedByUserId = "";
        message.allowViewerQueueAdd = false;
        message.subtitleLabel = "";
        message.subtitleVttText = "";
        message.syncTargetSeconds = 0;
        message.syncLaunchAtMs = 0n;
        message.syncMode = "";
        message.syncReadyUserIds = [];
        message.mediaSourceType = "";
        message.resolvedMediaUrl = "";
        message.mediaPipelineStatus = "";
        message.mediaPipelineMessage = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* string host_user_id */ 2:
                    message.hostUserId = reader.string();
                    break;
                case /* string room_name */ 12:
                    message.roomName = reader.string();
                    break;
                case /* string media_url */ 3:
                    message.mediaUrl = reader.string();
                    break;
                case /* bool playing */ 4:
                    message.playing = reader.bool();
                    break;
                case /* double current_time_seconds */ 5:
                    message.currentTimeSeconds = reader.double();
                    break;
                case /* double playback_rate */ 6:
                    message.playbackRate = reader.double();
                    break;
                case /* uint64 updated_at_ms */ 7:
                    message.updatedAtMs = reader.uint64().toBigInt();
                    break;
                case /* uint64 version */ 8:
                    message.version = reader.uint64().toBigInt();
                    break;
                case /* repeated string participant_user_ids */ 9:
                    message.participantUserIds.push(reader.string());
                    break;
                case /* double duration_seconds */ 10:
                    message.durationSeconds = reader.double();
                    break;
                case /* string pending_host_user_id */ 11:
                    message.pendingHostUserId = reader.string();
                    break;
                case /* repeated string playlist_urls */ 13:
                    message.playlistUrls.push(reader.string());
                    break;
                case /* repeated string playlist_history_urls */ 14:
                    message.playlistHistoryUrls.push(reader.string());
                    break;
                case /* repeated string playlist_added_by_user_ids */ 15:
                    message.playlistAddedByUserIds.push(reader.string());
                    break;
                case /* repeated string playlist_history_added_by_user_ids */ 16:
                    message.playlistHistoryAddedByUserIds.push(reader.string());
                    break;
                case /* string current_media_added_by_user_id */ 17:
                    message.currentMediaAddedByUserId = reader.string();
                    break;
                case /* bool allow_viewer_queue_add */ 18:
                    message.allowViewerQueueAdd = reader.bool();
                    break;
                case /* string subtitle_label */ 19:
                    message.subtitleLabel = reader.string();
                    break;
                case /* string subtitle_vtt_text */ 20:
                    message.subtitleVttText = reader.string();
                    break;
                case /* double sync_target_seconds */ 21:
                    message.syncTargetSeconds = reader.double();
                    break;
                case /* uint64 sync_launch_at_ms */ 22:
                    message.syncLaunchAtMs = reader.uint64().toBigInt();
                    break;
                case /* string sync_mode */ 23:
                    message.syncMode = reader.string();
                    break;
                case /* repeated string sync_ready_user_ids */ 24:
                    message.syncReadyUserIds.push(reader.string());
                    break;
                case /* string media_source_type */ 25:
                    message.mediaSourceType = reader.string();
                    break;
                case /* string resolved_media_url */ 26:
                    message.resolvedMediaUrl = reader.string();
                    break;
                case /* string media_pipeline_status */ 27:
                    message.mediaPipelineStatus = reader.string();
                    break;
                case /* string media_pipeline_message */ 28:
                    message.mediaPipelineMessage = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* string host_user_id = 2; */
        if (message.hostUserId !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.hostUserId);
        /* string media_url = 3; */
        if (message.mediaUrl !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.mediaUrl);
        /* bool playing = 4; */
        if (message.playing !== false)
            writer.tag(4, WireType.Varint).bool(message.playing);
        /* double current_time_seconds = 5; */
        if (message.currentTimeSeconds !== 0)
            writer.tag(5, WireType.Bit64).double(message.currentTimeSeconds);
        /* double playback_rate = 6; */
        if (message.playbackRate !== 0)
            writer.tag(6, WireType.Bit64).double(message.playbackRate);
        /* uint64 updated_at_ms = 7; */
        if (message.updatedAtMs !== 0n)
            writer.tag(7, WireType.Varint).uint64(message.updatedAtMs);
        /* uint64 version = 8; */
        if (message.version !== 0n)
            writer.tag(8, WireType.Varint).uint64(message.version);
        /* repeated string participant_user_ids = 9; */
        for (let i = 0; i < message.participantUserIds.length; i++)
            writer.tag(9, WireType.LengthDelimited).string(message.participantUserIds[i]);
        /* double duration_seconds = 10; */
        if (message.durationSeconds !== 0)
            writer.tag(10, WireType.Bit64).double(message.durationSeconds);
        /* string pending_host_user_id = 11; */
        if (message.pendingHostUserId !== "")
            writer.tag(11, WireType.LengthDelimited).string(message.pendingHostUserId);
        /* string room_name = 12; */
        if (message.roomName !== "")
            writer.tag(12, WireType.LengthDelimited).string(message.roomName);
        /* repeated string playlist_urls = 13; */
        for (let i = 0; i < message.playlistUrls.length; i++)
            writer.tag(13, WireType.LengthDelimited).string(message.playlistUrls[i]);
        /* repeated string playlist_history_urls = 14; */
        for (let i = 0; i < message.playlistHistoryUrls.length; i++)
            writer.tag(14, WireType.LengthDelimited).string(message.playlistHistoryUrls[i]);
        /* repeated string playlist_added_by_user_ids = 15; */
        for (let i = 0; i < message.playlistAddedByUserIds.length; i++)
            writer.tag(15, WireType.LengthDelimited).string(message.playlistAddedByUserIds[i]);
        /* repeated string playlist_history_added_by_user_ids = 16; */
        for (let i = 0; i < message.playlistHistoryAddedByUserIds.length; i++)
            writer.tag(16, WireType.LengthDelimited).string(message.playlistHistoryAddedByUserIds[i]);
        /* string current_media_added_by_user_id = 17; */
        if (message.currentMediaAddedByUserId !== "")
            writer.tag(17, WireType.LengthDelimited).string(message.currentMediaAddedByUserId);
        /* bool allow_viewer_queue_add = 18; */
        if (message.allowViewerQueueAdd !== false)
            writer.tag(18, WireType.Varint).bool(message.allowViewerQueueAdd);
        /* string subtitle_label = 19; */
        if (message.subtitleLabel !== "")
            writer.tag(19, WireType.LengthDelimited).string(message.subtitleLabel);
        /* string subtitle_vtt_text = 20; */
        if (message.subtitleVttText !== "")
            writer.tag(20, WireType.LengthDelimited).string(message.subtitleVttText);
        /* double sync_target_seconds = 21; */
        if (message.syncTargetSeconds !== 0)
            writer.tag(21, WireType.Bit64).double(message.syncTargetSeconds);
        /* uint64 sync_launch_at_ms = 22; */
        if (message.syncLaunchAtMs !== 0n)
            writer.tag(22, WireType.Varint).uint64(message.syncLaunchAtMs);
        /* string sync_mode = 23; */
        if (message.syncMode !== "")
            writer.tag(23, WireType.LengthDelimited).string(message.syncMode);
        /* repeated string sync_ready_user_ids = 24; */
        for (let i = 0; i < message.syncReadyUserIds.length; i++)
            writer.tag(24, WireType.LengthDelimited).string(message.syncReadyUserIds[i]);
        /* string media_source_type = 25; */
        if (message.mediaSourceType !== "")
            writer.tag(25, WireType.LengthDelimited).string(message.mediaSourceType);
        /* string resolved_media_url = 26; */
        if (message.resolvedMediaUrl !== "")
            writer.tag(26, WireType.LengthDelimited).string(message.resolvedMediaUrl);
        /* string media_pipeline_status = 27; */
        if (message.mediaPipelineStatus !== "")
            writer.tag(27, WireType.LengthDelimited).string(message.mediaPipelineStatus);
        /* string media_pipeline_message = 28; */
        if (message.mediaPipelineMessage !== "")
            writer.tag(28, WireType.LengthDelimited).string(message.mediaPipelineMessage);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message RoomState
 */
export const RoomState = new RoomState$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetRoomStateRequest$Type extends MessageType {
    constructor() {
        super("GetRoomStateRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GetRoomStateRequest
 */
export const GetRoomStateRequest = new GetRoomStateRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class LeaveRoomRequest$Type extends MessageType {
    constructor() {
        super("LeaveRoomRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message LeaveRoomRequest
 */
export const LeaveRoomRequest = new LeaveRoomRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetRoomStateResponse$Type extends MessageType {
    constructor() {
        super("GetRoomStateResponse", [
            { no: 1, name: "state", kind: "message", T: () => RoomState }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* RoomState state */ 1:
                    message.state = RoomState.internalBinaryRead(reader, reader.uint32(), options, message.state);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* RoomState state = 1; */
        if (message.state)
            RoomState.internalBinaryWrite(message.state, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GetRoomStateResponse
 */
export const GetRoomStateResponse = new GetRoomStateResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetHostRequest$Type extends MessageType {
    constructor() {
        super("SetHostRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "host_user_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.hostUserId = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* string host_user_id */ 2:
                    message.hostUserId = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* string host_user_id = 2; */
        if (message.hostUserId !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.hostUserId);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetHostRequest
 */
export const SetHostRequest = new SetHostRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetMediaRequest$Type extends MessageType {
    constructor() {
        super("SetMediaRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "url", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.url = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* string url */ 2:
                    message.url = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* string url = 2; */
        if (message.url !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.url);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetMediaRequest
 */
export const SetMediaRequest = new SetMediaRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class PlaylistMutationRequest$Type extends MessageType {
    constructor() {
        super("PlaylistMutationRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "url", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.url = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* string url */ 2:
                    message.url = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* string url = 2; */
        if (message.url !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.url);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message PlaylistMutationRequest
 */
export const PlaylistMutationRequest = new PlaylistMutationRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class AdvanceQueueRequest$Type extends MessageType {
    constructor() {
        super("AdvanceQueueRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "autoplay", kind: "scalar", T: 8 /*ScalarType.BOOL*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.autoplay = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* bool autoplay */ 2:
                    message.autoplay = reader.bool();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* bool autoplay = 2; */
        if (message.autoplay !== false)
            writer.tag(2, WireType.Varint).bool(message.autoplay);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message AdvanceQueueRequest
 */
export const AdvanceQueueRequest = new AdvanceQueueRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class RemoveQueueItemRequest$Type extends MessageType {
    constructor() {
        super("RemoveQueueItemRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "index", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.index = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* uint32 index */ 2:
                    message.index = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* uint32 index = 2; */
        if (message.index !== 0)
            writer.tag(2, WireType.Varint).uint32(message.index);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message RemoveQueueItemRequest
 */
export const RemoveQueueItemRequest = new RemoveQueueItemRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class MoveQueueItemRequest$Type extends MessageType {
    constructor() {
        super("MoveQueueItemRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "from_index", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 3, name: "to_index", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.fromIndex = 0;
        message.toIndex = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* uint32 from_index */ 2:
                    message.fromIndex = reader.uint32();
                    break;
                case /* uint32 to_index */ 3:
                    message.toIndex = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* uint32 from_index = 2; */
        if (message.fromIndex !== 0)
            writer.tag(2, WireType.Varint).uint32(message.fromIndex);
        /* uint32 to_index = 3; */
        if (message.toIndex !== 0)
            writer.tag(3, WireType.Varint).uint32(message.toIndex);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message MoveQueueItemRequest
 */
export const MoveQueueItemRequest = new MoveQueueItemRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetRoomNameRequest$Type extends MessageType {
    constructor() {
        super("SetRoomNameRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "room_name", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.roomName = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* string room_name */ 2:
                    message.roomName = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* string room_name = 2; */
        if (message.roomName !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.roomName);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetRoomNameRequest
 */
export const SetRoomNameRequest = new SetRoomNameRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetViewerQueuePolicyRequest$Type extends MessageType {
    constructor() {
        super("SetViewerQueuePolicyRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "allow_viewer_queue_add", kind: "scalar", T: 8 /*ScalarType.BOOL*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.allowViewerQueueAdd = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* bool allow_viewer_queue_add */ 2:
                    message.allowViewerQueueAdd = reader.bool();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* bool allow_viewer_queue_add = 2; */
        if (message.allowViewerQueueAdd !== false)
            writer.tag(2, WireType.Varint).bool(message.allowViewerQueueAdd);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetViewerQueuePolicyRequest
 */
export const SetViewerQueuePolicyRequest = new SetViewerQueuePolicyRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class PlaybackRequest$Type extends MessageType {
    constructor() {
        super("PlaybackRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "at_seconds", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.atSeconds = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* double at_seconds */ 2:
                    message.atSeconds = reader.double();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* double at_seconds = 2; */
        if (message.atSeconds !== 0)
            writer.tag(2, WireType.Bit64).double(message.atSeconds);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message PlaybackRequest
 */
export const PlaybackRequest = new PlaybackRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetRateRequest$Type extends MessageType {
    constructor() {
        super("SetRateRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "playback_rate", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.playbackRate = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* double playback_rate */ 2:
                    message.playbackRate = reader.double();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* double playback_rate = 2; */
        if (message.playbackRate !== 0)
            writer.tag(2, WireType.Bit64).double(message.playbackRate);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetRateRequest
 */
export const SetRateRequest = new SetRateRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetDurationRequest$Type extends MessageType {
    constructor() {
        super("SetDurationRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "duration_seconds", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.durationSeconds = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* double duration_seconds */ 2:
                    message.durationSeconds = reader.double();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* double duration_seconds = 2; */
        if (message.durationSeconds !== 0)
            writer.tag(2, WireType.Bit64).double(message.durationSeconds);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetDurationRequest
 */
export const SetDurationRequest = new SetDurationRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class RequestHostClaimRequest$Type extends MessageType {
    constructor() {
        super("RequestHostClaimRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message RequestHostClaimRequest
 */
export const RequestHostClaimRequest = new RequestHostClaimRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DecideHostClaimRequest$Type extends MessageType {
    constructor() {
        super("DecideHostClaimRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "requester_user_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "approve", kind: "scalar", T: 8 /*ScalarType.BOOL*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.requesterUserId = "";
        message.approve = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* string requester_user_id */ 2:
                    message.requesterUserId = reader.string();
                    break;
                case /* bool approve */ 3:
                    message.approve = reader.bool();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* string requester_user_id = 2; */
        if (message.requesterUserId !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.requesterUserId);
        /* bool approve = 3; */
        if (message.approve !== false)
            writer.tag(3, WireType.Varint).bool(message.approve);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DecideHostClaimRequest
 */
export const DecideHostClaimRequest = new DecideHostClaimRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ListRoomsRequest$Type extends MessageType {
    constructor() {
        super("ListRoomsRequest", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ListRoomsRequest
 */
export const ListRoomsRequest = new ListRoomsRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class RoomSummary$Type extends MessageType {
    constructor() {
        super("RoomSummary", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 10, name: "room_name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 11, name: "preview_media_url", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "host_user_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "media_url", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "playing", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 5, name: "current_time_seconds", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 6, name: "duration_seconds", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 7, name: "progress_percent", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 8, name: "participant_user_ids", kind: "scalar", repeat: 2 /*RepeatType.UNPACKED*/, T: 9 /*ScalarType.STRING*/ },
            { no: 9, name: "version", kind: "scalar", T: 4 /*ScalarType.UINT64*/, L: 0 /*LongType.BIGINT*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.roomName = "";
        message.previewMediaUrl = "";
        message.hostUserId = "";
        message.mediaUrl = "";
        message.playing = false;
        message.currentTimeSeconds = 0;
        message.durationSeconds = 0;
        message.progressPercent = 0;
        message.participantUserIds = [];
        message.version = 0n;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* string room_name */ 10:
                    message.roomName = reader.string();
                    break;
                case /* string preview_media_url */ 11:
                    message.previewMediaUrl = reader.string();
                    break;
                case /* string host_user_id */ 2:
                    message.hostUserId = reader.string();
                    break;
                case /* string media_url */ 3:
                    message.mediaUrl = reader.string();
                    break;
                case /* bool playing */ 4:
                    message.playing = reader.bool();
                    break;
                case /* double current_time_seconds */ 5:
                    message.currentTimeSeconds = reader.double();
                    break;
                case /* double duration_seconds */ 6:
                    message.durationSeconds = reader.double();
                    break;
                case /* double progress_percent */ 7:
                    message.progressPercent = reader.double();
                    break;
                case /* repeated string participant_user_ids */ 8:
                    message.participantUserIds.push(reader.string());
                    break;
                case /* uint64 version */ 9:
                    message.version = reader.uint64().toBigInt();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* string host_user_id = 2; */
        if (message.hostUserId !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.hostUserId);
        /* string media_url = 3; */
        if (message.mediaUrl !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.mediaUrl);
        /* bool playing = 4; */
        if (message.playing !== false)
            writer.tag(4, WireType.Varint).bool(message.playing);
        /* double current_time_seconds = 5; */
        if (message.currentTimeSeconds !== 0)
            writer.tag(5, WireType.Bit64).double(message.currentTimeSeconds);
        /* double duration_seconds = 6; */
        if (message.durationSeconds !== 0)
            writer.tag(6, WireType.Bit64).double(message.durationSeconds);
        /* double progress_percent = 7; */
        if (message.progressPercent !== 0)
            writer.tag(7, WireType.Bit64).double(message.progressPercent);
        /* repeated string participant_user_ids = 8; */
        for (let i = 0; i < message.participantUserIds.length; i++)
            writer.tag(8, WireType.LengthDelimited).string(message.participantUserIds[i]);
        /* uint64 version = 9; */
        if (message.version !== 0n)
            writer.tag(9, WireType.Varint).uint64(message.version);
        /* string room_name = 10; */
        if (message.roomName !== "")
            writer.tag(10, WireType.LengthDelimited).string(message.roomName);
        /* string preview_media_url = 11; */
        if (message.previewMediaUrl !== "")
            writer.tag(11, WireType.LengthDelimited).string(message.previewMediaUrl);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message RoomSummary
 */
export const RoomSummary = new RoomSummary$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ListRoomsResponse$Type extends MessageType {
    constructor() {
        super("ListRoomsResponse", [
            { no: 1, name: "rooms", kind: "message", repeat: 2 /*RepeatType.UNPACKED*/, T: () => RoomSummary }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.rooms = [];
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated RoomSummary rooms */ 1:
                    message.rooms.push(RoomSummary.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* repeated RoomSummary rooms = 1; */
        for (let i = 0; i < message.rooms.length; i++)
            RoomSummary.internalBinaryWrite(message.rooms[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ListRoomsResponse
 */
export const ListRoomsResponse = new ListRoomsResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class MutationResponse$Type extends MessageType {
    constructor() {
        super("MutationResponse", [
            { no: 1, name: "accepted", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 2, name: "reason", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "state", kind: "message", T: () => RoomState }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.accepted = false;
        message.reason = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* bool accepted */ 1:
                    message.accepted = reader.bool();
                    break;
                case /* string reason */ 2:
                    message.reason = reader.string();
                    break;
                case /* RoomState state */ 3:
                    message.state = RoomState.internalBinaryRead(reader, reader.uint32(), options, message.state);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* bool accepted = 1; */
        if (message.accepted !== false)
            writer.tag(1, WireType.Varint).bool(message.accepted);
        /* string reason = 2; */
        if (message.reason !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.reason);
        /* RoomState state = 3; */
        if (message.state)
            RoomState.internalBinaryWrite(message.state, writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message MutationResponse
 */
export const MutationResponse = new MutationResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class StateChangedEvent$Type extends MessageType {
    constructor() {
        super("StateChangedEvent", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "action", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "actor_user_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "state", kind: "message", T: () => RoomState }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.action = "";
        message.actorUserId = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* string action */ 2:
                    message.action = reader.string();
                    break;
                case /* string actor_user_id */ 3:
                    message.actorUserId = reader.string();
                    break;
                case /* RoomState state */ 4:
                    message.state = RoomState.internalBinaryRead(reader, reader.uint32(), options, message.state);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* string action = 2; */
        if (message.action !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.action);
        /* string actor_user_id = 3; */
        if (message.actorUserId !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.actorUserId);
        /* RoomState state = 4; */
        if (message.state)
            RoomState.internalBinaryWrite(message.state, writer.tag(4, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message StateChangedEvent
 */
export const StateChangedEvent = new StateChangedEvent$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SearchSubtitlesRequest$Type extends MessageType {
    constructor() {
        super("SearchSubtitlesRequest", [
            { no: 1, name: "query", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "language", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "tvseries", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 4, name: "season", kind: "scalar", T: 13 /*ScalarType.UINT32*/ },
            { no: 5, name: "episode", kind: "scalar", T: 13 /*ScalarType.UINT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.query = "";
        message.language = "";
        message.tvseries = false;
        message.season = 0;
        message.episode = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string query */ 1:
                    message.query = reader.string();
                    break;
                case /* string language */ 2:
                    message.language = reader.string();
                    break;
                case /* bool tvseries */ 3:
                    message.tvseries = reader.bool();
                    break;
                case /* uint32 season */ 4:
                    message.season = reader.uint32();
                    break;
                case /* uint32 episode */ 5:
                    message.episode = reader.uint32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string query = 1; */
        if (message.query !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.query);
        /* string language = 2; */
        if (message.language !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.language);
        /* bool tvseries = 3; */
        if (message.tvseries !== false)
            writer.tag(3, WireType.Varint).bool(message.tvseries);
        /* uint32 season = 4; */
        if (message.season !== 0)
            writer.tag(4, WireType.Varint).uint32(message.season);
        /* uint32 episode = 5; */
        if (message.episode !== 0)
            writer.tag(5, WireType.Varint).uint32(message.episode);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SearchSubtitlesRequest
 */
export const SearchSubtitlesRequest = new SearchSubtitlesRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SubtitleCandidate$Type extends MessageType {
    constructor() {
        super("SubtitleCandidate", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "provider", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "download_url", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 5, name: "score", kind: "scalar", T: 5 /*ScalarType.INT32*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.id = "";
        message.provider = "";
        message.name = "";
        message.downloadUrl = "";
        message.score = 0;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                case /* string provider */ 2:
                    message.provider = reader.string();
                    break;
                case /* string name */ 3:
                    message.name = reader.string();
                    break;
                case /* string download_url */ 4:
                    message.downloadUrl = reader.string();
                    break;
                case /* int32 score */ 5:
                    message.score = reader.int32();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* string provider = 2; */
        if (message.provider !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.provider);
        /* string name = 3; */
        if (message.name !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.name);
        /* string download_url = 4; */
        if (message.downloadUrl !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.downloadUrl);
        /* int32 score = 5; */
        if (message.score !== 0)
            writer.tag(5, WireType.Varint).int32(message.score);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SubtitleCandidate
 */
export const SubtitleCandidate = new SubtitleCandidate$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SearchSubtitlesResponse$Type extends MessageType {
    constructor() {
        super("SearchSubtitlesResponse", [
            { no: 1, name: "items", kind: "message", repeat: 2 /*RepeatType.UNPACKED*/, T: () => SubtitleCandidate },
            { no: 2, name: "error", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.items = [];
        message.error = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated SubtitleCandidate items */ 1:
                    message.items.push(SubtitleCandidate.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                case /* string error */ 2:
                    message.error = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* repeated SubtitleCandidate items = 1; */
        for (let i = 0; i < message.items.length; i++)
            SubtitleCandidate.internalBinaryWrite(message.items[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        /* string error = 2; */
        if (message.error !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.error);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SearchSubtitlesResponse
 */
export const SearchSubtitlesResponse = new SearchSubtitlesResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class FetchSubtitleRequest$Type extends MessageType {
    constructor() {
        super("FetchSubtitleRequest", [
            { no: 1, name: "download_url", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.downloadUrl = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string download_url */ 1:
                    message.downloadUrl = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string download_url = 1; */
        if (message.downloadUrl !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.downloadUrl);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message FetchSubtitleRequest
 */
export const FetchSubtitleRequest = new FetchSubtitleRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class FetchSubtitleResponse$Type extends MessageType {
    constructor() {
        super("FetchSubtitleResponse", [
            { no: 1, name: "ok", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 2, name: "name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "vtt_text", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "error", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.ok = false;
        message.name = "";
        message.vttText = "";
        message.error = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* bool ok */ 1:
                    message.ok = reader.bool();
                    break;
                case /* string name */ 2:
                    message.name = reader.string();
                    break;
                case /* string vtt_text */ 3:
                    message.vttText = reader.string();
                    break;
                case /* string error */ 4:
                    message.error = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* bool ok = 1; */
        if (message.ok !== false)
            writer.tag(1, WireType.Varint).bool(message.ok);
        /* string name = 2; */
        if (message.name !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.name);
        /* string vtt_text = 3; */
        if (message.vttText !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.vttText);
        /* string error = 4; */
        if (message.error !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.error);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message FetchSubtitleResponse
 */
export const FetchSubtitleResponse = new FetchSubtitleResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetSubtitleRequest$Type extends MessageType {
    constructor() {
        super("SetSubtitleRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "subtitle_label", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "subtitle_vtt_text", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.subtitleLabel = "";
        message.subtitleVttText = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* string subtitle_label */ 2:
                    message.subtitleLabel = reader.string();
                    break;
                case /* string subtitle_vtt_text */ 3:
                    message.subtitleVttText = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* string subtitle_label = 2; */
        if (message.subtitleLabel !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.subtitleLabel);
        /* string subtitle_vtt_text = 3; */
        if (message.subtitleVttText !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.subtitleVttText);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetSubtitleRequest
 */
export const SetSubtitleRequest = new SetSubtitleRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ReportSyncStatusRequest$Type extends MessageType {
    constructor() {
        super("ReportSyncStatusRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "current_time_seconds", kind: "scalar", T: 1 /*ScalarType.DOUBLE*/ },
            { no: 3, name: "ready", kind: "scalar", T: 8 /*ScalarType.BOOL*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.currentTimeSeconds = 0;
        message.ready = false;
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* double current_time_seconds */ 2:
                    message.currentTimeSeconds = reader.double();
                    break;
                case /* bool ready */ 3:
                    message.ready = reader.bool();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* double current_time_seconds = 2; */
        if (message.currentTimeSeconds !== 0)
            writer.tag(2, WireType.Bit64).double(message.currentTimeSeconds);
        /* bool ready = 3; */
        if (message.ready !== false)
            writer.tag(3, WireType.Varint).bool(message.ready);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ReportSyncStatusRequest
 */
export const ReportSyncStatusRequest = new ReportSyncStatusRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class HostStartSyncRequest$Type extends MessageType {
    constructor() {
        super("HostStartSyncRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "mode", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.mode = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                case /* string mode */ 2:
                    message.mode = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        /* string mode = 2; */
        if (message.mode !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.mode);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message HostStartSyncRequest
 */
export const HostStartSyncRequest = new HostStartSyncRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class HostLaunchSyncRequest$Type extends MessageType {
    constructor() {
        super("HostLaunchSyncRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        if (value !== undefined)
            reflectionMergePartial(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string room_id */ 1:
                    message.roomId = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.roomId);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message HostLaunchSyncRequest
 */
export const HostLaunchSyncRequest = new HostLaunchSyncRequest$Type();
//# sourceMappingURL=example.js.map