"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetSubtitleRequest = exports.FetchSubtitleResponse = exports.FetchSubtitleRequest = exports.SearchSubtitlesResponse = exports.SubtitleCandidate = exports.SearchSubtitlesRequest = exports.StateChangedEvent = exports.MutationResponse = exports.ListRoomsResponse = exports.RoomSummary = exports.ListRoomsRequest = exports.DecideHostClaimRequest = exports.RequestHostClaimRequest = exports.SetDurationRequest = exports.SetRateRequest = exports.PlaybackRequest = exports.SetViewerQueuePolicyRequest = exports.SetRoomNameRequest = exports.MoveQueueItemRequest = exports.RemoveQueueItemRequest = exports.AdvanceQueueRequest = exports.PlaylistMutationRequest = exports.SetMediaRequest = exports.SetHostRequest = exports.GetRoomStateResponse = exports.LeaveRoomRequest = exports.GetRoomStateRequest = exports.RoomState = void 0;
const runtime_1 = require("@protobuf-ts/runtime");
const runtime_2 = require("@protobuf-ts/runtime");
const runtime_3 = require("@protobuf-ts/runtime");
const runtime_4 = require("@protobuf-ts/runtime");
// @generated message type with reflection information, may provide speed optimized methods
class RoomState$Type extends runtime_4.MessageType {
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
            { no: 20, name: "subtitle_vtt_text", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
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
        if (value !== undefined)
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* string host_user_id = 2; */
        if (message.hostUserId !== "")
            writer.tag(2, runtime_1.WireType.LengthDelimited).string(message.hostUserId);
        /* string media_url = 3; */
        if (message.mediaUrl !== "")
            writer.tag(3, runtime_1.WireType.LengthDelimited).string(message.mediaUrl);
        /* bool playing = 4; */
        if (message.playing !== false)
            writer.tag(4, runtime_1.WireType.Varint).bool(message.playing);
        /* double current_time_seconds = 5; */
        if (message.currentTimeSeconds !== 0)
            writer.tag(5, runtime_1.WireType.Bit64).double(message.currentTimeSeconds);
        /* double playback_rate = 6; */
        if (message.playbackRate !== 0)
            writer.tag(6, runtime_1.WireType.Bit64).double(message.playbackRate);
        /* uint64 updated_at_ms = 7; */
        if (message.updatedAtMs !== 0n)
            writer.tag(7, runtime_1.WireType.Varint).uint64(message.updatedAtMs);
        /* uint64 version = 8; */
        if (message.version !== 0n)
            writer.tag(8, runtime_1.WireType.Varint).uint64(message.version);
        /* repeated string participant_user_ids = 9; */
        for (let i = 0; i < message.participantUserIds.length; i++)
            writer.tag(9, runtime_1.WireType.LengthDelimited).string(message.participantUserIds[i]);
        /* double duration_seconds = 10; */
        if (message.durationSeconds !== 0)
            writer.tag(10, runtime_1.WireType.Bit64).double(message.durationSeconds);
        /* string pending_host_user_id = 11; */
        if (message.pendingHostUserId !== "")
            writer.tag(11, runtime_1.WireType.LengthDelimited).string(message.pendingHostUserId);
        /* string room_name = 12; */
        if (message.roomName !== "")
            writer.tag(12, runtime_1.WireType.LengthDelimited).string(message.roomName);
        /* repeated string playlist_urls = 13; */
        for (let i = 0; i < message.playlistUrls.length; i++)
            writer.tag(13, runtime_1.WireType.LengthDelimited).string(message.playlistUrls[i]);
        /* repeated string playlist_history_urls = 14; */
        for (let i = 0; i < message.playlistHistoryUrls.length; i++)
            writer.tag(14, runtime_1.WireType.LengthDelimited).string(message.playlistHistoryUrls[i]);
        /* repeated string playlist_added_by_user_ids = 15; */
        for (let i = 0; i < message.playlistAddedByUserIds.length; i++)
            writer.tag(15, runtime_1.WireType.LengthDelimited).string(message.playlistAddedByUserIds[i]);
        /* repeated string playlist_history_added_by_user_ids = 16; */
        for (let i = 0; i < message.playlistHistoryAddedByUserIds.length; i++)
            writer.tag(16, runtime_1.WireType.LengthDelimited).string(message.playlistHistoryAddedByUserIds[i]);
        /* string current_media_added_by_user_id = 17; */
        if (message.currentMediaAddedByUserId !== "")
            writer.tag(17, runtime_1.WireType.LengthDelimited).string(message.currentMediaAddedByUserId);
        /* bool allow_viewer_queue_add = 18; */
        if (message.allowViewerQueueAdd !== false)
            writer.tag(18, runtime_1.WireType.Varint).bool(message.allowViewerQueueAdd);
        /* string subtitle_label = 19; */
        if (message.subtitleLabel !== "")
            writer.tag(19, runtime_1.WireType.LengthDelimited).string(message.subtitleLabel);
        /* string subtitle_vtt_text = 20; */
        if (message.subtitleVttText !== "")
            writer.tag(20, runtime_1.WireType.LengthDelimited).string(message.subtitleVttText);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message RoomState
 */
exports.RoomState = new RoomState$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetRoomStateRequest$Type extends runtime_4.MessageType {
    constructor() {
        super("GetRoomStateRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        if (value !== undefined)
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GetRoomStateRequest
 */
exports.GetRoomStateRequest = new GetRoomStateRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class LeaveRoomRequest$Type extends runtime_4.MessageType {
    constructor() {
        super("LeaveRoomRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        if (value !== undefined)
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message LeaveRoomRequest
 */
exports.LeaveRoomRequest = new LeaveRoomRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class GetRoomStateResponse$Type extends runtime_4.MessageType {
    constructor() {
        super("GetRoomStateResponse", [
            { no: 1, name: "state", kind: "message", T: () => exports.RoomState }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            (0, runtime_3.reflectionMergePartial)(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* RoomState state */ 1:
                    message.state = exports.RoomState.internalBinaryRead(reader, reader.uint32(), options, message.state);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* RoomState state = 1; */
        if (message.state)
            exports.RoomState.internalBinaryWrite(message.state, writer.tag(1, runtime_1.WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message GetRoomStateResponse
 */
exports.GetRoomStateResponse = new GetRoomStateResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetHostRequest$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* string host_user_id = 2; */
        if (message.hostUserId !== "")
            writer.tag(2, runtime_1.WireType.LengthDelimited).string(message.hostUserId);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetHostRequest
 */
exports.SetHostRequest = new SetHostRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetMediaRequest$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* string url = 2; */
        if (message.url !== "")
            writer.tag(2, runtime_1.WireType.LengthDelimited).string(message.url);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetMediaRequest
 */
exports.SetMediaRequest = new SetMediaRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class PlaylistMutationRequest$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* string url = 2; */
        if (message.url !== "")
            writer.tag(2, runtime_1.WireType.LengthDelimited).string(message.url);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message PlaylistMutationRequest
 */
exports.PlaylistMutationRequest = new PlaylistMutationRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class AdvanceQueueRequest$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* bool autoplay = 2; */
        if (message.autoplay !== false)
            writer.tag(2, runtime_1.WireType.Varint).bool(message.autoplay);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message AdvanceQueueRequest
 */
exports.AdvanceQueueRequest = new AdvanceQueueRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class RemoveQueueItemRequest$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* uint32 index = 2; */
        if (message.index !== 0)
            writer.tag(2, runtime_1.WireType.Varint).uint32(message.index);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message RemoveQueueItemRequest
 */
exports.RemoveQueueItemRequest = new RemoveQueueItemRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class MoveQueueItemRequest$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* uint32 from_index = 2; */
        if (message.fromIndex !== 0)
            writer.tag(2, runtime_1.WireType.Varint).uint32(message.fromIndex);
        /* uint32 to_index = 3; */
        if (message.toIndex !== 0)
            writer.tag(3, runtime_1.WireType.Varint).uint32(message.toIndex);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message MoveQueueItemRequest
 */
exports.MoveQueueItemRequest = new MoveQueueItemRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetRoomNameRequest$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* string room_name = 2; */
        if (message.roomName !== "")
            writer.tag(2, runtime_1.WireType.LengthDelimited).string(message.roomName);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetRoomNameRequest
 */
exports.SetRoomNameRequest = new SetRoomNameRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetViewerQueuePolicyRequest$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* bool allow_viewer_queue_add = 2; */
        if (message.allowViewerQueueAdd !== false)
            writer.tag(2, runtime_1.WireType.Varint).bool(message.allowViewerQueueAdd);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetViewerQueuePolicyRequest
 */
exports.SetViewerQueuePolicyRequest = new SetViewerQueuePolicyRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class PlaybackRequest$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* double at_seconds = 2; */
        if (message.atSeconds !== 0)
            writer.tag(2, runtime_1.WireType.Bit64).double(message.atSeconds);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message PlaybackRequest
 */
exports.PlaybackRequest = new PlaybackRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetRateRequest$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* double playback_rate = 2; */
        if (message.playbackRate !== 0)
            writer.tag(2, runtime_1.WireType.Bit64).double(message.playbackRate);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetRateRequest
 */
exports.SetRateRequest = new SetRateRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetDurationRequest$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* double duration_seconds = 2; */
        if (message.durationSeconds !== 0)
            writer.tag(2, runtime_1.WireType.Bit64).double(message.durationSeconds);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetDurationRequest
 */
exports.SetDurationRequest = new SetDurationRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class RequestHostClaimRequest$Type extends runtime_4.MessageType {
    constructor() {
        super("RequestHostClaimRequest", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        if (value !== undefined)
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message RequestHostClaimRequest
 */
exports.RequestHostClaimRequest = new RequestHostClaimRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class DecideHostClaimRequest$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* string requester_user_id = 2; */
        if (message.requesterUserId !== "")
            writer.tag(2, runtime_1.WireType.LengthDelimited).string(message.requesterUserId);
        /* bool approve = 3; */
        if (message.approve !== false)
            writer.tag(3, runtime_1.WireType.Varint).bool(message.approve);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message DecideHostClaimRequest
 */
exports.DecideHostClaimRequest = new DecideHostClaimRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ListRoomsRequest$Type extends runtime_4.MessageType {
    constructor() {
        super("ListRoomsRequest", []);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        if (value !== undefined)
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ListRoomsRequest
 */
exports.ListRoomsRequest = new ListRoomsRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class RoomSummary$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* string host_user_id = 2; */
        if (message.hostUserId !== "")
            writer.tag(2, runtime_1.WireType.LengthDelimited).string(message.hostUserId);
        /* string media_url = 3; */
        if (message.mediaUrl !== "")
            writer.tag(3, runtime_1.WireType.LengthDelimited).string(message.mediaUrl);
        /* bool playing = 4; */
        if (message.playing !== false)
            writer.tag(4, runtime_1.WireType.Varint).bool(message.playing);
        /* double current_time_seconds = 5; */
        if (message.currentTimeSeconds !== 0)
            writer.tag(5, runtime_1.WireType.Bit64).double(message.currentTimeSeconds);
        /* double duration_seconds = 6; */
        if (message.durationSeconds !== 0)
            writer.tag(6, runtime_1.WireType.Bit64).double(message.durationSeconds);
        /* double progress_percent = 7; */
        if (message.progressPercent !== 0)
            writer.tag(7, runtime_1.WireType.Bit64).double(message.progressPercent);
        /* repeated string participant_user_ids = 8; */
        for (let i = 0; i < message.participantUserIds.length; i++)
            writer.tag(8, runtime_1.WireType.LengthDelimited).string(message.participantUserIds[i]);
        /* uint64 version = 9; */
        if (message.version !== 0n)
            writer.tag(9, runtime_1.WireType.Varint).uint64(message.version);
        /* string room_name = 10; */
        if (message.roomName !== "")
            writer.tag(10, runtime_1.WireType.LengthDelimited).string(message.roomName);
        /* string preview_media_url = 11; */
        if (message.previewMediaUrl !== "")
            writer.tag(11, runtime_1.WireType.LengthDelimited).string(message.previewMediaUrl);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message RoomSummary
 */
exports.RoomSummary = new RoomSummary$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ListRoomsResponse$Type extends runtime_4.MessageType {
    constructor() {
        super("ListRoomsResponse", [
            { no: 1, name: "rooms", kind: "message", repeat: 2 /*RepeatType.UNPACKED*/, T: () => exports.RoomSummary }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.rooms = [];
        if (value !== undefined)
            (0, runtime_3.reflectionMergePartial)(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated RoomSummary rooms */ 1:
                    message.rooms.push(exports.RoomSummary.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* repeated RoomSummary rooms = 1; */
        for (let i = 0; i < message.rooms.length; i++)
            exports.RoomSummary.internalBinaryWrite(message.rooms[i], writer.tag(1, runtime_1.WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message ListRoomsResponse
 */
exports.ListRoomsResponse = new ListRoomsResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class MutationResponse$Type extends runtime_4.MessageType {
    constructor() {
        super("MutationResponse", [
            { no: 1, name: "accepted", kind: "scalar", T: 8 /*ScalarType.BOOL*/ },
            { no: 2, name: "reason", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "state", kind: "message", T: () => exports.RoomState }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.accepted = false;
        message.reason = "";
        if (value !== undefined)
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                    message.state = exports.RoomState.internalBinaryRead(reader, reader.uint32(), options, message.state);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* bool accepted = 1; */
        if (message.accepted !== false)
            writer.tag(1, runtime_1.WireType.Varint).bool(message.accepted);
        /* string reason = 2; */
        if (message.reason !== "")
            writer.tag(2, runtime_1.WireType.LengthDelimited).string(message.reason);
        /* RoomState state = 3; */
        if (message.state)
            exports.RoomState.internalBinaryWrite(message.state, writer.tag(3, runtime_1.WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message MutationResponse
 */
exports.MutationResponse = new MutationResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class StateChangedEvent$Type extends runtime_4.MessageType {
    constructor() {
        super("StateChangedEvent", [
            { no: 1, name: "room_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "action", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "actor_user_id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "state", kind: "message", T: () => exports.RoomState }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.roomId = "";
        message.action = "";
        message.actorUserId = "";
        if (value !== undefined)
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                    message.state = exports.RoomState.internalBinaryRead(reader, reader.uint32(), options, message.state);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* string action = 2; */
        if (message.action !== "")
            writer.tag(2, runtime_1.WireType.LengthDelimited).string(message.action);
        /* string actor_user_id = 3; */
        if (message.actorUserId !== "")
            writer.tag(3, runtime_1.WireType.LengthDelimited).string(message.actorUserId);
        /* RoomState state = 4; */
        if (message.state)
            exports.RoomState.internalBinaryWrite(message.state, writer.tag(4, runtime_1.WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message StateChangedEvent
 */
exports.StateChangedEvent = new StateChangedEvent$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SearchSubtitlesRequest$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string query = 1; */
        if (message.query !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.query);
        /* string language = 2; */
        if (message.language !== "")
            writer.tag(2, runtime_1.WireType.LengthDelimited).string(message.language);
        /* bool tvseries = 3; */
        if (message.tvseries !== false)
            writer.tag(3, runtime_1.WireType.Varint).bool(message.tvseries);
        /* uint32 season = 4; */
        if (message.season !== 0)
            writer.tag(4, runtime_1.WireType.Varint).uint32(message.season);
        /* uint32 episode = 5; */
        if (message.episode !== 0)
            writer.tag(5, runtime_1.WireType.Varint).uint32(message.episode);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SearchSubtitlesRequest
 */
exports.SearchSubtitlesRequest = new SearchSubtitlesRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SubtitleCandidate$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.id);
        /* string provider = 2; */
        if (message.provider !== "")
            writer.tag(2, runtime_1.WireType.LengthDelimited).string(message.provider);
        /* string name = 3; */
        if (message.name !== "")
            writer.tag(3, runtime_1.WireType.LengthDelimited).string(message.name);
        /* string download_url = 4; */
        if (message.downloadUrl !== "")
            writer.tag(4, runtime_1.WireType.LengthDelimited).string(message.downloadUrl);
        /* int32 score = 5; */
        if (message.score !== 0)
            writer.tag(5, runtime_1.WireType.Varint).int32(message.score);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SubtitleCandidate
 */
exports.SubtitleCandidate = new SubtitleCandidate$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SearchSubtitlesResponse$Type extends runtime_4.MessageType {
    constructor() {
        super("SearchSubtitlesResponse", [
            { no: 1, name: "items", kind: "message", repeat: 2 /*RepeatType.UNPACKED*/, T: () => exports.SubtitleCandidate },
            { no: 2, name: "error", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.items = [];
        message.error = "";
        if (value !== undefined)
            (0, runtime_3.reflectionMergePartial)(this, message, value);
        return message;
    }
    internalBinaryRead(reader, length, options, target) {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated SubtitleCandidate items */ 1:
                    message.items.push(exports.SubtitleCandidate.internalBinaryRead(reader, reader.uint32(), options));
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* repeated SubtitleCandidate items = 1; */
        for (let i = 0; i < message.items.length; i++)
            exports.SubtitleCandidate.internalBinaryWrite(message.items[i], writer.tag(1, runtime_1.WireType.LengthDelimited).fork(), options).join();
        /* string error = 2; */
        if (message.error !== "")
            writer.tag(2, runtime_1.WireType.LengthDelimited).string(message.error);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SearchSubtitlesResponse
 */
exports.SearchSubtitlesResponse = new SearchSubtitlesResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class FetchSubtitleRequest$Type extends runtime_4.MessageType {
    constructor() {
        super("FetchSubtitleRequest", [
            { no: 1, name: "download_url", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value) {
        const message = globalThis.Object.create((this.messagePrototype));
        message.downloadUrl = "";
        if (value !== undefined)
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string download_url = 1; */
        if (message.downloadUrl !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.downloadUrl);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message FetchSubtitleRequest
 */
exports.FetchSubtitleRequest = new FetchSubtitleRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class FetchSubtitleResponse$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* bool ok = 1; */
        if (message.ok !== false)
            writer.tag(1, runtime_1.WireType.Varint).bool(message.ok);
        /* string name = 2; */
        if (message.name !== "")
            writer.tag(2, runtime_1.WireType.LengthDelimited).string(message.name);
        /* string vtt_text = 3; */
        if (message.vttText !== "")
            writer.tag(3, runtime_1.WireType.LengthDelimited).string(message.vttText);
        /* string error = 4; */
        if (message.error !== "")
            writer.tag(4, runtime_1.WireType.LengthDelimited).string(message.error);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message FetchSubtitleResponse
 */
exports.FetchSubtitleResponse = new FetchSubtitleResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class SetSubtitleRequest$Type extends runtime_4.MessageType {
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
            (0, runtime_3.reflectionMergePartial)(this, message, value);
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
                        (u === true ? runtime_2.UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message, writer, options) {
        /* string room_id = 1; */
        if (message.roomId !== "")
            writer.tag(1, runtime_1.WireType.LengthDelimited).string(message.roomId);
        /* string subtitle_label = 2; */
        if (message.subtitleLabel !== "")
            writer.tag(2, runtime_1.WireType.LengthDelimited).string(message.subtitleLabel);
        /* string subtitle_vtt_text = 3; */
        if (message.subtitleVttText !== "")
            writer.tag(3, runtime_1.WireType.LengthDelimited).string(message.subtitleVttText);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? runtime_2.UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message SetSubtitleRequest
 */
exports.SetSubtitleRequest = new SetSubtitleRequest$Type();
//# sourceMappingURL=example.js.map