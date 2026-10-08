use crate::utils::is_mod_loaded;
use directories::ProjectDirs;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
/*
todo: could link each mod to a gamebanana link to check for updates
another hashmap with <file name, gamebanana link>
if the mod is not linked the value should be ""
 */
#[derive(Default, Deserialize, Serialize, Clone)]
pub struct ModManagerConfigV1 {
    #[serde(default = "v1_version_default")]
    pub version: String,
    pub deadlock_path: String,
    pub mod_names: HashMap<String, String>,
}

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct ModManagerConfigV2 {
    #[serde(default = "v2_version_default")]
    pub version: String,
    pub deadlock_path: String,
    pub mods: Vec<Mod>,
    pub presets: Vec<Preset>,
}

#[derive(Clone, Default, Deserialize, Serialize)]
pub struct Mod {
    pub file_name: String,
    pub user_name: String,
    pub id: String,
    pub is_loaded: bool,
}



#[derive(Clone, Default, Deserialize, Serialize)]
pub struct Preset {
    pub preset_name: String,
    pub mods: Vec<Mod>,
}

fn v1_version_default() -> String {
    "1".to_string()
}
fn v2_version_default() -> String {
    "2".to_string()
}

pub struct ConfigState {
    pub config_path: PathBuf,
    pub cache_path: PathBuf,
    pub config: Mutex<ModManagerConfigV2>,
}

pub fn save_config(
    config_state: &ConfigState,
) -> Result<ModManagerConfigV2, Box<dyn std::error::Error>> {
    let config = config_state.config.lock().map_err(|_| {
        log::error!("Config lock is poisoned.");
        "couldn't acquire config lock"
    })?;
    if let Some(parent) = config_state.config_path.parent() {
        std::fs::create_dir_all(parent).map_err(|_| {
            log::error!("Could not create parent directory for config path");
            "Could not create parent directory for config path"
        })?;
    }
    let json = serde_json::to_string_pretty(&*config).map_err(|_| {
        log::error!("Could not serialize config");
        "Could not serialize config"
    })?;
    std::fs::write(&config_state.config_path, json).map_err(|_| {
        log::error!("Could not write config file");
        "Could not write config file"
    })?;
    Ok(config.clone())
}

pub fn load_config() -> Result<ModManagerConfigV2, Box<dyn std::error::Error>> {
    let mut config_path = PathBuf::new();
    let mut cache_path = PathBuf::new();
    if let Some(proj_dirs) = ProjectDirs::from("", "sdmm", "sdmm") {
        config_path = proj_dirs.config_dir().to_path_buf().join("config.json");
        std::fs::create_dir_all(proj_dirs.config_dir().to_path_buf()).map_err(|_| {
            log::error!(
                "Could not create config dir {}",
                proj_dirs.config_dir().to_path_buf().display()
            );
            "Could not create config dir"
        })?;
        log::info!(
            "{}",
            format!("Config located at {:?}", config_path.to_string_lossy())
        );
        cache_path = proj_dirs.cache_dir().to_path_buf();
        log::info!(
            "{}",
            format!("Cache dir located at {:?}", cache_path.to_string_lossy())
        );
        if cache_path.exists() {
            std::fs::remove_dir_all(&cache_path).map_err(|_| {
                log::error!("Could not remove cache dir");
                "Could not remove cache dir"
            })?;
        }
        std::fs::create_dir_all(&cache_path).map_err(|_| {
            log::error!("Could not create cache dir");
            "Could not create cache dir"
        })?;
    }
    if !config_path.exists() {
        log::warn!("Config does not exist, creating default config");
        let default_config = ModManagerConfigV2::default();
        save_config(&ConfigState {
            config_path,
            cache_path,
            config: Mutex::new(default_config.clone()),
        })?;
        return Ok(default_config);
    }
    let contents = std::fs::read_to_string(&config_path).map_err(|_| {
        log::error!("Could not read config file");
        "Could not read config file"
    })?;

    match serde_json::from_str::<ModManagerConfigV1>(&contents) {
        Ok(config_V1) => {
            //upgrade to v2
            let mut result: Vec<Mod> = Vec::default();
            log::warn!("Updating config to V2");
            config_V1.mod_names.iter().for_each(|mod_name| {
                let is_loaded = is_mod_loaded(mod_name.clone().0);
                result.push(Mod {
                    file_name: mod_name.0.to_string(),
                    user_name: mod_name.1.to_string(),
                    is_loaded,
                    id: "".to_string(),
                })
            });
            let config = ModManagerConfigV2 {
                mods: result,
                presets: Vec::default(),
                version: "2".to_string(),
                deadlock_path: "".to_string(),
            };
            save_config(&ConfigState {
                config_path,
                cache_path,
                config: Mutex::new(config.clone()),
            })?;
            return Ok(config);
        }
        Err(_) => {
            //probably means the config is v2
        }
    }
    let config = serde_json::from_str::<ModManagerConfigV2>(&contents).map_err(|_| {
        log::error!("Could not parse config file");
        "Could not parse config file"
    })?;
    Ok(config)
}
/*let config = serde_json::from_str::<ModManagerConfigV1>(&contents).map_err(|_| {
log::error!("Could not parse config file");
"Could not parse config file"
})?;*/
