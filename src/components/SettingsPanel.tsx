import React from "react";
import { GestureSettings } from "../utils/gestureDetector";
import {
  Sliders,
  Activity,
  MousePointer,
  Hand,
  MoveVertical,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export type SmoothingPreset = "responsive" | "balanced" | "smooth";

interface SettingsPanelProps {
  settings: GestureSettings;
  onUpdateSettings: (newSettings: Partial<GestureSettings>) => void;
  smoothingPreset: SmoothingPreset;
  onSelectPreset: (preset: SmoothingPreset) => void;
  enablePointer: boolean;
  onTogglePointer: (val: boolean) => void;
  enableClick: boolean;
  onToggleClick: (val: boolean) => void;
  enableRightClick: boolean;
  onToggleRightClick: (val: boolean) => void;
  enableScroll: boolean;
  onToggleScroll: (val: boolean) => void;
  enableVolumeGesture: boolean;
  onToggleVolumeGesture: (val: boolean) => void;
  enableSwipeGesture: boolean;
  onToggleSwipeGesture: (val: boolean) => void;
  enableTwoHandZoom: boolean;
  onToggleTwoHandZoom: (val: boolean) => void;
  enableAutoStandby: boolean;
  onToggleAutoStandby: (val: boolean) => void;
  screenSize: { width: number; height: number };
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdateSettings,
  smoothingPreset,
  onSelectPreset,
  enablePointer,
  onTogglePointer,
  enableClick,
  onToggleClick,
  enableRightClick,
  onToggleRightClick,
  enableScroll,
  onToggleScroll,
  enableVolumeGesture,
  onToggleVolumeGesture,
  enableSwipeGesture,
  onToggleSwipeGesture,
  enableTwoHandZoom,
  onToggleTwoHandZoom,
  enableAutoStandby,
  onToggleAutoStandby,
  screenSize,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center space-x-2.5">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
            Holographic Motion & Gesture Tuning
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
          <span className="bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            Display: {screenSize.width} × {screenSize.height}
          </span>
        </div>
      </div>

      {/* Stability & Dominant Hand Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Smoothing Presets */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-200 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Tremor Suppression & Anti-Jitter Filter
            </span>
            <span className="text-cyan-400 text-[11px] font-mono capitalize">
              {smoothingPreset === "smooth"
                ? "Ultra-Stable"
                : smoothingPreset === "balanced"
                ? "Balanced"
                : "Fast"}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["smooth", "balanced", "responsive"] as SmoothingPreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => onSelectPreset(preset)}
                className={`py-2 px-2.5 text-xs font-medium rounded-lg border transition ${
                  smoothingPreset === preset
                    ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950/50"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {preset === "smooth" && "Ultra-Stable"}
                {preset === "balanced" && "Balanced (Rec.)"}
                {preset === "responsive" && "Fast / Gaming"}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-slate-500">
            {smoothingPreset === "smooth" && "Heavy tremor suppression. Cursor stays completely still when hovering."}
            {smoothingPreset === "balanced" && "Optimal balance of jitter elimination and snappy response."}
            {smoothingPreset === "responsive" && "Minimum latency, ideal for fast cross-screen flicks."}
          </p>
        </div>

        {/* Dominant Hand Selection */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-200 flex items-center gap-1.5">
              <Hand className="w-3.5 h-3.5 text-purple-400" />
              Dual-Hand Role Assignment
            </span>
            <span className="text-purple-400 text-[11px] font-mono">
              {settings.dominantHand} Hand Dominant
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onUpdateSettings({ dominantHand: "Right" })}
              className={`py-2 px-3 text-xs font-medium rounded-lg border transition ${
                settings.dominantHand === "Right"
                  ? "bg-purple-950/80 border-purple-500 text-purple-300 shadow-md"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Right (Cursor) + Left (Gestures)
            </button>
            <button
              onClick={() => onUpdateSettings({ dominantHand: "Left" })}
              className={`py-2 px-3 text-xs font-medium rounded-lg border transition ${
                settings.dominantHand === "Left"
                  ? "bg-purple-950/80 border-purple-500 text-purple-300 shadow-md"
                  : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Left (Cursor) + Right (Gestures)
            </button>
          </div>
          <p className="text-[10px] text-slate-500">
            Dominant hand moves cursor & clicks. Other hand handles volume, scrolling & zoom!
          </p>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cursor Speed */}
        <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
              Cursor Speed
            </span>
            <span className="font-mono text-cyan-400">{settings.sensitivity.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.6"
            max="2.6"
            step="0.1"
            value={settings.sensitivity}
            onChange={(e) => onUpdateSettings({ sensitivity: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Precise (0.6x)</span>
            <span>Fast (2.6x)</span>
          </div>
        </div>

        {/* Active Bounds Margin */}
        <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <Hand className="w-3.5 h-3.5 text-cyan-400" />
              Control Margin
            </span>
            <span className="font-mono text-cyan-400">
              {Math.round(settings.activeMarginX * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.08"
            max="0.26"
            step="0.02"
            value={settings.activeMarginX}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateSettings({ activeMarginX: val, activeMarginY: val });
            }}
            className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Wide Reach (8%)</span>
            <span>Compact (26%)</span>
          </div>
        </div>

        {/* Pinch Sensitivity */}
        <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Pinch Click Range
            </span>
            <span className="font-mono text-cyan-400">{settings.pinchThreshold.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.28"
            max="0.44"
            step="0.02"
            value={settings.pinchThreshold}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              onUpdateSettings({
                pinchThreshold: val,
                pinchReleaseThreshold: val + 0.08,
              });
            }}
            className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Close Pinch (0.28)</span>
            <span>Easy Pinch (0.44)</span>
          </div>
        </div>

        {/* Scroll Speed */}
        <div className="space-y-2 bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300 flex items-center gap-1.5">
              <MoveVertical className="w-3.5 h-3.5 text-cyan-400" />
              Scroll Speed
            </span>
            <span className="font-mono text-cyan-400">{settings.scrollSensitivity.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="4.0"
            step="0.2"
            value={settings.scrollSensitivity}
            onChange={(e) => onUpdateSettings({ scrollSensitivity: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center space-x-1.5 text-[10px] text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.invertScroll}
                onChange={(e) => onUpdateSettings({ invertScroll: e.target.checked })}
                className="rounded accent-cyan-500 text-cyan-500 bg-slate-800"
              />
              <span>Invert Direction</span>
            </label>
          </div>
        </div>
      </div>

      {/* Useful Gestures Checklist */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Active Gesture Commands
          </h3>
          <span className="text-[11px] text-slate-500">Enable or disable specific air gestures</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          {/* Pointer */}
          <label className="flex items-center space-x-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={enablePointer}
              onChange={(e) => onTogglePointer(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span className="text-slate-300">👆 Pointer Tracking</span>
          </label>

          {/* Left Click */}
          <label className="flex items-center space-x-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={enableClick}
              onChange={(e) => onToggleClick(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span className="text-slate-300">🤏 Pinch Click / Drag</span>
          </label>

          {/* Right Click */}
          <label className="flex items-center space-x-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={enableRightClick}
              onChange={(e) => onToggleRightClick(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span className="text-slate-300">⚡ Middle-Pinch Right Click</span>
          </label>

          {/* Scroll */}
          <label className="flex items-center space-x-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={enableScroll}
              onChange={(e) => onToggleScroll(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span className="text-slate-300">✌️ Two-Finger Scroll</span>
          </label>

          {/* Volume Control */}
          <label className="flex items-center space-x-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={enableVolumeGesture}
              onChange={(e) => onToggleVolumeGesture(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span className="text-slate-300">👍 / 👎 Thumbs Volume</span>
          </label>

          {/* Swipe Lateral */}
          <label className="flex items-center space-x-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={enableSwipeGesture}
              onChange={(e) => onToggleSwipeGesture(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span className="text-slate-300">👋 Swipe Alt+Tab / Slides</span>
          </label>

          {/* Two Hand Zoom */}
          <label className="flex items-center space-x-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={enableTwoHandZoom}
              onChange={(e) => onToggleTwoHandZoom(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span className="text-slate-300">🔍 Two-Hand Pinch Zoom</span>
          </label>

          {/* Fist Standby */}
          <label className="flex items-center space-x-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800/90 cursor-pointer hover:border-slate-700 transition">
            <input
              type="checkbox"
              checked={enableAutoStandby}
              onChange={(e) => onToggleAutoStandby(e.target.checked)}
              className="accent-cyan-500 rounded"
            />
            <span className="text-slate-300">✊ Closed Fist = Pause</span>
          </label>
        </div>
      </div>
    </div>
  );
};
