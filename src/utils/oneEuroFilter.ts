/**
 * 1€ Filter (One Euro Filter) with Adaptive Deadband & Click-Stabilization Lock
 * Eliminates hand tremors and sensor jitter while providing instant responsive tracking.
 */

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  constructor() {}

  filter(value: number, alpha: number): number {
    if (this.s === null) {
      this.s = value;
      this.y = value;
    } else {
      this.s = alpha * value + (1.0 - alpha) * this.s;
      this.y = this.s;
    }
    return this.y;
  }

  hasLast(): boolean {
    return this.s !== null;
  }

  last(): number {
    return this.y ?? 0;
  }

  reset() {
    this.y = null;
    this.s = null;
  }
}

export class OneEuroFilter {
  private xFilter: LowPassFilter;
  private dxFilter: LowPassFilter;
  private lastTime: number | null = null;

  /**
   * @param minCutoff Lower values = rock-solid stillness when hovering (~0.4 - 0.7)
   * @param beta Speed coefficient. Higher = snappy fast tracking (~0.02 - 0.06)
   * @param dCutoff Cutoff frequency for velocity estimation (~1.0)
   */
  constructor(
    private minCutoff: number = 0.5,
    private beta: number = 0.035,
    private dCutoff: number = 1.0
  ) {
    this.xFilter = new LowPassFilter();
    this.dxFilter = new LowPassFilter();
  }

  setParams(minCutoff: number, beta: number) {
    this.minCutoff = Math.max(0.05, minCutoff);
    this.beta = Math.max(0.001, beta);
  }

  filter(value: number, timestamp: number = performance.now()): number {
    if (this.lastTime === null) {
      this.lastTime = timestamp;
      return this.xFilter.filter(value, 1.0);
    }

    const dt = Math.max((timestamp - this.lastTime) / 1000.0, 0.001);
    this.lastTime = timestamp;

    const dx = this.xFilter.hasLast()
      ? (value - this.xFilter.last()) / dt
      : 0.0;
    const edx = this.dxFilter.filter(dx, this.alpha(this.dCutoff, dt));
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(value, this.alpha(cutoff, dt));
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  reset() {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

export class PointSmoother {
  private filterX: OneEuroFilter;
  private filterY: OneEuroFilter;
  private lastSmoothedX: number | null = null;
  private lastSmoothedY: number | null = null;

  // Click-lock stabilization: freezes cursor position during pinch execution
  private freezeUntil: number = 0;
  private frozenX: number = 0;
  private frozenY: number = 0;

  // Deadband threshold to eliminate microscopic finger tremors when still
  public deadband: number = 0.0012; // in normalized screen coords

  constructor(minCutoff: number = 0.5, beta: number = 0.035) {
    this.filterX = new OneEuroFilter(minCutoff, beta);
    this.filterY = new OneEuroFilter(minCutoff, beta);
  }

  updateParams(minCutoff: number, beta: number, deadband: number = 0.0012) {
    this.filterX.setParams(minCutoff, beta);
    this.filterY.setParams(minCutoff, beta);
    this.deadband = deadband;
  }

  /**
   * Freezes the cursor for a few milliseconds during pinch-to-click.
   * This eliminates the physical tremor that occurs when fingers make contact.
   */
  lockPosition(durationMs: number = 220) {
    this.freezeUntil = performance.now() + durationMs;
    if (this.lastSmoothedX !== null && this.lastSmoothedY !== null) {
      this.frozenX = this.lastSmoothedX;
      this.frozenY = this.lastSmoothedY;
    }
  }

  smooth(rawX: number, rawY: number, timestamp: number = performance.now()): { x: number; y: number } {
    // If click-stabilization lock is active, hold position steady
    if (timestamp < this.freezeUntil && this.lastSmoothedX !== null) {
      return { x: this.frozenX, y: this.frozenY };
    }

    const filteredX = this.filterX.filter(rawX, timestamp);
    const filteredY = this.filterY.filter(rawY, timestamp);

    if (this.lastSmoothedX === null || this.lastSmoothedY === null) {
      this.lastSmoothedX = filteredX;
      this.lastSmoothedY = filteredY;
      return { x: filteredX, y: filteredY };
    }

    // Deadband check: if delta is microscopic, suppress jitter
    const dx = filteredX - this.lastSmoothedX;
    const dy = filteredY - this.lastSmoothedY;
    const distSq = dx * dx + dy * dy;

    if (distSq < this.deadband * this.deadband) {
      return { x: this.lastSmoothedX, y: this.lastSmoothedY };
    }

    this.lastSmoothedX = filteredX;
    this.lastSmoothedY = filteredY;
    return { x: filteredX, y: filteredY };
  }

  reset() {
    this.filterX.reset();
    this.filterY.reset();
    this.lastSmoothedX = null;
    this.lastSmoothedY = null;
    this.freezeUntil = 0;
  }
}
