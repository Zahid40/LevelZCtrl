use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct ScreenSize {
    pub width: i32,
    pub height: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CursorPos {
    pub x: i32,
    pub y: i32,
}

#[tauri::command]
fn get_screen_size() -> ScreenSize {
    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SM_CXSCREEN, SM_CYSCREEN};
        let width = GetSystemMetrics(SM_CXSCREEN);
        let height = GetSystemMetrics(SM_CYSCREEN);
        ScreenSize { width, height }
    }
    #[cfg(not(windows))]
    {
        ScreenSize { width: 1920, height: 1080 }
    }
}

#[tauri::command]
fn get_cursor_position() -> CursorPos {
    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::Foundation::POINT;
        use windows_sys::Win32::UI::WindowsAndMessaging::GetCursorPos;
        let mut pt = POINT { x: 0, y: 0 };
        GetCursorPos(&mut pt);
        CursorPos { x: pt.x, y: pt.y }
    }
    #[cfg(not(windows))]
    {
        CursorPos { x: 0, y: 0 }
    }
}

#[tauri::command]
fn mouse_move_abs(x: i32, y: i32) -> Result<(), String> {
    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SetCursorPos, SM_CXSCREEN, SM_CYSCREEN};
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::{mouse_event, MOUSEEVENTF_ABSOLUTE, MOUSEEVENTF_MOVE};

        // 1. Direct hardware cursor position
        SetCursorPos(x, y);

        // 2. Hardware packet injection via mouse_event for DirectX / UWP / browser compatibility
        let w = GetSystemMetrics(SM_CXSCREEN);
        let h = GetSystemMetrics(SM_CYSCREEN);
        if w > 0 && h > 0 {
            let abs_x = ((x as i64 * 65535) / w as i64) as i32;
            let abs_y = ((y as i64 * 65535) / h as i64) as i32;
            mouse_event(MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE, abs_x, abs_y, 0, 0);
        }
        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = (x, y);
        Ok(())
    }
}

#[tauri::command]
fn mouse_move_norm(norm_x: f64, norm_y: f64) -> Result<(), String> {
    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::UI::WindowsAndMessaging::{GetSystemMetrics, SetCursorPos, SM_CXSCREEN, SM_CYSCREEN};
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::{mouse_event, MOUSEEVENTF_ABSOLUTE, MOUSEEVENTF_MOVE};

        let w = GetSystemMetrics(SM_CXSCREEN);
        let h = GetSystemMetrics(SM_CYSCREEN);
        let clamped_x = norm_x.clamp(0.0, 1.0);
        let clamped_y = norm_y.clamp(0.0, 1.0);

        let cx = (clamped_x * w as f64) as i32;
        let cy = (clamped_y * h as f64) as i32;

        // Set cursor position directly
        SetCursorPos(cx, cy);

        // Also inject raw mouse event packet (0 to 65535 normalized absolute)
        let abs_x = (clamped_x * 65535.0) as i32;
        let abs_y = (clamped_y * 65535.0) as i32;
        mouse_event(MOUSEEVENTF_MOVE | MOUSEEVENTF_ABSOLUTE, abs_x, abs_y, 0, 0);

        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = (norm_x, norm_y);
        Ok(())
    }
}

#[tauri::command]
fn mouse_move_rel(dx: i32, dy: i32) -> Result<(), String> {
    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::Foundation::POINT;
        use windows_sys::Win32::UI::WindowsAndMessaging::{GetCursorPos, SetCursorPos};
        let mut pt = POINT { x: 0, y: 0 };
        GetCursorPos(&mut pt);
        if SetCursorPos(pt.x + dx, pt.y + dy) == 0 {
            return Err("Failed to set cursor position".to_string());
        }
        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = (dx, dy);
        Ok(())
    }
}

#[tauri::command]
fn mouse_down(button: String) -> Result<(), String> {
    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
            mouse_event, MOUSEEVENTF_LEFTDOWN, MOUSEEVENTF_MIDDLEDOWN, MOUSEEVENTF_RIGHTDOWN,
        };
        let flag = match button.to_lowercase().as_str() {
            "left" => MOUSEEVENTF_LEFTDOWN,
            "right" => MOUSEEVENTF_RIGHTDOWN,
            "middle" => MOUSEEVENTF_MIDDLEDOWN,
            _ => return Err(format!("Unknown button: {}", button)),
        };
        mouse_event(flag, 0, 0, 0, 0);
        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = button;
        Ok(())
    }
}

#[tauri::command]
fn mouse_up(button: String) -> Result<(), String> {
    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
            mouse_event, MOUSEEVENTF_LEFTUP, MOUSEEVENTF_MIDDLEUP, MOUSEEVENTF_RIGHTUP,
        };
        let flag = match button.to_lowercase().as_str() {
            "left" => MOUSEEVENTF_LEFTUP,
            "right" => MOUSEEVENTF_RIGHTUP,
            "middle" => MOUSEEVENTF_MIDDLEUP,
            _ => return Err(format!("Unknown button: {}", button)),
        };
        mouse_event(flag, 0, 0, 0, 0);
        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = button;
        Ok(())
    }
}

#[tauri::command]
fn mouse_click(button: String) -> Result<(), String> {
    mouse_down(button.clone())?;
    std::thread::sleep(std::time::Duration::from_millis(15));
    mouse_up(button)?;
    Ok(())
}

