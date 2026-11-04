import React from "react";
import {
  X,
  HelpCircle,
  MousePointer,
  Hand,
  MoveVertical,
  Volume2,
  ZoomIn,
  Pause,
  Play,
  AppWindow,
} from "lucide-react";

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const gestures = [
    {
      title: "Move Cursor",
      pose: "👆 Point Index Finger",
      description: "Dominant hand: Extend index finger naturally. Adaptive 1€ filter eliminates tremors when hovering.",
      icon: <MousePointer className="w-5 h-5 text-cyan-400" />,
      color: "border-cyan-800/60 bg-cyan-950/30",
    },
    {
      title: "Left Click",
      pose: "🤏 Pinch Index + Thumb",
      description: "Quickly pinch index and thumb together. Automatic click-lock freezes the cursor to prevent twitches.",
      icon: <Hand className="w-5 h-5 text-emerald-400" />,
      color: "border-emerald-800/60 bg-emerald-950/30",
    },
    {
      title: "Drag & Drop",
      pose: "✊ Pinch & Hold (>220ms)",
      description: "Pinch index and thumb and hold. Windows/sliders are grabbed. Release pinch to drop.",
      icon: <Hand className="w-5 h-5 text-amber-400" />,
      color: "border-amber-800/60 bg-amber-950/30",
    },
    {
      title: "Right Click",
      pose: "⚡ Pinch Middle + Thumb",
      description: "Pinch middle fingertip and thumb tip together to open context menus.",
      icon: <Hand className="w-5 h-5 text-purple-400" />,
      color: "border-purple-800/60 bg-purple-950/30",
    },
    {
      title: "Two-Finger Scroll",
      pose: "✌️ Peace Sign Up/Down",
      description: "Either hand: Extend index + middle fingers. Move hand up/down for buttery smooth scrolling.",
      icon: <MoveVertical className="w-5 h-5 text-blue-400" />,
      color: "border-blue-800/60 bg-blue-950/30",
    },
    {
      title: "Volume Up / Down",
      pose: "👍 Thumbs Up / 👎 Down",
      description: "Curl fingers with thumb extended up to raise volume, or down to lower volume.",
      icon: <Volume2 className="w-5 h-5 text-amber-400" />,
      color: "border-amber-800/60 bg-amber-950/30",
    },
    {
      title: "Two-Hand Zoom",
      pose: "🔍 Two Hands Spread / Pinch",
      description: "Pinch both hands in air. Spread hands apart to zoom in (Ctrl+Wheel), bring together to zoom out.",
      icon: <ZoomIn className="w-5 h-5 text-emerald-400" />,
      color: "border-emerald-800/60 bg-emerald-950/30",
    },
    {
      title: "App Switcher / Slide",
      pose: "👋 Lateral Hand Swipe",
      description: "Flick hand quickly left or right to switch apps (Alt+Tab) or navigate presentation slides.",
      icon: <AppWindow className="w-5 h-5 text-indigo-400" />,
      color: "border-indigo-800/60 bg-indigo-950/30",
    },
    {
      title: "Instant Rest / Sleep",
      pose: "✊ Closed Fist",
      description: "Fold fingers into a fist to immediately pause tracking and rest your arm or use keyboard.",
      icon: <Pause className="w-5 h-5 text-rose-400" />,
      color: "border-rose-800/60 bg-rose-950/30",
    },
    {
      title: "Resume Tracking",
      pose: "✋ Open Palm",
      description: "Show open palm face-forward to smoothly re-engage tracking without jarring cursor leaps.",
      icon: <Play className="w-5 h-5 text-teal-400" />,
      color: "border-teal-800/60 bg-teal-950/30",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-800 text-cyan-400">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              LevelZ AirTouch Gesture Command Library
            </h3>
            <p className="text-xs text-slate-400">
              Complete reference for single-hand, dual-hand, and system air gestures
            </p>
          </div>
        </div>

        {/* Gestures Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {gestures.map((g, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border ${g.color} space-y-1 transition hover:scale-[1.01]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">{g.title}</span>
                {g.icon}
              </div>
              <div className="text-xs font-mono font-medium text-cyan-300">{g.pose}</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{g.description}</p>
            </div>
          ))}
        </div>

        {/* Bottom Banner */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
          <span>
            💡 <strong>Quick Hotkey:</strong> Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-cyan-300">Spacebar</kbd> anytime to toggle tracking On/Off.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-medium rounded-lg transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
