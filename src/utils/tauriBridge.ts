import { invoke } from "@tauri-apps/api/core";

export interface ScreenSize {
  width: number;
  height: number;
}

export interface CursorPos {
  x: number;
  y: number;
}

const isTauri = (): boolean => {
  return typeof window !== "undefined" && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
};

export const TauriBridge = {
  isTauriEnvironment(): boolean {
    return isTauri();
  },

  async getScreenSize(): Promise<ScreenSize> {
    if (!isTauri()) {
      return { width: window.screen.width || 1920, height: window.screen.height || 1080 };
    }
    try {
      return await invoke<ScreenSize>("get_screen_size");
    } catch (e) {
      console.warn("Failed to get_screen_size from Tauri:", e);
      return { width: window.screen.width || 1920, height: window.screen.height || 1080 };
    }
  },

  async getCursorPosition(): Promise<CursorPos> {
    if (!isTauri()) {
      return { x: 0, y: 0 };
    }
    try {
      return await invoke<CursorPos>("get_cursor_position");
    } catch {
      return { x: 0, y: 0 };
    }
  },

  async mouseMoveAbs(x: number, y: number): Promise<void> {
    if (!isTauri()) return;
    try {
      await invoke("mouse_move_abs", { x: Math.round(x), y: Math.round(y) });
    } catch (e) {
      console.error("mouse_move_abs error:", e);
    }
  },

  async mouseMoveNorm(normX: number, normY: number): Promise<void> {
    if (!isTauri()) return;
    try {
      await invoke("mouse_move_norm", { normX, normY });
    } catch {
      try {
        const screen = await this.getScreenSize();
        const x = Math.round(normX * screen.width);
        const y = Math.round(normY * screen.height);
        await invoke("mouse_move_abs", { x, y });
      } catch (err2) {
        console.error("mouseMove error:", err2);
      }
    }
  },

  async mouseMoveRel(dx: number, dy: number): Promise<void> {
    if (!isTauri()) return;
    try {
      await invoke("mouse_move_rel", { dx: Math.round(dx), dy: Math.round(dy) });
    } catch (e) {
      console.error("mouse_move_rel error:", e);
    }
  },

  async mouseDown(button: "left" | "right" | "middle" = "left"): Promise<void> {
    if (!isTauri()) {
      console.log(`[Mock] Mouse Down: ${button}`);
      return;
    }
    try {
      await invoke("mouse_down", { button });
    } catch (e) {
      console.error("mouse_down error:", e);
    }
  },

  async mouseUp(button: "left" | "right" | "middle" = "left"): Promise<void> {
    if (!isTauri()) {
      console.log(`[Mock] Mouse Up: ${button}`);
      return;
    }
    try {
      await invoke("mouse_up", { button });
    } catch (e) {
      console.error("mouse_up error:", e);
    }
  },

  async mouseClick(button: "left" | "right" | "middle" = "left"): Promise<void> {
    if (!isTauri()) {
      console.log(`[Mock] Mouse Click: ${button}`);
      return;
    }
    try {
      await invoke("mouse_click", { button });
    } catch (e) {
      console.error("mouse_click error:", e);
    }
  },

  async mouseDoubleClick(button: "left" | "right" | "middle" = "left"): Promise<void> {
    if (!isTauri()) {
      console.log(`[Mock] Mouse Double Click: ${button}`);
      return;
    }
    try {
      await invoke("mouse_double_click", { button });
    } catch (e) {
      console.error("mouse_double_click error:", e);
    }
  },

  async mouseScroll(deltaY: number, deltaX: number = 0): Promise<void> {
    if (!isTauri()) {
      console.log(`[Mock] Mouse Scroll: y=${deltaY}, x=${deltaX}`);
      return;
    }
    try {
      await invoke("mouse_scroll", { deltaY: Math.round(deltaY), deltaX: Math.round(deltaX) });
    } catch (e) {
      console.error("mouse_scroll error:", e);
    }
  },

  async mouseZoom(delta: number): Promise<void> {
    if (!isTauri()) {
      console.log(`[Mock] Mouse Zoom: delta=${delta}`);
      return;
    }
    try {
      await invoke("mouse_zoom", { delta: Math.round(delta) });
    } catch (e) {
      console.error("mouse_zoom error:", e);
    }
  },

  async triggerAction(action: string): Promise<void> {
    if (!isTauri()) {
      console.log(`[Mock] Action triggered: ${action}`);
      return;
    }
    try {
      await invoke("trigger_keyboard_action", { action });
    } catch (e) {
      console.error("trigger_keyboard_action error:", e);
    }
  },

  async getLocalIp(): Promise<string | null> {
    if (!isTauri()) return "localhost";
    try {
      return await invoke<string | null>("get_local_ip");
    } catch {
      return null;
    }
  },
};