#[tauri::command]
fn mouse_double_click(button: String) -> Result<(), String> {
    mouse_click(button.clone())?;
    std::thread::sleep(std::time::Duration::from_millis(40));
    mouse_click(button)?;
    Ok(())
}

#[tauri::command]
fn mouse_scroll(delta_y: i32, delta_x: i32) -> Result<(), String> {
    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
            mouse_event, MOUSEEVENTF_HWHEEL, MOUSEEVENTF_WHEEL,
        };
        if delta_y != 0 {
            // positive delta = up, negative = down
            let dw_data = (delta_y * 60) as i32;
            mouse_event(MOUSEEVENTF_WHEEL, 0, 0, dw_data, 0);
        }
        if delta_x != 0 {
            let dw_data = (delta_x * 60) as i32;
            mouse_event(MOUSEEVENTF_HWHEEL, 0, 0, dw_data, 0);
        }
        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = (delta_y, delta_x);
        Ok(())
    }
}

#[tauri::command]
fn mouse_zoom(delta: i32) -> Result<(), String> {
    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
            keybd_event, mouse_event, KEYEVENTF_KEYUP, MOUSEEVENTF_WHEEL, VK_CONTROL,
        };
        keybd_event(VK_CONTROL as u8, 0, 0, 0);
        let dw_data = (delta * 60) as i32;
        mouse_event(MOUSEEVENTF_WHEEL, 0, 0, dw_data, 0);
        keybd_event(VK_CONTROL as u8, 0, KEYEVENTF_KEYUP, 0);
        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = delta;
        Ok(())
    }
}

#[tauri::command]
fn trigger_keyboard_action(action: String) -> Result<(), String> {
    #[cfg(windows)]
    unsafe {
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::{
            keybd_event, KEYEVENTF_KEYUP, VK_DOWN, VK_ESCAPE, VK_LEFT, VK_LWIN, VK_MEDIA_NEXT_TRACK,
            VK_MEDIA_PLAY_PAUSE, VK_MEDIA_PREV_TRACK, VK_MENU, VK_RIGHT, VK_TAB, VK_UP, VK_VOLUME_DOWN,
            VK_VOLUME_MUTE, VK_VOLUME_UP,
        };

        let tap_key = |vk: u8| {
            keybd_event(vk, 0, 0, 0);
            std::thread::sleep(std::time::Duration::from_millis(10));
            keybd_event(vk, 0, KEYEVENTF_KEYUP, 0);
        };

        match action.to_lowercase().as_str() {
            "volume_up" => tap_key(VK_VOLUME_UP as u8),
            "volume_down" => tap_key(VK_VOLUME_DOWN as u8),
            "volume_mute" => tap_key(VK_VOLUME_MUTE as u8),
            "media_play_pause" => tap_key(VK_MEDIA_PLAY_PAUSE as u8),
            "media_next" => tap_key(VK_MEDIA_NEXT_TRACK as u8),
            "media_prev" => tap_key(VK_MEDIA_PREV_TRACK as u8),
            "arrow_left" | "slide_prev" => tap_key(VK_LEFT as u8),
            "arrow_right" | "slide_next" => tap_key(VK_RIGHT as u8),
            "arrow_up" => tap_key(VK_UP as u8),
            "arrow_down" => tap_key(VK_DOWN as u8),
            "escape" => tap_key(VK_ESCAPE as u8),
            "alt_tab" => {
                keybd_event(VK_MENU as u8, 0, 0, 0);
                keybd_event(VK_TAB as u8, 0, 0, 0);
                std::thread::sleep(std::time::Duration::from_millis(15));
                keybd_event(VK_TAB as u8, 0, KEYEVENTF_KEYUP, 0);
                keybd_event(VK_MENU as u8, 0, KEYEVENTF_KEYUP, 0);
            }
            "task_view" => {
                // Win + Tab
                keybd_event(VK_LWIN as u8, 0, 0, 0);
                keybd_event(VK_TAB as u8, 0, 0, 0);
                std::thread::sleep(std::time::Duration::from_millis(15));
                keybd_event(VK_TAB as u8, 0, KEYEVENTF_KEYUP, 0);
                keybd_event(VK_LWIN as u8, 0, KEYEVENTF_KEYUP, 0);
            }
            "show_desktop" => {
                // Win + D
                keybd_event(VK_LWIN as u8, 0, 0, 0);
                keybd_event(b'D', 0, 0, 0);
                std::thread::sleep(std::time::Duration::from_millis(15));
                keybd_event(b'D', 0, KEYEVENTF_KEYUP, 0);
                keybd_event(VK_LWIN as u8, 0, KEYEVENTF_KEYUP, 0);
            }
            _ => return Err(format!("Unsupported action: {}", action)),
        }
        Ok(())
    }
    #[cfg(not(windows))]
    {
        let _ = action;
        Ok(())
    }
}

#[tauri::command]
fn get_local_ip() -> Option<String> {
    use std::net::UdpSocket;
    // Connect to a public dummy address to determine outgoing network interface IP
    let socket = UdpSocket::bind("0.0.0.0:0").ok()?;
    socket.connect("8.8.8.8:80").ok()?;
    let local_addr = socket.local_addr().ok()?;
    Some(local_addr.ip().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_screen_size,
            get_cursor_position,
            mouse_move_abs,
            mouse_move_norm,
            mouse_move_rel,
            mouse_down,
            mouse_up,
            mouse_click,
            mouse_double_click,
            mouse_scroll,
            mouse_zoom,
            trigger_keyboard_action,
            get_local_ip,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
