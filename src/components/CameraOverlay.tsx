import React from "react";
import { MultiHandDetectionResult } from "../utils/gestureDetector";
import { Eye, Video, VideoOff, RefreshCw, Layers } from "lucide-react";

interface CameraOverlayProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  multiResult: MultiHandDetectionResult | null;
  fps: number;
  isTrackingActive: boolean;
  isCameraLoading: boolean;
  selectedCameraId: string;
  availableCameras: MediaDeviceInfo[];
  onSelectCamera: (deviceId: string) => void;
  onRefreshCameras: () => void;
  showSkeleton: boolean;
  onToggleSkeleton: () => void;
  showCameraVideo: boolean;
  onToggleCameraVideo: () => void;
  isMinimized: boolean;
  onToggleMinimized: () => void;
  statusText?: string;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({
  videoRef,
  canvasRef,
  multiResult,
  fps,
  isTrackingActive,
  isCameraLoading,
  selectedCameraId,
  availableCameras,
  onSelectCamera,
  onRefreshCameras,
  showSkeleton,
  onToggleSkeleton,
  showCameraVideo,
  onToggleCameraVideo,
  isMinimized,
  onToggleMinimized,
  statusText,
}) => {
  const primary = multiResult?.primaryHand;
  const aux = multiResult?.auxiliaryHand;
  const handsCount = multiResult?.hands.length || 0;

  const getGestureBadge = (gesture: string | undefined) => {
    if (!gesture || gesture === "NONE") {
      return { text: "IDLE", color: "bg-slate-800/80 text-slate-400 border-slate-700" };
    }
    switch (gesture) {
      case "PINCH_INDEX":
        return { text: "CLICK 🤏", color: "bg-emerald-950/90 text-emerald-300 border-emerald-500 glow-emerald" };
      case "DRAGGING":
        return { text: "DRAG ✊", color: "bg-cyan-950/90 text-cyan-300 border-cyan-400 glow-cyan" };
      case "PINCH_MIDDLE":
        return { text: "RIGHT CLICK ⚡", color: "bg-purple-950/90 text-purple-300 border-purple-500 glow-purple" };
      case "SCROLLING":
        return { text: "SCROLL ↕", color: "bg-blue-950/90 text-blue-300 border-blue-500" };
      case "VOLUME_UP":
        return { text: "VOL UP 👍", color: "bg-amber-950/90 text-amber-300 border-amber-500" };
      case "VOLUME_DOWN":
        return { text: "VOL DOWN 👎", color: "bg-amber-950/90 text-amber-300 border-amber-500" };
      case "SWIPE_LEFT":
        return { text: "SWIPE LEFT ⬅", color: "bg-indigo-950/90 text-indigo-300 border-indigo-500" };
      case "SWIPE_RIGHT":
        return { text: "SWIPE RIGHT ➡", color: "bg-indigo-950/90 text-indigo-300 border-indigo-500" };
      case "TWO_HAND_ZOOM":
        return { text: "ZOOMING 🔍", color: "bg-emerald-950/90 text-emerald-300 border-emerald-500 glow-emerald" };
      case "FIST":
        return { text: "PAUSE ✊", color: "bg-rose-950/90 text-rose-300 border-rose-600" };
      case "OPEN_PALM":
        return { text: "PALM ✋", color: "bg-teal-950/90 text-teal-300 border-teal-600" };
      case "POINTING":
      default:
        return { text: "AIMING 👆", color: "bg-cyan-950/80 text-cyan-300 border-cyan-600" };
    }
  };

  const primaryBadge = getGestureBadge(primary?.gesture);
  const auxBadge = aux ? getGestureBadge(aux.gesture) : null;

  return (
    <div
      style={{
        minHeight: isMinimized ? "52px" : "440px",
        height: isMinimized ? "52px" : "440px",
      }}
      className="relative w-full rounded-2xl overflow-hidden border border-slate-800/90 bg-slate-950 shadow-2xl flex flex-col transition-all duration-300"
    >
      {/* Top Holographic Navigation Bar */}
      <div className="h-12 flex-shrink-0 flex items-center justify-between px-4 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 z-20">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-cyan-950/60 border border-cyan-800/70 text-cyan-400 text-xs font-mono">
            <Layers className="w-3.5 h-3.5" />
            <span className="font-semibold">
              {showCameraVideo ? "CAMERA VIEW" : "HOLOGRAM HUD"}
            </span>
          </div>

          {/* Camera Selection */}
          <div className="flex items-center space-x-1">
            <select
              value={selectedCameraId}
              onChange={(e) => onSelectCamera(e.target.value)}
              disabled={isCameraLoading}
              className="text-xs bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1 text-slate-200 focus:outline-none focus:border-cyan-500 max-w-[150px] sm:max-w-[200px] truncate"
            >
              {availableCameras.map((cam) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera ${cam.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
            <button
              onClick={onRefreshCameras}
              title="Refresh Camera Devices"
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* View Toggles & Badges */}
        <div className="flex items-center space-x-2">
          {/* Hands Detected Counter */}
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded border ${
              handsCount > 0
                ? "bg-cyan-950/70 border-cyan-700 text-cyan-300 font-medium"
                : "bg-slate-900 border-slate-800 text-slate-400"
            }`}
          >
            {handsCount === 0 && "NO HANDS"}
            {handsCount === 1 && "1 HAND"}
            {handsCount >= 2 && "2 HANDS (DUAL)"}
          </span>

          {/* FPS Counter */}
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-semibold">
            {fps} FPS
          </span>

          {/* Toggle Video Underlay */}
          <button
            onClick={onToggleCameraVideo}
            title={showCameraVideo ? "Hide Camera Video (Hologram Mode)" : "Show Camera Video Feed"}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-medium border transition ${
              showCameraVideo
                ? "bg-cyan-950/80 border-cyan-500 text-cyan-300"
                : "bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200"
            }`}
          >
            {showCameraVideo ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{showCameraVideo ? "Video On" : "Video Off"}</span>
          </button>

          {/* Toggle Skeleton */}
          <button
            onClick={onToggleSkeleton}
            title={showSkeleton ? "Hide Skeleton" : "Show Skeleton"}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-cyan-400 transition"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Minimize Viewport */}
          <button
            onClick={onToggleMinimized}
            className="text-xs px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium transition"
          >
            {isMinimized ? "Expand" : "Minimize"}
          </button>
        </div>
      </div>

      {/* Main Holographic Canvas Viewport */}
      {!isMinimized && (
        <div className="relative flex-1 w-full bg-slate-950 overflow-hidden flex items-center justify-center">
          {/* Webcam Element (Hidden if showCameraVideo is false, purely provides video stream) */}
          <video
            ref={videoRef}
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 transition-opacity duration-300 ${
              showCameraVideo ? "opacity-100 z-0" : "opacity-0 pointer-events-none"
            }`}
          />

          {/* Holographic Cyber Canvas (Always visible at 60 FPS) */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
          />

          {/* Floating Gesture Status Badges */}
          <div className="absolute bottom-3 left-4 z-20 flex flex-wrap items-center gap-2">
            {!isTrackingActive ? (
              <div className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide border bg-slate-800 text-slate-300 border-slate-700 shadow-md">
                TRACKING PAUSED
              </div>
            ) : handsCount === 0 ? (
              <div className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide border bg-amber-950/70 text-amber-300 border-amber-800/80 animate-pulse shadow-md">
                HOLD HANDS IN FRONT OF CAMERA
              </div>
            ) : (
              <>
                {/* Primary Hand Badge */}
                {primary && (
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide border backdrop-blur-md shadow-lg transition-all ${primaryBadge.color}`}
                  >
                    {primary.handedness.toUpperCase()}: {primaryBadge.text}
                  </div>
                )}

                {/* Auxiliary Hand Badge */}
                {aux && auxBadge && (
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide border backdrop-blur-md shadow-lg transition-all ${auxBadge.color}`}
                  >
                    {aux.handedness.toUpperCase()}: {auxBadge.text}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Active Control Bounds Label */}
          <div className="absolute top-3 right-4 z-20 flex items-center space-x-1 text-[10px] font-mono text-cyan-400/90 bg-slate-950/80 px-2 py-0.5 rounded border border-cyan-800/60 shadow">
            <span>TOUCH ZONE: ACTIVE</span>
          </div>

          {isCameraLoading && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col items-center justify-center space-y-3 z-30">
              <div className="w-9 h-9 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-300 font-medium tracking-wide">
                {statusText || "Booting Neural Hologram Engine..."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
