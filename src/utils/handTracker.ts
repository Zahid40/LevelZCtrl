import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { Landmark, MultiHandDetectionResult } from "./gestureDetector";

export interface HandTrackerCallbacks {
  onResults: (hands: Landmark[][], handedness: string[], timestamp: number) => void;
  onError: (err: string) => void;
  onFpsUpdate?: (fps: number) => void;
  onStatusChange?: (status: string) => void;
}

// MediaPipe 21-joint hand connections
const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [5, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [9, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
];

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private lastTimestamp: number = 0;
  private frameCount: number = 0;
  private lastFpsTime: number = performance.now();
  private isProcessingFrame: boolean = false;

  // Active overlay configuration
  public showSkeleton: boolean = true;
  public showCameraVideo: boolean = false; // Default: clean hologram HUD (video hidden)
  public activeMarginX: number = 0.14;
  public activeMarginY: number = 0.14;
  public latestMultiResult: MultiHandDetectionResult | null = null;
  public isTrackingActive: boolean = true;

  constructor(public callbacks: HandTrackerCallbacks) {}

  setCallbacks(callbacks: HandTrackerCallbacks) {
    this.callbacks = callbacks;
  }

  async initialize(): Promise<void> {
    this.callbacks.onStatusChange?.("Loading AI Vision Runtime...");

    try {
      // 1. Resolve WASM assets
      let vision;
      try {
        const wasmPath = `${window.location.origin}/mediapipe/wasm`;
        vision = await FilesetResolver.forVisionTasks(wasmPath);
      } catch (localWasmErr) {
        console.warn("Local WASM failed, falling back to CDN:", localWasmErr);
        vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
      }

      // 2. Load model buffer
      this.callbacks.onStatusChange?.("Loading Neural Hand Model...");
      let modelBuffer: Uint8Array | null = null;
      try {
        const modelRes = await fetch("/models/hand_landmarker.task");
        if (modelRes.ok) {
          modelBuffer = new Uint8Array(await modelRes.arrayBuffer());
        }
      } catch (bufErr) {
        console.warn("Could not pre-fetch model buffer, will use asset path:", bufErr);
      }

      const baseOptions = modelBuffer
        ? { modelAssetBuffer: modelBuffer }
        : { modelAssetPath: "/models/hand_landmarker.task" };

      // 3. Create HandLandmarker with numHands: 2 for dual-hand tracking!
      try {
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            ...baseOptions,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 2, // Track both hands
          minHandDetectionConfidence: 0.35,
          minHandPresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
      } catch (gpuErr) {
        console.warn("GPU delegate failed, using CPU delegate:", gpuErr);
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            ...baseOptions,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.35,
          minHandPresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
      }

      this.callbacks.onStatusChange?.("AI Vision Ready (Dual Hand)");
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      this.callbacks.onError(`HandLandmarker init error: ${errMsg}`);
      throw e;
    }
  }

  startTracking(video: HTMLVideoElement, canvas: HTMLCanvasElement | null = null) {
    this.videoElement = video;
    this.canvasElement = canvas;
    this.isRunning = true;
    this.lastTimestamp = 0;
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.isProcessingFrame = false;
    this.loop();
  }

  setCanvas(canvas: HTMLCanvasElement | null) {
    this.canvasElement = canvas;
  }

  stopTracking() {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.canvasElement) {
      const ctx = this.canvasElement.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
      }
    }
    this.callbacks.onResults([], [], performance.now());
  }

  private loop = () => {
    if (!this.isRunning) return;

    const video = this.videoElement;
    const canvas = this.canvasElement;

    if (
      video &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      video.videoWidth > 0 &&
      this.handLandmarker &&
      !this.isProcessingFrame
    ) {
      // Sync canvas dimensions to match video stream pixels
      if (canvas) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
      }

      let now = performance.now();
      if (now <= this.lastTimestamp) {
        now = this.lastTimestamp + 1;
      }
      this.lastTimestamp = now;

      try {
        this.isProcessingFrame = true;
        const results = this.handLandmarker.detectForVideo(video, now);
        this.isProcessingFrame = false;

        const allHands = results.landmarks || [];
        const handednessList = (results.handedness || []).map((h) =>
          h.length > 0 ? h[0].categoryName : "Right"
        );

        // Render holographic overlay at 60 FPS
        if (canvas) {
          this.drawOverlay(canvas, allHands, handednessList);
        }

        this.callbacks.onResults(allHands, handednessList, now);
      } catch (e) {
        this.isProcessingFrame = false;
        console.error("detectForVideo error:", e);
      }

      // FPS calculation
      this.frameCount++;
      const elapsed = performance.now() - this.lastFpsTime;
      if (elapsed >= 1000) {
        const currentFps = Math.round((this.frameCount * 1000) / elapsed);
        this.callbacks.onFpsUpdate?.(currentFps);
        this.frameCount = 0;
        this.lastFpsTime = performance.now();
      }
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  /**
   * Draws the Holographic HUD with Cyber Grid & Glowing Neon Hand Skeletons.
   */
  private drawOverlay(
    canvas: HTMLCanvasElement,
    hands: Landmark[][],
    handednesses: string[]
  ) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // If camera video is hidden, render sleek dark cyberspace background with perspective grid
    if (!this.showCameraVideo) {
      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, "#080c14");
      bgGrad.addColorStop(1, "#03060a");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Cybernetic perspective grid lines
      ctx.save();
      ctx.strokeStyle = "rgba(14, 165, 233, 0.08)";
      ctx.lineWidth = 1;

      // Vertical lines
      const vStep = width / 16;
      for (let x = 0; x <= width; x += vStep) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      const hStep = height / 12;
      for (let y = 0; y <= height; y += hStep) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    // 1. Draw Active Control Zone Box
    const boxX = this.activeMarginX * width;
    const boxY = this.activeMarginY * height;
    const boxW = (1 - 2 * this.activeMarginX) * width;
    const boxH = (1 - 2 * this.activeMarginY) * height;

    ctx.save();
    ctx.strokeStyle = this.isTrackingActive ? "rgba(6, 182, 212, 0.4)" : "rgba(71, 85, 105, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 8]);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    // Glowing futuristic corner brackets
    const corner = 20;
    ctx.setLineDash([]);
    ctx.strokeStyle = this.isTrackingActive ? "#06b6d4" : "rgba(100, 116, 139, 0.6)";
    ctx.lineWidth = 3;

    // Top-Left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + corner);
    ctx.lineTo(boxX, boxY);
    ctx.lineTo(boxX + corner, boxY);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - corner, boxY);
    ctx.lineTo(boxX + boxW, boxY);
    ctx.lineTo(boxX + boxW, boxY + corner);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(boxX, boxY + boxH - corner);
    ctx.lineTo(boxX, boxY + boxH);
    ctx.lineTo(boxX + corner, boxY + boxH);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(boxX + boxW - corner, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH);
    ctx.lineTo(boxX + boxW, boxY + boxH - corner);
    ctx.stroke();

    // Tag
    ctx.font = "10px monospace";
    ctx.fillStyle = "rgba(6, 182, 212, 0.75)";
    ctx.fillText("ACTIVE TOUCH ZONE", boxX + 6, boxY + 14);
    ctx.restore();

    // 2. Render each detected hand
    hands.forEach((landmarks, handIdx) => {
      const handedness = handednesses[handIdx] || (handIdx === 0 ? "Right" : "Left");
      const isRight = handedness.toLowerCase().includes("right");

      // Distinct color themes:
      // Right hand: Neon Electric Cyan & Royal Blue
      // Left hand: Neon Purple & Vivid Coral
      const primaryColor = isRight ? "#00f0ff" : "#c084fc";
      const secondaryColor = isRight ? "#3b82f6" : "#f43f5e";
      const glowColor = isRight ? "rgba(0, 240, 255, 0.35)" : "rgba(192, 132, 252, 0.35)";

      // Mirror X coordinates for intuitive mirror projection
      const points = landmarks.map((lm) => ({
        x: (1.0 - lm.x) * width,
        y: lm.y * height,
      }));

      // Draw skeleton bones
      ctx.save();
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";

      for (const [i, j] of HAND_CONNECTIONS) {
        const p1 = points[i];
        const p2 = points[j];
        if (!p1 || !p2) continue;

        const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        grad.addColorStop(0, primaryColor);
        grad.addColorStop(1, secondaryColor);

        ctx.strokeStyle = grad;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      ctx.restore();

      // Draw joints
      points.forEach((p, idx) => {
        const isFingertip = [4, 8, 12, 16, 20].includes(idx);
        const radius = isFingertip ? 6 : 3.5;

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius + 3, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = isFingertip ? primaryColor : secondaryColor;
        ctx.fill();
        ctx.restore();
      });

      // Pinch indicator line (Thumb 4 to Index 8)
      const thumb = points[4];
      const index = points[8];
      const singleHandResult = this.latestMultiResult?.hands.find((h) => h.handIndex === handIdx);

      if (thumb && index && singleHandResult) {
        const isPinching = singleHandResult.isPinchingIndex;
        ctx.save();
        ctx.lineWidth = isPinching ? 4 : 2;
        ctx.strokeStyle = isPinching ? "#10b981" : "rgba(245, 158, 11, 0.75)";
        ctx.setLineDash(isPinching ? [] : [4, 4]);
        ctx.beginPath();
        ctx.moveTo(thumb.x, thumb.y);
        ctx.lineTo(index.x, index.y);
        ctx.stroke();

        const midX = (thumb.x + index.x) / 2;
        const midY = (thumb.y + index.y) / 2;
        ctx.beginPath();
        ctx.arc(midX, midY, isPinching ? 7 : 4, 0, Math.PI * 2);
        ctx.fillStyle = isPinching ? "#10b981" : "#f59e0b";
        ctx.fill();

        if (isPinching) {
          ctx.font = "bold 11px sans-serif";
          ctx.fillStyle = "#10b981";
          ctx.fillText("CLICK", midX + 10, midY - 6);
        }
        ctx.restore();
      }

      // Cursor Aiming Reticle (drawn on Index fingertip)
      if (index && isRight) {
        ctx.save();
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(index.x, index.y, 14, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(index.x - 18, index.y);
        ctx.lineTo(index.x - 8, index.y);
        ctx.moveTo(index.x + 8, index.y);
        ctx.lineTo(index.x + 18, index.y);
        ctx.moveTo(index.x, index.y - 18);
        ctx.lineTo(index.x, index.y - 8);
        ctx.moveTo(index.x, index.y + 8);
        ctx.lineTo(index.x, index.y + 18);
        ctx.stroke();
        ctx.restore();
      }

      // Hand Role Tag near wrist
      const wrist = points[0];
      if (wrist) {
        ctx.save();
        ctx.font = "11px sans-serif";
        ctx.fillStyle = primaryColor;
        const tag = isRight ? "RIGHT (CURSOR)" : "LEFT (GESTURES)";
        ctx.fillText(tag, wrist.x - 30, wrist.y + 22);
        ctx.restore();
      }
    });

    // 3. Two-hand Zoom Connecting Line
    if (hands.length >= 2 && this.latestMultiResult?.twoHandZoomDelta) {
      const h1 = hands[0][8];
      const h2 = hands[1][8];
      if (h1 && h2) {
        ctx.save();
        ctx.strokeStyle = "rgba(16, 185, 129, 0.85)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo((1 - h1.x) * width, h1.y * height);
        ctx.lineTo((1 - h2.x) * width, h2.y * height);
        ctx.stroke();

        const midX = ((1 - h1.x) * width + (1 - h2.x) * width) / 2;
        const midY = (h1.y * height + h2.y * height) / 2;
        ctx.font = "bold 13px sans-serif";
        ctx.fillStyle = "#10b981";
        ctx.fillText("ZOOMING 🔍", midX - 35, midY - 10);
        ctx.restore();
      }
    }
  }

  dispose() {
    this.stopTracking();
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
  }
}
