use crate::config::ModManagerConfigV1;
use crate::types::{ModName, Mods};
use regex::Regex;
use std::path::{Path, PathBuf};
use std::sync::MutexGuard;

pub fn update_config_mod_name(
    config: &mut MutexGuard<ModManagerConfigV1>,
    mod_name: &ModName,
    new_name: String,
) {
    if config.mod_names.remove(&mod_name.file_name).is_some() {
        if mod_name.file_name == mod_name.user_name {
            config.mod_names.insert(new_name.clone(), new_name);
        } else {
            config
                .mod_names
                .insert(new_name, mod_name.user_name.clone());
        }
    }
}

//basic way to check if the path is valid
pub fn is_deadlock_path_valid(deadlock_path: &String) -> bool {
    let gameinfo_path = PathBuf::from(deadlock_path)
        .join("game")
        .join("citadel")
        .join("gameinfo.gi");
    if !gameinfo_path.exists() {
        log::warn!("Deadlock path is not valid at {}", gameinfo_path.display());
        false
    } else {
        true
    }
}

/// Returns a list of Mods (see types.rs)
/// Mods that match the VALID_MOD_REGEX (see commands.rs) get put in the loaded_mods array
pub fn process_mod_directory(
    mod_path: &Path,
    config: &mut ModManagerConfigV1,
) -> Result<Mods, String> {
    let regex = Regex::new(crate::commands::VALID_MOD_REGEX).unwrap();
    let mut result = Mods::default();

    if mod_path.is_dir() {
        for entry in std::fs::read_dir(mod_path).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            if entry.file_type().map_err(|e| e.to_string())?.is_file() {
                let file_name = entry.file_name().to_string_lossy().into_owned();

                // If the user has specified a name then load that
                let user_name = if let Some(existing_user_name) = config.mod_names.get(&file_name) {
                    existing_user_name.clone()
                } else {
                    // otherwise set the user name the same as the file name
                    config
                        .mod_names
                        .insert(file_name.clone(), file_name.clone());
                    file_name.clone()
                };

                let mod_name = ModName {
                    user_name,
                    file_name: file_name.clone(),
                };

                if regex.is_match(&file_name) {
                    result.loaded_mods.push(mod_name);
                } else if entry.path().extension().map_or(false, |ext| ext == "vpk") {
                    result.unloaded_mods.push(mod_name);
                }
            }
        }
    }
    Ok(result)
}

pub fn list_vpk_files(path: PathBuf, result: &mut Vec<String>) -> Result<(), String> {
    if path.is_dir() {
        for entry in std::fs::read_dir(path).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_dir() {
                list_vpk_files(path, result)?;
            } else {
                if path.extension().map_or(false, |ext| ext == "vpk") {
                    result.push(path.to_string_lossy().into_owned());
                }
            }
        }
    };
    Ok(())
}
