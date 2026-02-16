import React, { useEffect, useMemo, useRef, useState } from "react";
import brandLogoAsset from "./assets/logo.png";
import { RootClientThemeEvent, rootClient } from "@rootsdk/client-app";
import { CineLinkServiceClientEvent, cineLinkServiceClient } from "@cinelink/gen-client";
import { MutationResponse, RoomState, RoomSummary, StateChangedEvent } from "@cinelink/gen-shared";
import "plyr/dist/plyr.css";

type AppView = "lobby" | "room";
type HostPopup = "room" | "media" | "subtitle" | "audio" | null;
type RoomModalMode = "create" | "rename" | "join";
type ViewerProfile = { name: string; avatarUrl?: string };
type SubtitleResult = { id: string; provider: string; name: string; downloadUrl: string; score: number };
type VideoSubtitleTrackInfo = { index: number; label: string; language: string; kind: string };
type VideoAudioTrackInfo = { index: number; label: string; language: string; kind: string };
type BrowserAudioTrack = { enabled: boolean; label?: string; language?: string; kind?: string };
type BrowserAudioTrackList = { length: number; [index: number]: BrowserAudioTrack };

const EMPTY_STATE: RoomState = {
  roomId: "",
  hostUserId: "",
  roomName: "",
  mediaUrl: "",
  playing: false,
  currentTimeSeconds: 0,
  playbackRate: 1,
  updatedAtMs: BigInt(0),
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
  syncReadyUserIds: []
};

