import React, { useState, useEffect } from "react";
import { Smartphone, Wifi, Copy, Check, X, QrCode, Sparkles } from "lucide-react";
import { TauriBridge } from "../utils/tauriBridge";

interface MobileHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileHubModal: React.FC<MobileHubModalProps> = ({ isOpen, onClose }) => {
  const [localIp, setLocalIp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      TauriBridge.getLocalIp().then((ip) => {
        setLocalIp(ip || "192.168.1.x");
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const mobileUrl = `http://${localIp || "localhost"}:1420`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
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
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Mobile Control & Wireless Extension
            </h3>
            <p className="text-xs text-slate-400">
              Control this PC wirelessly from your smartphone or use phone camera
            </p>
          </div>
        </div>

        {/* Local Network URL Card */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              Local Network Address (Same Wi-Fi)
            </span>
            <span className="font-mono text-cyan-400 text-[11px]">Port 1420</span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={mobileUrl}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 select-all"
            />
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white text-xs font-medium rounded-lg transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* 2 Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1.5">
            <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Phone as Ultra HD Webcam
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Use your phone's 4K 60fps camera for supreme gesture tracking fidelity and low-light capability.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80 space-y-1.5">
            <div className="font-semibold text-purple-300 flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              Wireless Air Mouse
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Use your smartphone touch screen as a trackpad, presenter clicker, and volume knob from across the room.
            </p>
          </div>
        </div>

        {/* Quick Instructions */}
        <div className="text-[11px] text-slate-400 bg-slate-950/30 p-3 rounded-lg border border-slate-800/50 space-y-1">
          <div className="font-medium text-slate-300">How to connect:</div>
          <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
            <li>Ensure both your laptop and phone are connected to the same Wi-Fi.</li>
            <li>Open Safari / Chrome on your phone and enter the URL above.</li>
            <li>Grant camera permissions when prompted.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

