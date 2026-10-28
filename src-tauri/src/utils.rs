use crate::config::{ModManagerConfigV2};
use crate::types::{DeadlockMod, ModOperation, Mods};
use regex::Regex;
use std::path::{Path, PathBuf};
use std::sync::MutexGuard;
use uuid::Uuid;

/// Updates the file name in the config when it is changed (load/unload)
pub fn update_config_mod_file_name(
    config: &mut MutexGuard<ModManagerConfigV2>,
    mod_name: &DeadlockMod,
    new_name: String,
    operation: ModOperation
) {
    /*if config.mod_names.remove(&mod_name.file_name).is_some() {
        if mod_name.file_name == mod_name.user_name {
            config.mod_names.insert(new_name.clone(), new_name);
        } else {
            config
                .mod_names
                .insert(new_name, mod_name.user_name.clone());
        }
    }*/

    if let Some(index) = config.mods.iter().position(|x| x.file_name == mod_name.file_name) {
        config.mods[index].file_name = new_name;
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
    config: &mut ModManagerConfigV2,
) -> Result<Mods, String> {
    let mut result = Mods::default();

    if mod_path.is_dir() {
        for entry in std::fs::read_dir(mod_path).map_err(|e| e.to_string())? { //read dir
            let entry = entry.map_err(|e| e.to_string())?;
            if entry.file_type().map_err(|e| e.to_string())?.is_file() { //we only care if it is a file
                let file_name = entry.file_name().to_string_lossy().into_owned();

                // If the user has specified a name then load that
                // If we already have the mod in the config load the id
                let existing_data = if let Some(existing_mod) = config.mods.iter().find(|m| m.file_name == file_name) {
                    (existing_mod.user_name.clone(), existing_mod.id.clone())
                } else { //otherwise default the username to the filename
                    let id = generate_uuid();
                    config.mods.push(DeadlockMod {
                        file_name: file_name.clone(),
                        user_name: file_name.clone(),
                        id: id.clone(),
                    });

                    (file_name.clone(), id)
                };

                let mod_name = DeadlockMod {
                    user_name: existing_data.0,
                    file_name: file_name.clone(),
                    id: existing_data.1,
                };

                if is_mod_loaded(&file_name) {
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

pub(crate) const VALID_MOD_REGEX: &str = r"^pak\d\d_dir\.vpk";

pub fn is_mod_loaded(mod_file_name: &str) -> bool {
    let regex = Regex::new(VALID_MOD_REGEX).unwrap();
    regex.is_match(mod_file_name)
}

pub fn generate_uuid() -> String {
    Uuid::new_v4().to_string()
}

pub fn aspect_ratio_to_fov(aspect_ratio: f32) -> i32 {
    (27.1463 * aspect_ratio + 31.9058) as i32
}

pub fn fov_to_aspect_ratio(fov: i32) -> f32 {
    (fov as f32 - 31.9058) / 27.1463
}