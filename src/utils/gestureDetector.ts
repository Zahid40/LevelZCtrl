export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export type Handedness = "Right" | "Left";

export type GestureType =
  | "NONE"
  | "POINTING"
  | "PINCH_INDEX"
  | "PINCH_MIDDLE"
  | "DRAGGING"
  | "SCROLLING"
  | "VOLUME_UP"
  | "VOLUME_DOWN"
  | "SWIPE_LEFT"
  | "SWIPE_RIGHT"
  | "TWO_HAND_ZOOM"
  | "FIST"
  | "OPEN_PALM";

export interface SingleHandResult {
  handIndex: number;
  handedness: Handedness;
  gesture: GestureType;
  cursorNormalized: { x: number; y: number };
  indexTip: { x: number; y: number };
  thumbTip: { x: number; y: number };
  wrist: { x: number; y: number };
  pinchDistance: number;
  isPinchingIndex: boolean;
  isPinchingMiddle: boolean;
  fingersExtended: {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  };
  scrollDeltaY: number;
}

export interface MultiHandDetectionResult {
  hands: SingleHandResult[];
  primaryHand: SingleHandResult | null;
  auxiliaryHand: SingleHandResult | null;
  twoHandZoomDelta: number; // Positive = zoom in, negative = zoom out
  globalGesture: GestureType;
}

export interface GestureSettings {
  sensitivity: number; // 0.6 to 2.8
  activeMarginX: number; // 0.08 to 0.30
  activeMarginY: number; // 0.08 to 0.30
  pinchThreshold: number; // 0.28 to 0.44
  pinchReleaseThreshold: number; // pinchThreshold + 0.08
  scrollSensitivity: number; // 1.0 to 4.0
  invertScroll: boolean;
  dragHoldMs: number; // 200ms
  dominantHand: "Right" | "Left";
  tremorDamping: number; // 0.001 to 0.005
}

export const DEFAULT_GESTURE_SETTINGS: GestureSettings = {
  sensitivity: 1.35,
  activeMarginX: 0.14,
  activeMarginY: 0.14,
  pinchThreshold: 0.35,
  pinchReleaseThreshold: 0.43,
  scrollSensitivity: 2.2,
  invertScroll: false,
  dragHoldMs: 220,
  dominantHand: "Right",
  tremorDamping: 0.0012,
};

