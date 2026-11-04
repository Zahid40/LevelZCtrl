# LevelZ AirTouch 🖐️✨
> **Advanced Touchless Hand-Gesture PC Control System for Windows (built with Tauri v2, MediaPipe & Rust)**  
> Inspired by [AirTouch](https://www.air-touch.ir/) — turn any standard laptop webcam into a touchless, high-precision air controller with zero hardware required.

---

## 🚀 Features

- **⚡ 100% Offline AI Vision Engine**: Runs Google MediaPipe Hand Landmarker via WASM/WebGL directly on the device with zero cloud latency.
- **🎯 1€ (One Euro) Motion Smoothing Filter**: Dual-adaptive filtering eliminates natural hand tremors and jitter when hovering, while offering instantaneous tracking response when moving fast.
- **🤏 Precision Gesture Detection**:
  - **Move Pointer**: Extend index finger `👆` naturally inside the camera frame.
  - **Left Click**: Quick pinch between Thumb & Index finger `🤏` (<200ms).
  - **Drag & Drop**: Pinch & hold Thumb + Index finger `✊` (>200ms) to grab and move windows/sliders.
  - **Right Click**: Pinch Thumb & Middle finger `⚡` to open context menus.
  - **Two-Finger Smooth Scroll**: Show peace sign `✌️` (Index + Middle extended) and move hand up/down.
  - **Auto-Standby / Rest Mode**: Make a closed fist `✊` to pause tracking and rest your hand. Show open palm `✋` to resume.
- **🖥️ Sub-Millisecond Win32 Native Injection**: Uses Windows kernel API (`SetCursorPos`, `mouse_event`, `keybd_event`) for instant, lag-free hardware simulation.
- **📱 Mobile Hub & Remote Extension**: Open the app's local network URL from your smartphone (Safari/Chrome on the same Wi-Fi) to use your phone's 4K/60fps camera or use the phone as a wireless air-mouse!
- **🧪 Interactive Sandbox**: Test clicks, drags, scrolling, and PC macro shortcuts (Volume up/down, Task View, Desktop) directly inside the app.
- **⌨️ Global Hotkeys**: Press `Spacebar` anytime to quickly toggle touchless tracking On or Off.

---

## 🛠️ Project Structure

```
LevelZCtrl/
├── src-tauri/               # Rust Native Backend
│   ├── src/
│   │   ├── main.rs          # Windows subsystem entrypoint
│   │   └── lib.rs           # Tauri IPC commands & Win32 input simulator
│   ├── Cargo.toml           # Rust dependencies (tauri v2, windows-sys)
│   └── tauri.conf.json      # Window styling, permissions, and app config
├── src/                     # React + TypeScript Frontend
│   ├── components/
│   │   ├── CameraOverlay.tsx    # Live camera feed, mirrored canvas, skeleton HUD
│   │   ├── SettingsPanel.tsx    # Smoothing presets, sensitivity & active margins
│   │   ├── TestSandbox.tsx      # In-app interactive testing sandbox & macro buttons
│   │   ├── GestureGuideModal.tsx# Visual cheat-sheet for all gestures
│   │   └── MobileHubModal.tsx   # Phone Wi-Fi pairing and remote control guide
│   ├── utils/
│   │   ├── oneEuroFilter.ts     # 1€ Filter (One Euro Filter) math & smoothing
│   │   ├── gestureDetector.ts   # 21-joint 3D vector geometry & gesture state machine
│   │   ├── handTracker.ts       # MediaPipe Tasks-Vision WASM pipeline
│   │   └── tauriBridge.ts       # Tauri IPC wrapper with browser fallback
│   ├── App.tsx              # Main dashboard
│   └── main.tsx             # React DOM root
└── public/
    ├── models/
    │   └── hand_landmarker.task # Offline MediaPipe model bundle
    └── mediapipe/wasm/      # Offline WASM binaries
```

---

## 🏁 Quick Start

### 1. Prerequisites
- **Node.js** (v18+)
- **Rust & Cargo** (v1.75+)
- A standard laptop webcam or USB webcam

### 2. Run in Development Mode
To launch the desktop app with live reload:
```bash
npm run tauri dev
```

### 3. Build Production Executable
To produce an optimized `.exe` installer or standalone binary:
```bash
npm run tauri build
```
The compiled executable will be located in:
`src-tauri/target/release/levelz-ctrl.exe`

---

## 🎮 Gestures Quick Reference

| Gesture | Hand Pose | Windows Action |
| :--- | :--- | :--- |
| **Move Pointer** | Point index finger `👆` | Smooth cursor navigation |
| **Left Click** | Pinch Index + Thumb `🤏` | Single click |
| **Drag & Drop** | Pinch & hold `✊` (&gt;200ms) | Grab & Drag |
| **Right Click** | Pinch Middle + Thumb `⚡` | Context menu |
| **Scroll** | Two fingers up `✌️` | Scroll page up/down |
| **Pause Tracking**| Closed Fist `✊` | Disengage cursor (rest hand) |
| **Resume Tracking**| Open Palm `✋` | Re-engage cursor smoothly |

---

## 📱 Mobile Integration (Phone as Camera or Remote Trackpad)
1. Keep the PC app running on your laptop.
2. Note your laptop's local IP displayed in the **Mobile Connect** tab (e.g. `http://192.168.1.50:1420`).
3. Connect your phone to the same Wi-Fi and open the URL in your phone's browser.
4. You can use your phone's rear camera as an ultra-high definition, 60fps tracking camera or use the phone screen as a wireless trackpad!


---

## 🤝 Contributing & Community

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/Zahid40/LevelZCtrl/issues) if you want to contribute.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'feat: add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.
