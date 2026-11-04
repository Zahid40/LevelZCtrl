import React, { useState } from "react";
import {
  Volume2,
  Volume1,
  VolumeX,
  Monitor,
  CheckCircle,
  Sparkles,
  ZoomIn,
  ZoomOut,
  AppWindow,
} from "lucide-react";
import { TauriBridge } from "../utils/tauriBridge";

export const TestSandbox: React.FC = () => {
  const [clickCount, setClickCount] = useState(0);
  const [rightClickCount, setRightClickCount] = useState(0);
  const [dragProgress, setDragProgress] = useState(50);
  const [lastAction, setLastAction] = useState<string>("None");

  const handleAction = async (actionName: string, actionKey: string) => {
    setLastAction(actionName);
    await TauriBridge.triggerAction(actionKey);
  };

  const handleZoom = async (delta: number, name: string) => {
    setLastAction(name);
    await TauriBridge.mouseZoom(delta);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
            Gesture Testing & System Deck
          </h3>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-800/60">
          Last: {lastAction}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Test 1: Click & Pinch Verification */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300">1. Click & Pinch Test</h4>
            <span className="text-[10px] font-mono text-slate-500">🤏 Index / Middle</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setClickCount((c) => c + 1);
                setLastAction("Left Click");
              }}
              className="flex-1 py-2 px-2.5 bg-cyan-950/60 hover:bg-cyan-900/80 active:bg-cyan-700 border border-cyan-700/80 rounded-lg text-xs font-medium text-cyan-200 transition"
            >
              Left: {clickCount}
            </button>
            <button
              onContextMenu={(e) => {
                e.preventDefault();
                setRightClickCount((c) => c + 1);
                setLastAction("Right Click");
              }}
              className="flex-1 py-2 px-2.5 bg-purple-950/60 hover:bg-purple-900/80 active:bg-purple-700 border border-purple-700/80 rounded-lg text-xs font-medium text-purple-200 transition"
            >
              Right: {rightClickCount}
            </button>
          </div>
          {(clickCount > 0 || rightClickCount > 0) && (
            <div className="flex items-center space-x-1.5 text-[10px] text-emerald-400">
              <CheckCircle className="w-3 h-3" />
              <span>Clicks registered successfully!</span>
            </div>
          )}
        </div>

        {/* Test 2: Drag & Hold Slider */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300">2. Pinch & Hold (Drag)</h4>
            <span className="text-[10px] font-mono text-slate-500">✊ Hold &gt;220ms</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={dragProgress}
            onChange={(e) => {
              setDragProgress(parseInt(e.target.value));
              setLastAction("Dragging Slider");
            }}
            className="w-full accent-cyan-400 bg-slate-800 h-2 rounded cursor-pointer"
          />
          <div className="text-center font-mono text-[11px] text-cyan-300">
            Slider Value: {dragProgress}%
          </div>
        </div>

        {/* Test 3: Scrollable Feed */}
        <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-300">3. Two-Finger Scroll</h4>
            <span className="text-[10px] font-mono text-slate-500">✌️ Peace Sign</span>
          </div>
          <div className="h-16 overflow-y-auto space-y-1 pr-1 border border-slate-800 rounded p-1 bg-slate-900/60 text-[10px]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 flex justify-between"
              >
                <span>Document Row #{i + 1}</span>
                <span className="text-slate-500 font-mono">↕ scroll</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Useful System Controls */}
      <div className="pt-1">
        <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Quick PC Shortcuts (Air Macro Triggers)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          {/* Vol Up */}
          <button
            onClick={() => handleAction("Volume Up", "volume_up")}
            className="flex items-center justify-center space-x-1.5 py-2 px-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-cyan-400 transition"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Vol +</span>
          </button>

          {/* Vol Down */}
          <button
            onClick={() => handleAction("Volume Down", "volume_down")}
            className="flex items-center justify-center space-x-1.5 py-2 px-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-cyan-400 transition"
          >
            <Volume1 className="w-3.5 h-3.5" />
            <span>Vol -</span>
          </button>

          {/* Mute */}
          <button
            onClick={() => handleAction("Mute Volume", "volume_mute")}
            className="flex items-center justify-center space-x-1.5 py-2 px-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-cyan-400 transition"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>Mute</span>
          </button>

          {/* Zoom In */}
          <button
            onClick={() => handleZoom(1, "Zoom In")}
            className="flex items-center justify-center space-x-1.5 py-2 px-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-cyan-400 transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>Zoom +</span>
          </button>

          {/* Zoom Out */}
          <button
            onClick={() => handleZoom(-1, "Zoom Out")}
            className="flex items-center justify-center space-x-1.5 py-2 px-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-cyan-400 transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
            <span>Zoom -</span>
          </button>

          {/* Alt+Tab App Switcher */}
          <button
            onClick={() => handleAction("Switch App (Alt+Tab)", "alt_tab")}
            className="flex items-center justify-center space-x-1.5 py-2 px-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-cyan-400 transition"
          >
            <AppWindow className="w-3.5 h-3.5" />
            <span>Alt+Tab</span>
          </button>

          {/* Show Desktop */}
          <button
            onClick={() => handleAction("Show Desktop", "show_desktop")}
            className="flex items-center justify-center space-x-1.5 py-2 px-2.5 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 hover:text-cyan-400 transition"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop</span>
          </button>
        </div>
      </div>
    </div>
  );
};