function euclideanDistance(a: Landmark, b: Landmark): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export class MultiHandGestureDetector {
  private isPinchingIndexState: Map<number, boolean> = new Map();
  private isPinchingMiddleState: Map<number, boolean> = new Map();
  private pinchStartTimestamps: Map<number, number> = new Map();
  private lastScrollY: Map<number, number> = new Map();
  private lastTwoHandDist: number | null = null;
  private lastVolumeTriggerTime: number = 0;
  private lastSwipeTriggerTime: number = 0;

  // Recent position history for lateral swipe detection
  private handVelocityHistory: Map<number, Array<{ x: number; time: number }>> = new Map();

  constructor(private settings: GestureSettings = DEFAULT_GESTURE_SETTINGS) {}

  updateSettings(newSettings: Partial<GestureSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): GestureSettings {
    return this.settings;
  }

  processMultiHands(
    handsLandmarks: Landmark[][],
    handednesses: string[] = [],
    now: number = performance.now()
  ): MultiHandDetectionResult {
    const handResults: SingleHandResult[] = handsLandmarks.map((landmarks, index) => {
      // Determine handedness label (default to Right for first hand if not provided)
      const label = handednesses[index] || (index === 0 ? "Right" : "Left");
      const handedness: Handedness = label.toLowerCase().includes("left") ? "Left" : "Right";
      return this.processSingleHand(landmarks, index, handedness, now);
    });

    let primaryHand: SingleHandResult | null = null;
    let auxiliaryHand: SingleHandResult | null = null;

    if (handResults.length === 1) {
      primaryHand = handResults[0];
    } else if (handResults.length >= 2) {
      // Assign dominant vs auxiliary
      const preferred = handResults.find((h) => h.handedness === this.settings.dominantHand);
      if (preferred) {
        primaryHand = preferred;
        auxiliaryHand = handResults.find((h) => h !== preferred) || null;
      } else {
        primaryHand = handResults[0];
        auxiliaryHand = handResults[1];
      }
    }

    // Two-Hand Zoom calculation:
    // If both hands are in pinch or fist pose, distance delta zooms in/out
    let twoHandZoomDelta = 0;
    if (primaryHand && auxiliaryHand) {
      const pIdx = primaryHand.indexTip;
      const aIdx = auxiliaryHand.indexTip;
      const currentDist = Math.hypot(pIdx.x - aIdx.x, pIdx.y - aIdx.y);

      if (this.lastTwoHandDist !== null) {
        const delta = currentDist - this.lastTwoHandDist;
        if (Math.abs(delta) > 0.015) {
          twoHandZoomDelta = delta > 0 ? 1 : -1;
        }
      }
      this.lastTwoHandDist = currentDist;
    } else {
      this.lastTwoHandDist = null;
    }

    // Determine overall global gesture
    let globalGesture: GestureType = "NONE";
    if (twoHandZoomDelta !== 0) {
      globalGesture = "TWO_HAND_ZOOM";
    } else if (primaryHand) {
      globalGesture = primaryHand.gesture;
    }

    return {
      hands: handResults,
      primaryHand,
      auxiliaryHand,
      twoHandZoomDelta,
      globalGesture,
    };
  }

  private processSingleHand(
    landmarks: Landmark[],
    handIndex: number,
    handedness: Handedness,
    now: number
  ): SingleHandResult {
    const wrist = landmarks[0];
    const thumbIp = landmarks[3];
    const thumbTip = landmarks[4];

    const indexPip = landmarks[6];
    const indexTip = landmarks[8];

    const middleMcp = landmarks[9];
    const middlePip = landmarks[10];
    const middleTip = landmarks[12];

    const ringPip = landmarks[14];
    const ringTip = landmarks[16];

    const pinkyMcp = landmarks[17];
    const pinkyPip = landmarks[18];
    const pinkyTip = landmarks[20];

    // Reference hand scale: distance between wrist and middle MCP
    const handScale = Math.max(euclideanDistance(wrist, middleMcp), 0.05);

    // Finger extended checks
    const indexExtended = euclideanDistance(wrist, indexTip) > euclideanDistance(wrist, indexPip) * 1.18;
    const middleExtended = euclideanDistance(wrist, middleTip) > euclideanDistance(wrist, middlePip) * 1.18;
    const ringExtended = euclideanDistance(wrist, ringTip) > euclideanDistance(wrist, ringPip) * 1.15;
    const pinkyExtended = euclideanDistance(wrist, pinkyTip) > euclideanDistance(wrist, pinkyPip) * 1.15;
    const thumbExtended = euclideanDistance(thumbTip, pinkyMcp) > euclideanDistance(thumbIp, pinkyMcp) * 1.12;

    const fingersExtended = {
      thumb: thumbExtended,
      index: indexExtended,
      middle: middleExtended,
      ring: ringExtended,
      pinky: pinkyExtended,
    };

    // Normalized pinch distances
    const rawIndexPinch = euclideanDistance(thumbTip, indexTip) / handScale;
    const rawMiddlePinch = euclideanDistance(thumbTip, middleTip) / handScale;

    // Hysteresis for Index Pinch (Click)
    let isPinchingIndex = this.isPinchingIndexState.get(handIndex) || false;
    if (!isPinchingIndex) {
      if (rawIndexPinch < this.settings.pinchThreshold) {
        isPinchingIndex = true;
        this.pinchStartTimestamps.set(handIndex, now);
      }
    } else {
      if (rawIndexPinch > this.settings.pinchReleaseThreshold) {
        isPinchingIndex = false;
        this.pinchStartTimestamps.delete(handIndex);
      }
    }
    this.isPinchingIndexState.set(handIndex, isPinchingIndex);

    // Hysteresis for Middle Pinch (Right Click)
    let isPinchingMiddle = this.isPinchingMiddleState.get(handIndex) || false;
    if (!isPinchingMiddle) {
      if (rawMiddlePinch < this.settings.pinchThreshold && !isPinchingIndex) {
        isPinchingMiddle = true;
      }
    } else {
      if (rawMiddlePinch > this.settings.pinchReleaseThreshold) {
        isPinchingMiddle = false;
      }
    }
    this.isPinchingMiddleState.set(handIndex, isPinchingMiddle);

    // Drag detection
    const pinchStart = this.pinchStartTimestamps.get(handIndex);
    const isDragging = isPinchingIndex && pinchStart && now - pinchStart > this.settings.dragHoldMs;

    // Cursor position calculation:
    // When pinching, anchor at the contact midpoint to prevent twitching
    let targetX = indexTip.x;
    let targetY = indexTip.y;
    if (isPinchingIndex) {
      targetX = (indexTip.x + thumbTip.x) / 2;
      targetY = (indexTip.y + thumbTip.y) / 2;
    }

    // Active zone bounding box remapping (Camera mirrored: flip X)
    const mirroredX = 1.0 - targetX;
    const mirroredY = targetY;

    const mx = this.settings.activeMarginX;
    const my = this.settings.activeMarginY;

    // Remap [mx, 1 - mx] to [0, 1]
    const clampedX = Math.max(0, Math.min(1, (mirroredX - mx) / (1 - 2 * mx)));
    const clampedY = Math.max(0, Math.min(1, (mirroredY - my) / (1 - 2 * my)));

    // Scroll gesture detection: Peace sign ✌️ or two fingers extended
    let scrollDeltaY = 0;
    const isScrollPose =
      indexExtended &&
      middleExtended &&
      !ringExtended &&
      !pinkyExtended &&
      !isPinchingIndex;

    if (isScrollPose) {
      const avgY = (indexTip.y + middleTip.y) / 2;
      const lastY = this.lastScrollY.get(handIndex);
      if (lastY !== undefined) {
        const dy = avgY - lastY;
        if (Math.abs(dy) > 0.004) {
          const factor = this.settings.invertScroll ? 1 : -1;
          scrollDeltaY = dy * 180 * this.settings.scrollSensitivity * factor;
        }
      }
      this.lastScrollY.set(handIndex, avgY);
    } else {
      this.lastScrollY.delete(handIndex);
    }

    // Swipe lateral movement detection (Flick left or right)
    let history = this.handVelocityHistory.get(handIndex) || [];
    history.push({ x: indexTip.x, time: now });
    if (history.length > 8) history.shift();
    this.handVelocityHistory.set(handIndex, history);

    let isSwipeLeft = false;
    let isSwipeRight = false;
    if (history.length >= 5 && now - this.lastSwipeTriggerTime > 600) {
      const first = history[0];
      const last = history[history.length - 1];
      const dt = (last.time - first.time) / 1000;
      const dx = last.x - first.x;
      const velocityX = dx / dt; // camera coordinates

      if (Math.abs(velocityX) > 1.8 && (indexExtended || middleExtended)) {
        if (velocityX > 0) {
          isSwipeLeft = true; // mirrored camera
        } else {
          isSwipeRight = true;
        }
        this.lastSwipeTriggerTime = now;
      }
    }

    // Volume gesture: Thumbs Up 👍 / Thumbs Down 👎
    let isVolumeUp = false;
    let isVolumeDown = false;
    const allFingersCurled = !indexExtended && !middleExtended && !ringExtended && !pinkyExtended;
    if (allFingersCurled && thumbExtended && now - this.lastVolumeTriggerTime > 350) {
      // Thumb pointing up vs down relative to wrist
      if (thumbTip.y < wrist.y - 0.08) {
        isVolumeUp = true;
        this.lastVolumeTriggerTime = now;
      } else if (thumbTip.y > wrist.y + 0.08) {
        isVolumeDown = true;
        this.lastVolumeTriggerTime = now;
      }
    }

    // Overall pose classification
    let gesture: GestureType = "NONE";
    const allOpen = indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended;

    if (allFingersCurled && !thumbExtended) {
      gesture = "FIST";
    } else if (isVolumeUp) {
      gesture = "VOLUME_UP";
    } else if (isVolumeDown) {
      gesture = "VOLUME_DOWN";
    } else if (isSwipeLeft) {
      gesture = "SWIPE_LEFT";
    } else if (isSwipeRight) {
      gesture = "SWIPE_RIGHT";
    } else if (isScrollPose) {
      gesture = "SCROLLING";
    } else if (isDragging) {
      gesture = "DRAGGING";
    } else if (isPinchingIndex) {
      gesture = "PINCH_INDEX";
    } else if (isPinchingMiddle) {
      gesture = "PINCH_MIDDLE";
    } else if (allOpen) {
      gesture = "OPEN_PALM";
    } else if (indexExtended) {
      gesture = "POINTING";
    }

    return {
      handIndex,
      handedness,
      gesture,
      cursorNormalized: { x: clampedX, y: clampedY },
      indexTip: { x: 1.0 - indexTip.x, y: indexTip.y },
      thumbTip: { x: 1.0 - thumbTip.x, y: thumbTip.y },
      wrist: { x: 1.0 - wrist.x, y: wrist.y },
      pinchDistance: rawIndexPinch,
      isPinchingIndex,
      isPinchingMiddle,
      fingersExtended,
      scrollDeltaY,
    };
  }

  reset() {
    this.isPinchingIndexState.clear();
    this.isPinchingMiddleState.clear();
    this.pinchStartTimestamps.clear();
    this.lastScrollY.clear();
    this.handVelocityHistory.clear();
    this.lastTwoHandDist = null;
  }
}
