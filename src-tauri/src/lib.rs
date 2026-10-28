// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

use crate::config::{load_config, ConfigState};
use directories::ProjectDirs;
use std::sync::Mutex;
use tauri::Manager;

mod commands;
mod config;
mod gamebanana_api;
mod types;
mod utils;
//function from https://github.com/TwintailTeam/TwintailLauncher/blob/stable/src-tauri/src/utils/gpu.rs
#[cfg(target_os = "linux")]
fn nvidia_bug_fix() {
    use wgpu::{
        BackendOptions, Backends, DeviceType, GlBackendOptions, Instance, InstanceDescriptor,
        InstanceFlags,
    };

    let instance = Instance::new(&InstanceDescriptor {
        flags: InstanceFlags::empty(),
        backends: Backends::GL | Backends::VULKAN,
        memory_budget_thresholds: Default::default(),
        backend_options: BackendOptions {
            gl: GlBackendOptions::default(),
            dx12: Default::default(),
            noop: Default::default(),
        },
    });

    for adapter in instance.enumerate_adapters(Backends::all()) {
        let info = adapter.get_info();

        match info.device_type {
            DeviceType::DiscreteGpu | DeviceType::IntegratedGpu | DeviceType::VirtualGpu => unsafe {
                if info.name.to_ascii_lowercase().contains("nvidia") {
                    std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
                    std::env::set_var("__GL_THREADED_OPTIMIZATIONS", "0");
                    std::env::set_var("__NV_DISABLE_EXPLICIT_SYNC", "1");
                    std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
                    log::info!("NVIDIA GPU detected, disabling DMABUF rendering!")
                }
            },
            _ => {}
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    {
        nvidia_bug_fix();
    }
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("logs".to_string()),
                    },
                ))
                .max_file_size(10000)
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .build(),
        )
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            log::info!("Starting app");
            if let Some(proj_dirs) = ProjectDirs::from("", "sdmm", "sdmm") {
                let config_dir = proj_dirs.config_dir().join("config.json");
                let cache_dir = proj_dirs.cache_dir();
                let config = load_config()?;
                app.manage(ConfigState {
                    config_path: config_dir,
                    cache_path: cache_dir.to_path_buf(),
                    config: Mutex::new(config),
                });
            };

            /*
            let path = home_dir()
                .ok_or("Unable to locate home directory")?
                .join(CONFIG_PATH);
            app.manage(ConfigState {
                path,
                config: Mutex::new(config),
            });*/
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_auto_detect_deadlock_path,
            commands::get_config,
            commands::change_path,
            commands::list_mods,
            commands::check_gameinfo_validity,
            commands::make_config_valid,
            commands::change_mod_name,
            commands::apply_changes,
            commands::copy_mod_to_game,
            commands::delete_mod,
            commands::process_compressed_file,
            commands::download_mod_command,
            commands::set_config,
            commands::get_presets_names,
            commands::create_preset,
            commands::change_preset_name,
            commands::apply_preset,
            commands::delete_preset,
            commands::get_fov
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
