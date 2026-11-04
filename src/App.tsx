import { useEffect, useRef, useState, useCallback } from "react";
import { CameraOverlay } from "./components/CameraOverlay";
import { SettingsPanel, SmoothingPreset } from "./components/SettingsPanel";
import { TestSandbox } from "./components/TestSandbox";
import { GestureGuideModal } from "./components/GestureGuideModal";
import { MobileHubModal } from "./components/MobileHubModal";
import {
  MultiHandGestureDetector,
  MultiHandDetectionResult,
  DEFAULT_GESTURE_SETTINGS,
  GestureSettings,
  Landmark,
} from "./utils/gestureDetector";
import { HandTracker } from "./utils/handTracker";
import { PointSmoother } from "./utils/oneEuroFilter";
import { TauriBridge, ScreenSize } from "./utils/tauriBridge";
import {
  Power,
  HelpCircle,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from "lucide-react";

export function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Core App State
  const [isTrackingActive, setIsTrackingActive] = useState<boolean>(true);
  const [isCameraLoading, setIsCameraLoading] = useState<boolean>(true);
  const [statusText, setStatusText] = useState<string>("Initializing AI Hologram Engine...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [screenSize, setScreenSize] = useState<ScreenSize>({ width: 1920, height: 1080 });

  // Calibration Settings
  const [settings, setSettings] = useState<GestureSettings>(DEFAULT_GESTURE_SETTINGS);
  const [smoothingPreset, setSmoothingPreset] = useState<SmoothingPreset>("balanced");

  // Feature Toggles
  const [enablePointer, setEnablePointer] = useState<boolean>(true);
  const [enableClick, setEnableClick] = useState<boolean>(true);
  const [enableRightClick, setEnableRightClick] = useState<boolean>(true);
  const [enableScroll, setEnableScroll] = useState<boolean>(true);
  const [enableVolumeGesture, setEnableVolumeGesture] = useState<boolean>(true);
  const [enableSwipeGesture, setEnableSwipeGesture] = useState<boolean>(true);
  const [enableTwoHandZoom, setEnableTwoHandZoom] = useState<boolean>(true);
  const [enableAutoStandby, setEnableAutoStandby] = useState<boolean>(true);

  // Viewport display modes (Default: Hologram mode, video hidden for maximum privacy & sleekness)
  const [showCameraVideo, setShowCameraVideo] = useState<boolean>(false);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showMobileHub, setShowMobileHub] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(0);

  // Multi-hand detection results sampled for UI
  const [multiResult, setMultiResult] = useState<MultiHandDetectionResult | null>(null);

  // Engine references
  const trackerRef = useRef<HandTracker | null>(null);
  const detectorRef = useRef<MultiHandGestureDetector>(new MultiHandGestureDetector(DEFAULT_GESTURE_SETTINGS));
  const smootherRef = useRef<PointSmoother>(new PointSmoother(0.5, 0.035));

  const isMouseDownRef = useRef<boolean>(false);
  const wasPinchingIndexRef = useRef<boolean>(false);
  const wasPinchingMiddleRef = useRef<boolean>(false);
  const pinchStartTimestampRef = useRef<number | null>(null);

  // Mutable refs to prevent stale closures in 60fps tracking loop
  const isTrackingActiveRef = useRef<boolean>(isTrackingActive);
  isTrackingActiveRef.current = isTrackingActive;

  const enablePointerRef = useRef<boolean>(enablePointer);
  enablePointerRef.current = enablePointer;

  const enableClickRef = useRef<boolean>(enableClick);
  enableClickRef.current = enableClick;

  const enableRightClickRef = useRef<boolean>(enableRightClick);
  enableRightClickRef.current = enableRightClick;

  const enableScrollRef = useRef<boolean>(enableScroll);
  enableScrollRef.current = enableScroll;

  const enableVolumeRef = useRef<boolean>(enableVolumeGesture);
  enableVolumeRef.current = enableVolumeGesture;

  const enableSwipeRef = useRef<boolean>(enableSwipeGesture);
  enableSwipeRef.current = enableSwipeGesture;

  const enableTwoHandZoomRef = useRef<boolean>(enableTwoHandZoom);
  enableTwoHandZoomRef.current = enableTwoHandZoom;

  const enableAutoStandbyRef = useRef<boolean>(enableAutoStandby);
  enableAutoStandbyRef.current = enableAutoStandby;

  const settingsRef = useRef<GestureSettings>(settings);
  settingsRef.current = settings;

  // 1. Initial Screen Discovery & Camera Enumeration
  useEffect(() => {
    TauriBridge.getScreenSize().then((size) => {
      setScreenSize(size);
    });

    const refreshCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        setAvailableCameras(videoDevices);
      } catch (e) {
        console.warn("Failed to enumerate camera devices:", e);
      }
    };

    refreshCameras();
  }, []);

  // 2. Keyboard shortcut: Spacebar toggles tracking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        setIsTrackingActive((prev) => {
          const next = !prev;
          if (trackerRef.current) trackerRef.current.isTrackingActive = next;
          return next;
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 3. Update detector and smoother params
  const handleUpdateSettings = (newSettings: Partial<GestureSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      detectorRef.current.updateSettings(updated);
      if (trackerRef.current) {
        if (updated.activeMarginX !== undefined) trackerRef.current.activeMarginX = updated.activeMarginX;
        if (updated.activeMarginY !== undefined) trackerRef.current.activeMarginY = updated.activeMarginY;
      }
      return updated;
    });
  };

  const handleSelectPreset = (preset: SmoothingPreset) => {
    setSmoothingPreset(preset);
    if (preset === "smooth") {
      // Ultra-stable: low cutoff for extreme stillness, moderate deadband
      smootherRef.current.updateParams(0.35, 0.02, 0.0016);
    } else if (preset === "balanced") {
      // Balanced: smooth hovering with snappy motion
      smootherRef.current.updateParams(0.5, 0.035, 0.0012);
    } else if (preset === "responsive") {
      // Fast: high responsiveness
      smootherRef.current.updateParams(1.0, 0.08, 0.0006);
    }
  };

  // 4. Multi-Hand Frame Processor & Action Pipeline (reads latest refs)
  const processFrame = useCallback(
    (handsLandmarks: Landmark[][], handednessList: string[], timestamp: number) => {
      if (!isTrackingActiveRef.current) {
        setMultiResult(null);
        if (trackerRef.current) trackerRef.current.latestMultiResult = null;
        if (isMouseDownRef.current) {
          TauriBridge.mouseUp("left");
          isMouseDownRef.current = false;
        }
        return;
      }

      if (handsLandmarks.length === 0) {
        setMultiResult(null);
        if (trackerRef.current) trackerRef.current.latestMultiResult = null;
        if (isMouseDownRef.current) {
          TauriBridge.mouseUp("left");
          isMouseDownRef.current = false;
        }
        smootherRef.current.reset();
        wasPinchingIndexRef.current = false;
        wasPinchingMiddleRef.current = false;
        pinchStartTimestampRef.current = null;
        return;
      }

      // Process both hands through multi-hand detector
      const result = detectorRef.current.processMultiHands(handsLandmarks, handednessList, timestamp);
      setMultiResult(result);
      if (trackerRef.current) {
        trackerRef.current.latestMultiResult = result;
      }

      // Check Auto-Standby: closed fist ✊ on either hand pauses cursor while held
      if (enableAutoStandbyRef.current && result.hands.some((h) => h.gesture === "FIST")) {
        if (isMouseDownRef.current) {
          TauriBridge.mouseUp("left");
          isMouseDownRef.current = false;
        }
        return;
      }

      // 1. Two-Hand Zooming (Expanding or pinching distance between both hands)
      if (enableTwoHandZoomRef.current && result.twoHandZoomDelta !== 0) {
        TauriBridge.mouseZoom(result.twoHandZoomDelta);
      }

      // 2. Primary Hand (Cursor Navigation & Clicks)
      const primary = result.primaryHand;
      if (primary) {
        // Cursor movement with adaptive 1€ smoothing & deadband
        const rawX = primary.cursorNormalized.x;
        const rawY = primary.cursorNormalized.y;
        const smoothed = smootherRef.current.smooth(rawX, rawY, timestamp);

        if (enablePointerRef.current && primary.gesture !== "SCROLLING") {
          TauriBridge.mouseMoveNorm(smoothed.x, smoothed.y);
        }

        // Pinch-to-click with Click-Stabilization Lock
        if (enableClickRef.current) {
          const isPinching = primary.isPinchingIndex;
          const wasPinching = wasPinchingIndexRef.current;

          // Transition: Finger contact made
          if (isPinching && !wasPinching) {
            pinchStartTimestampRef.current = timestamp;
            // Freeze cursor during pinch contact to eliminate twitch
            smootherRef.current.lockPosition(220);
          }

          // Drag & Drop: held past dragHoldMs threshold
          if (
            isPinching &&
            pinchStartTimestampRef.current &&
            timestamp - pinchStartTimestampRef.current > settingsRef.current.dragHoldMs &&
            !isMouseDownRef.current
          ) {
            TauriBridge.mouseDown("left");
            isMouseDownRef.current = true;
          }

          // Transition: Pinch released
          if (!isPinching && wasPinching) {
            if (isMouseDownRef.current) {
              TauriBridge.mouseUp("left");
              isMouseDownRef.current = false;
            } else if (
              pinchStartTimestampRef.current &&
              timestamp - pinchStartTimestampRef.current <= settingsRef.current.dragHoldMs
            ) {
              TauriBridge.mouseClick("left");
            }
            pinchStartTimestampRef.current = null;
          }

          wasPinchingIndexRef.current = isPinching;
        }

        // Middle-Pinch Right Click
        if (enableRightClickRef.current) {
          const isPinchingMid = primary.isPinchingMiddle;
          const wasPinchingMid = wasPinchingMiddleRef.current;

          if (isPinchingMid && !wasPinchingMid) {
            smootherRef.current.lockPosition(220);
            TauriBridge.mouseClick("right");
          }
          wasPinchingMiddleRef.current = isPinchingMid;
        }

        // Primary Hand Scroll (if peace sign ✌️)
        if (enableScrollRef.current && primary.scrollDeltaY !== 0) {
          TauriBridge.mouseScroll(primary.scrollDeltaY);
        }
      }

      // 3. Auxiliary Hand (Gestures, Volume, Scrolling, App Switcher)
      const aux = result.auxiliaryHand;
      if (aux) {
        // Two-Finger Scroll from auxiliary hand
        if (enableScrollRef.current && aux.scrollDeltaY !== 0) {
          TauriBridge.mouseScroll(aux.scrollDeltaY);
        }

        // Volume Gestures: Thumbs Up / Down
        if (enableVolumeRef.current) {
          if (aux.gesture === "VOLUME_UP") {
            TauriBridge.triggerAction("volume_up");
          } else if (aux.gesture === "VOLUME_DOWN") {
            TauriBridge.triggerAction("volume_down");
          }
        }

        // Horizontal Swipe: Alt+Tab / Presentation
        if (enableSwipeRef.current) {
          if (aux.gesture === "SWIPE_LEFT") {
            TauriBridge.triggerAction("alt_tab");
          } else if (aux.gesture === "SWIPE_RIGHT") {
            TauriBridge.triggerAction("slide_next");
          }
        }
      }
    },
    []
  );

  // 5. Initialize HandTracker and Camera Stream
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    let isDisposed = false;

    const startCameraAndTracker = async () => {
      setIsCameraLoading(true);
      setErrorMessage(null);

      try {
        if (!trackerRef.current) {
          setStatusText("Booting Dual-Hand AI Vision Engine...");
          trackerRef.current = new HandTracker({
            onResults: (hands, handedness, ts) => {
              if (!isDisposed) processFrame(hands, handedness, ts);
            },
            onError: (err) => {
              console.error(err);
              if (!isDisposed) setErrorMessage(err);
            },
            onFpsUpdate: (currentFps) => {
              if (!isDisposed) setFps(currentFps);
            },
            onStatusChange: (status) => {
              if (!isDisposed) setStatusText(status);
            },
          });
          await trackerRef.current.initialize();
        } else {
          trackerRef.current.setCallbacks({
            onResults: (hands, handedness, ts) => {
              if (!isDisposed) processFrame(hands, handedness, ts);
            },
            onError: (err) => {
              console.error(err);
              if (!isDisposed) setErrorMessage(err);
            },
            onFpsUpdate: (currentFps) => {
              if (!isDisposed) setFps(currentFps);
            },
            onStatusChange: (status) => {
              if (!isDisposed) setStatusText(status);
            },
          });
        }

        trackerRef.current.showSkeleton = showSkeleton;
        trackerRef.current.showCameraVideo = showCameraVideo;
        trackerRef.current.activeMarginX = settings.activeMarginX;
        trackerRef.current.activeMarginY = settings.activeMarginY;
        trackerRef.current.isTrackingActive = isTrackingActive;

        setStatusText("Connecting Webcam...");
        const constraints: MediaStreamConstraints = {
          video: selectedCameraId
            ? { deviceId: { exact: selectedCameraId }, width: { ideal: 640 }, height: { ideal: 480 } }
            : { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isDisposed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        activeStream = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          trackerRef.current.startTracking(videoRef.current, canvasRef.current);
        }
      } catch (err) {
        if (!isDisposed) {
          const msg = err instanceof Error ? err.message : String(err);
          setErrorMessage(`Camera Stream Error: ${msg}. Grant camera permissions and reload.`);
        }
      } finally {
        if (!isDisposed) {
          setIsCameraLoading(false);
        }
      }
    };

    startCameraAndTracker();

    return () => {
      isDisposed = true;
      if (activeStream) {
        activeStream.getTracks().forEach((t) => t.stop());
      }
      if (trackerRef.current) {
        trackerRef.current.stopTracking();
      }
    };
  }, [selectedCameraId, processFrame]);

  // Sync canvas & display flags with tracker
  useEffect(() => {
    if (trackerRef.current) {
      trackerRef.current.showSkeleton = showSkeleton;
      trackerRef.current.showCameraVideo = showCameraVideo;
      trackerRef.current.activeMarginX = settings.activeMarginX;
      trackerRef.current.activeMarginY = settings.activeMarginY;
      trackerRef.current.isTrackingActive = isTrackingActive;
      if (canvasRef.current) {
        trackerRef.current.setCanvas(canvasRef.current);
      }
    }
  }, [showSkeleton, showCameraVideo, settings.activeMarginX, settings.activeMarginY, isTrackingActive]);

  const refreshCamerasList = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAvailableCameras(devices.filter((d) => d.kind === "videoinput"));
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-white">
      {/* Top Futuristic Cyber Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-6 py-3 flex items-center justify-between shadow-2xl">
        {/* Brand Logo & Version */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-300 bg-clip-text text-transparent">
                LevelZ AirTouch
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-700/80 text-cyan-300 font-semibold shadow-sm">
                DUAL-HAND AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Touchless PC Air-Control • Zero Cloud Latency
            </p>
          </div>
        </div>

        {/* Master Controls & Actions */}
        <div className="flex items-center space-x-2.5">
          {/* Master Toggle Button */}
          <button
            onClick={() => {
              setIsTrackingActive((prev) => {
                const next = !prev;
                if (trackerRef.current) trackerRef.current.isTrackingActive = next;
                return next;
              });
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide border transition shadow-lg ${
              isTrackingActive
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white shadow-emerald-900/30 glow-emerald"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isTrackingActive ? "TRACKING ACTIVE" : "PAUSED"}</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isTrackingActive ? "bg-emerald-300 animate-pulse" : "bg-slate-500"
              }`}
            />
          </button>

          {/* Gesture Library Modal Trigger */}
          <button
            onClick={() => setShowGuide(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 transition"
            title="Gesture Command Library"
          >
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Gestures</span>
          </button>

          {/* Mobile Remote Trigger */}
          <button
            onClick={() => setShowMobileHub(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 text-xs text-cyan-300 transition"
            title="Mobile / Phone Remote Hub"
          >
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Mobile Connect</span>
          </button>
        </div>
      </header>

      {/* Main App Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Error Alert if camera fails */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center space-x-3 shadow-lg">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <div>
              <div className="font-semibold">Notice:</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Top Grid: Hologram Viewport & Testing Desk */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Hologram Cyber Viewport */}
          <div className="lg:col-span-7">
            <CameraOverlay
              videoRef={videoRef}
              canvasRef={canvasRef}
              multiResult={multiResult}
              fps={fps}
              isTrackingActive={isTrackingActive}
              isCameraLoading={isCameraLoading}
              selectedCameraId={selectedCameraId}
              availableCameras={availableCameras}
              onSelectCamera={(id) => setSelectedCameraId(id)}
              onRefreshCameras={refreshCamerasList}
              showSkeleton={showSkeleton}
              onToggleSkeleton={() => setShowSkeleton((prev) => !prev)}
              showCameraVideo={showCameraVideo}
              onToggleCameraVideo={() => setShowCameraVideo((prev) => !prev)}
              isMinimized={isMinimized}
              onToggleMinimized={() => setIsMinimized((prev) => !prev)}
              statusText={statusText}
            />
          </div>

          {/* Interactive Testing Sandbox & PC Deck */}
          <div className="lg:col-span-5 space-y-6">
            <TestSandbox />
          </div>
        </div>

        {/* Calibration & Gesture Tuning Deck */}
        <SettingsPanel
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          smoothingPreset={smoothingPreset}
          onSelectPreset={handleSelectPreset}
          enablePointer={enablePointer}
          onTogglePointer={setEnablePointer}
          enableClick={enableClick}
          onToggleClick={setEnableClick}
          enableRightClick={enableRightClick}
          onToggleRightClick={setEnableRightClick}
          enableScroll={enableScroll}
          onToggleScroll={setEnableScroll}
          enableVolumeGesture={enableVolumeGesture}
          onToggleVolumeGesture={setEnableVolumeGesture}
          enableSwipeGesture={enableSwipeGesture}
          onToggleSwipeGesture={setEnableSwipeGesture}
          enableTwoHandZoom={enableTwoHandZoom}
          onToggleTwoHandZoom={setEnableTwoHandZoom}
          enableAutoStandby={enableAutoStandby}
          onToggleAutoStandby={setEnableAutoStandby}
          screenSize={screenSize}
        />
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 px-6 py-3 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500" />
          <span>Dual-Hand Neural Pipeline: 60 FPS Stable</span>
          <span className="text-slate-700">|</span>
          <span>1€ Tremor Suppression Filter Active</span>
        </div>
        <div className="font-mono text-slate-400">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">Space</kbd> to toggle tracking
        </div>
      </footer>

      {/* Modals */}
      <GestureGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />
      <MobileHubModal isOpen={showMobileHub} onClose={() => setShowMobileHub(false)} />
    </div>
  );
}

export default App;