const App: React.FC = () => {
  const me = useMemo(() => rootClient.users.getCurrentUserId(), []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const subtitleTrackRef = useRef<HTMLTrackElement>(null);
  const ambilightVideoRef = useRef<HTMLVideoElement>(null);
  const ytContainerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const plyrRef = useRef<any>(null);
  const ytLoadedIdRef = useRef<string>("");
  const subtitleUploadInputRef = useRef<HTMLInputElement>(null);
  const hostPopupRef = useRef<HTMLElement>(null);
  const bottomActionsRef = useRef<HTMLDivElement>(null);
  const suppressEvents = useRef(false);
  const isHostRef = useRef(false);
  const isJoinedRef = useRef(false);
  const roomIdRef = useRef("");
  const syncLaunchHandledRef = useRef<string>("");

  const [themeMode, setThemeMode] = useState<"dark" | "light">(rootClient.theme.getTheme());
  const [view, setView] = useState<AppView>("lobby");
  const [hostPopup, setHostPopup] = useState<HostPopup>(null);
  const [newRoomNameInput, setNewRoomNameInput] = useState("");
  const [joinRoomInput, setJoinRoomInput] = useState("");
  const [mediaUrlInput, setMediaUrlInput] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomState, setRoomState] = useState<RoomState>(EMPTY_STATE);
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [status, setStatus] = useState("Create or join a room.");
  const [busy, setBusy] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [showVideoErrorModal, setShowVideoErrorModal] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, ViewerProfile>>({});
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [roomModalMode, setRoomModalMode] = useState<RoomModalMode>("create");
  const [ytApiReady, setYtApiReady] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window === "undefined" ? 1280 : window.innerWidth
  );
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);
  const [ambilightEnabled, setAmbilightEnabled] = useState(true);
  const ambilightSpread = 25;
  const [mediaThumbCache, setMediaThumbCache] = useState<Record<string, string>>({});
  const [subtitleQuery, setSubtitleQuery] = useState("");
  const [subtitleResults, setSubtitleResults] = useState<SubtitleResult[]>([]);
  const [subtitleBusy, setSubtitleBusy] = useState(false);
  const [subtitleTrackUrl, setSubtitleTrackUrl] = useState("");
  const [subtitleLabel, setSubtitleLabel] = useState("");
  const [subtitleLoadingLanguage, setSubtitleLoadingLanguage] = useState("");
  const [subtitleAppliedLanguage, setSubtitleAppliedLanguage] = useState("");
  const [subtitleBaseVttText, setSubtitleBaseVttText] = useState("");
  const [subtitleOffsetMs, setSubtitleOffsetMs] = useState(0);
  const [videoSubtitleTracks, setVideoSubtitleTracks] = useState<VideoSubtitleTrackInfo[]>([]);
  const [activeVideoTrackIndex, setActiveVideoTrackIndex] = useState(-1);
  const [videoAudioTracks, setVideoAudioTracks] = useState<VideoAudioTrackInfo[]>([]);
  const [activeVideoAudioTrackIndex, setActiveVideoAudioTrackIndex] = useState(-1);
  const [playbackMediaUrl, setPlaybackMediaUrl] = useState("");
  const [driveIframeFallbackFor, setDriveIframeFallbackFor] = useState("");
  const [youtubeNowPlayingTitle, setYoutubeNowPlayingTitle] = useState("");
  const [selfSyncingPlayback, setSelfSyncingPlayback] = useState(false);
  const [actionStates, setActionStates] = useState<Record<string, "loading" | "done">>({});
  const [hostTransferCandidateUserId, setHostTransferCandidateUserId] = useState("");
  const triedMkvFallbackRef = useRef<Record<string, boolean>>({});
  const triedDriveVariantRef = useRef<Record<string, boolean>>({});
  const thumbCapturePlanRef = useRef<{ url: string; nextAt: number; step: number } | null>(null);

  const tokens = themeMode === "dark" ? darkTokens : lightTokens;
  const isMobile = viewportWidth <= 768;
  const isNarrowMobile = viewportWidth <= 480;
  const isLightTheme = themeMode === "light";
  const isJoined = roomId.length > 0;
  const isHost = isJoined && roomState.hostUserId === me;
  const participants = prioritizeHost(roomState.participantUserIds || [], roomState.hostUserId);
  const playlist = roomState.playlistUrls || [];
  const playlistAddedBy = roomState.playlistAddedByUserIds || [];
  const watchedUrlSet = useMemo(() => new Set(roomState.playlistHistoryUrls || []), [roomState.playlistHistoryUrls]);
  const visibleParticipants = participants.slice(0, 6);
  const hiddenParticipantsCount = Math.max(0, participants.length - visibleParticipants.length);
  const activeMediaSource = (playbackMediaUrl || roomState.mediaUrl || "").trim();
  const youtubeVideoId = getYouTubeVideoId(activeMediaSource);
  const drivePreviewUrl = getGoogleDrivePreviewUrl(activeMediaSource);
  const isDriveIframeMode = !!drivePreviewUrl && driveIframeFallbackFor === activeMediaSource;
  const isIframeMode = !!youtubeVideoId || isDriveIframeMode;
  const currentThumb = getRoomThumbnail(roomState.mediaUrl, mediaThumbCache);
  const isAmbilightAvailable = !isIframeMode;
  const isAmbilightActive = ambilightEnabled && isAmbilightAvailable;
  const pendingClaimUserId = roomState.pendingHostUserId || "";
  const hasPendingClaim = pendingClaimUserId.length > 0;
  const canClaimHost = isJoined && !isHost && !hasPendingClaim;
  const canOpenMediaPopup = isJoined && (isHost || roomState.allowViewerQueueAdd);
  const canOpenSubtitlePopup = isJoined && !isIframeMode;
  const hasSelectableMkvAudioTracks = isLikelyMkvUrl(activeMediaSource) && videoAudioTracks.length > 1;
  const canOpenAudioPopup = isJoined && !isIframeMode && hasSelectableMkvAudioTracks;
  const hasLoadedSubtitle = !!subtitleTrackUrl || activeVideoTrackIndex >= 0;
  const nowPlayingName = youtubeVideoId
    ? getReadableRoomName(youtubeNowPlayingTitle || "YouTube video", "YouTube video")
    : getReadableRoomName(getMediaDisplayName(activeMediaSource), "No media loaded");
  const canSubmitRoomModal = newRoomNameInput.trim().length > 3;
  const canSubmitJoinRoom = normalizeJoinTarget(joinRoomInput).length > 0;
  const isJoinModal = roomModalMode === "join";
  const canSubmitActiveModal = isJoinModal ? canSubmitJoinRoom : canSubmitRoomModal;
  const modalBusy = !isJoinModal && busy;
  const isMediaPopupOpen = hostPopup === "media";
  const syncMode = (roomState.syncMode || "").trim().toLowerCase();
  const syncReadyUserIds = roomState.syncReadyUserIds || [];
  const syncReadySet = useMemo(() => new Set(syncReadyUserIds), [syncReadyUserIds]);
  const ambilightSpreadRatio = Math.max(0, Math.min(1, ambilightSpread / 100));
  const ambilightInsetPx = Math.round(10 + ambilightSpreadRatio * 180);
  const ambilightBlurPx = Math.round(28 + ambilightSpreadRatio * 130);
  const ambilightScale = 1 + ambilightSpreadRatio * 0.62;
  const ambilightOpacity = 0.18 + ambilightSpreadRatio * 0.82;
  const ambilightBrightness = 1 + ambilightSpreadRatio * 0.22;
  const ambilightSaturation = 1.14 + ambilightSpreadRatio * 0.66;
  const ambilightInsetThemePx = isLightTheme ? ambilightInsetPx : Math.round(ambilightInsetPx * 0.62);
  const ambilightBlurThemePx = isLightTheme ? ambilightBlurPx : Math.round(ambilightBlurPx * 1.12);
  const ambilightScaleTheme = isLightTheme ? ambilightScale : 1 + (ambilightScale - 1) * 0.72;
  const ambilightOpacityTheme = isLightTheme ? ambilightOpacity : Math.min(0.54, ambilightOpacity * 0.58);
  const ambilightBrightnessTheme = isLightTheme ? ambilightBrightness : Math.max(1.02, ambilightBrightness * 0.9);
  const ambilightSaturationTheme = isLightTheme ? ambilightSaturation : Math.max(1.12, ambilightSaturation * 0.88);
  const subtitleLanguageGroups = useMemo(() => groupSubtitleCandidatesByLanguage(subtitleResults), [subtitleResults]);
  const iconButtonThemeStyle: React.CSSProperties = isLightTheme
    ? {
      borderColor: "rgba(70,92,148,0.34)",
      background: "rgba(229,236,248,0.92)",
      color: "#24324d",
      boxShadow: "0 4px 12px rgba(64,86,136,0.18), inset 0 1px 0 rgba(255,255,255,0.7)"
    }
    : {
      borderColor: "rgba(255,255,255,0.24)",
      background: "rgba(255,255,255,0.12)",
      color: "#f8fafc",
      boxShadow: "0 4px 12px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.1)"
    };
  const themedIconButtonStyle: React.CSSProperties = { ...styles.iconButton, ...iconButtonThemeStyle };
  const themedPopupIconButtonStyle: React.CSSProperties = {
    ...styles.popupIconButton,
    ...iconButtonThemeStyle,
    ...(isLightTheme
      ? {
        background: "rgba(246,250,255,0.62)",
        borderColor: "rgba(136,160,210,0.42)"
      }
      : {})
  };
  const themedCompactIconButtonStyle: React.CSSProperties = { ...styles.compactIconButton, ...iconButtonThemeStyle };
  const themedSubtitleSearchButtonStyle: React.CSSProperties = { ...styles.subtitleSearchInlineButton, ...iconButtonThemeStyle };
  const mediaPopupInputStyle: React.CSSProperties = isLightTheme
    ? { ...styles.input, color: "#1f2a44", borderColor: "rgba(153,176,220,0.44)", background: "rgba(244,249,255,0.5)" }
    : { ...styles.input, color: tokens.text, borderColor: tokens.border, background: tokens.input };
  const liquidShellSurfaceStyle: React.CSSProperties = isLightTheme
    ? {
      backdropFilter: "blur(22px) saturate(1.14)",
      WebkitBackdropFilter: "blur(22px) saturate(1.14)",
      backgroundImage:
        "radial-gradient(560px 280px at 50% 86%, rgba(102,146,231,0.38) 0%, rgba(159,191,246,0.22) 48%, rgba(0,0,0,0) 78%), radial-gradient(340px 180px at 8% 26%, rgba(111,157,236,0.26) 0%, rgba(0,0,0,0) 76%), radial-gradient(340px 180px at 92% 26%, rgba(111,157,236,0.26) 0%, rgba(0,0,0,0) 76%)",
      boxShadow: "0 36px 86px rgba(96,124,190,0.34), 0 0 0 1px rgba(240,247,255,0.56) inset, 0 -1px 0 rgba(145,169,222,0.28) inset"
    }
    : {
      backdropFilter: "blur(20px) saturate(1.2)",
      WebkitBackdropFilter: "blur(20px) saturate(1.2)",
      boxShadow: "0 32px 80px rgba(6,12,30,0.58), 0 0 0 1px rgba(150,183,250,0.18) inset, 0 -1px 0 rgba(88,122,191,0.18) inset"
    };
  const liquidCardSurfaceStyle: React.CSSProperties = isLightTheme
    ? {
      backdropFilter: "blur(16px) saturate(1.12)",
      WebkitBackdropFilter: "blur(16px) saturate(1.12)",
      boxShadow: "0 18px 38px rgba(109,135,194,0.2), 0 0 0 1px rgba(232,243,255,0.42) inset, 0 -1px 0 rgba(144,170,224,0.18) inset"
    }
    : {
      backdropFilter: "blur(14px) saturate(1.18)",
      WebkitBackdropFilter: "blur(14px) saturate(1.18)",
      boxShadow: "0 18px 38px rgba(7,14,35,0.42), 0 0 0 1px rgba(171,199,250,0.12) inset, 0 -1px 0 rgba(98,129,194,0.14) inset"
    };
  const themedPlayerHeaderStyle: React.CSSProperties = isLightTheme
    ? {
      ...styles.playerHeader,
      borderBottom: "1px solid rgba(166,188,232,0.3)",
      background: "linear-gradient(180deg, rgba(255,255,255,0.34), rgba(240,247,255,0.18))",
      backdropFilter: "blur(14px) saturate(1.1)",
      WebkitBackdropFilter: "blur(14px) saturate(1.1)"
    }
    : {
      ...styles.playerHeader,
      borderBottom: "1px solid rgba(160,188,240,0.2)",
      background: "linear-gradient(180deg, rgba(112,151,235,0.18), rgba(28,47,92,0.1))",
      backdropFilter: "blur(12px) saturate(1.12)",
      WebkitBackdropFilter: "blur(12px) saturate(1.12)"
    };
  const themedModalOverlayStyle: React.CSSProperties = isLightTheme
    ? { ...styles.modalOverlay, background: "rgba(224,231,244,0.34)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }
    : { ...styles.modalOverlay, background: "rgba(2,6,16,0.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" };
  const responsivePageStyle: React.CSSProperties = {
    ...styles.page,
    padding: isMobile ? "8px" : "20px"
  };
  const responsiveLobbyShellStyle: React.CSSProperties = {
    ...styles.lobbyShell,
    maxWidth: isMobile ? "100%" : styles.lobbyShell.maxWidth,
    borderRadius: isMobile ? "16px" : styles.lobbyShell.borderRadius,
    padding: isMobile ? "12px" : styles.lobbyShell.padding
  };
  const responsiveLobbyTitleStyle: React.CSSProperties = {
    ...styles.lobbyTitle,
    margin: isMobile ? "10px 0 10px" : styles.lobbyTitle.margin,
    fontSize: isNarrowMobile ? "2.15rem" : isMobile ? "2.45rem" : styles.lobbyTitle.fontSize
  };
  const responsiveRoomGridStyle: React.CSSProperties = {
    ...styles.roomGrid,
    gridTemplateColumns: isMobile ? "1fr" : styles.roomGrid.gridTemplateColumns,
    justifyContent: isMobile ? "stretch" : styles.roomGrid.justifyContent
  };
  const responsiveRoomCardStyle: React.CSSProperties = {
    ...styles.roomCard,
    minHeight: isMobile ? "190px" : styles.roomCard.minHeight,
    padding: isMobile ? "8px" : styles.roomCard.padding
  };
  const responsiveRoomModalStyle: React.CSSProperties = {
    ...styles.roomModal,
    width: isMobile ? "min(560px, calc(100vw - 20px))" : styles.roomModal.width,
    borderRadius: isMobile ? "18px" : styles.roomModal.borderRadius,
    padding: isMobile ? "12px" : styles.roomModal.padding
  };
  const responsivePlayerShellStyle: React.CSSProperties = {
    ...styles.playerShell,
    maxWidth: isMobile ? "100%" : styles.playerShell.maxWidth,
    borderRadius: isMobile ? "14px" : styles.playerShell.borderRadius
  };
  const responsivePlayerHeaderStyle: React.CSSProperties = {
    ...themedPlayerHeaderStyle,
    padding: isMobile ? "10px 10px" : themedPlayerHeaderStyle.padding
  };
  const responsivePlayerTitleStyle: React.CSSProperties = {
    ...styles.playerTitle,
    maxWidth: isMobile ? "68%" : styles.playerTitle.maxWidth,
    fontSize: isNarrowMobile ? "1.5rem" : isMobile ? "1.65rem" : styles.playerTitle.fontSize
  };
  const responsiveVideoStyle: React.CSSProperties = {
    ...styles.video,
    minHeight: isMobile ? "34vh" : styles.video.minHeight,
    maxHeight: isMobile ? "52vh" : styles.video.maxHeight
  };
  const responsiveVideoFrameWrapStyle: React.CSSProperties = {
    ...styles.videoFrameWrap,
    minHeight: isMobile ? "34vh" : styles.videoFrameWrap.minHeight,
    maxHeight: isMobile ? "52vh" : styles.videoFrameWrap.maxHeight
  };
  const responsiveBottomActionsStyle: React.CSSProperties = {
    ...styles.playerBottomActions,
    flexWrap: isMobile ? "wrap" : "nowrap",
    rowGap: isMobile ? "8px" : styles.playerBottomActions.gap
  };
  const responsiveNowPlayingWrapStyle: React.CSSProperties = {
    ...styles.nowPlayingWrap,
    flexBasis: isMobile ? "100%" : "auto",
    order: isMobile ? 2 : 1
  };
  const responsiveInfoBarStyle: React.CSSProperties = {
    ...styles.infoBar,
    margin: isMobile ? "8px 8px 6px" : styles.infoBar.margin,
    padding: isMobile ? "8px" : styles.infoBar.padding
  };
  const responsivePlaylistDockStyle: React.CSSProperties = {
    ...styles.playlistDock,
    margin: isMobile ? "8px 8px 0" : styles.playlistDock.margin,
    padding: isMobile ? "8px" : styles.playlistDock.padding
  };
  const responsiveQueueRowStyle: React.CSSProperties = {
    ...styles.queueRow,
    gap: isMobile ? "6px" : styles.queueRow.gap,
    padding: isMobile ? "5px 6px" : styles.queueRow.padding
  };
  const responsiveQueueThumbStyle: React.CSSProperties = {
    ...styles.queueThumb,
    width: isMobile ? "64px" : styles.queueThumb.width,
    height: isMobile ? "36px" : styles.queueThumb.height
  };
  const responsiveQueueItemStyle: React.CSSProperties = {
    ...styles.queueItem,
    fontSize: isMobile ? "0.9rem" : styles.queueItem.fontSize
  };
  const responsiveQueueBylineStyle: React.CSSProperties = {
    ...styles.queueByline,
    fontSize: isMobile ? "0.78rem" : styles.queueByline.fontSize
  };
  const plyrThemeVars: React.CSSProperties = isLightTheme
    ? {
      ["--plyr-color-main" as any]: "#4f7ee8",
      ["--plyr-video-controls-background" as any]: "linear-gradient(180deg, rgba(228,238,255,0.54), rgba(198,216,248,0.72))",
      ["--plyr-menu-background" as any]: "rgba(242,247,255,0.9)",
      ["--plyr-menu-color" as any]: "#1f2d4d",
      ["--plyr-control-icon-size" as any]: "15px",
      ["--plyr-control-radius" as any]: "11px",
      ["--cinelink-plyr-control-bg" as any]: "rgba(36,65,120,0.08)",
      ["--cinelink-plyr-control-border" as any]: "rgba(118,153,222,0.42)",
      ["--cinelink-plyr-control-color" as any]: "#1d2b48",
      ["--cinelink-plyr-control-hover-bg" as any]: "rgba(86,138,236,0.2)",
      ["--cinelink-plyr-control-hover-border" as any]: "rgba(116,164,247,0.62)"
    }
    : {
      ["--plyr-color-main" as any]: "#5b95ff",
      ["--plyr-video-controls-background" as any]: "linear-gradient(180deg, rgba(10,20,44,0.54), rgba(7,14,33,0.8))",
      ["--plyr-menu-background" as any]: "rgba(8,17,38,0.92)",
      ["--plyr-menu-color" as any]: "#e8efff",
      ["--plyr-control-icon-size" as any]: "15px",
      ["--plyr-control-radius" as any]: "11px",
      ["--cinelink-plyr-control-bg" as any]: "rgba(255,255,255,0.08)",
      ["--cinelink-plyr-control-border" as any]: "rgba(149,182,244,0.34)",
      ["--cinelink-plyr-control-color" as any]: "#eef4ff",
      ["--cinelink-plyr-control-hover-bg" as any]: "rgba(97,154,255,0.24)",
      ["--cinelink-plyr-control-hover-border" as any]: "rgba(153,196,255,0.66)"
    };

  useEffect(() => {
    isHostRef.current = isHost;
    isJoinedRef.current = isJoined;
    roomIdRef.current = roomId;
  }, [isHost, isJoined, roomId]);

  useEffect(() => {
    return () => {
      if (subtitleTrackUrl) {
        URL.revokeObjectURL(subtitleTrackUrl);
      }
    };
  }, [subtitleTrackUrl]);

  useEffect(() => {
    subtitleDebug("track:url:changed", { hasTrack: !!subtitleTrackUrl, label: subtitleLabel });
  }, [subtitleTrackUrl, subtitleLabel]);

  useEffect(() => {
    if (videoError) {
      setShowVideoErrorModal(true);
    }
  }, [videoError]);

  useEffect(() => {
    setPlaybackMediaUrl((roomState.mediaUrl || "").trim());
    triedMkvFallbackRef.current = {};
    triedDriveVariantRef.current = {};
    setDriveIframeFallbackFor("");
  }, [roomState.mediaUrl]);

  useEffect(() => {
    if (!driveIframeFallbackFor) {
      return;
    }
    if (driveIframeFallbackFor !== activeMediaSource) {
      setDriveIframeFallbackFor("");
    }
  }, [driveIframeFallbackFor, activeMediaSource]);

  useEffect(() => {
    if (!youtubeVideoId && youtubeNowPlayingTitle) {
      setYoutubeNowPlayingTitle("");
    }
  }, [youtubeVideoId, youtubeNowPlayingTitle]);

  useEffect(() => {
    if (!activeMediaSource || youtubeVideoId) {
      return;
    }
    if (!getGoogleDrivePreviewUrl(activeMediaSource)) {
      return;
    }
    if (driveIframeFallbackFor === activeMediaSource) {
      return;
    }
    setDriveIframeFallbackFor(activeMediaSource);
    setStatus("Google Drive links use iframe mode for compatibility.");
    addDebug("video:drive:auto-iframe", { source: activeMediaSource });
  }, [activeMediaSource, youtubeVideoId, driveIframeFallbackFor]);

  useEffect(() => {
    if (!isJoined || !(roomState.mediaUrl || "").trim()) {
      setSelfSyncingPlayback(false);
    }
  }, [isJoined, roomState.mediaUrl]);

  useEffect(() => {
    if (isIframeMode && selfSyncingPlayback) {
      setSelfSyncingPlayback(false);
    }
  }, [isIframeMode, selfSyncingPlayback]);

  useEffect(() => {
    let disposed = false;
    if (typeof window === "undefined") {
      return;
    }
    if (isIframeMode) {
      if (plyrRef.current) {
        plyrRef.current.destroy();
        plyrRef.current = null;
      }
      return;
    }
    const video = videoRef.current;
    if (!video || plyrRef.current) {
      return;
    }
    const setup = async (): Promise<void> => {
      const mod: any = await import("plyr");
      if (disposed || isIframeMode || plyrRef.current || !videoRef.current) {
        return;
      }
      const PlyrCtor = mod?.default ?? mod;
      plyrRef.current = new PlyrCtor(videoRef.current, {
        controls: ["play", "progress", "current-time", "duration", "mute", "volume", "settings", "fullscreen"],
        settings: ["speed"],
        speed: {
          selected: 1,
          options: [0.5, 0.75, 1, 1.25, 1.5, 2]
        }
      });
    };
    void setup();
    return () => {
      disposed = true;
      if (plyrRef.current) {
        plyrRef.current.destroy();
        plyrRef.current = null;
      }
    };
  }, [isIframeMode]);

  useEffect(() => {
    if (!subtitleTrackUrl) {
      return;
    }
    const video = videoRef.current;
    const trackEl = subtitleTrackRef.current;
    if (!video || !trackEl) {
      subtitleDebug("track:missing-refs");
      return;
    }

    const applyShowingMode = (): void => {
      const tracks = video.textTracks;
      if (!tracks || tracks.length === 0) {
        subtitleDebug("track:no-texttracks-yet");
        return;
      }
      for (let i = 0; i < tracks.length; i += 1) {
        tracks[i].mode = i === tracks.length - 1 ? "showing" : "disabled";
      }
      const active = tracks[tracks.length - 1];
      syncPlyrCaptions(true, Math.max(0, tracks.length - 1));
      subtitleDebug("track:showing", {
        trackCount: tracks.length,
        activeLabel: active?.label,
        activeLanguage: active?.language,
        cues: active?.cues?.length ?? null
      });
    };

    const onLoad = (): void => {
      subtitleDebug("track:load:event");
      applyShowingMode();
    };
    const onError = (): void => {
      subtitleDebug("track:error:event", { src: trackEl.src });
    };

    trackEl.addEventListener("load", onLoad);
    trackEl.addEventListener("error", onError);
    const timer = window.setTimeout(applyShowingMode, 120);

    return () => {
      window.clearTimeout(timer);
      trackEl.removeEventListener("load", onLoad);
      trackEl.removeEventListener("error", onError);
    };
  }, [subtitleTrackUrl]);

  useEffect(() => {
    if (hostPopup !== "subtitle" || isIframeMode) {
      return;
    }
    refreshVideoSubtitleTracks();
    const timer = window.setInterval(() => {
      refreshVideoSubtitleTracks();
    }, 1200);
    return () => window.clearInterval(timer);
  }, [hostPopup, isIframeMode, subtitleTrackUrl]);

  useEffect(() => {
    if (hostPopup !== "audio" || isIframeMode) {
      return;
    }
    refreshVideoAudioTracks();
    const timer = window.setInterval(() => {
      refreshVideoAudioTracks();
    }, 1200);
    return () => window.clearInterval(timer);
  }, [hostPopup, isIframeMode, playbackMediaUrl, roomState.mediaUrl]);

  useEffect(() => {
    if (hostPopup === "audio" && !canOpenAudioPopup) {
      setHostPopup(null);
    }
  }, [hostPopup, canOpenAudioPopup]);

  useEffect(() => {
    if (hostPopup === "subtitle" && !canOpenSubtitlePopup) {
      setHostPopup(null);
    }
  }, [hostPopup, canOpenSubtitlePopup]);

  const addDebug = (_message: string, _payload?: unknown): void => undefined;
  const subtitleDebug = (message: string, payload?: unknown): void => {
    const ts = new Date().toISOString();
    if (payload === undefined) {
      console.log(`[CineLink][${ts}] subtitle:${message}`);
      return;
    }
    console.log(`[CineLink][${ts}] subtitle:${message}`, payload);
  };

  const applySubtitleTrackFromVtt = (vttText: string, label: string): void => {
    if (!vttText.trim()) {
      return;
    }
    if (subtitleTrackUrl) {
      URL.revokeObjectURL(subtitleTrackUrl);
    }
    const blob = new Blob([vttText], { type: "text/vtt" });
    const url = URL.createObjectURL(blob);
    setSubtitleTrackUrl(url);
    setSubtitleLabel(label || "Subtitle");
  };

  const syncPlyrCaptions = (active: boolean, preferredTrackIndex?: number): void => {
    const player = plyrRef.current;
    if (!player) {
      return;
    }
    try {
      if (player.captions && typeof player.captions === "object") {
        player.captions.active = active;
      }
      if (active && typeof preferredTrackIndex === "number" && Number.isFinite(preferredTrackIndex)) {
        player.currentTrack = preferredTrackIndex;
      }
    } catch {
      // ignore plyr caption sync errors
    }
  };

  const clearLocalSubtitleTrack = (): void => {
    if (subtitleTrackUrl) {
      URL.revokeObjectURL(subtitleTrackUrl);
    }
    setSubtitleTrackUrl("");
    setSubtitleLabel("");
    setSubtitleAppliedLanguage("");
    setSubtitleLoadingLanguage("");
    setSubtitleBaseVttText("");
    setSubtitleOffsetMs(0);
    setActiveVideoTrackIndex(-1);
    syncPlyrCaptions(false);
  };

  const refreshVideoSubtitleTracks = (): void => {
    const video = videoRef.current;
    if (!video || isIframeMode) {
      setVideoSubtitleTracks([]);
      setActiveVideoTrackIndex(-1);
      return;
    }
    const tracks = video.textTracks;
    const list: VideoSubtitleTrackInfo[] = [];
    let active = -1;
    for (let i = 0; i < tracks.length; i += 1) {
      const track = tracks[i];
      list.push({
        index: i,
        label: (track.label || "").trim() || `Track ${i + 1}`,
        language: (track.language || "").trim(),
        kind: (track.kind || "").trim()
      });
      if (track.mode === "showing") {
        active = i;
      }
    }
    setVideoSubtitleTracks(list);
    setActiveVideoTrackIndex(active);
  };

  const getBrowserAudioTracks = (video: HTMLVideoElement): BrowserAudioTrackList | null => {
    const trackList = (video as unknown as { audioTracks?: BrowserAudioTrackList }).audioTracks;
    if (!trackList || typeof trackList.length !== "number") {
      return null;
    }
    return trackList;
  };

  const refreshVideoAudioTracks = (): void => {
    const video = videoRef.current;
    if (!video || isIframeMode) {
      setVideoAudioTracks([]);
      setActiveVideoAudioTrackIndex(-1);
      return;
    }
    const tracks = getBrowserAudioTracks(video);
    if (!tracks) {
      setVideoAudioTracks([]);
      setActiveVideoAudioTrackIndex(-1);
      return;
    }
    const list: VideoAudioTrackInfo[] = [];
    let active = -1;
    for (let i = 0; i < tracks.length; i += 1) {
      const track = tracks[i];
      list.push({
        index: i,
        label: (track.label || "").trim() || `Audio ${i + 1}`,
        language: (track.language || "").trim(),
        kind: (track.kind || "").trim()
      });
      if (track.enabled) {
        active = i;
      }
    }
    setVideoAudioTracks(list);
    setActiveVideoAudioTrackIndex(active);
  };

  const selectVideoAudioTrack = (index: number): void => {
    const video = videoRef.current;
    if (!video || isIframeMode) {
      return;
    }
    const tracks = getBrowserAudioTracks(video);
    if (!tracks || tracks.length === 0) {
      setStatus("This browser does not expose selectable audio tracks for this source.");
      return;
    }
    const targetIndex = index >= 0 && index < tracks.length ? index : 0;
    for (let i = 0; i < tracks.length; i += 1) {
      tracks[i].enabled = i === targetIndex;
    }
    const chosen = videoAudioTracks.find((item) => item.index === targetIndex);
    setStatus(chosen ? `Audio track selected: ${chosen.label}` : "Audio track selected.");
    refreshVideoAudioTracks();
  };

  const selectVideoSubtitleTrack = (index: number): void => {
    const video = videoRef.current;
    if (!video || isIframeMode) {
      return;
    }
    const tracks = video.textTracks;
    if (!tracks || tracks.length === 0) {
      return;
    }
    if (index >= 0 && subtitleTrackUrl) {
      clearLocalSubtitleTrack();
    }
    for (let i = 0; i < tracks.length; i += 1) {
      tracks[i].mode = i === index ? "showing" : "disabled";
    }
    const chosen = index >= 0 ? videoSubtitleTracks.find((item) => item.index === index) : null;
    if (index >= 0) {
      syncPlyrCaptions(true, index);
    } else {
      syncPlyrCaptions(false);
    }
    setStatus(chosen ? `Subtitle track selected: ${chosen.label}` : "Subtitle track disabled.");
    subtitleDebug("track:manual-select", { index, chosen: chosen?.label || "", total: tracks.length });
    refreshVideoSubtitleTracks();
  };

  const openSubtitleFilePicker = (): void => {
    subtitleUploadInputRef.current?.click();
  };

  const applyLocalSubtitleText = (rawText: string, fileName: string): void => {
    const text = (rawText || "").trim();
    if (!text) {
      setStatus("Subtitle file is empty.");
      return;
    }
    const lowerName = (fileName || "").toLowerCase();
    const isSrt = lowerName.endsWith(".srt");
    const vttText = isSrt ? convertSrtToVtt(text) : ensureVttHeader(text);
    const baseLabel = fileName || "Local subtitle";
    setSubtitleBaseVttText(vttText);
    setSubtitleOffsetMs(0);
    applySubtitleTrackFromVtt(vttText, baseLabel);
    setSubtitleAppliedLanguage("Local");
    setStatus(`Local subtitle loaded: ${baseLabel}`);
    subtitleDebug("load:local-file:applied", { fileName, vttLength: vttText.length });
  };

  const handleSubtitleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const name = (file.name || "").toLowerCase();
      if (!(name.endsWith(".vtt") || name.endsWith(".srt"))) {
        setStatus("Unsupported subtitle file. Use .srt or .vtt.");
        return;
      }
      const text = await file.text();
      applyLocalSubtitleText(text, file.name || "Local subtitle");
    } catch (error) {
      setStatus(`Failed to load local subtitle: ${String(error)}`);
      subtitleDebug("load:local-file:error", { error: String(error) });
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const runWithActionState = async (key: string, action: () => Promise<void>): Promise<void> => {
    if (actionStates[key] === "loading") {
      return;
    }
    setActionStates((prev) => ({ ...prev, [key]: "loading" }));
    try {
      await action();
      setActionStates((prev) => ({ ...prev, [key]: "done" }));
      window.setTimeout(() => {
        setActionStates((prev) => {
          if (prev[key] !== "done") {
            return prev;
          }
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }, 900);
    } catch {
      setActionStates((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const renderActionContent = (key: string, fallback: React.ReactNode): React.ReactNode => {
    const state = actionStates[key];
    if (state === "loading") {
      return <span style={styles.actionSpinner} />;
    }
    if (state === "done") {
      return <span style={styles.actionCheck}>✓</span>;
    }
    return fallback;
  };

  const resolveAvatar = (uri?: string): string | undefined => {
    if (!uri) {
      return undefined;
    }
    return uri.startsWith("http") ? uri : rootClient.assets.toImageUrl(uri, "small");
  };

  const ensureProfiles = async (userIds: string[]): Promise<void> => {
    const missing = Array.from(new Set(userIds)).filter((id) => id && !profiles[id]);
    if (!missing.length) {
      return;
    }

    try {
      const items = await rootClient.users.getUserProfiles(missing);
      const updates: Record<string, ViewerProfile> = {};
      for (const item of items) {
        updates[item.id] = {
          name: item.nickname || shortenUserId(item.id),
          avatarUrl: resolveAvatar(item.profilePictureUri)
        };
      }

      for (const id of missing) {
        if (!updates[id]) {
          updates[id] = { name: shortenUserId(id) };
        }
      }
      setProfiles((prev) => ({ ...prev, ...updates }));
    } catch {
      const fallback: Record<string, ViewerProfile> = {};
      for (const id of missing) {
        fallback[id] = { name: shortenUserId(id) };
      }
      setProfiles((prev) => ({ ...prev, ...fallback }));
    }
  };

  const refreshRooms = async (): Promise<void> => {
    const response = await cineLinkServiceClient.listRooms({});
    const list = response.rooms || [];
    setRooms(list);
    const userIds = list.flatMap((room) => room.participantUserIds || []);
    await ensureProfiles(userIds);
  };

  const runMutation = async (request: Promise<MutationResponse>, successMessage: string): Promise<void> => {
    const response = await request;
    const state = response.state ?? EMPTY_STATE;
    addDebug("mutation", { accepted: response.accepted, reason: response.reason, state });

    if (!response.accepted) {
      setStatus(response.reason || "Action rejected.");
      if (state.roomId) {
        setRoomState(state);
        applyRemoteState(state);
      }
      return;
    }

    setRoomState(state);
    applyRemoteState(state);
    if (response.reason) {
      setStatus(response.reason);
    } else {
      setStatus(successMessage);
    }
  };

  const applyJoinedRoom = async (targetRoomId: string, state: RoomState): Promise<void> => {
    setRoomId(targetRoomId);
    setRoomState(state);
    setMediaUrlInput(state.mediaUrl || "");
    setView("room");
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => applyRemoteState(state));
    }
    if (typeof window !== "undefined") {
      const expectedHash = `#room=${encodeURIComponent(targetRoomId)}`;
      if (window.location.hash !== expectedHash) {
        window.location.hash = expectedHash;
      }
    }
    await ensureProfiles(state.participantUserIds || []);
    await ensureProfiles(state.playlistAddedByUserIds || []);
    if (state.hostUserId) {
      await ensureProfiles([state.hostUserId]);
    }
  };

  const applyRemoteState = (state: RoomState): void => {
    const video = videoRef.current;
    setRoomState(state);
    if (isLikelyMkvUrl(state.mediaUrl)) {
      addDebug("media:mkv:detected", { url: state.mediaUrl });
    }

    const youtubeId = getYouTubeVideoId(state.mediaUrl);
    if (youtubeId) {
      const player = ytPlayerRef.current;
      if (!player) {
        return;
      }

      suppressEvents.current = true;
      try {
        if (ytLoadedIdRef.current !== youtubeId) {
          if (state.playing) {
            player.loadVideoById(youtubeId, state.currentTimeSeconds || 0);
          } else {
            player.cueVideoById(youtubeId, state.currentTimeSeconds || 0);
          }
          ytLoadedIdRef.current = youtubeId;
        } else {
          const targetTime = expectedTime(state);
          const current = Number(player.getCurrentTime?.() || 0);
          if (Math.abs(current - targetTime) > 1) {
            player.seekTo(targetTime, true);
          }
          if (state.playing) {
            player.playVideo?.();
          } else {
            player.pauseVideo?.();
          }
        }
        if (state.playbackRate) {
          player.setPlaybackRate?.(state.playbackRate);
        }
      } catch (error) {
        addDebug("youtube:apply:error", { error: String(error) });
      }
      suppressEvents.current = false;
      setVideoError("");
      return;
    }

    if (!video) {
      return;
    }

    const activeMediaUrl = (playbackMediaUrl || state.mediaUrl || "").trim();
    if (activeMediaUrl && video.src !== activeMediaUrl) {
      suppressEvents.current = true;
      setSelfSyncingPlayback(true);
      video.src = activeMediaUrl;
      video.load();
      setVideoError("");
      addDebug("video:src:set", { src: activeMediaUrl, sourceMediaUrl: state.mediaUrl });
      suppressEvents.current = false;
    }

    const targetTime = expectedTime(state);
    const drift = Math.abs(video.currentTime - targetTime);
    suppressEvents.current = true;
    if (drift > 1) {
      video.currentTime = targetTime;
    }
    video.playbackRate = state.playbackRate || 1;

    if (state.playing && video.paused) {
      video.play().catch((error) => {
        setStatus(`Autoplay blocked: ${String(error)}`);
      });
    }
    if (!state.playing && !video.paused) {
      video.pause();
    }
    suppressEvents.current = false;
  };

  const joinRoom = async (targetRoomId: string): Promise<boolean> => {
    setBusy(true);
    addDebug("join:start", { rawTarget: targetRoomId, view, roomIdBefore: roomIdRef.current });
    const normalizedRoomId = normalizeJoinTarget(targetRoomId);
    addDebug("join:normalized", { rawTarget: targetRoomId, normalizedRoomId });
    if (!normalizedRoomId) {
      addDebug("join:invalid-target", { rawTarget: targetRoomId });
      setStatus("Enter a room name.");
      setBusy(false);
      return false;
    }

    try {
      addDebug("join:getRoomState:request", { roomId: normalizedRoomId });
      const response = await cineLinkServiceClient.getRoomState({ roomId: normalizedRoomId });
      const state = response.state ?? EMPTY_STATE;
      if (!state.roomId) {
        addDebug("join:not-found", { roomId: normalizedRoomId });
        setStatus(`Room "${normalizedRoomId}" was not found.`);
        setBusy(false);
        return false;
      }
      addDebug("join:getRoomState:response", {
        roomId: normalizedRoomId,
        roomName: state.roomName,
        hostUserId: state.hostUserId,
        participants: state.participantUserIds?.length || 0,
        mediaUrl: state.mediaUrl
      });
      setRoomId(normalizedRoomId);
      setRoomState(state);
      setSelfSyncingPlayback(
        !!(state.mediaUrl || "").trim() &&
        !getYouTubeVideoId(state.mediaUrl) &&
        !getGoogleDrivePreviewUrl(state.mediaUrl)
      );
      setMediaUrlInput(state.mediaUrl || "");
      setView("room");
      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => applyRemoteState(state));
      }
      setStatus((state.mediaUrl || "").trim()
        ? `Connected to "${normalizedRoomId}". Loading and syncing playback...`
        : `Connected to "${normalizedRoomId}".`);
      if (typeof window !== "undefined") {
        const expectedHash = `#room=${encodeURIComponent(normalizedRoomId)}`;
        if (window.location.hash !== expectedHash) {
          window.location.hash = expectedHash;
          addDebug("join:hash:updated", { expectedHash });
        }
      }
      await ensureProfiles(state.participantUserIds || []);
      await ensureProfiles(state.playlistAddedByUserIds || []);
      if (state.hostUserId) {
        await ensureProfiles([state.hostUserId]);
      }
      addDebug("join:success", { roomId: normalizedRoomId, viewAfter: "room" });
      setBusy(false);
      return true;
    } catch (error) {
      addDebug("join:error", { roomId: normalizedRoomId, error: String(error) });
      setStatus(`Failed to join room: ${String(error)}`);
      setBusy(false);
      return false;
    }
  };

  const createRoomAndJoin = async (): Promise<void> => {
    if (busy) {
      return;
    }
    setBusy(true);
    const generatedId = generateRoomId();
    const roomIntent = await resolveRoomNameInput(newRoomNameInput, generatedId);
    const requestedName = roomIntent.requestedName;
    const mediaFromNameField = roomIntent.mediaUrl;
    addDebug("create:start", { generatedId, requestedName });

    try {
      addDebug("rpc:preflight:start", { method: "ListRooms", timeoutMs: 2200 });
      await withTimeout(cineLinkServiceClient.listRooms({}), 2200, "ListRooms preflight timeout");
      addDebug("rpc:preflight:ok", { method: "ListRooms" });

      const hostResponse = await cineLinkServiceClient.requestHostClaim({ roomId: generatedId });
      addDebug("create:host-claim:response", { accepted: hostResponse.accepted, reason: hostResponse.reason, state: hostResponse.state });

      if (!hostResponse.accepted || !hostResponse.state?.roomId) {
        setStatus(hostResponse.reason || "Failed to create room.");
        return;
      }

      let finalState = hostResponse.state;
      if (requestedName) {
        const renameResponse = await cineLinkServiceClient.setRoomName({ roomId: generatedId, roomName: requestedName });
        addDebug("create:rename:response", { accepted: renameResponse.accepted, reason: renameResponse.reason, state: renameResponse.state });
        if (renameResponse.accepted && renameResponse.state?.roomId) {
          finalState = renameResponse.state;
        } else if (!renameResponse.accepted && renameResponse.reason) {
          setStatus(`Room created, but rename failed: ${renameResponse.reason}`);
        }
      }

      if (mediaFromNameField) {
        const mediaResponse = await cineLinkServiceClient.setMedia({ roomId: generatedId, url: mediaFromNameField });
        addDebug("create:media-from-name:response", {
          accepted: mediaResponse.accepted,
          reason: mediaResponse.reason,
          mediaUrl: mediaFromNameField
        });
        if (mediaResponse.accepted && mediaResponse.state?.roomId) {
          finalState = mediaResponse.state;
        } else if (!mediaResponse.accepted && mediaResponse.reason) {
          setStatus(`Room created, but media load failed: ${mediaResponse.reason}`);
        }
      }

      await applyJoinedRoom(generatedId, finalState);
      setStatus(`Connected to "${generatedId}".`);
      setRoomModalOpen(false);
      setNewRoomNameInput("");
      try {
        await refreshRooms();
      } catch (error) {
        addDebug("rooms:refresh:error", { error: String(error) });
      }
    } catch (error) {
      addDebug("create:error", { generatedId, error: String(error) });
      if (String(error).includes("preflight")) {
        setStatus("Server RPC unavailable (preflight). Check server process.");
      } else {
        setStatus(`Failed to create room: ${String(error)}`);
      }
    } finally {
      setBusy(false);
    }
  };

  const joinRoomFromInput = async (): Promise<void> => {
    addDebug("join:modal-submit", { input: joinRoomInput, mode: roomModalMode });
    const joined = await joinRoom(joinRoomInput);
    if (joined) {
      addDebug("join:modal-submit:success", { input: joinRoomInput });
      setJoinRoomInput("");
      setRoomModalOpen(false);
    } else {
      addDebug("join:modal-submit:failed", { input: joinRoomInput });
    }
  };

  const leaveCurrentRoom = async (): Promise<void> => {
    const currentRoomId = roomId;
    if (!currentRoomId) {
      setView("lobby");
      return;
    }

    setBusy(true);
    try {
      await cineLinkServiceClient.leaveRoom({ roomId: currentRoomId });
    } catch (error) {
      setStatus(`Failed to leave room: ${String(error)}`);
    } finally {
      setRoomId("");
      setRoomState(EMPTY_STATE);
      setSelfSyncingPlayback(false);
      clearLocalSubtitleTrack();
      setMediaUrlInput("");
      setHostPopup(null);
      setView("lobby");
      setBusy(false);
      if (typeof window !== "undefined" && window.location.hash) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      await refreshRooms();
    }
  };

  const renameRoom = async (): Promise<void> => {
    if (!isJoined || !isHost) {
      return;
    }
    const roomIntent = await resolveRoomNameInput(newRoomNameInput || roomState.roomName || roomId, roomState.roomName || roomId);
    const requestedName = roomIntent.requestedName;
    const mediaFromNameField = roomIntent.mediaUrl;
    if (!requestedName) {
      setStatus("Room name is required.");
      return;
    }
    setBusy(true);
    await runMutation(
      cineLinkServiceClient.setRoomName({ roomId, roomName: requestedName }),
      "Room renamed."
    );
    if (mediaFromNameField) {
      await runMutation(
        cineLinkServiceClient.setMedia({ roomId, url: mediaFromNameField }),
        "Media link loaded."
      );
    }
    setRoomModalOpen(false);
    setHostPopup(null);
    setBusy(false);
    await refreshRooms();
  };

  const openCreateRoomModal = (): void => {
    addDebug("modal:open", { mode: "create" });
    setRoomModalMode("create");
    setNewRoomNameInput("");
    setRoomModalOpen(true);
  };

  const openRenameRoomModal = (): void => {
    addDebug("modal:open", { mode: "rename", currentRoomId: roomId });
    setRoomModalMode("rename");
    setNewRoomNameInput(roomState.roomName || roomId);
    setRoomModalOpen(true);
    setHostPopup(null);
  };

  const copyRoomLink = async (): Promise<void> => {
    if (!roomId) {
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}#room=${encodeURIComponent(roomId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setStatus("Room link copied.");
      setHostPopup(null);
    } catch {
      setStatus("Could not copy link.");
    }
  };

  const toggleViewerQueueAdd = async (): Promise<void> => {
    if (!isJoined || !isHost) {
      return;
    }
    await runMutation(
      cineLinkServiceClient.setViewerQueuePolicy({
        roomId,
        allowViewerQueueAdd: !roomState.allowViewerQueueAdd
      }),
      roomState.allowViewerQueueAdd ? "Member queue add disabled." : "Member queue add enabled."
    );
  };

  const requestHostClaim = async (): Promise<void> => {
    if (!isJoined) {
      return;
    }
    await runMutation(
      cineLinkServiceClient.requestHostClaim({ roomId }),
      "Host claim submitted."
    );
  };

  const approveHostClaim = async (approve: boolean): Promise<void> => {
    if (!isHost || !roomState.pendingHostUserId) {
      return;
    }
    await runMutation(
      cineLinkServiceClient.decideHostClaim({
        roomId,
        requesterUserId: roomState.pendingHostUserId,
        approve
      }),
      approve ? "Host claim approved." : "Host claim rejected."
    );
  };

  const requestHostTransferCandidate = (userId: string): void => {
    if (!isHost || !isJoined || !userId || userId === me) {
      return;
    }
    if (pendingClaimUserId) {
      setStatus("Resolve current host claim first.");
      return;
    }
    setHostTransferCandidateUserId((prev) => prev === userId ? "" : userId);
  };

  const confirmHostTransfer = async (): Promise<void> => {
    if (!isHost || !isJoined || !hostTransferCandidateUserId) {
      return;
    }
    await runMutation(
      cineLinkServiceClient.setHost({ roomId, hostUserId: hostTransferCandidateUserId }),
      "Host transferred."
    );
    setHostTransferCandidateUserId("");
  };

  const setMedia = async (): Promise<void> => {
    if (!isJoined) {
      return;
    }
    if (!isHost) {
      setStatus("Only host can load a link.");
      return;
    }
    const urls = parseMediaUrlsInput(mediaUrlInput);
    if (!urls.length) {
      setStatus("Paste at least one valid URL.");
      return;
    }
    const resolvedUrls = await resolveMediaUrls(urls);
    const changedCount = resolvedUrls.filter((url, idx) => url !== urls[idx]).length;

    await runMutation(cineLinkServiceClient.setMedia({ roomId, url: resolvedUrls[0] }), "Media link loaded.");
    if (resolvedUrls.length > 1) {
      for (const extraUrl of resolvedUrls.slice(1)) {
        await runMutation(
          cineLinkServiceClient.addQueueLast({ roomId, url: extraUrl }),
          "Added to queue end."
        );
      }
      setStatus(
        `${changedCount ? `Resolved ${changedCount} link(s). ` : ""}Loaded current + ${resolvedUrls.length - 1} queued.`
      );
    } else if (changedCount) {
      setStatus(`Resolved ${changedCount} link(s). Media link loaded.`);
    }
    setMediaUrlInput("");
    setHostPopup(null);
  };

  const addNext = async (): Promise<void> => {
    if (!isJoined || !isHost) {
      return;
    }
    const urls = parseMediaUrlsInput(mediaUrlInput);
    if (!urls.length) {
      setStatus("Paste at least one valid URL.");
      return;
    }
    const resolvedUrls = await resolveMediaUrls(urls);

    // Reverse so the first typed URL stays as the next item.
    for (const url of [...resolvedUrls].reverse()) {
      await runMutation(cineLinkServiceClient.addQueueNext({ roomId, url }), "Added right after current video.");
    }
    setStatus(`${resolvedUrls.length} item(s) added right after current video.`);
    setMediaUrlInput("");
    setHostPopup(null);
  };

  const addLast = async (): Promise<void> => {
    if (!isJoined) {
      return;
    }
    if (!isHost && !roomState.allowViewerQueueAdd) {
      setStatus("Host has disabled queue adds for members.");
      return;
    }
    const urls = parseMediaUrlsInput(mediaUrlInput);
    if (!urls.length) {
      setStatus("Paste at least one valid URL.");
      return;
    }
    const resolvedUrls = await resolveMediaUrls(urls);

    for (const url of resolvedUrls) {
      await runMutation(cineLinkServiceClient.addQueueLast({ roomId, url }), "Added to queue end.");
    }
    setStatus(`${resolvedUrls.length} item(s) added to queue end.`);
    setMediaUrlInput("");
    setHostPopup(null);
  };

  const resolveMediaUrls = async (urls: string[]): Promise<string[]> => {
    const resolved = await Promise.all(
      urls.map(async (url) => {
        const driveNormalized = toGoogleDriveDirectViewUrl(url);
        return resolveArchiveMediaUrl(driveNormalized);
      })
    );
    return resolved;
  };

  const searchSubtitles = async (): Promise<SubtitleResult[]> => {
    if (!isJoined) {
      subtitleDebug("search:blocked:not-joined");
      return [];
    }
    const requestData = buildSubtitleSearchRequest(subtitleQuery, roomState.roomName, roomState.mediaUrl, "all");
    const query = requestData.query;
    subtitleDebug("search:start", {
      query,
      roomId,
      roomName: roomState.roomName,
      mediaUrl: roomState.mediaUrl,
      tvseries: requestData.tvseries,
      season: requestData.season,
      episode: requestData.episode
    });
    if (!query) {
      setStatus("Type a subtitle query first.");
      subtitleDebug("search:blocked:empty-query");
      return [];
    }
    setSubtitleBusy(true);
    try {
      subtitleDebug("search:request", requestData);
      const response = await cineLinkServiceClient.searchSubtitles({
        query: requestData.query,
        language: requestData.language,
        tvseries: requestData.tvseries,
        season: requestData.season,
        episode: requestData.episode
      });
      setSubtitleResults(response.items || []);
      const items = response.items || [];
      subtitleDebug("search:response", {
        error: response.error,
        count: items.length,
        top: items[0] ? { name: items[0].name, score: items[0].score, provider: items[0].provider } : null
      });
      if (response.error) {
        setStatus(response.error);
      } else {
        setStatus(`Subtitle search returned ${items.length} result(s).`);
      }
      return items;
    } catch (error) {
      setStatus(`Subtitle search failed: ${String(error)}`);
      subtitleDebug("search:error", { error: String(error) });
      return [];
    } finally {
      setSubtitleBusy(false);
      subtitleDebug("search:done");
    }
  };

  const loadSubtitleFromUrl = async (downloadUrl: string, nameHint = "Subtitle", languageLabel = ""): Promise<void> => {
    if (!isJoined || !downloadUrl.trim()) {
      subtitleDebug("load:blocked", { isJoined, hasUrl: !!downloadUrl.trim() });
      return;
    }
    if (isIframeMode) {
      setStatus("Subtitle loading is available only for direct video playback, not iframe mode.");
      subtitleDebug("load:blocked:iframe", { youtubeVideoId, drivePreviewUrl });
      return;
    }
    setSubtitleBusy(true);
    setSubtitleLoadingLanguage(languageLabel);
    subtitleDebug("load:start", { downloadUrl, nameHint, languageLabel });
    try {
      if (subtitleTrackUrl && languageLabel && subtitleAppliedLanguage !== languageLabel) {
        URL.revokeObjectURL(subtitleTrackUrl);
        setSubtitleTrackUrl("");
        setSubtitleLabel("");
      }
      const response = await cineLinkServiceClient.fetchSubtitle({ downloadUrl: downloadUrl.trim() });
      subtitleDebug("load:response", {
        ok: response.ok,
        error: response.error,
        name: response.name,
        vttLength: (response.vttText || "").length
      });
      if (!response.ok || !response.vttText) {
        setStatus(response.error || "Could not load subtitle.");
        return;
      }
      const baseVtt = ensureVttHeader(response.vttText);
      const baseLabel = response.name || nameHint;
      setSubtitleBaseVttText(baseVtt);
      setSubtitleOffsetMs(0);
      applySubtitleTrackFromVtt(baseVtt, baseLabel);
      setSubtitleAppliedLanguage(languageLabel);
      setStatus(`Subtitle loaded: ${baseLabel}`);
      subtitleDebug("load:applied", { label: baseLabel, shared: false });
    } catch (error) {
      setStatus(`Subtitle load failed: ${String(error)}`);
      subtitleDebug("load:error", { error: String(error) });
    } finally {
      setSubtitleBusy(false);
      setSubtitleLoadingLanguage("");
      subtitleDebug("load:done");
    }
  };

  const clearSubtitle = async (): Promise<void> => {
    subtitleDebug("clear:start", { hadTrack: !!subtitleTrackUrl, label: subtitleLabel });
    clearLocalSubtitleTrack();
    setStatus("Subtitle cleared.");
    subtitleDebug("clear:done");
  };

  useEffect(() => {
    if (!subtitleBaseVttText.trim()) {
      return;
    }
    if (subtitleOffsetMs === 0) {
      applySubtitleTrackFromVtt(subtitleBaseVttText, subtitleLabel || "Subtitle");
      return;
    }
    const shifted = shiftVttByMs(subtitleBaseVttText, subtitleOffsetMs);
    applySubtitleTrackFromVtt(shifted, subtitleLabel || "Subtitle");
    subtitleDebug("offset:applied", { subtitleOffsetMs });
  }, [subtitleOffsetMs, subtitleBaseVttText]);

  const tryApplyBrowserFriendlyFallback = async (rawUrl: string): Promise<boolean> => {
    const sourceUrl = (rawUrl || "").trim();
    if (!sourceUrl || !isLikelyMkvUrl(sourceUrl)) {
      return false;
    }
    if (triedMkvFallbackRef.current[sourceUrl]) {
      return false;
    }
    triedMkvFallbackRef.current[sourceUrl] = true;
    try {
      const resolved = (await resolveArchiveMediaUrl(sourceUrl)).trim();
      if (!resolved || resolved === sourceUrl) {
        return false;
      }
      setPlaybackMediaUrl(resolved);
      setVideoError("");
      setStatus("Applied browser-compatible video fallback.");
      addDebug("video:fallback:applied", { from: sourceUrl, to: resolved });
      return true;
    } catch (error) {
      addDebug("video:fallback:error", { from: sourceUrl, error: String(error) });
      return false;
    }
  };

  const updateYoutubeNowPlayingTitle = (): void => {
    const player = ytPlayerRef.current;
    if (!player) {
      return;
    }
    try {
      const data = player.getVideoData?.();
      const title = (data?.title || "").trim();
      if (!title || /^watch$/i.test(title)) {
        setYoutubeNowPlayingTitle("YouTube video");
        return;
      }
      setYoutubeNowPlayingTitle(title);
    } catch {
      setYoutubeNowPlayingTitle("YouTube video");
    }
  };

  const tryApplyDriveDirectVariant = (rawUrl: string): boolean => {
    const sourceUrl = (rawUrl || "").trim();
    if (!sourceUrl) {
      return false;
    }
    const alternateUrl = toGoogleDriveAlternateDirectUrl(sourceUrl);
    if (!alternateUrl || alternateUrl === sourceUrl) {
      return false;
    }
    if (triedDriveVariantRef.current[sourceUrl]) {
      return false;
    }
    triedDriveVariantRef.current[sourceUrl] = true;
    setPlaybackMediaUrl(alternateUrl);
    setStatus("Trying alternate Google Drive direct URL...");
    addDebug("video:drive-direct-variant", { from: sourceUrl, to: alternateUrl });
    return true;
  };

  const tryEnableDriveIframeFallback = (rawUrl: string): boolean => {
    const sourceUrl = (rawUrl || "").trim();
    if (!sourceUrl) {
      return false;
    }
    if (getYouTubeVideoId(sourceUrl)) {
      return false;
    }
    const preview = getGoogleDrivePreviewUrl(sourceUrl);
    if (!preview) {
      return false;
    }
    setDriveIframeFallbackFor(sourceUrl);
    setVideoError("");
    setShowVideoErrorModal(false);
    setStatus("Direct playback failed. Switched to Google Drive iframe mode.");
    addDebug("video:drive-iframe-fallback", { sourceUrl, preview });
    return true;
  };

  const reportSyncStatus = async (ready: boolean, currentTimeSeconds = 0): Promise<void> => {
    if (!isJoined) {
      return;
    }
    await cineLinkServiceClient.reportSyncStatus({
      roomId,
      ready,
      currentTimeSeconds: Math.max(0, currentTimeSeconds)
    });
  };

  const closeHostPopupOnOutsideClick = (event: React.MouseEvent): void => {
    if (!hostPopup) {
      return;
    }
    const target = event.target as Node | null;
    if (!target) {
      return;
    }
    if (hostPopupRef.current?.contains(target)) {
      return;
    }
    if (bottomActionsRef.current?.contains(target)) {
      return;
    }
    setHostPopup(null);
  };

  const resolveRoomNameInput = async (input: string, fallback: string): Promise<{ requestedName: string; mediaUrl: string }> => {
    const rawInput = (input || "").trim();
    const safeFallback = (fallback || "").trim();
    if (!isHttpMediaUrl(rawInput)) {
      return {
        requestedName: (rawInput || safeFallback).slice(0, 80),
        mediaUrl: ""
      };
    }

    const mediaUrl = (await resolveArchiveMediaUrl(rawInput)).trim();
    const requestedName = (getMediaDisplayName(mediaUrl || rawInput) || safeFallback).slice(0, 80);
    return {
      requestedName,
      mediaUrl: mediaUrl || rawInput
    };
  };

  const removeQueueItem = async (index: number): Promise<void> => {
    if (!isJoined) {
      return;
    }
    await runMutation(
      cineLinkServiceClient.removeQueueItem({ roomId, index }),
      "Queue item removed."
    );
  };

  const nextQueueItem = async (): Promise<void> => {
    if (!isJoined || !isHost) {
      return;
    }
    await runMutation(
      cineLinkServiceClient.advanceQueue({ roomId, autoplay: true }),
      "Loaded next from queue."
    );
  };

  const previousQueueItem = async (): Promise<void> => {
    if (!isJoined || !isHost) {
      return;
    }
    await runMutation(
      cineLinkServiceClient.previousQueue({ roomId, autoplay: true }),
      "Loaded previous item."
    );
  };

  const moveQueueItem = async (fromIndex: number, toIndex: number): Promise<void> => {
    if (!isJoined || !isHost || fromIndex === toIndex) {
      return;
    }
    await runMutation(
      cineLinkServiceClient.moveQueueItem({ roomId, fromIndex, toIndex }),
      "Queue reordered."
    );
  };

  useEffect(() => {
    const onThemeUpdate = (mode: "dark" | "light"): void => setThemeMode(mode);
    rootClient.theme.on(RootClientThemeEvent.ThemeUpdate, onThemeUpdate);
    void refreshRooms();
    const timer = setInterval(() => {
      void refreshRooms();
    }, 6000);
    return () => {
      rootClient.theme.off(RootClientThemeEvent.ThemeUpdate, onThemeUpdate);
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const tryJoinFromHash = (): void => {
      const hashRoomId = getRoomIdFromHash(window.location.hash);
      addDebug("hashchange:detected", { hash: window.location.hash, parsedRoomId: hashRoomId, currentRoomId: roomIdRef.current });
      if (!hashRoomId || hashRoomId === roomIdRef.current) {
        return;
      }
      void joinRoom(hashRoomId);
    };

    tryJoinFromHash();
    window.addEventListener("hashchange", tryJoinFromHash);
    return () => {
      window.removeEventListener("hashchange", tryJoinFromHash);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if ((window as any).YT?.Player) {
      setYtApiReady(true);
      return;
    }

    const existing = document.getElementById("youtube-iframe-api");
    if (!existing) {
      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      setYtApiReady(true);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const onResize = (): void => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onStateChanged = (event: StateChangedEvent): void => {
      if (!isJoined || event.roomId !== roomId || !event.state) {
        return;
      }
      applyRemoteState(event.state);
      void ensureProfiles([
        ...(event.state.participantUserIds || []),
        ...(event.state.playlistAddedByUserIds || [])
      ]);
      if (event.state.hostUserId) {
        void ensureProfiles([event.state.hostUserId]);
      }
    };

    cineLinkServiceClient.on(CineLinkServiceClientEvent.StateChanged, onStateChanged);
    return () => {
      cineLinkServiceClient.off(CineLinkServiceClientEvent.StateChanged, onStateChanged);
    };
  }, [isJoined, roomId]);

  useEffect(() => {
    if (!isJoined || !roomId) {
      return;
    }
    let cancelled = false;
    const refreshState = async (): Promise<void> => {
      try {
        const response = await cineLinkServiceClient.getRoomState({ roomId });
        const state = response.state ?? EMPTY_STATE;
        if (cancelled || !state.roomId) {
          return;
        }
        applyRemoteState(state);
        void ensureProfiles([
          ...(state.participantUserIds || []),
          ...(state.playlistAddedByUserIds || [])
        ]);
        if (state.hostUserId) {
          void ensureProfiles([state.hostUserId]);
        }
      } catch {
        // ignore transient poll errors
      }
    };
    const timer = window.setInterval(() => {
      void refreshState();
    }, 1800);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isJoined, roomId]);

  useEffect(() => {
    if (!isJoined || !roomId || !hasPendingClaim) {
      return;
    }
    let cancelled = false;

    const refreshPendingClaimState = async (): Promise<void> => {
      try {
        const response = await cineLinkServiceClient.getRoomState({ roomId });
        const state = response.state ?? EMPTY_STATE;
        if (cancelled || !state.roomId) {
          return;
        }
        applyRemoteState(state);
        if (!state.pendingHostUserId) {
          setStatus("Host claim was resolved.");
        }
      } catch {
        // ignore transient polling errors while claim is pending
      }
    };

    void refreshPendingClaimState();
    const timer = window.setInterval(() => {
      void refreshPendingClaimState();
    }, 1400);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isJoined, roomId, hasPendingClaim]);

  useEffect(() => {
    if (!isHost || !isJoined) {
      setHostTransferCandidateUserId("");
      return;
    }
    if (pendingClaimUserId && hostTransferCandidateUserId) {
      setHostTransferCandidateUserId("");
      return;
    }
    if (hostTransferCandidateUserId && !participants.includes(hostTransferCandidateUserId)) {
      setHostTransferCandidateUserId("");
    }
  }, [isHost, isJoined, pendingClaimUserId, hostTransferCandidateUserId, participants]);

  useEffect(() => {
    if (!youtubeVideoId || !ytApiReady || !ytContainerRef.current) {
      return;
    }

    if (!(window as any).YT?.Player) {
      return;
    }

    if (!ytPlayerRef.current) {
      ytPlayerRef.current = new (window as any).YT.Player(ytContainerRef.current, {
        videoId: youtubeVideoId,
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => {
            ytLoadedIdRef.current = youtubeVideoId;
            updateYoutubeNowPlayingTitle();
            if (isHostRef.current && roomIdRef.current) {
              const duration = Number(ytPlayerRef.current?.getDuration?.() || 0);
              if (duration > 0) {
                void runMutation(
                  cineLinkServiceClient.setDuration({ roomId: roomIdRef.current, durationSeconds: duration }),
                  "Duration synced."
                );
              }
            }
          },
          onStateChange: (event: any) => {
            updateYoutubeNowPlayingTitle();
            if (suppressEvents.current || !isHostRef.current || !isJoinedRef.current) {
              return;
            }
            const at = Number(ytPlayerRef.current?.getCurrentTime?.() || 0);
            if (event.data === 1) {
              void runMutation(cineLinkServiceClient.play({ roomId: roomIdRef.current, atSeconds: at }), "Play.");
            } else if (event.data === 2) {
              void runMutation(cineLinkServiceClient.pause({ roomId: roomIdRef.current, atSeconds: at }), "Pause.");
            } else if (event.data === 0) {
              void runMutation(
                cineLinkServiceClient.advanceQueue({ roomId: roomIdRef.current, autoplay: true }),
                "Loaded next from queue."
              );
            }
          },
          onPlaybackRateChange: () => {
            if (suppressEvents.current || !isHostRef.current || !isJoinedRef.current) {
              return;
            }
            const rate = Number(ytPlayerRef.current?.getPlaybackRate?.() || 1);
            void runMutation(
              cineLinkServiceClient.setRate({ roomId: roomIdRef.current, playbackRate: rate }),
              `Speed ${rate}x.`
            );
          }
        }
      });
    } else if (ytLoadedIdRef.current !== youtubeVideoId) {
      suppressEvents.current = true;
      ytPlayerRef.current.cueVideoById?.(youtubeVideoId, 0);
      ytLoadedIdRef.current = youtubeVideoId;
      suppressEvents.current = false;
      window.setTimeout(() => {
        updateYoutubeNowPlayingTitle();
      }, 120);
    }
  }, [youtubeVideoId, ytApiReady]);

  useEffect(() => {
    if (!youtubeVideoId || !isHost || !isJoined) {
      return;
    }

    const timer = setInterval(() => {
      const player = ytPlayerRef.current;
      if (!player) {
        return;
      }
      const at = Number(player.getCurrentTime?.() || 0);
      void cineLinkServiceClient.seek({ roomId, atSeconds: at });
    }, 3000);

    return () => clearInterval(timer);
  }, [youtubeVideoId, isHost, isJoined, roomId]);

  useEffect(() => {
    if (!isJoined || !youtubeVideoId) {
      return;
    }
    const timer = window.setInterval(() => {
      const player = ytPlayerRef.current;
      if (!player) {
        return;
      }
      const at = Number(player.getCurrentTime?.() || 0);
      void reportSyncStatus(syncReadySet.has(me), at);
    }, 1400);
    return () => window.clearInterval(timer);
  }, [isJoined, youtubeVideoId, roomId, me, syncReadySet]);

  useEffect(() => {
    if (!isJoined || !youtubeVideoId || syncMode !== "youtube") {
      return;
    }
    const launchAt = Number(roomState.syncLaunchAtMs || BigInt(0));
    if (!launchAt) {
      return;
    }
    const target = Math.max(0, roomState.syncTargetSeconds || 0);
    const player = ytPlayerRef.current;
    if (!player) {
      return;
    }
    try {
      player.pauseVideo?.();
      player.seekTo?.(target, true);
    } catch {
      // ignore youtube sync prep errors
    }

    const key = `yt:${roomId}:${launchAt}`;
    if (syncLaunchHandledRef.current === key) {
      return;
    }
    syncLaunchHandledRef.current = key;
    const delay = Math.max(0, launchAt - Date.now());
    const timer = window.setTimeout(() => {
      if (isHostRef.current) {
        void runMutation(
          cineLinkServiceClient.play({ roomId: roomIdRef.current, atSeconds: target }),
          "Resumed synced playback."
        );
        return;
      }
      try {
        ytPlayerRef.current?.playVideo?.();
      } catch {
        // ignore client play errors
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [isJoined, youtubeVideoId, syncMode, roomState.syncLaunchAtMs, roomState.syncTargetSeconds, roomId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || isIframeMode) {
      return;
    }

    const onError = (): void => {
      const code = video.error?.code ?? -1;
      const msg = `Media error (code=${code}) src=${video.currentSrc || "-"}`;
      const sourceForHint = video.currentSrc || playbackMediaUrl || roomState.mediaUrl;
      if (tryApplyDriveDirectVariant(sourceForHint)) {
        return;
      }
      if (tryEnableDriveIframeFallback(sourceForHint)) {
        return;
      }
      const mkvHint = isLikelyMkvUrl(sourceForHint)
        ? `MKV failed in browser. ${getMkvFailureHint(sourceForHint)}`
        : "";
      setVideoError(mkvHint ? `${msg}. ${mkvHint}` : msg);
      setStatus("Failed to load media.");
      setSelfSyncingPlayback(false);
      addDebug("video:error", { code, currentSrc: video.currentSrc });
      void tryApplyBrowserFriendlyFallback(sourceForHint);
    };

    const onLoadedMetadata = (): void => {
      if (video.videoWidth === 0 && video.videoHeight === 0 && video.duration > 0) {
        const sourceForHint = video.currentSrc || playbackMediaUrl || roomState.mediaUrl;
        if (tryApplyDriveDirectVariant(sourceForHint)) {
          return;
        }
        const hint = `Video stream is not decodable in this browser (audio-only fallback). ${getMkvFailureHint(sourceForHint)}`;
        setVideoError(hint);
        setStatus("Video codec unsupported in browser.");
        addDebug("video:audio-only-detected", {
          currentSrc: video.currentSrc,
          duration: video.duration
        });
        void tryApplyBrowserFriendlyFallback(sourceForHint);
      } else {
        setVideoError("");
      }
      if (!isHost || !roomId || !Number.isFinite(video.duration)) {
        refreshVideoSubtitleTracks();
        refreshVideoAudioTracks();
        return;
      }
      refreshVideoSubtitleTracks();
      refreshVideoAudioTracks();
      void runMutation(
        cineLinkServiceClient.setDuration({ roomId, durationSeconds: video.duration }),
        "Duration synced."
      );
    };

    const onLoadedData = (): void => {
      if (video.videoWidth === 0 && video.videoHeight === 0 && video.duration > 0) {
        const sourceForHint = video.currentSrc || playbackMediaUrl || roomState.mediaUrl;
        if (tryApplyDriveDirectVariant(sourceForHint)) {
          return;
        }
        const hint = `Video stream is not decodable in this browser (audio-only fallback). ${getMkvFailureHint(sourceForHint)}`;
        setVideoError(hint);
        setStatus("Video codec unsupported in browser.");
        addDebug("video:audio-only-loadeddata", {
          currentSrc: video.currentSrc,
          duration: video.duration
        });
        void tryApplyBrowserFriendlyFallback(sourceForHint);
        setSelfSyncingPlayback(false);
      } else if ((video.videoWidth > 0 || video.videoHeight > 0) && selfSyncingPlayback) {
        setSelfSyncingPlayback(false);
        setStatus("Synced with room playback.");
        addDebug("join:sync:complete", {
          currentSrc: video.currentSrc,
          currentTime: video.currentTime,
          duration: video.duration
        });
      }
    };

    video.addEventListener("error", onError);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("loadeddata", onLoadedData);
    return () => {
      video.removeEventListener("error", onError);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("loadeddata", onLoadedData);
    };
  }, [isHost, roomId, isIframeMode, roomState.mediaUrl, playbackMediaUrl, selfSyncingPlayback]);

  useEffect(() => {
    if (!isJoined) {
      return;
    }

    const timer = setInterval(() => {
      const video = videoRef.current;
      if (!video || !roomState.playing) {
        return;
      }

      const target = expectedTime(roomState);
      const diff = video.currentTime - target;
      if (Math.abs(diff) > 1) {
        suppressEvents.current = true;
        video.currentTime = target;
        suppressEvents.current = false;
        return;
      }

      if (diff > 0.25) {
        video.playbackRate = Math.max(0.97, roomState.playbackRate - 0.03);
      } else if (diff < -0.25) {
        video.playbackRate = Math.min(1.03, roomState.playbackRate + 0.03);
      } else {
        video.playbackRate = roomState.playbackRate;
      }
    }, 2000);

    return () => clearInterval(timer);
  }, [isJoined, roomState]);

  useEffect(() => {
    if (isIframeMode) {
      return;
    }
    const timer = setInterval(() => {
      const main = videoRef.current;
      const ambi = ambilightVideoRef.current;
      if (!main || !ambi) {
        return;
      }
      const drift = Math.abs(main.currentTime - ambi.currentTime);
      if (drift > 0.35) {
        try {
          ambi.currentTime = main.currentTime;
        } catch {
          // ignore sync errors for non-seekable streams
        }
      }
    }, 700);
    return () => clearInterval(timer);
  }, [isIframeMode]);

  useEffect(() => {
    if (isIframeMode) {
      return;
    }
    const ambi = ambilightVideoRef.current;
    if (!ambi) {
      return;
    }

    const src = (playbackMediaUrl || roomState.mediaUrl || "").trim();
    if (!src) {
      if (ambi.getAttribute("src")) {
        ambi.removeAttribute("src");
        ambi.load();
      }
      return;
    }

    if (ambi.src !== src) {
      ambi.src = src;
      ambi.load();
    }

    const main = videoRef.current;
    if (main) {
      const drift = Math.abs((ambi.currentTime || 0) - (main.currentTime || 0));
      if (Number.isFinite(main.currentTime) && drift > 0.5) {
        try {
          ambi.currentTime = main.currentTime;
        } catch {
          // ignore sync errors for non-seekable streams
        }
      }
      ambi.playbackRate = main.playbackRate || 1;
      if (main.paused) {
        ambi.pause();
      } else {
        ambi.play().catch(() => undefined);
      }
      return;
    }

    ambi.playbackRate = roomState.playbackRate || 1;
    if (roomState.playing) {
      ambi.play().catch(() => undefined);
    } else {
      ambi.pause();
    }
  }, [playbackMediaUrl, roomState.mediaUrl, roomState.playing, roomState.playbackRate, roomState.currentTimeSeconds, isIframeMode]);

  useEffect(() => {
    if (isIframeMode) {
      return;
    }

    const video = videoRef.current;
    const mediaUrl = (roomState.mediaUrl || "").trim();
    if (!video || !mediaUrl) {
      return;
    }

    const captureThumb = (): void => {
      if (!video.videoWidth || !video.videoHeight) {
        return;
      }
      try {
        const canvas = document.createElement("canvas");
        const targetWidth = 320;
        const scale = targetWidth / video.videoWidth;
        canvas.width = targetWidth;
        canvas.height = Math.max(180, Math.round(video.videoHeight * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
        setMediaThumbCache((prev) => (prev[mediaUrl] === dataUrl ? prev : { ...prev, [mediaUrl]: dataUrl }));
      } catch (error) {
        addDebug("thumb:capture:error", { mediaUrl, error: String(error) });
      }
    };

    const setupPlan = (): void => {
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
      const step = duration > 0 ? Math.min(duration * 0.1, 300) : 300;
      const firstAt = duration > 0 ? Math.max(0.8, Math.min(duration * 0.01, step)) : 0.8;
      thumbCapturePlanRef.current = { url: mediaUrl, nextAt: firstAt, step };
    };

    const onLoadedMetadata = (): void => {
      setupPlan();
      if (!mediaThumbCache[mediaUrl]) {
        captureThumb();
      }
    };

    const onTimeUpdate = (): void => {
      const plan = thumbCapturePlanRef.current;
      if (!plan || plan.url !== mediaUrl) {
        return;
      }
      if (video.currentTime + 0.01 < plan.nextAt) {
        return;
      }
      captureThumb();
      while (plan.nextAt <= video.currentTime + 0.01) {
        plan.nextAt += plan.step;
      }
      thumbCapturePlanRef.current = plan;
    };

    const onSeeked = (): void => {
      const plan = thumbCapturePlanRef.current;
      if (!plan || plan.url !== mediaUrl) {
        return;
      }
      if (video.currentTime >= plan.nextAt) {
        captureThumb();
        while (plan.nextAt <= video.currentTime + 0.01) {
          plan.nextAt += plan.step;
        }
        thumbCapturePlanRef.current = plan;
      }
    };

    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("seeked", onSeeked);
    if (video.readyState >= 1) {
      onLoadedMetadata();
    }
    return () => {
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("seeked", onSeeked);
    };
  }, [isIframeMode, roomState.mediaUrl, mediaThumbCache]);

  const emitPlay = async (): Promise<void> => {
    if (!isHost || suppressEvents.current || !videoRef.current) {
      return;
    }
    await runMutation(cineLinkServiceClient.play({ roomId, atSeconds: videoRef.current.currentTime }), "Play.");
  };

  const emitPause = async (): Promise<void> => {
    if (!isHost || suppressEvents.current || !videoRef.current) {
      return;
    }
    await runMutation(cineLinkServiceClient.pause({ roomId, atSeconds: videoRef.current.currentTime }), "Pause.");
  };

  const emitSeek = async (): Promise<void> => {
    if (!isHost || suppressEvents.current || !videoRef.current) {
      return;
    }
    await runMutation(cineLinkServiceClient.seek({ roomId, atSeconds: videoRef.current.currentTime }), "Seek.");
  };

  const emitRate = async (rate: number): Promise<void> => {
    if (!isHost || suppressEvents.current) {
      return;
    }
    await runMutation(cineLinkServiceClient.setRate({ roomId, playbackRate: rate }), `Speed ${rate}x.`);
  };

  if (view === "lobby") {
    return (
      <main style={{ ...responsivePageStyle, background: tokens.background, color: tokens.text }}>
        <section
          style={{
            ...responsiveLobbyShellStyle,
            borderColor: tokens.border,
            background: tokens.glass,
            ...liquidShellSurfaceStyle
          }}
        >
          <header style={styles.lobbyTopBar}>
            <div style={styles.brandWrap}>
              <div style={styles.logoMark}><img
                alt="CineLink"
                style={{
                  ...styles.logoImage,
                  ...(isLightTheme
                    ? {
                        mixBlendMode: "normal",
                        opacity: 0.98,
                        filter: "drop-shadow(0 4px 10px rgba(92,123,196,0.28))"
                      }
                    : {
                        mixBlendMode: "screen",
                        opacity: 1
                      })
                }}
                src={brandLogoAsset}
              />
              </div>
              <strong style={styles.brandText}>CineLink</strong>
            </div>
          </header>
          <span style={styles.srOnly}>{status}</span>
          <h2 style={responsiveLobbyTitleStyle}>Lobby</h2>

          <section style={responsiveRoomGridStyle}>
            {rooms.map((room) => {
              const minutes = Math.floor(room.currentTimeSeconds / 60);
              const durationMinutes = Math.floor(room.durationSeconds / 60);
              const percent = Math.round(room.progressPercent || 0);
              const thumbUrl = getRoomThumbnail(room.mediaUrl || room.previewMediaUrl, mediaThumbCache);
              const orderedParticipants = prioritizeHost(room.participantUserIds || [], room.hostUserId);
              const previewParticipants = orderedParticipants.slice(0, 3);
              const extraParticipants = Math.max(0, orderedParticipants.length - previewParticipants.length);
              const statusKind = getRoomStatusKind(room);
              const statusColor = isLightTheme && !thumbUrl ? "#111827" : "#e2e8f0";
              const roomLabel = getReadableRoomName(room.roomName || room.roomId, room.roomId);
              return (
                <article
                  key={room.roomId}
                  style={{
                    ...responsiveRoomCardStyle,
                    borderColor: tokens.border,
                    background: tokens.card,
                    ...liquidCardSurfaceStyle,
                    backgroundImage: thumbUrl ? `url("${thumbUrl}")` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center"
                  }}
                  onClick={() => void joinRoom(room.roomId)}
                >
                  <div style={{ ...styles.roomTop, ...(thumbUrl ? styles.roomTopOverlay : {}) }}>
                    <div style={styles.roomCardViewerRow}>
                      {previewParticipants.map((userId) => {
                        const profile = profiles[userId];
                        const label = profile?.name || shortenUserId(userId);
                        return (
                          <div key={userId} title={label} style={styles.avatarWrap}>
                            {profile?.avatarUrl ? (
                              <img src={profile.avatarUrl} alt={label} style={styles.avatar} />
                            ) : (
                              <div style={styles.avatarFallback}>{initials(label)}</div>
                            )}
                          </div>
                        );
                      })}
                      {extraParticipants > 0 && (
                        <div
                          title={`${extraParticipants} more`}
                          style={styles.avatarCountBadge}
                        >
                          +{extraParticipants}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        ...styles.badge,
                        color: statusColor
                      }}
                      title={statusKind === "live" ? "Live" : statusKind === "playing" ? "Playing" : "Paused"}
                    >
                      <RoomStatusIcon kind={statusKind} color={statusColor} />
                    </span>
                  </div>
                  <div style={{ ...styles.progressWrap, ...(thumbUrl ? styles.roomBottomOverlay : {}) }}>
                    <div style={styles.progressMeta}>
                      <span
                        style={{
                          ...styles.roomTitleOverlay,
                          ...(isLightTheme && !thumbUrl ? { color: "#0f172a", textShadow: "none" } : {})
                        }}
                        title={roomLabel}
                      >
                        {shortenLabel(roomLabel, 20)}
                      </span>
                      <span
                        style={{
                          ...styles.timeOverlay,
                          ...(isLightTheme && !thumbUrl ? { color: "#334155", textShadow: "none" } : {})
                        }}
                      >
                        {minutes}m / {durationMinutes || 0}m
                      </span>
                    </div>
                    <div style={{ ...styles.progressBarBg, background: tokens.input }}>
                      <div style={{ ...styles.progressBarFill, width: `${percent}%` }} />
                    </div>
                  </div>
                </article>
              );
            })}
            <article
              style={{
                ...responsiveRoomCardStyle,
                borderColor: tokens.border,
                background: tokens.card,
                cursor: "pointer",
                ...liquidCardSurfaceStyle
              }}
              onClick={openCreateRoomModal}
            >
              <div style={styles.plusCard}>
                <div style={styles.plusIcon}>+</div>
              </div>
            </article>
          </section>
          {roomModalOpen && (
            <div style={themedModalOverlayStyle} onClick={() => setRoomModalOpen(false)}>
              <section
                style={{
                  ...responsiveRoomModalStyle,
                  borderColor: tokens.border,
                  background: tokens.flyout,
                  color: tokens.text,
                  backdropFilter: "blur(18px) saturate(1.12)",
                  WebkitBackdropFilter: "blur(18px) saturate(1.12)"
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <div style={styles.roomModalHeader}>
                  <h3 style={styles.roomModalTitle}>
                    {roomModalMode === "join" ? "Enter room" : roomModalMode === "create" ? "Create room" : "Rename room"}
                  </h3>
                  <button
                    style={{ ...styles.roomModalCloseButton, color: tokens.text, borderColor: tokens.border, background: tokens.input }}
                    onClick={() => setRoomModalOpen(false)}
                    aria-label="Close modal"
                    title="Close"
                  >
                    ✕
                  </button>
                </div>
                <div style={styles.roomModalInputRow}>
                  <input
                    style={{ ...styles.input, ...styles.roomModalInput, color: tokens.text, borderColor: tokens.border, background: tokens.input }}
                    value={isJoinModal ? joinRoomInput : newRoomNameInput}
                    onChange={(event) => {
                      if (isJoinModal) {
                        setJoinRoomInput(event.target.value);
                        return;
                      }
                      setNewRoomNameInput(event.target.value);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && canSubmitActiveModal && !modalBusy) {
                        event.preventDefault();
                        if (roomModalMode === "join") {
                          void joinRoomFromInput();
                        } else {
                          void (roomModalMode === "create" ? createRoomAndJoin() : renameRoom());
                        }
                      }
                    }}
                    placeholder={isJoinModal ? "Room code or link" : "Room display name"}
                  />
                  <button
                    style={{
                      ...styles.roomModalSubmitButton,
                      color: tokens.buttonText,
                      background: canSubmitActiveModal && !modalBusy ? tokens.buttonPrimary : tokens.buttonDisabled,
                      borderColor: tokens.border,
                      opacity: canSubmitActiveModal && !modalBusy ? 1 : 0.7,
                      cursor: canSubmitActiveModal && !modalBusy ? "pointer" : "not-allowed"
                    }}
                    onClick={() => {
                      addDebug("modal:submit:click", {
                        mode: roomModalMode,
                        canSubmitActiveModal,
                        busy,
                        modalBusy,
                        joinInput: joinRoomInput,
                        roomNameInput: newRoomNameInput
                      });
                      if (!canSubmitActiveModal || modalBusy) {
                        addDebug("modal:submit:blocked", {
                          mode: roomModalMode,
                          reason: !canSubmitActiveModal ? "invalid_input" : "busy"
                        });
                        return;
                      }
                      if (roomModalMode === "join") {
                        void joinRoomFromInput();
                      } else {
                        void (roomModalMode === "create" ? createRoomAndJoin() : renameRoom());
                      }
                    }}
                    disabled={!canSubmitActiveModal || modalBusy}
                    aria-label={roomModalMode === "join" ? "Enter room" : roomModalMode === "create" ? "Create room" : "Rename room"}
                    title={roomModalMode === "join" ? "Enter room" : roomModalMode === "create" ? "Create room" : "Rename room"}
                  >
                    {modalBusy ? <span style={styles.roomModalSubmitBusy}>…</span> : <ModalArrowIcon />}
                  </button>
                </div>
              </section>
            </div>
          )}
        </section>
      </main>
    );
  }

  return (
    <main style={{ ...responsivePageStyle, background: tokens.background, color: tokens.text }}>
      <style>{`
        .subtitle-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(180,205,255,0.62) rgba(23,36,68,0.35);
        }
        .subtitle-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .subtitle-scroll::-webkit-scrollbar-track {
          background: rgba(23,36,68,0.35);
          border-radius: 999px;
          border: 1px solid rgba(188,206,245,0.18);
        }
        .subtitle-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(195,218,255,0.86), rgba(138,173,236,0.84));
          border-radius: 999px;
          border: 2px solid rgba(23,36,68,0.38);
        }
        @keyframes subtitle-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes iframe-ambilight-breathe {
          0% { opacity: 0.74; }
          50% { opacity: 1; }
          100% { opacity: 0.8; }
        }
        @keyframes iframe-ambilight-drift {
          0% { background-position: 50% 50%, 50% 50%; }
          50% { background-position: 46% 54%, 48% 52%; }
          100% { background-position: 54% 46%, 52% 48%; }
        }
        .plyr {
          --plyr-font-family: "Segoe UI", "Inter", sans-serif;
        }
        .plyr--video {
          border-radius: 0;
          overflow: hidden;
        }
        .plyr--video .plyr__controls {
          border-top: 1px solid rgba(128, 166, 235, 0.24);
          backdrop-filter: blur(12px) saturate(1.12);
          -webkit-backdrop-filter: blur(12px) saturate(1.12);
        }
        .plyr--video .plyr__control {
          border: 1px solid var(--cinelink-plyr-control-border);
          background: var(--cinelink-plyr-control-bg);
          color: var(--cinelink-plyr-control-color);
          transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
        }
        .plyr--video .plyr__control:hover {
          background: var(--cinelink-plyr-control-hover-bg);
          border-color: var(--cinelink-plyr-control-hover-border);
          transform: translateY(-1px);
        }
        .plyr--video .plyr__control[aria-pressed="true"] {
          background: rgba(88, 146, 255, 0.28);
          border-color: rgba(172, 206, 255, 0.78);
        }
        .plyr--video .plyr__progress__buffer {
          color: rgba(255, 255, 255, 0.25);
        }
        .plyr--video .plyr__menu__container {
          border: 1px solid rgba(145, 180, 245, 0.35);
          box-shadow: 0 12px 32px rgba(9, 18, 42, 0.38);
          backdrop-filter: blur(16px) saturate(1.14);
          -webkit-backdrop-filter: blur(16px) saturate(1.14);
        }
        .plyr__tooltip {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
      `}</style>
      <section
        style={{ ...responsivePlayerShellStyle, borderColor: tokens.border, background: tokens.glass, ...liquidShellSurfaceStyle }}
        onMouseDown={closeHostPopupOnOutsideClick}
      >
        <div style={responsivePlayerHeaderStyle}>
          <button style={themedIconButtonStyle} onClick={() => void leaveCurrentRoom()} title="Back" aria-label="Back">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <strong style={responsivePlayerTitleStyle} title={getReadableRoomName(roomState.roomName || roomId, roomId || "CineLink Room")}>
            {getReadableRoomName(roomState.roomName || roomId, roomId || "CineLink Room")}
          </strong>
          <div style={styles.playerHeaderActions} />
        </div>

        <div style={{ ...styles.videoStage, ...plyrThemeVars }}>
          {isAmbilightActive && (
            isIframeMode ? (
              <>
                <div
                  style={{
                    ...styles.ambilightLayer,
                    ...(isMediaPopupOpen ? styles.ambilightToneMediaPopup : styles.ambilightToneDefault),
                    inset: `-${ambilightInsetThemePx}px`,
                    filter: `blur(${isMediaPopupOpen ? Math.max(18, ambilightBlurThemePx - 16) : ambilightBlurThemePx}px) saturate(${isMediaPopupOpen ? ambilightSaturationTheme * 0.84 : ambilightSaturationTheme}) brightness(${isMediaPopupOpen ? ambilightBrightnessTheme * 0.86 : ambilightBrightnessTheme})`,
                    transform: `scale(${isMediaPopupOpen ? Math.max(1, ambilightScaleTheme - 0.08) : ambilightScaleTheme})`,
                    opacity: isMediaPopupOpen ? ambilightOpacityTheme * 0.7 : ambilightOpacityTheme,
                    animation: "iframe-ambilight-breathe 7.5s ease-in-out infinite",
                    backgroundImage: currentThumb
                      ? `radial-gradient(closest-side, rgba(255,255,255,0.18), rgba(0,0,0,0.06) 54%, rgba(0,0,0,0) 78%), url("${currentThumb}")`
                      : "radial-gradient(closest-side, rgba(88,164,255,0.3), rgba(167,139,250,0.24) 54%, rgba(0,0,0,0) 78%)"
                  }}
                />
                <div
                  style={{
                    ...styles.ambilightLayer,
                    ...(isMediaPopupOpen ? styles.ambilightToneMediaPopup : styles.ambilightToneDefault),
                    inset: `-${Math.max(24, ambilightInsetThemePx - 8)}px`,
                    filter: `blur(${Math.max(24, ambilightBlurThemePx + 20)}px) saturate(${ambilightSaturationTheme * 1.12}) brightness(${ambilightBrightnessTheme * 1.05})`,
                    transform: `scale(${Math.max(1.08, ambilightScaleTheme + 0.08)})`,
                    opacity: (isMediaPopupOpen ? ambilightOpacityTheme * 0.7 : ambilightOpacityTheme) * (isLightTheme ? 0.58 : 0.66),
                    animation: "iframe-ambilight-drift 18s ease-in-out infinite alternate",
                    mixBlendMode: isLightTheme ? "soft-light" : "screen",
                    backgroundImage: currentThumb
                      ? `radial-gradient(closest-side, rgba(120,186,255,0.34), rgba(196,163,255,0.22) 58%, rgba(0,0,0,0) 80%), url("${currentThumb}")`
                      : "radial-gradient(closest-side, rgba(112,176,255,0.34), rgba(180,148,255,0.26) 58%, rgba(0,0,0,0) 80%)",
                    backgroundSize: currentThumb ? "120% 120%, cover" : "120% 120%",
                    backgroundPosition: "50% 50%, 50% 50%"
                  }}
                />
              </>
            ) : (
              <video
                ref={ambilightVideoRef}
                style={{
                  ...styles.ambilightVideo,
                  ...(isMediaPopupOpen ? styles.ambilightToneMediaPopup : styles.ambilightToneDefault)
                  ,inset: `-${ambilightInsetThemePx}px`
                  ,width: `calc(100% + ${ambilightInsetThemePx * 2}px)`
                  ,height: `calc(100% + ${ambilightInsetThemePx * 2}px)`
                  ,filter: `blur(${isMediaPopupOpen ? Math.max(18, ambilightBlurThemePx - 16) : ambilightBlurThemePx}px) saturate(${isMediaPopupOpen ? ambilightSaturationTheme * 0.84 : ambilightSaturationTheme}) brightness(${isMediaPopupOpen ? ambilightBrightnessTheme * 0.86 : ambilightBrightnessTheme})`
                  ,transform: `scale(${isMediaPopupOpen ? Math.max(1, ambilightScaleTheme - 0.08) : ambilightScaleTheme})`
                  ,opacity: isMediaPopupOpen ? ambilightOpacityTheme * 0.7 : ambilightOpacityTheme
                }}
                muted
                playsInline
                autoPlay
                preload="auto"
                aria-hidden="true"
              />
            )
          )}
          {youtubeVideoId ? (
            <div style={responsiveVideoFrameWrapStyle}>
              <div ref={ytContainerRef} style={styles.videoFrame} />
            </div>
          ) : isDriveIframeMode && drivePreviewUrl ? (
            <div style={responsiveVideoFrameWrapStyle}>
              <iframe
                src={drivePreviewUrl}
                style={styles.videoFrame}
                title="Google Drive player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                scrolling="no"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              style={responsiveVideoStyle}
              controls
              onPlay={emitPlay}
              onPause={emitPause}
              onEnded={() => {
                clearLocalSubtitleTrack();
                if (!isHost) {
                  return;
                }
                void runMutation(
                  cineLinkServiceClient.advanceQueue({ roomId, autoplay: true }),
                  "Loaded next from queue."
                );
              }}
              onSeeked={emitSeek}
              onRateChange={(event) => void emitRate((event.target as HTMLVideoElement).playbackRate)}
            >
              {subtitleTrackUrl && (
                <track
                  ref={subtitleTrackRef}
                  key={subtitleTrackUrl}
                  kind="subtitles"
                  src={subtitleTrackUrl}
                  srcLang="en"
                  label={subtitleLabel || "Subtitle"}
                  default
                />
              )}
            </video>
          )}

          {hostPopup && ((hostPopup === "room" && isHost) || (hostPopup === "media" && (isHost || roomState.allowViewerQueueAdd)) || (hostPopup === "subtitle" && canOpenSubtitlePopup) || (hostPopup === "audio" && canOpenAudioPopup)) && (
            <aside ref={hostPopupRef} style={hostPopupStyle(tokens, true, hostPopup, isLightTheme, isMobile)}>
              {hostPopup === "room" && (
                <div style={styles.flyoutBody}>
                  <h3 style={styles.flyoutTitle}>Room</h3>
                  <div style={{ ...styles.flyoutIconRow, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                    <button style={themedPopupIconButtonStyle} onClick={openRenameRoomModal} title="Rename room">✎</button>
                    <button
                      style={themedPopupIconButtonStyle}
                      onClick={() => void runWithActionState("room:copy-link", copyRoomLink)}
                      title="Copy link"
                    >
                      {renderActionContent("room:copy-link", "🔗")}
                    </button>
                    <button
                      style={themedPopupIconButtonStyle}
                      onClick={() => void runWithActionState("room:toggle-queue-policy", toggleViewerQueueAdd)}
                      title={roomState.allowViewerQueueAdd ? "Disable member queue add" : "Enable member queue add"}
                    >
                      {renderActionContent("room:toggle-queue-policy", <MemberQueueIcon enabled={roomState.allowViewerQueueAdd} />)}
                    </button>
                  </div>
                </div>
              )}

              {hostPopup === "media" && (isHost || roomState.allowViewerQueueAdd) && (
                <div style={styles.flyoutBody}>
                  <h3 style={styles.flyoutTitle}>Media</h3>
                  <input
                    style={mediaPopupInputStyle}
                    value={mediaUrlInput}
                    onChange={(event) => setMediaUrlInput(event.target.value)}
                    placeholder="Paste one or more URLs separated by comma"
                  />
                  {isHost ? (
                    <div style={styles.flyoutIconRow}>
                      <button
                        style={themedPopupIconButtonStyle}
                        onClick={() => void runWithActionState("media:set", setMedia)}
                        title="Load URL"
                      >
                        {renderActionContent("media:set", "▶")}
                      </button>
                      <button
                        style={themedPopupIconButtonStyle}
                        onClick={() => void runWithActionState("media:add-next", addNext)}
                        title="Insert right after current"
                      >
                        {renderActionContent("media:add-next", "⏭")}
                      </button>
                      <button
                        style={themedPopupIconButtonStyle}
                        onClick={() => void runWithActionState("media:add-last", addLast)}
                        title="Add last"
                      >
                        {renderActionContent("media:add-last", "↩")}
                      </button>
                    </div>
                  ) : (
                    <div style={styles.flyoutIconRowSingle}>
                      <button
                        style={themedPopupIconButtonStyle}
                        onClick={() => void runWithActionState("media:add-last", addLast)}
                        title="Add to queue end"
                      >
                        {renderActionContent("media:add-last", "↩")}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {hostPopup === "subtitle" && canOpenSubtitlePopup && (
                <div style={styles.flyoutBody}>
                  <h3 style={{ ...styles.flyoutTitle, marginTop: "8px" }}>Subtitles</h3>
                  <input
                    ref={subtitleUploadInputRef}
                    type="file"
                    accept=".srt,.vtt,text/vtt,.srt,application/x-subrip"
                    style={styles.hiddenFileInput}
                    onChange={(event) => {
                      void handleSubtitleFileSelected(event);
                    }}
                  />
                  <div style={styles.subtitleInputRow}>
                    <input
                      style={{ ...styles.input, color: tokens.text, borderColor: tokens.border, background: tokens.input }}
                      value={subtitleQuery}
                      onChange={(event) => setSubtitleQuery(event.target.value)}
                      placeholder="Subtitle query or direct subtitle URL"
                    />
                    <button
                      style={themedSubtitleSearchButtonStyle}
                      onClick={() => void runWithActionState("subtitle:search", async () => { await searchSubtitles(); })}
                      title="Search subtitles"
                      disabled={subtitleBusy || actionStates["subtitle:search"] === "loading"}
                    >
                      {renderActionContent("subtitle:search", <SearchIcon />)}
                    </button>
                    <button
                      style={themedSubtitleSearchButtonStyle}
                      onClick={openSubtitleFilePicker}
                      title="Upload local subtitle (.srt/.vtt)"
                    >
                      ⤴
                    </button>
                  </div>
                  {hasLoadedSubtitle && (
                    <>
                      <div style={styles.subtitleOffsetRow}>
                        <button
                          style={styles.subtitleOffsetButton}
                          onClick={() => setSubtitleOffsetMs((v) => clampNumber(v - 100, -120000, 120000))}
                          disabled={!subtitleBaseVttText}
                          title="Delay subtitle by 0.1s"
                        >
                          -0.1
                        </button>
                        <button
                          style={styles.subtitleOffsetButton}
                          onClick={() => setSubtitleOffsetMs((v) => clampNumber(v - 1000, -120000, 120000))}
                          disabled={!subtitleBaseVttText}
                          title="Delay subtitle by 1s"
                        >
                          -1
                        </button>
                        <button
                          style={styles.subtitleOffsetButton}
                          onClick={() => setSubtitleOffsetMs((v) => clampNumber(v + 100, -120000, 120000))}
                          disabled={!subtitleBaseVttText}
                          title="Advance subtitle by 0.1s"
                        >
                          +0.1
                        </button>
                        <button
                          style={styles.subtitleOffsetButton}
                          onClick={() => setSubtitleOffsetMs((v) => clampNumber(v + 1000, -120000, 120000))}
                          disabled={!subtitleBaseVttText}
                          title="Advance subtitle by 1s"
                        >
                          +1
                        </button>
                        <span style={styles.subtitleOffsetValue}>
                          {formatSubtitleOffsetMs(subtitleOffsetMs)}
                        </span>
                        <button
                          style={styles.subtitleOffsetButton}
                          onClick={() => setSubtitleOffsetMs(0)}
                          disabled={!subtitleBaseVttText}
                          title="Reset subtitle offset"
                        >
                          0
                        </button>
                      </div>
                      <div style={styles.subtitleEmbeddedSection}>
                        <div style={styles.subtitleEmbeddedHeader}>
                          <strong>Embedded tracks</strong>
                          <button
                            style={styles.subtitleEmbeddedRefresh}
                            onClick={refreshVideoSubtitleTracks}
                            title="Refresh embedded subtitle tracks"
                          >
                            ↻
                          </button>
                        </div>
                        {videoSubtitleTracks.length > 0 ? (
                          <div style={styles.subtitleEmbeddedList}>
                            {videoSubtitleTracks.map((track) => {
                              const isActive = activeVideoTrackIndex === track.index;
                              return (
                                <div key={`track-${track.index}`} style={styles.subtitleEmbeddedRow}>
                                  <div style={styles.subtitleEmbeddedMeta}>
                                    <strong style={styles.textEllipsisSingle}>{track.label}</strong>
                                    <span style={styles.textEllipsisSingle}>{[track.language || "und", track.kind || "subtitles"].join(" • ")}</span>
                                  </div>
                                  <button
                                    style={styles.subtitleAddButton}
                                    onClick={() => selectVideoSubtitleTrack(track.index)}
                                    title={`Use ${track.label}`}
                                  >
                                    {isActive ? <span style={styles.subtitleCheck}>✓</span> : "Use"}
                                  </button>
                                </div>
                              );
                            })}
                            <button
                              style={styles.subtitleClearItem}
                              onClick={() => selectVideoSubtitleTrack(-1)}
                              title="Disable all embedded subtitle tracks"
                            >
                              Disable embedded tracks
                            </button>
                          </div>
                        ) : (
                          <p style={styles.subtitleEmbeddedEmpty}>
                            No subtitle tracks exposed by the browser for this source.
                          </p>
                        )}
                      </div>
                    </>
                  )}
                  {subtitleLanguageGroups.length > 0 && (
                    <div className="subtitle-scroll" style={styles.subtitleLangList}>
                      {subtitleLanguageGroups.map((group) => (
                        <div key={group.language} style={styles.subtitleLangRow}>
                          <div style={styles.subtitleLangMeta}>
                            <strong style={styles.textEllipsisSingle}>{group.language}</strong>
                            <span>{group.items.length} found</span>
                          </div>
                          {(() => {
                            const isLoading = subtitleLoadingLanguage === group.language;
                            const isApplied = !isLoading && !!subtitleTrackUrl && subtitleAppliedLanguage === group.language;
                            return (
                          <button
                            style={styles.subtitleAddButton}
                            onClick={() => void loadSubtitleFromUrl(group.items[0].downloadUrl, group.items[0].name, group.language)}
                            title={`Load ${group.language}`}
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <span style={styles.subtitleSpinner} />
                            ) : isApplied ? (
                              <span style={styles.subtitleCheck}>✓</span>
                            ) : (
                              "+"
                            )}
                          </button>
                            );
                          })()}
                        </div>
                      ))}
                      {hasLoadedSubtitle && (
                        <button style={styles.subtitleClearItem} onClick={() => void clearSubtitle()} title="Remove subtitle">
                          Remove subtitle
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {hostPopup === "audio" && canOpenAudioPopup && (
                <div style={styles.flyoutBody}>
                  <h3 style={{ ...styles.flyoutTitle, marginTop: "8px" }}>Audio tracks</h3>
                  <div style={styles.subtitleEmbeddedSection}>
                    <div style={styles.subtitleEmbeddedHeader}>
                      <strong>Available tracks</strong>
                      <button
                        style={styles.subtitleEmbeddedRefresh}
                        onClick={refreshVideoAudioTracks}
                        title="Refresh audio tracks"
                      >
                        ↻
                      </button>
                    </div>
                    {videoAudioTracks.length > 0 ? (
                      <div style={styles.subtitleEmbeddedList}>
                        {videoAudioTracks.map((track) => {
                          const isActive = activeVideoAudioTrackIndex === track.index;
                          return (
                            <div key={`audio-${track.index}`} style={styles.subtitleEmbeddedRow}>
                              <div style={styles.subtitleEmbeddedMeta}>
                                <strong style={styles.textEllipsisSingle}>{track.label}</strong>
                                <span style={styles.textEllipsisSingle}>{[track.language || "und", track.kind || "audio"].join(" • ")}</span>
                              </div>
                              <button
                                style={styles.subtitleAddButton}
                                onClick={() => selectVideoAudioTrack(track.index)}
                                title={`Use ${track.label}`}
                              >
                                {isActive ? <span style={styles.subtitleCheck}>✓</span> : "Use"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={styles.subtitleEmbeddedEmpty}>
                        No selectable audio tracks exposed by this browser for this source.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </aside>
          )}
        </div>

        <div ref={bottomActionsRef} style={responsiveBottomActionsStyle}>
          <div style={responsiveNowPlayingWrapStyle} title={nowPlayingName}>
            <span style={styles.nowPlayingLabel}>Now Playing:</span>
            <span style={styles.nowPlayingValue}>{nowPlayingName}</span>
          </div>
          <button
            style={{ ...themedIconButtonStyle, opacity: isAmbilightAvailable ? (ambilightEnabled ? 1 : 0.66) : 0.42, cursor: isAmbilightAvailable ? "pointer" : "not-allowed" }}
            onClick={() => {
              if (!isAmbilightAvailable) {
                return;
              }
              setAmbilightEnabled((v) => !v);
            }}
            title={isAmbilightAvailable ? (ambilightEnabled ? "Ambilight on" : "Ambilight off") : "Ambilight unavailable on YouTube"}
            disabled={!isAmbilightAvailable}
          >
            ◐
          </button>
          <button
            style={{ ...themedIconButtonStyle, opacity: canClaimHost ? 1 : 0.5, cursor: canClaimHost ? "pointer" : "not-allowed" }}
            onClick={() => void runWithActionState("room:claim-host", requestHostClaim)}
            title={isHost ? "You are host" : hasPendingClaim ? "Host claim already pending" : "Claim host"}
            disabled={!canClaimHost}
          >
            {renderActionContent("room:claim-host", "♛")}
          </button>
          {canOpenMediaPopup && (
            <>
              <button
                style={themedIconButtonStyle}
                onClick={() => setHostPopup((p) => p === "media" ? null : "media")}
                title={isHost ? "Add media" : "Add to queue end"}
              >
                +
              </button>
            </>
          )}
          {canOpenAudioPopup && (
            <button
              style={themedIconButtonStyle}
              onClick={() => {
                setHostPopup((p) => p === "audio" ? null : "audio");
              }}
              title="Audio tracks"
            >
              <AudioTrackIcon />
            </button>
          )}
          {canOpenSubtitlePopup && (
            <button
              style={themedIconButtonStyle}
              onClick={() => {
                setHostPopup((p) => p === "subtitle" ? null : "subtitle");
                if (!subtitleQuery) {
                  setSubtitleQuery(getReadableRoomName(roomState.roomName || getMediaDisplayName(roomState.mediaUrl || ""), "Subtitle"));
                }
              }}
              title="Subtitles"
            >
              CC
            </button>
          )}
          {isHost && (
            <button
              style={themedIconButtonStyle}
              onClick={() => setHostPopup((p) => p === "room" ? null : "room")}
              title="Room options"
            >
              ...
            </button>
          )}
        </div>

        <div
          style={{
            ...styles.infoBar,
            ...responsiveInfoBarStyle,
            borderColor: tokens.border,
            background: tokens.flyout,
            backdropFilter: "blur(14px) saturate(1.1)",
            WebkitBackdropFilter: "blur(14px) saturate(1.1)"
          }}
        >
          <div style={styles.viewerRow}>
            {visibleParticipants.map((userId) => {
              const profile = profiles[userId];
              const label = profile?.name || shortenUserId(userId);
              const isCurrentHost = userId === roomState.hostUserId;
              const isPendingRequester = userId === pendingClaimUserId;
              const isManualTransferCandidate = isHost && hostTransferCandidateUserId === userId;
              const isSelfSyncingAvatar = userId === me && selfSyncingPlayback;
              return (
                <div
                  key={`${userId}-bottom`}
                  title={isCurrentHost ? `${label} (host)` : label}
                  style={{
                    ...styles.avatarWrap,
                    cursor: isHost && userId !== me ? "pointer" : "default",
                    boxShadow: isManualTransferCandidate ? "0 0 0 2px rgba(147,197,253,0.55)" : undefined
                  }}
                  onClick={() => requestHostTransferCandidate(userId)}
                >
                  {isCurrentHost && <span style={styles.crown}><CrownIcon /></span>}
                  {isSelfSyncingAvatar && (
                    <span style={styles.participantSyncBadge} title="Loading and syncing...">
                      <span style={styles.participantSyncSpinner} />
                    </span>
                  )}
                  {(isPendingRequester || isManualTransferCandidate) && (
                    <div style={styles.claimPopup}>
                      {isManualTransferCandidate ? (
                        <>
                          <button
                            style={styles.claimActionButton}
                            title="Confirm host transfer"
                            onClick={(event) => {
                              event.stopPropagation();
                              void runWithActionState("room:confirm-host-transfer", confirmHostTransfer);
                            }}
                          >
                            {renderActionContent("room:confirm-host-transfer", "✓")}
                          </button>
                          <button
                            style={styles.claimActionButton}
                            title="Cancel host transfer"
                            onClick={(event) => {
                              event.stopPropagation();
                              setHostTransferCandidateUserId("");
                            }}
                          >
                            ✕
                          </button>
                        </>
                      ) : isHost ? (
                        <>
                          <button
                            style={styles.claimActionButton}
                            title="Approve claim"
                            onClick={(event) => {
                              event.stopPropagation();
                              void runWithActionState("room:approve-claim", async () => { await approveHostClaim(true); });
                            }}
                          >
                            {renderActionContent("room:approve-claim", "✓")}
                          </button>
                          <button
                            style={styles.claimActionButton}
                            title="Reject claim"
                            onClick={(event) => {
                              event.stopPropagation();
                              void runWithActionState("room:reject-claim", async () => { await approveHostClaim(false); });
                            }}
                          >
                            {renderActionContent("room:reject-claim", "✕")}
                          </button>
                        </>
                      ) : (
                        <div style={styles.claimWaitingBadge} title={userId === me ? "Waiting for host approval" : "Host claim pending"}>
                          ⏳
                        </div>
                      )}
                    </div>
                  )}
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={label} style={styles.avatar} />
                  ) : (
                    <div style={{ ...styles.avatarFallback }}>{initials(label)}</div>
                  )}
                </div>
              );
            })}
            {hiddenParticipantsCount > 0 && (
              <div
                title={`${hiddenParticipantsCount} more`}
                style={{ ...styles.avatarFallback, width: "30px", height: "30px", borderRadius: "999px", flex: "0 0 auto" }}
              >
                +{hiddenParticipantsCount}
              </div>
            )}
          </div>
        </div>

        {showVideoErrorModal && !!videoError && (
          <div style={styles.errorModalBackdrop} onClick={() => setShowVideoErrorModal(false)}>
            <div style={styles.errorModalCard} onClick={(event) => event.stopPropagation()}>
              <div style={styles.errorModalTitleRow}>
                <strong style={styles.errorModalTitle}>Playback error</strong>
                <button
                  style={styles.errorModalClose}
                  onClick={() => setShowVideoErrorModal(false)}
                  title="Close"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <p style={styles.errorModalText}>{videoError}</p>
              <div style={styles.errorModalActions}>
                <button
                  style={styles.errorModalActionButton}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(videoError);
                      setStatus("Error copied to clipboard.");
                    } catch {
                      setStatus("Could not copy error.");
                    }
                  }}
                >
                  Copy details
                </button>
                <button style={styles.errorModalActionPrimary} onClick={() => setShowVideoErrorModal(false)}>
                  Ok
                </button>
              </div>
            </div>
          </div>
        )}
        {playlist.length > 0 && (
          <section
            style={{
              ...responsivePlaylistDockStyle,
              borderColor: tokens.border,
              background: tokens.flyout,
              backdropFilter: "blur(14px) saturate(1.1)",
              WebkitBackdropFilter: "blur(14px) saturate(1.1)"
            }}
          >
            <div style={styles.playlistHeader}>
              <strong>Up next</strong>
              <span
                style={{ ...styles.smallText, color: tokens.muted }}
                title={`${playlist.length} video${playlist.length === 1 ? "" : "s"} in queue`}
              >
                🎬 {playlist.length}
              </span>
            </div>
            {isHost && (
              <div style={styles.playlistButtons}>
                <button
                  style={themedCompactIconButtonStyle}
                  onClick={() => void runWithActionState("playlist:previous", previousQueueItem)}
                  title="Previous"
                >
                  {renderActionContent("playlist:previous", "⏮")}
                </button>
                <button
                  style={themedCompactIconButtonStyle}
                  onClick={() => void runWithActionState("playlist:next", nextQueueItem)}
                  title="Next"
                >
                  {renderActionContent("playlist:next", "⏭")}
                </button>
              </div>
            )}
            <div style={styles.queueBox}>
              {playlist.map((item, index) => {
                const qThumb = getRoomThumbnail(item, mediaThumbCache);
                const qFallbackBg = getQueueFallbackBackground(item);
                const addedByUserId = playlistAddedBy[index] || "";
                const canRemove = isHost || (!!addedByUserId && addedByUserId === me);
                const addedByProfile = profiles[addedByUserId];
                const addedByName = addedByProfile?.name || (addedByUserId ? shortenUserId(addedByUserId) : "Unknown");
                const itemDisplayName = getMediaDisplayName(item);
                const isWatched = watchedUrlSet.has(item);
                return (
                  <div
                    key={`${item}-${index}`}
                    style={responsiveQueueRowStyle}
                    draggable={isHost}
                    onDragStart={() => setDragFromIndex(index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => {
                      if (dragFromIndex === null) {
                        return;
                      }
                      void moveQueueItem(dragFromIndex, index);
                      setDragFromIndex(null);
                    }}
                    onDragEnd={() => setDragFromIndex(null)}
                  >
                    <div style={styles.queueIndex}>{index + 1}</div>
                    <div
                      style={{
                        ...responsiveQueueThumbStyle,
                        backgroundImage: qThumb
                          ? `url("${qThumb}")`
                          : qFallbackBg
                      }}
                    >
                      {!!addedByUserId && (
                        <div style={styles.queueAddedByBadge} title={addedByName}>
                          {addedByProfile?.avatarUrl ? (
                            <img src={addedByProfile.avatarUrl} alt={addedByName} style={styles.queueAddedByAvatar} />
                          ) : (
                            <div style={styles.queueAddedByFallback}>{initials(addedByName)}</div>
                          )}
                        </div>
                      )}
                    </div>
                    <div style={styles.queueTextCol}>
                      <div style={responsiveQueueItemStyle} title={item}>{itemDisplayName}</div>
                      {!!addedByUserId && (
                        <div style={responsiveQueueBylineStyle} title={`Added by ${addedByName}`}>
                          {addedByName}
                        </div>
                      )}
                    </div>
                    {isWatched && <span style={styles.queueWatched} title="Watched">✓</span>}
                    {canRemove && (
                      <button style={styles.queueRemove} onClick={() => void removeQueueItem(index)} title="Remove">
                        x
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
        {roomModalOpen && (
          <div style={themedModalOverlayStyle} onClick={() => setRoomModalOpen(false)}>
              <section
                style={{
                  ...responsiveRoomModalStyle,
                  borderColor: tokens.border,
                  background: tokens.flyout,
                  color: tokens.text,
                backdropFilter: "blur(18px) saturate(1.12)",
                WebkitBackdropFilter: "blur(18px) saturate(1.12)"
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div style={styles.roomModalHeader}>
                <h3 style={styles.roomModalTitle}>
                  {roomModalMode === "join" ? "Enter room" : roomModalMode === "create" ? "Create room" : "Rename room"}
                </h3>
                <button
                  style={{ ...styles.roomModalCloseButton, color: tokens.text, borderColor: tokens.border, background: tokens.input }}
                  onClick={() => setRoomModalOpen(false)}
                  aria-label="Close modal"
                  title="Close"
                >
                  ✕
                </button>
              </div>
              <div style={styles.roomModalInputRow}>
                <input
                  style={{ ...styles.input, ...styles.roomModalInput, color: tokens.text, borderColor: tokens.border, background: tokens.input }}
                  value={isJoinModal ? joinRoomInput : newRoomNameInput}
                  onChange={(event) => {
                    if (isJoinModal) {
                      setJoinRoomInput(event.target.value);
                      return;
                    }
                    setNewRoomNameInput(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && canSubmitActiveModal && !modalBusy) {
                      event.preventDefault();
                      if (roomModalMode === "join") {
                        void joinRoomFromInput();
                      } else {
                        void (roomModalMode === "create" ? createRoomAndJoin() : renameRoom());
                      }
                    }
                  }}
                  placeholder={isJoinModal ? "Room code or link" : "Room display name"}
                />
                <button
                  style={{
                    ...styles.roomModalSubmitButton,
                    color: tokens.buttonText,
                    background: canSubmitActiveModal && !modalBusy ? tokens.buttonPrimary : tokens.buttonDisabled,
                    borderColor: tokens.border,
                    opacity: canSubmitActiveModal && !modalBusy ? 1 : 0.7,
                    cursor: canSubmitActiveModal && !modalBusy ? "pointer" : "not-allowed"
                  }}
                  onClick={() => {
                    addDebug("modal:submit:click", {
                      mode: roomModalMode,
                      canSubmitActiveModal,
                      busy,
                      modalBusy,
                      joinInput: joinRoomInput,
                      roomNameInput: newRoomNameInput
                    });
                    if (!canSubmitActiveModal || modalBusy) {
                      addDebug("modal:submit:blocked", {
                        mode: roomModalMode,
                        reason: !canSubmitActiveModal ? "invalid_input" : "busy"
                      });
                      return;
                    }
                    if (roomModalMode === "join") {
                      void joinRoomFromInput();
                    } else {
                      void (roomModalMode === "create" ? createRoomAndJoin() : renameRoom());
                    }
                  }}
                  disabled={!canSubmitActiveModal || modalBusy}
                  aria-label={roomModalMode === "join" ? "Enter room" : roomModalMode === "create" ? "Create room" : "Rename room"}
                  title={roomModalMode === "join" ? "Enter room" : roomModalMode === "create" ? "Create room" : "Rename room"}
                >
                  {modalBusy ? <span style={styles.roomModalSubmitBusy}>…</span> : <ModalArrowIcon />}
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
};

export default App;

function ModalArrowIcon(): React.JSX.Element {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={styles.roomModalSubmitIcon}
    >
      <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function expectedTime(state: RoomState): number {
  const now = Date.now();
  const updatedAt = Number(state.updatedAtMs);
  const elapsed = state.playing ? (now - updatedAt) / 1000 : 0;
  return Math.max(0, state.currentTimeSeconds + elapsed);
}

function generateRoomId(): string {
  return `cinelink-${Math.random().toString(36).slice(2, 8)}`;
}

function getYouTubeVideoId(url: string | undefined): string | undefined {
  const raw = (url || "").trim();
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    if (host === "youtu.be") {
      const id = parsed.pathname.replace("/", "");
      return id || undefined;
    }
    if (host.includes("youtube.com")) {
      const watchId = parsed.searchParams.get("v");
      if (watchId) {
        return watchId;
      }
      const embedMatch = parsed.pathname.match(/\/embed\/([^/?]+)/i);
      if (embedMatch?.[1]) {
        return embedMatch[1];
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function getGoogleDriveFileId(url: string | undefined): string | undefined {
  const raw = (url || "").trim();
  if (!raw) {
    return undefined;
  }
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    if (!(host.includes("drive.google.com") || host.includes("drive.usercontent.google.com") || host.includes("docs.google.com"))) {
      return undefined;
    }
    const byQuery = parsed.searchParams.get("id");
    if (byQuery) {
      return byQuery;
    }
    const byPath = parsed.pathname.match(/\/file\/d\/([^/]+)/i)?.[1];
    if (byPath) {
      return byPath;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function getGoogleDrivePreviewUrl(url: string | undefined): string | undefined {
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) {
    return undefined;
  }
  try {
    const payload = JSON.stringify({ id: [fileId] });
    const encoded = (typeof window !== "undefined" && typeof window.btoa === "function")
      ? window.btoa(payload)
      : btoa(payload);
    return `https://sh20raj.github.io/DrivePlyr/plyr.html?id=${encodeURIComponent(encoded)}`;
  } catch {
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
}

function toGoogleDriveDirectViewUrl(url: string): string {
  const raw = (url || "").trim();
  if (!raw) {
    return raw;
  }
  const fileId = getGoogleDriveFileId(raw);
  if (!fileId) {
    return raw;
  }
  try {
    const parsed = new URL(raw);
    const direct = new URL("https://drive.google.com/uc");
    direct.searchParams.set("export", "view");
    direct.searchParams.set("id", fileId);
    const resourceKey = (parsed.searchParams.get("resourcekey") || "").trim();
    if (resourceKey) {
      direct.searchParams.set("resourcekey", resourceKey);
    }
    return direct.toString();
  } catch {
    return raw;
  }
}

function toGoogleDriveDirectDownloadUrl(url: string): string {
  const raw = (url || "").trim();
  if (!raw) {
    return raw;
  }
  const fileId = getGoogleDriveFileId(raw);
  if (!fileId) {
    return raw;
  }
  try {
    const parsed = new URL(raw);
    const direct = new URL("https://drive.usercontent.google.com/download");
    direct.searchParams.set("export", "download");
    direct.searchParams.set("confirm", "t");
    direct.searchParams.set("id", fileId);
    const resourceKey = (parsed.searchParams.get("resourcekey") || "").trim();
    if (resourceKey) {
      direct.searchParams.set("resourcekey", resourceKey);
    }
    return direct.toString();
  } catch {
    return raw;
  }
}

function toGoogleDriveAlternateDirectUrl(url: string): string | undefined {
  const raw = (url || "").trim();
  if (!raw) {
    return undefined;
  }
  const fileId = getGoogleDriveFileId(raw);
  if (!fileId) {
    return undefined;
  }
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    const isUcView = (host === "drive.google.com" || host.endsWith(".drive.google.com"))
      && parsed.pathname === "/uc";
    const isUsercontentDownload = host === "drive.usercontent.google.com" && parsed.pathname === "/download";
    if (isUcView) {
      return toGoogleDriveDirectDownloadUrl(raw);
    }
    if (isUsercontentDownload) {
      return toGoogleDriveDirectViewUrl(raw);
    }
    return toGoogleDriveDirectDownloadUrl(raw);
  } catch {
    return undefined;
  }
}

function CrownIcon(): JSX.Element {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 18.5L5.2 8.2L10.2 12.2L12 6.6L13.8 12.2L18.8 8.2L20.5 18.5H3.5Z"
        fill="currentColor"
        stroke="rgba(73,42,0,0.78)"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="5.2" cy="8.1" r="1.1" fill="#ffd66e" />
      <circle cx="12" cy="6.6" r="1.15" fill="#ffe28f" />
      <circle cx="18.8" cy="8.1" r="1.1" fill="#ffd66e" />
    </svg>
  );
}

function RoomStatusIcon({ kind, color }: { kind: "paused" | "playing" | "live"; color: string }): JSX.Element {
  if (kind === "live") {
    return (
      <svg width="24" height="16" viewBox="0 0 24 16" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="2.4" fill="#ef4444" />
        <path d="M7.5 4.2C5.8 5.6 5.8 10.4 7.5 11.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M16.5 4.2C18.2 5.6 18.2 10.4 16.5 11.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (kind === "playing") {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M5 3L12 8L5 13V3Z" fill={color} />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="4" y="3" width="3" height="10" rx="1" fill={color} />
      <rect x="9" y="3" width="3" height="10" rx="1" fill={color} />
    </svg>
  );
}

function MemberQueueIcon({ enabled }: { enabled: boolean }): JSX.Element {
  if (!enabled) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="8" cy="9" r="2.2" fill="currentColor" />
        <circle cx="15.5" cy="9.8" r="1.9" fill="currentColor" opacity="0.78" />
        <path d="M4.6 16.4C5.5 14.5 7 13.7 8.8 13.7C10.6 13.7 12.1 14.5 13 16.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M13.6 16.2C14.1 15 15.1 14.5 16.2 14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
        <path d="M5 5L19 19" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="8" cy="9" r="2.2" fill="currentColor" />
      <circle cx="15.5" cy="9.8" r="1.9" fill="currentColor" opacity="0.78" />
      <path d="M4.6 16.4C5.5 14.5 7 13.7 8.8 13.7C10.6 13.7 12.1 14.5 13 16.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M13.6 16.2C14.1 15 15.1 14.5 16.2 14.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.75" />
      <path d="M18.7 5.8L20.6 7.8" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20.6 5.8L18.7 7.8" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon(): JSX.Element {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16L20.2 20.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function AudioTrackIcon(): JSX.Element {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M4 10H8L12 6V18L8 14H4V10Z" fill="currentColor" />
      <path d="M16 9.5C17.2 10.3 17.9 11.1 17.9 12C17.9 12.9 17.2 13.7 16 14.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="M18.6 7.2C20.4 8.5 21.4 10.2 21.4 12C21.4 13.8 20.4 15.5 18.6 16.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function getRoomStatusKind(room: RoomSummary): "paused" | "playing" | "live" {
  const hasYouTube = !!getYouTubeVideoId(room.mediaUrl);
  if (hasYouTube && room.playing && room.durationSeconds <= 0) {
    return "live";
  }
  return room.playing ? "playing" : "paused";
}

function groupSubtitleCandidatesByLanguage(items: SubtitleResult[]): Array<{ language: string; items: SubtitleResult[] }> {
  const map = new Map<string, SubtitleResult[]>();
  for (const item of items) {
    const language = inferSubtitleLanguageLabel(item.name);
    const bucket = map.get(language) || [];
    bucket.push(item);
    map.set(language, bucket);
  }
  return Array.from(map.entries())
    .map(([language, grouped]) => ({ language, items: grouped.sort((a, b) => b.score - a.score) }))
    .sort((a, b) => b.items.length - a.items.length);
}

function inferSubtitleLanguageLabel(name: string): string {
  const text = (name || "").toLowerCase();
  if (/(portuguese|portugu[eê]s|brazil|brasil|pt[-_ ]?br|brazilian)/i.test(text)) {
    return "Portuguese (BR)";
  }
  if (/(english|ingl[eê]s|en[-_ ]?us|en[-_ ]?gb)/i.test(text)) {
    return "English";
  }
  if (/(spanish|espa[nñ]ol|latino|castellano)/i.test(text)) {
    return "Spanish";
  }
  if (/(french|fran[cç][aâ]is)/i.test(text)) {
    return "French";
  }
  if (/(german|deutsch)/i.test(text)) {
    return "German";
  }
  if (/(italian|italiano)/i.test(text)) {
    return "Italian";
  }
  if (/(japanese|japon[eê]s|nihongo)/i.test(text)) {
    return "Japanese";
  }
  return "Other";
}

function prioritizeHost(userIds: string[], hostUserId: string): string[] {
  if (!userIds.length || !hostUserId) {
    return userIds;
  }
  const rest = userIds.filter((id) => id !== hostUserId);
  if (rest.length === userIds.length) {
    return userIds;
  }
  return [hostUserId, ...rest];
}

function isLikelyMkvUrl(url: string | undefined): boolean {
  const raw = (url || "").trim().toLowerCase();
  if (!raw) {
    return false;
  }

  try {
    const parsed = new URL(raw);
    const pathname = parsed.pathname.toLowerCase();
    if (pathname.endsWith(".mkv")) {
      return true;
    }
    for (const [, value] of parsed.searchParams.entries()) {
      if (value.toLowerCase().includes(".mkv")) {
        return true;
      }
    }
    return false;
  } catch {
    return raw.includes(".mkv");
  }
}

function getMkvFailureHint(url: string): string {
  return `Prefer MP4 (H.264/AAC) or WebM (VP9/Opus), with public access and CORS + Accept-Ranges enabled. Source: ${url}`;
}

function getRoomThumbnail(mediaUrl: string | undefined, mediaThumbCache: Record<string, string>): string | undefined {
  const raw = (mediaUrl || "").trim();
  const youtubeId = getYouTubeVideoId(raw);
  if (youtubeId) {
    return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
  }
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = new URL(raw);
    const explicitThumb = (parsed.searchParams.get("cinelink_thumb") || "").trim();
    if (explicitThumb) {
      return explicitThumb;
    }

    const driveId = getGoogleDriveFileId(raw);
    if (driveId) {
      return `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId)}&sz=w960`;
    }

    const host = parsed.hostname.toLowerCase();
    const isArchiveHost = host === "archive.org" || host.endsWith(".archive.org");
    if (isArchiveHost) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const root = parts[0] || "";
      const identifier = (root === "download" || root === "details") ? (parts[1] || "") : "";
      if (identifier) {
        return `https://archive.org/services/img/${encodeURIComponent(identifier)}`;
      }
    }
  } catch {
    // ignore URL parsing failures and fallback to cached thumb
  }

  return mediaThumbCache[raw];
}

function getQueueFallbackBackground(seed: string): string {
  const palettes = [
    "linear-gradient(135deg, rgba(59,130,246,0.45), rgba(15,23,42,0.65))",
    "linear-gradient(135deg, rgba(16,185,129,0.42), rgba(30,41,59,0.66))",
    "linear-gradient(135deg, rgba(244,114,182,0.42), rgba(17,24,39,0.68))",
    "linear-gradient(135deg, rgba(245,158,11,0.42), rgba(31,41,55,0.68))",
    "linear-gradient(135deg, rgba(168,85,247,0.42), rgba(15,23,42,0.66))"
  ];
  const idx = Math.abs(hashString(seed)) % palettes.length;
  return palettes[idx];
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
  }
  return hash;
}

function shortenUserId(userId: string): string {
  if (userId.length <= 12) {
    return userId;
  }
  return `${userId.slice(0, 6)}...${userId.slice(-4)}`;
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((word) => word[0]?.toUpperCase() ?? "").join("") || "U";
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutLabel: string): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${timeoutLabel} (${timeoutMs}ms)`)), timeoutMs);
    })
  ]);
}

async function resolveArchiveMediaUrl(rawUrl: string): Promise<string> {
  const direct = rawUrl.trim();
  if (!direct) {
    return rawUrl;
  }

  try {
    const parsed = new URL(direct);
    const host = parsed.hostname.toLowerCase();
    const isArchiveHost = host === "archive.org" || host.endsWith(".archive.org");
    if (!isArchiveHost) {
      return rawUrl;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    const isDetails = parts[0] === "details";
    const isDownload = parts[0] === "download";
    if (!isDetails && !isDownload) {
      return rawUrl;
    }

    const identifier = parts[1] || "";
    if (!identifier) {
      return rawUrl;
    }

    const directFilePath = parts.length > 2 ? parts.slice(2).join("/") : "";
    const directFileLower = directFilePath.toLowerCase();
    const directFileIsMkv = /\.mkv$/i.test(directFilePath);
    const hasDirectFile = !!directFilePath && /\.[a-z0-9]{2,5}$/i.test(parts[parts.length - 1] || "");

    const metadataResp = await fetch(`https://archive.org/metadata/${encodeURIComponent(identifier)}`);
    if (!metadataResp.ok) {
      return rawUrl;
    }

    const metadata = await metadataResp.json() as { files?: Array<{ name?: string; format?: string }> };
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
      return rawUrl;
    }

    const scoreFile = (file: { name?: string; format?: string }): number => {
      const name = (file.name || "").toLowerCase();
      const format = (file.format || "").toLowerCase();
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
      if (directFilePath && name.endsWith(directFileLower)) {
        score += directFileIsMkv ? 0 : 80;
      }
      return score;
    };

    const sorted = [...videoFiles].sort((a, b) => scoreFile(b) - scoreFile(a));
    const best = sorted[0];
    if (!best?.name) {
      return rawUrl;
    }

    if (hasDirectFile && !directFileIsMkv && best.name.toLowerCase().endsWith(directFileLower)) {
      return rawUrl;
    }

    const fileName = best.name
      .split("/")
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join("/");
    return `https://archive.org/download/${encodeURIComponent(identifier)}/${fileName}`;
  } catch {
    return rawUrl;
  }
}

function getMediaDisplayName(url: string): string {
  const raw = url.trim();
  if (!raw) {
    return "Media";
  }

  const cleanSegment = (segment: string): string => {
    let value = segment.trim();
    if (!value) {
      return "";
    }
    value = value.replace(/\+/g, " ");
    try {
      value = decodeURIComponent(value);
    } catch {
      // keep original value if decode fails
    }
    value = value.replace(/\.[a-z0-9]{2,5}$/i, "");
    value = value.replace(/[_-]+/g, " ");
    value = value.replace(/\s+/g, " ").trim();
    return value;
  };

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    const isYouTubeHost = host.includes("youtube.com") || host === "youtu.be";
    const isDriveHost = host.includes("drive.google.com") || host.includes("drive.usercontent.google.com") || host.includes("docs.google.com");
    const genericTokens = new Set(["watch", "view", "download", "uc", "preview", "file"]);
    const explicitName = (parsed.searchParams.get("cinelink_name") || "").trim();
    if (explicitName) {
      const labeled = cleanSegment(explicitName);
      if (labeled) {
        return shortenLabel(labeled, 56);
      }
    }
    const tail = parsed.pathname.split("/").filter(Boolean).pop() || "";
    const readable = cleanSegment(tail);
    if (readable && !genericTokens.has(readable.toLowerCase())) {
      return shortenLabel(readable, 56);
    }
    if (isYouTubeHost) {
      return "YouTube video";
    }
    if (isDriveHost) {
      return "Google Drive video";
    }
    return shortenLabel(parsed.hostname, 56);
  } catch {
    const tail = raw.split("/").filter(Boolean).pop() || raw;
    const withoutQuery = tail.split("?")[0]?.split("#")[0] || tail;
    const readable = cleanSegment(withoutQuery);
    if (readable) {
      return shortenLabel(readable, 56);
    }
    return shortenLabel(raw, 56);
  }
}

function getReadableRoomName(value: string, fallback: string): string {
  const base = (value || "").trim() || (fallback || "").trim() || "Room";
  if (isHttpMediaUrl(base)) {
    return getMediaDisplayName(base);
  }
  return base;
}

function getMediaDisplayNameForSearch(url: string): string {
  const raw = (url || "").trim();
  if (!raw) {
    return "";
  }
  try {
    const parsed = new URL(raw);
    const tail = parsed.pathname.split("/").filter(Boolean).pop() || "";
    return sanitizeSubtitleSearchQuery(tail);
  } catch {
    return sanitizeSubtitleSearchQuery(raw);
  }
}

function ensureVttHeader(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (/^WEBVTT\b/i.test(normalized)) {
    return normalized;
  }
  return `WEBVTT\n\n${normalized}`;
}

function convertSrtToVtt(text: string): string {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n");
  const out: string[] = ["WEBVTT", ""];
  for (const line of lines) {
    if (/^\d+$/.test(line.trim())) {
      continue;
    }
    out.push(line.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2"));
  }
  return out.join("\n").trim();
}

function shiftVttByMs(vttText: string, offsetMs: number): string {
  if (!offsetMs) {
    return vttText;
  }
  return vttText.replace(
    /(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/g,
    (_full, start, end) => `${shiftVttTimestamp(start, offsetMs)} --> ${shiftVttTimestamp(end, offsetMs)}`
  );
}

function shiftVttTimestamp(ts: string, offsetMs: number): string {
  const baseMs = vttTimestampToMs(ts);
  const nextMs = Math.max(0, baseMs + offsetMs);
  return msToVttTimestamp(nextMs);
}

function vttTimestampToMs(ts: string): number {
  const match = ts.match(/^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/);
  if (!match) {
    return 0;
  }
  const hh = Number(match[1] || 0);
  const mm = Number(match[2] || 0);
  const ss = Number(match[3] || 0);
  const ms = Number(match[4] || 0);
  return (((hh * 60) + mm) * 60 + ss) * 1000 + ms;
}

function msToVttTimestamp(ms: number): string {
  const total = Math.max(0, Math.floor(ms));
  const hh = Math.floor(total / 3_600_000);
  const mm = Math.floor((total % 3_600_000) / 60_000);
  const ss = Math.floor((total % 60_000) / 1000);
  const mmm = total % 1000;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}.${String(mmm).padStart(3, "0")}`;
}

function formatSubtitleOffsetMs(ms: number): string {
  const sign = ms >= 0 ? "+" : "-";
  const value = Math.abs(ms);
  const seconds = value / 1000;
  return `${sign}${seconds.toFixed(Number.isInteger(seconds) ? 0 : 1)}s`;
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeSubtitleSearchQuery(input: string): string {
  let text = (input || "").trim();
  if (!text) {
    return "";
  }
  text = text.replace(/\.[a-z0-9]{2,5}$/i, "");
  text = text.replace(/%[0-9A-F]{2}/gi, (match) => {
    try {
      return decodeURIComponent(match);
    } catch {
      return match;
    }
  });
  text = text.replace(/[_\.]+/g, " ");
  text = text.replace(/\[[^\]]*]/g, " ");
  text = text.replace(/\([^)]*(?:x264|x265|h264|h265|1080|720|bdrip|webrip|aac|hevc)[^)]*\)/gi, " ");
  text = text.replace(/\b(?:bdrip|webrip|bluray|x264|x265|hevc|h264|aac|dualaudio|dual audio|1080p|720p)\b/gi, " ");
  text = text.replace(/\s+/g, " ").trim();
  text = text.replace(/\.\.\.+$/, "").trim();
  return text;
}

function buildSubtitleSearchRequest(
  rawInput: string,
  roomName: string,
  mediaUrl: string,
  language: string
): { query: string; language: string; tvseries: boolean; season: number; episode: number } {
  const fromInput = sanitizeSubtitleSearchQuery(rawInput);
  const fromRoom = sanitizeSubtitleSearchQuery(roomName);
  const fromMedia = getMediaDisplayNameForSearch(mediaUrl);
  let base = fromInput || fromMedia || fromRoom;
  if (base.includes("...")) {
    base = sanitizeSubtitleSearchQuery(base.replace(/\.\.\.+/g, " "));
  }

  let tvseries = false;
  let season = 0;
  let episode = 0;

  const sxe = base.match(/\bs(\d{1,2})\s*e(\d{1,3})\b/i);
  if (sxe) {
    tvseries = true;
    season = Number(sxe[1] || 0);
    episode = Number(sxe[2] || 0);
    base = base.replace(sxe[0], " ").replace(/\s+/g, " ").trim();
  }

  if (!tvseries) {
    const animeEp = base.match(/\((\d{4})\)\s*(\d{1,3})\b/);
    if (animeEp) {
      tvseries = true;
      season = 1;
      episode = Number(animeEp[2] || 0);
    }
  }

  return {
    query: base.slice(0, 120),
    language,
    tvseries,
    season,
    episode
  };
}

function shortenLabel(text: string, maxLen: number): string {
  if (text.length <= maxLen) {
    return text;
  }
  return `${text.slice(0, maxLen - 3)}...`;
}

function parseMediaUrlsInput(raw: string): string[] {
  return raw
    .split(/[,\n]/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function isHttpMediaUrl(value: string): boolean {
  const raw = value.trim();
  if (!raw) {
    return false;
  }
  if (/^https?:\/\//i.test(raw)) {
    return true;
  }
  if (/^(www\.)?youtube\.com\//i.test(raw) || /^youtu\.be\//i.test(raw)) {
    return true;
  }
  return /^archive\.org\//i.test(raw);
}

function normalizeJoinTarget(raw: string): string {
  const direct = raw.trim();
  if (!direct) {
    return "";
  }

  const fromHash = getRoomIdFromHash(direct);
  if (fromHash) {
    return fromHash;
  }

  try {
    const parsed = new URL(direct);
    const hashRoomId = getRoomIdFromHash(parsed.hash);
    if (hashRoomId) {
      return hashRoomId;
    }
  } catch {
    // not a URL, keep direct value
  }

  return direct;
}

function getRoomIdFromHash(hashValue: string): string {
  const hash = hashValue.trim();
  if (!hash) {
    return "";
  }

  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(value);
  const room = params.get("room");
  return (room ? decodeURIComponent(room) : "").trim();
}

function hostPopupStyle(tokens: ThemeTokens, open: boolean, popupType: HostPopup, isLightTheme: boolean, isMobile: boolean): React.CSSProperties {
  const isMediaPopup = popupType === "media";
  const isSubtitlePopup = popupType === "subtitle";
  const mediaPopupBackground = isLightTheme
    ? "linear-gradient(155deg, rgba(255,255,255,0.34), rgba(237,245,255,0.22) 58%, rgba(221,234,255,0.18))"
    : "linear-gradient(180deg, rgba(6,11,24,0.96), rgba(8,14,30,0.94))";
  const mediaPopupShadow = isLightTheme
    ? "0 22px 56px rgba(48,71,116,0.18), inset 0 1px 0 rgba(255,255,255,0.74)"
    : "0 24px 52px rgba(0,0,0,0.62), inset 0 1px 0 rgba(159,188,255,0.12)";
  const mediaPopupBorder = isLightTheme ? "rgba(255,255,255,0.58)" : tokens.border;
  return {
    ...styles.hostPopup,
    borderColor: isMediaPopup ? mediaPopupBorder : tokens.border,
    background: isMediaPopup
      ? mediaPopupBackground
      : tokens.flyout,
    boxShadow: isMediaPopup
      ? mediaPopupShadow
      : styles.hostPopup.boxShadow,
    backdropFilter: isMediaPopup ? (isLightTheme ? "blur(20px) saturate(1.15)" : "blur(14px)") : undefined,
    WebkitBackdropFilter: isMediaPopup ? (isLightTheme ? "blur(20px) saturate(1.15)" : "blur(14px)") : undefined,
    width: isMediaPopup ? "340px" : isSubtitlePopup ? "420px" : "320px",
    maxWidth: "calc(100vw - 56px)",
    maxHeight: isSubtitlePopup ? "min(64vh, 520px)" : undefined,
    overflowX: "hidden",
    overflowY: isSubtitlePopup ? "auto" : "visible",
    right: isMobile ? "8px" : "12px",
    bottom: isMobile ? "8px" : "12px",
    opacity: open ? 1 : 0,
    transform: open ? "translateY(0)" : "translateY(8px)",
    pointerEvents: open ? "auto" : "none"
  };
}

type ThemeTokens = {
  background: string;
  glass: string;
  flyout: string;
  input: string;
  border: string;
  text: string;
  muted: string;
  buttonPrimary: string;
  buttonDisabled: string;
  buttonText: string;
  railButton: string;
  card: string;
};

const darkTokens: ThemeTokens = {
  background:
    "radial-gradient(1200px 720px at 50% 72%, rgba(150,180,255,0.24) 0%, rgba(69,100,173,0.16) 28%, rgba(22,36,72,0.12) 52%, rgba(7,12,25,0.92) 100%), linear-gradient(180deg, #20345d 0%, #152748 40%, #0b1630 100%)",
  glass: "linear-gradient(155deg, rgba(22,38,76,0.44), rgba(13,24,52,0.34) 56%, rgba(9,17,37,0.28))",
  flyout: "linear-gradient(160deg, rgba(24,40,80,0.52), rgba(13,24,52,0.42) 58%, rgba(9,17,37,0.36))",
  input: "rgba(168,193,245,0.12)",
  border: "rgba(173,197,250,0.34)",
  text: "#f5f5f5",
  muted: "#b8b8b8",
  buttonPrimary: "#fafafa",
  buttonDisabled: "#5f5f5f",
  buttonText: "#101010",
  railButton: "rgba(217,230,255,0.16)",
  card: "linear-gradient(162deg, rgba(28,46,90,0.44), rgba(16,30,63,0.34) 58%, rgba(11,21,44,0.3))"
};

const lightTokens: ThemeTokens = {
  background:
    "radial-gradient(820px 500px at 50% 80%, rgba(98,138,228,0.5) 0%, rgba(147,181,243,0.3) 40%, rgba(210,224,248,0.12) 74%, rgba(0,0,0,0) 100%), radial-gradient(620px 360px at 8% 32%, rgba(106,149,230,0.28) 0%, rgba(170,198,245,0.12) 56%, rgba(0,0,0,0) 100%), radial-gradient(620px 360px at 92% 32%, rgba(106,149,230,0.28) 0%, rgba(170,198,245,0.12) 56%, rgba(0,0,0,0) 100%), linear-gradient(180deg, #edf2fb 0%, #dde6f6 44%, #d1daec 100%)",
  glass: "linear-gradient(160deg, rgba(255,255,255,0.44), rgba(240,247,255,0.28) 58%, rgba(226,238,255,0.22))",
  flyout: "linear-gradient(160deg, rgba(255,255,255,0.52), rgba(241,248,255,0.36) 58%, rgba(230,241,255,0.3))",
  input: "rgba(238,245,255,0.42)",
  border: "rgba(116,141,196,0.34)",
  text: "#111827",
  muted: "#4b5563",
  buttonPrimary: "#111827",
  buttonDisabled: "#9ca3af",
  buttonText: "#f8fafc",
  railButton: "rgba(236,243,255,0.62)",
  card: "linear-gradient(162deg, rgba(255,255,255,0.4), rgba(236,245,255,0.24) 60%, rgba(223,236,255,0.2))"
};

const SIZE = {
  logo: 46,
  headerIcon: 38,
  compactIcon: 40,
  lobbyTitle: 2.35,
  brand: 2.0,
  plus: 3.6,
  playerTitle: 1.85,
  cardTitle: 1.5,
  meta: 1.0
} as const;

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    margin: 0,
    padding: "20px",
    fontFamily: "'Manrope', 'Segoe UI', 'Helvetica Neue', sans-serif"
  },
  lobbyShell: {
    maxWidth: "760px",
    margin: "0 auto",
    border: "1px solid",
    borderRadius: "22px",
    padding: "18px",
    boxShadow:
      "0 30px 70px rgba(8,16,40,0.46), inset 0 1px 0 rgba(205,220,255,0.18), inset 0 -1px 0 rgba(120,146,206,0.16)"
  },
  lobbyTopBar: {
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px",
    paddingBottom: "14px",
    borderBottom: "1px solid rgba(188, 206, 245, 0.22)",
    boxShadow: "inset 0 -1px 0 rgba(88, 118, 180, 0.22)"
  },
  brandWrap: {
    display: "flex",
    alignItems: "center",
    gap: "8px"
  },
  logoMark: {
    width: `${SIZE.logo}px`,
    height: `${SIZE.logo}px`,
    position: "relative",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    borderRadius: "6px"
  },
  logoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "50% 50%",
    display: "block",
    mixBlendMode: "screen",
    transform: "scale(1.22)"
  },
  logoGlow: {
    position: "absolute",
    inset: "-4px",
    borderRadius: "999px",
    background: "radial-gradient(circle, rgba(147,197,253,0.34), rgba(96,165,250,0.18) 58%, rgba(0,0,0,0) 76%)",
    filter: "blur(5px)"
  },
  logoHexOuter: {
    position: "absolute",
    inset: "1.5px",
    background: "linear-gradient(145deg, #d946ef 4%, #7c3aed 42%, #38bdf8 92%)",
    clipPath: "polygon(25% 6%, 75% 6%, 95% 50%, 75% 94%, 25% 94%, 5% 50%)",
    borderRadius: "6px",
    boxShadow: "0 0 0 1px rgba(255,255,255,0.2) inset"
  },
  logoHexInner: {
    position: "absolute",
    inset: "5.6px",
    background: "linear-gradient(150deg, rgba(55,35,124,0.96), rgba(31,77,161,0.95))",
    clipPath: "polygon(25% 6%, 75% 6%, 95% 50%, 75% 94%, 25% 94%, 5% 50%)",
    borderRadius: "4px"
  },
  logoPlay: {
    position: "absolute",
    width: "7px",
    height: "9px",
    marginLeft: "0.8px",
    background: "linear-gradient(180deg, #f8fbff, #d8e0f2)",
    clipPath: "polygon(0 0, 100% 50%, 0 100%)",
    filter: "drop-shadow(0 0 1px rgba(255,255,255,0.28))"
  },
  brandText: {
    fontSize: `${SIZE.brand}rem`,
    letterSpacing: "0.1px",
    fontWeight: 700
  },
  iconButton: {
    width: `${SIZE.headerIcon}px`,
    height: `${SIZE.headerIcon}px`,
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.24)",
    background: "rgba(255,255,255,0.12)",
    color: "#f8fafc",
    cursor: "pointer",
    fontSize: "1.15rem",
    lineHeight: 1
  },
  lobbyTitle: {
    margin: "14px 0 12px",
    fontSize: `${SIZE.lobbyTitle}rem`,
    lineHeight: 1.04,
    letterSpacing: "-0.2px"
  },
  heading: {
    margin: 0
  },
  caption: {
    margin: 0,
    fontSize: "0.9rem"
  },
  roomGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 360px))",
    justifyContent: "center",
    gap: "12px",
    alignItems: "stretch"
  },
  roomCard: {
    border: "1px solid",
    borderRadius: "14px",
    padding: "10px",
    boxSizing: "border-box",
    display: "grid",
    gap: "8px",
    minHeight: "230px",
    boxShadow:
      "0 16px 34px rgba(8,16,40,0.28), inset 0 1px 0 rgba(215,228,255,0.12), inset 0 -1px 0 rgba(120,146,206,0.12)",
    transition: "transform 120ms ease, box-shadow 120ms ease"
  },
  plusCard: {
    minHeight: "100%",
    display: "grid",
    placeItems: "center",
    alignContent: "center",
    gap: "8px"
  },
  plusIcon: {
    fontSize: `${SIZE.plus}rem`,
    lineHeight: 1,
    fontWeight: 700,
    opacity: 0.82
  },
  createCardBody: {
    minHeight: "100%",
    display: "grid",
    alignContent: "center",
    gap: "10px"
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(4px)",
    WebkitBackdropFilter: "blur(4px)",
    display: "grid",
    placeItems: "center",
    zIndex: 20,
    padding: "16px"
  },
  roomModal: {
    width: "min(560px, 96vw)",
    border: "1px solid",
    borderRadius: "26px",
    padding: "16px",
    display: "grid",
    gap: "14px",
    boxShadow: "0 20px 60px rgba(10,20,60,0.35)"
  },
  roomModalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px"
  },
  roomModalTitle: {
    margin: 0,
    fontSize: "1.65rem",
    lineHeight: 1.1
  },
  roomModalCloseButton: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontSize: "0.98rem",
    fontWeight: 800,
    lineHeight: 1,
    padding: 0
  },
  roomModalInputRow: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "10px",
    alignItems: "center"
  },
  roomModalInput: {
    height: "48px"
  },
  roomModalSubmitButton: {
    width: "52px",
    height: "48px",
    borderRadius: "12px",
    border: "1px solid",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    fontWeight: 800,
    lineHeight: 1,
    padding: 0
  },
  roomModalSubmitIcon: {
    display: "block"
  },
  roomModalSubmitBusy: {
    fontSize: "1.3rem",
    lineHeight: 1
  },
  roomTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    minHeight: "34px"
  },
  roomTopOverlay: {
    borderRadius: "10px",
    padding: "6px 8px",
    background: "transparent"
  },
  badge: {
    fontSize: "0.95rem"
  },
  progressWrap: {
    display: "grid",
    gap: "8px",
    marginTop: "auto"
  },
  roomBottomOverlay: {
    borderRadius: "10px",
    padding: "8px",
    background: "linear-gradient(180deg, rgba(0,0,0,0.14), rgba(0,0,0,0.58))",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)"
  },
  progressMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px"
  },
  roomTitleOverlay: {
    fontSize: "1.3rem",
    fontWeight: 700,
    color: "#f8fafc",
    textShadow: "0 1px 10px rgba(0,0,0,0.5)",
    minWidth: 0,
    flex: "1 1 auto",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  timeOverlay: {
    fontSize: `${SIZE.meta}rem`,
    color: "#e2e8f0",
    textShadow: "0 1px 8px rgba(0,0,0,0.5)",
    flexShrink: 0
  },
  progressBarBg: {
    height: "6px",
    borderRadius: "999px",
    overflow: "hidden",
    boxShadow: "inset 0 1px 4px rgba(0,0,0,0.22)"
  },
  progressBarFill: {
    height: "100%",
    borderRadius: "999px",
    background: "linear-gradient(90deg,#34d399,#60a5fa 65%, #a78bfa)"
  },
  progressText: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.82rem"
  },
  viewerRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "wrap",
    overflow: "visible"
  },
  roomCardViewerRow: {
    display: "flex",
    gap: "6px",
    flexWrap: "nowrap",
    overflow: "visible",
    alignItems: "flex-start",
    transform: "none"
  },
  playerShell: {
    maxWidth: "980px",
    margin: "0 auto",
    border: "1px solid",
    borderRadius: "18px",
    overflow: "hidden",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    paddingBottom: "12px",
    boxShadow:
      "0 30px 75px rgba(8,16,40,0.46), inset 0 1px 0 rgba(210,224,255,0.16), inset 0 -1px 0 rgba(118,146,214,0.14)"
  },
  playerHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "12px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
    background: "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))"
  },
  playerTitle: {
    fontSize: `${SIZE.playerTitle}rem`,
    fontWeight: 700,
    minWidth: 0,
    maxWidth: "60%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  playerHeaderActions: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },
  playerBottomActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    padding: "10px 12px 6px"
  },
  nowPlayingWrap: {
    display: "flex",
    alignItems: "baseline",
    gap: "6px",
    minWidth: 0,
    flex: "1 1 auto",
    marginRight: "10px"
  },
  nowPlayingLabel: {
    fontSize: "0.8rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    opacity: 0.82,
    flexShrink: 0
  },
  nowPlayingValue: {
    fontSize: "0.92rem",
    fontWeight: 600,
    opacity: 0.94,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  videoStage: {
    position: "relative",
    isolation: "isolate"
  },
  ambilightLayer: {
    position: "absolute",
    inset: "-96px",
    borderRadius: "18px",
    pointerEvents: "none",
    zIndex: 0,
    backgroundSize: "cover",
    backgroundPosition: "center",
    filter: "blur(116px) saturate(1.6) brightness(1.18)",
    transform: "scale(1.38)",
    opacity: 0.97,
    mixBlendMode: "screen",
    transition: "opacity 220ms ease"
  },
  ambilightVideo: {
    position: "absolute",
    inset: "-96px",
    width: "calc(100% + 192px)",
    height: "calc(100% + 192px)",
    objectFit: "cover",
    borderRadius: "22px",
    pointerEvents: "none",
    zIndex: 0,
    filter: "blur(116px) saturate(1.6) brightness(1.18)",
    transform: "scale(1.42)",
    opacity: 0.97,
    mixBlendMode: "screen"
  },
  ambilightToneDefault: {
    filter: "blur(126px) saturate(1.68) brightness(1.2)",
    transform: "scale(1.5)",
    opacity: 1
  },
  ambilightToneMediaPopup: {
    filter: "blur(102px) saturate(1.44) brightness(1.08)",
    transform: "scale(1.34)",
    opacity: 0.8
  },
  video: {
    width: "100%",
    minHeight: "56vh",
    maxHeight: "72vh",
    backgroundColor: "#000",
    display: "block",
    position: "relative",
    zIndex: 1
  },
  videoFrameWrap: {
    width: "100%",
    aspectRatio: "16 / 9",
    minHeight: "56vh",
    maxHeight: "72vh",
    backgroundColor: "#000",
    position: "relative",
    zIndex: 1
  },
  videoFrame: {
    width: "100%",
    height: "100%",
    border: 0,
    display: "block"
  },
  syncOverlay: {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: "min(520px, 86%)",
    borderRadius: "14px",
    border: "1px solid rgba(186,210,255,0.38)",
    background: "linear-gradient(145deg, rgba(14,26,58,0.92), rgba(10,20,46,0.92))",
    boxShadow: "0 22px 54px rgba(0,0,0,0.45)",
    padding: "14px",
    zIndex: 14,
    display: "grid",
    gap: "8px",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)"
  },
  syncOverlayTitle: {
    fontSize: "1rem",
    letterSpacing: "0.2px"
  },
  syncOverlayText: {
    margin: 0,
    fontSize: "0.86rem",
    opacity: 0.9
  },
  syncOverlayMeta: {
    fontSize: "0.82rem",
    opacity: 0.85
  },
  syncOverlayActions: {
    display: "flex",
    gap: "8px"
  },
  syncOverlayButton: {
    minHeight: "34px",
    padding: "0 12px",
    borderRadius: "9px",
    border: "1px solid rgba(187,211,255,0.35)",
    background: "rgba(255,255,255,0.1)",
    color: "inherit",
    cursor: "pointer",
    fontWeight: 700
  },
  viewerStrip: {
    position: "absolute",
    left: "12px",
    top: "12px",
    display: "flex",
    gap: "8px",
    maxWidth: "62%",
    overflowX: "auto",
    paddingBottom: "2px"
  },
  avatarWrap: {
    width: "30px",
    height: "30px",
    borderRadius: "999px",
    overflow: "visible",
    border: "1px solid rgba(255,255,255,0.45)",
    flex: "0 0 auto",
    position: "relative"
  },
  crown: {
    position: "absolute",
    top: "-10px",
    right: "5px",
    fontSize: "0.72rem",
    zIndex: 4,
    width: "16px",
    height: "16px",
    color: "#f5c84c",
    filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.55)) drop-shadow(0 0 6px rgba(255,211,95,0.45))",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    lineHeight: 1
  },
  participantSyncBadge: {
    position: "absolute",
    right: "-6px",
    bottom: "-6px",
    width: "16px",
    height: "16px",
    borderRadius: "999px",
    background: "rgba(8,18,42,0.9)",
    border: "1px solid rgba(188,213,255,0.62)",
    display: "grid",
    placeItems: "center",
    zIndex: 5
  },
  participantSyncSpinner: {
    width: "9px",
    height: "9px",
    borderRadius: "999px",
    border: "2px solid rgba(255,255,255,0.28)",
    borderTopColor: "rgba(255,255,255,0.95)",
    animation: "subtitle-spin 0.75s linear infinite"
  },
  claimPopup: {
    position: "absolute",
    top: "-32px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "4px",
    alignItems: "center",
    zIndex: 5
  },
  claimActionButton: {
    width: "20px",
    height: "20px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.28)",
    background: "rgba(15,15,15,0.88)",
    color: "#f3f4f6",
    fontSize: "0.72rem",
    lineHeight: 1,
    padding: 0,
    cursor: "pointer"
  },
  claimWaitingBadge: {
    width: "20px",
    height: "20px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(15,15,15,0.88)",
    color: "#f3f4f6",
    display: "grid",
    placeItems: "center",
    fontSize: "0.66rem"
  },
  avatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    borderRadius: "999px"
  },
  avatarFallback: {
    width: "100%",
    height: "100%",
    borderRadius: "999px",
    display: "grid",
    placeItems: "center",
    fontSize: "0.74rem",
    fontWeight: 700,
    background: "#7f7f7f",
    color: "#111"
  },
  avatarCountBadge: {
    width: "30px",
    height: "30px",
    borderRadius: "999px",
    flex: "0 0 auto",
    display: "grid",
    placeItems: "center",
    fontSize: "0.72rem",
    fontWeight: 700,
    background: "rgba(15,23,42,0.55)",
    color: "#e5e7eb",
    border: "1px solid rgba(255,255,255,0.45)"
  },
  hostControls: {
    position: "absolute",
    right: "12px",
    bottom: "16px",
    display: "flex",
    gap: "8px"
  },
  hostPopup: {
    position: "absolute",
    right: "12px",
    bottom: "12px",
    width: "320px",
    border: "1px solid",
    borderRadius: "14px",
    boxShadow: "0 18px 44px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.12)",
    backdropFilter: "blur(16px) saturate(1.1)",
    WebkitBackdropFilter: "blur(16px) saturate(1.1)",
    transition: "opacity 180ms ease, transform 180ms ease",
    zIndex: 12
  },
  infoBar: {
    margin: "10px 12px 6px",
    padding: "10px 12px",
    border: "1px solid",
    borderRadius: "12px",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
    fontSize: "0.98rem",
    justifyContent: "space-between"
  },
  statusLine: {
    margin: "0 14px",
    fontSize: "0.92rem"
  },
  queueBox: {
    borderRadius: "8px",
    display: "grid",
    gap: "4px",
    overflow: "visible"
  },
  queueRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    border: "1px solid rgba(127,127,127,0.25)",
    borderRadius: "10px",
    padding: "6px 8px",
    background: "rgba(127,127,127,0.08)"
  },
  queueIndex: {
    width: "20px",
    textAlign: "center",
    fontSize: "0.9rem",
    opacity: 0.85
  },
  queueThumb: {
    width: "74px",
    height: "42px",
    borderRadius: "7px",
    backgroundColor: "rgba(0,0,0,0.45)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    flex: "0 0 auto",
    position: "relative",
    overflow: "hidden"
  },
  queueAddedByBadge: {
    position: "absolute",
    right: "2px",
    bottom: "2px",
    width: "16px",
    height: "16px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.7)",
    background: "rgba(0,0,0,0.62)",
    overflow: "hidden",
    display: "grid",
    placeItems: "center"
  },
  queueAddedByAvatar: {
    width: "100%",
    height: "100%",
    objectFit: "cover"
  },
  queueAddedByFallback: {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    fontSize: "0.55rem",
    fontWeight: 700,
    background: "#8b8b8b",
    color: "#111"
  },
  queueItem: {
    flex: 1,
    fontSize: "0.95rem",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden"
  },
  queueTextCol: {
    flex: 1,
    minWidth: 0,
    display: "grid",
    gap: "2px"
  },
  queueByline: {
    fontSize: "0.84rem",
    opacity: 0.72,
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    overflow: "hidden"
  },
  queueWatched: {
    width: "20px",
    height: "20px",
    borderRadius: "999px",
    border: "1px solid rgba(52,211,153,0.55)",
    background: "rgba(52,211,153,0.16)",
    color: "#34d399",
    display: "grid",
    placeItems: "center",
    fontSize: "0.75rem",
    fontWeight: 700,
    flex: "0 0 auto"
  },
  queueRemove: {
    border: "1px solid rgba(127,127,127,0.45)",
    borderRadius: "999px",
    background: "rgba(127,127,127,0.08)",
    color: "inherit",
    width: "26px",
    height: "26px",
    padding: 0,
    fontSize: "0.95rem",
    cursor: "pointer"
  },
  playlistDock: {
    margin: "10px 12px 0",
    border: "1px solid",
    borderRadius: "12px",
    padding: "10px",
    display: "grid",
    gap: "8px"
  },
  playlistHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  playlistButtons: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap"
  },
  flyoutBody: {
    padding: "14px",
    display: "grid",
    gap: "12px"
  },
  flyoutIconRow: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: "10px"
  },
  flyoutIconRowSingle: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px"
  },
  subtitleLangList: {
    display: "grid",
    gap: "6px",
    maxHeight: "128px",
    overflowY: "auto",
    overflowX: "hidden"
  },
  subtitleInputRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto auto",
    gap: "8px",
    alignItems: "center"
  },
  hiddenFileInput: {
    display: "none"
  },
  subtitleSearchInlineButton: {
    width: "52px",
    minWidth: "52px",
    height: "42px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  subtitleOffsetRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    alignItems: "center"
  },
  subtitleOffsetButton: {
    minWidth: "46px",
    minHeight: "34px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.24)",
    background: "rgba(255,255,255,0.08)",
    color: "inherit",
    fontWeight: 700,
    cursor: "pointer"
  },
  subtitleOffsetValue: {
    justifySelf: "end",
    fontSize: "0.82rem",
    opacity: 0.86,
    fontVariantNumeric: "tabular-nums"
  },
  subtitleEmbeddedSection: {
    display: "grid",
    gap: "6px"
  },
  subtitleEmbeddedHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    fontSize: "0.9rem"
  },
  subtitleEmbeddedRefresh: {
    minWidth: "34px",
    minHeight: "30px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.24)",
    background: "rgba(255,255,255,0.08)",
    color: "inherit",
    cursor: "pointer"
  },
  subtitleEmbeddedList: {
    display: "grid",
    gap: "6px",
    maxHeight: "138px",
    overflowY: "auto",
    overflowX: "hidden"
  },
  subtitleEmbeddedRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.04)",
    padding: "6px 8px",
    minWidth: 0
  },
  subtitleEmbeddedMeta: {
    minWidth: 0,
    display: "grid",
    gap: "2px",
    fontSize: "0.8rem",
    overflow: "hidden"
  },
  subtitleEmbeddedEmpty: {
    margin: 0,
    fontSize: "0.8rem",
    opacity: 0.78
  },
  textEllipsisSingle: {
    display: "block",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  },
  subtitleLangRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "8px",
    background: "rgba(255,255,255,0.05)",
    padding: "6px 8px",
    minWidth: 0
  },
  subtitleLangMeta: {
    minWidth: 0,
    display: "grid",
    gap: "2px",
    fontSize: "0.82rem",
    overflow: "hidden"
  },
  subtitleAddButton: {
    width: "34px",
    minWidth: "34px",
    height: "34px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.24)",
    background: "rgba(255,255,255,0.08)",
    color: "inherit",
    fontSize: "1.1rem",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  subtitleSpinner: {
    width: "16px",
    height: "16px",
    borderRadius: "999px",
    border: "2px solid rgba(255,255,255,0.25)",
    borderTopColor: "rgba(255,255,255,0.95)",
    animation: "subtitle-spin 0.85s linear infinite"
  },
  subtitleCheck: {
    fontSize: "1rem",
    fontWeight: 800,
    lineHeight: 1,
    color: "#7dd3fc"
  },
  actionSpinner: {
    width: "15px",
    height: "15px",
    borderRadius: "999px",
    border: "2px solid rgba(255,255,255,0.22)",
    borderTopColor: "rgba(255,255,255,0.96)",
    animation: "subtitle-spin 0.8s linear infinite"
  },
  actionCheck: {
    fontSize: "0.96rem",
    fontWeight: 800,
    lineHeight: 1,
    color: "#86efac"
  },
  subtitleClearItem: {
    width: "100%",
    minHeight: "34px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    fontSize: "0.84rem",
    fontWeight: 600,
    textAlign: "center",
    cursor: "pointer"
  },
  menuRowButton: {
    width: "100%",
    minHeight: "42px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.04)",
    color: "inherit",
    fontWeight: 600,
    fontSize: "1rem",
    textAlign: "left",
    padding: "0 12px",
    cursor: "pointer"
  },
  popupIconButton: {
    width: "100%",
    minHeight: `${SIZE.compactIcon}px`,
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    fontSize: "1.08rem",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer"
  },
  compactIconButton: {
    width: `${SIZE.compactIcon}px`,
    height: `${SIZE.compactIcon}px`,
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.22)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    fontSize: "1.1rem",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    padding: 0
  },
  flyoutTitle: {
    margin: 0,
    fontSize: "1rem"
  },
  flyoutRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    alignItems: "stretch"
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid",
    borderRadius: "10px",
    padding: "10px 12px",
    outline: "none"
  },
  button: {
    width: "100%",
    minHeight: "42px",
    border: "1px solid",
    borderRadius: "12px",
    boxSizing: "border-box",
    padding: "10px 12px",
    fontWeight: 700,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    appearance: "none"
  },
  smallText: {
    margin: 0,
    fontSize: "0.84rem"
  },
  error: {
    margin: 0,
    color: "#ef4444",
    fontFamily: "Consolas, monospace",
    fontSize: "0.8rem",
    wordBreak: "break-all"
  },
  errorModalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(3,10,24,0.56)",
    backdropFilter: "blur(8px)",
    display: "grid",
    placeItems: "center",
    zIndex: 40,
    padding: "16px"
  },
  errorModalCard: {
    width: "min(640px, 92vw)",
    borderRadius: "16px",
    border: "1px solid rgba(151,179,235,0.45)",
    background: "linear-gradient(145deg, rgba(20,33,66,0.95), rgba(13,22,48,0.95))",
    boxShadow: "0 24px 64px rgba(0,0,0,0.52), 0 0 0 1px rgba(255,255,255,0.05) inset",
    padding: "16px",
    display: "grid",
    gap: "12px"
  },
  errorModalTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px"
  },
  errorModalTitle: {
    fontSize: "1.1rem",
    letterSpacing: "0.2px"
  },
  errorModalClose: {
    width: "34px",
    height: "34px",
    borderRadius: "10px",
    border: "1px solid rgba(193,212,255,0.32)",
    background: "rgba(255,255,255,0.08)",
    color: "inherit",
    cursor: "pointer"
  },
  errorModalText: {
    margin: 0,
    color: "#fca5a5",
    fontFamily: "Consolas, monospace",
    fontSize: "0.82rem",
    lineHeight: 1.45,
    wordBreak: "break-word",
    maxHeight: "220px",
    overflowY: "auto"
  },
  errorModalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px"
  },
  errorModalActionButton: {
    minHeight: "36px",
    padding: "0 12px",
    borderRadius: "10px",
    border: "1px solid rgba(190,208,248,0.34)",
    background: "rgba(255,255,255,0.06)",
    color: "inherit",
    cursor: "pointer",
    fontWeight: 600
  },
  errorModalActionPrimary: {
    minHeight: "36px",
    padding: "0 14px",
    borderRadius: "10px",
    border: "1px solid rgba(148,197,255,0.48)",
    background: "linear-gradient(180deg, rgba(71,126,225,0.56), rgba(49,96,190,0.6))",
    color: "#eaf2ff",
    cursor: "pointer",
    fontWeight: 700
  },
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    padding: 0,
    margin: "-1px",
    overflow: "hidden",
    clip: "rect(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    border: 0
  }
};



