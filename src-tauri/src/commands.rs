use crate::config::{save_config, ConfigState, ModManagerConfigV1};
use crate::gamebanana_api::api::{download_mod, get_mod_files};
use crate::gamebanana_api::types::FileEntry;
use crate::types::{CompressedFileType, ModName, Mods, Operation};
use crate::utils::{
    is_deadlock_path_valid, list_vpk_files, process_mod_directory, update_config_mod_name,
};
use rand::RngExt;
use regex::bytes::Regex;
use serde::Serialize;
use std::fs::DirEntry;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter, State};
use unrar::Archive;
use url::Url;

const DEADLOCK_APP_ID: u32 = 1422450;

//From https://deadlocker.net/install-guide
const FILESYSTEM_BLOCK_CONTENTS: &str = r#"FileSystem
{
	//
    // The code that loads this file automatically does a few things here:
    //
    // 1. For each "Game" search path, it adds a "GameBin" path, in <dir>\bin
    // 2. For each "Game" search path, it adds another "Game" path in front of it with _<language> at the end.
    //    For example: c:\hl2\cstrike on a french machine would get a c:\hl2\cstrike_french path added to it.
    // 3. If no "Mod" key, for the first "Game" search path, it adds a search path called "MOD".
    // 4. If no "Write" key, for the first "Game" search path, it adds a search path called "DEFAULT_WRITE_PATH".
    //

    //
    // Search paths are relative to the exe directory\..\
    //
    SearchPaths
    {
        // These are optional language paths. They must be mounted first, which is why there are first in the list.
        // *LANGUAGE* will be replaced with the actual language name. If not running a specific language, these paths will not be mounted
        // These currently hold localized images containing text, so they need to follow the UI language, not the audio language.
        // When we ship localized VO, it should go in a separate Game_AudioLanguage path (e.g. citadel_vo_*LANGUAGE*)
        Game_UILanguage "citadel_*LANGUAGE*"

        // These are optional low-violence paths. They will only get mounted if you're in a low-violence mode.
        //Game                citadel/cvar_unlocker
        Game_Language "citadel_*LANGUAGE*"
        Game          "citadel/addons"

        Mod   "citadel"
        Write "citadel"
        Game  "citadel"
        Mod   "core"
        Write "core"
        Game  "core"
    }

    UserSettingsPathID       "USRLOCAL"
    LegacyUserSettingsPathID "MOD"
}"#;

pub(crate) const VALID_MOD_REGEX: &str = r"^pak\d\d_dir\.vpk";

/// Get the path to the Deadlock game installation directory
#[tauri::command]
pub fn get_auto_detect_deadlock_path() -> Result<String, String> {
    let steam_dir = steamlocate::SteamDir::locate().map_err(|_| {
        log::warn!("Could not locate steam directory");
        "Could not locate steam directory".to_string()
    })?;
    log::info!("{}", format!("Found steam directory at {:?}", steam_dir));
    match steam_dir.find_app(DEADLOCK_APP_ID) {
        Ok(Some((deadlock, library))) => {
            let app_dir = library.resolve_app_dir(&deadlock);
            log::info!("Found deadlock directory at {:?}", app_dir);
            Ok(app_dir.to_string_lossy().into_owned())
        }
        Ok(None) => {
            log::warn!("Deadlock not found");
            Err("Deadlock not found".to_string())
        }
        Err(e) => {
            log::error!("Failed to find Deadlock");
            Err(format!("Failed to find Steam app: {}", e))
        }
    }
}

#[tauri::command]
pub fn get_config(state: State<ConfigState>) -> Result<ModManagerConfigV1, String> {
    Ok(state.config.lock().map_err(|e| e.to_string())?.clone())
}

#[tauri::command]
pub fn change_path(path: String, state: State<ConfigState>) -> Result<String, String> {
    {
        let mut config = state.config.lock().map_err(|e| e.to_string())?;
        log::info!("Changed deadlock path to: {}", path);
        config.deadlock_path = path.clone();
    }
    save_config(&state).map_err(|e| e.to_string())?;
    Ok(path)
}

#[tauri::command]
pub fn list_mods(state: State<ConfigState>) -> Result<Mods, String> {
    let result: Mods;
    {
        let mut config = state.config.lock().map_err(|e| e.to_string())?;
        if !is_deadlock_path_valid(&config.deadlock_path) {
            return Err("Deadlock path is not valid".to_string());
        }
        if config.deadlock_path.is_empty() {
            return Err("Deadlock path not set".to_string());
        }

        let mod_path = PathBuf::from(config.deadlock_path.clone())
            .join("game")
            .join("citadel")
            .join("addons");
        std::fs::create_dir_all(&mod_path).map_err(|e| e.to_string())?;

        let mods = process_mod_directory(&mod_path, &mut config)?;
        // this removes mods which have been deleted from the config
        for file_name in config.mod_names.clone().keys().clone() {
            let mut present = false;
            if mods.unloaded_mods.contains(&ModName {
                file_name: file_name.clone(),
                user_name: "".to_string(),
            }) {
                present = true
            }
            if mods.loaded_mods.contains(&ModName {
                file_name: file_name.clone(),
                user_name: "".to_string(),
            }) {
                present = true
            }
            if !present {
                config.mod_names.remove(file_name);
            }
        }
        result = mods;
    }
    save_config(&state).map_err(|e| e.to_string())?;
    Ok(result)
}

#[tauri::command]
pub fn check_gameinfo_validity(state: State<ConfigState>) -> Result<bool, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    let gameinfo_path = PathBuf::from(config.deadlock_path.clone())
        .join("game")
        .join("citadel")
        .join("gameinfo.gi");
    if gameinfo_path.is_file() {
        let contents = std::fs::read_to_string(&gameinfo_path).map_err(|e| e.to_string())?;
        return Ok(contents.contains(FILESYSTEM_BLOCK_CONTENTS));
    }
    Err(format!(
        "Gameinfo file does not exist at: {:?}",
        gameinfo_path
    ))
}

/// Searches for the filesystem block and replaces it with a valid one for loading mods
//todo: should not replace it if it is already valid
#[tauri::command]
pub fn make_config_valid(state: State<ConfigState>) -> Result<(), String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    if !is_deadlock_path_valid(&config.deadlock_path) {
        return Err("Deadlock path is not valid".to_string());
    }
    let gameinfo_path = PathBuf::from(config.deadlock_path.clone())
        .join("game")
        .join("citadel")
        .join("gameinfo.gi");
    if gameinfo_path.is_file() {
        let contents = std::fs::read_to_string(&gameinfo_path).map_err(|e| e.to_string())?;

        if let Some(start_idx) = contents.find("FileSystem") {
            // Count braces to find the end of the block
            let mut brace_count = 0;
            let mut in_block = false;
            let mut end_idx = start_idx;

            for (i, c) in contents[start_idx..].char_indices() {
                if c == '{' {
                    brace_count += 1;
                    in_block = true;
                } else if c == '}' {
                    brace_count -= 1;
                }

                if in_block && brace_count == 0 {
                    end_idx = start_idx + i + 1;
                    break;
                }
            }

            // Replace the block
            let mut new_contents = String::new();
            new_contents.push_str(&contents[..start_idx]);
            new_contents.push_str(FILESYSTEM_BLOCK_CONTENTS);
            new_contents.push_str(&contents[end_idx..]);

            std::fs::write(gameinfo_path, new_contents).map_err(|e| e.to_string())?;
            return Ok(());
        }
        return Err("Gameinfo file does not contain filesystem".to_string());
    }
    Err(format!(
        "Gameinfo file does not exist at: {:?}",
        gameinfo_path
    ))
}

#[tauri::command]
pub fn change_mod_name(
    state: State<ConfigState>,
    mut user_name: String,
    file_name: String,
) -> Result<String, String> {
    {
        let mut config = state.config.lock().map_err(|e| e.to_string())?;
        if !config.mod_names.contains_key(&file_name) {
            return Err("File name is not valid".to_string());
        }
        if user_name == "" {
            user_name = file_name.clone();
        }
        let mod_name = config
            .mod_names
            .entry(file_name.clone())
            .or_insert(file_name);
        *mod_name = user_name.clone();
    }
    save_config(&state).map_err(|e| e.to_string())?;
    Ok(user_name)
}

/// This function takes in the which mods should be changed.
///
/// It will then rename mods that have been unloaded to ****pak**_dir.vpk
///
/// If the user has not specified a custom name for it then rename them to the new file name (****pak**_dir.vpk) else keep the user name for it
///
/// For mods that have been loaded it will rename them to pak**dir.vpk
///
/// Again if they do not have a custom name (check by comparing the user name and the file name) just rename to the new name or keep the custom one
///
/// Finally it should save the config with the modified file names
#[tauri::command]
pub fn apply_changes(
    mods: Vec<ModName>,
    operation: Operation,
    state: State<ConfigState>,
) -> Result<Mods, String> {
    let discovered_mods: Mods;
    {
        let mut config = state.config.lock().map_err(|e| e.to_string())?;
        if !is_deadlock_path_valid(&config.deadlock_path) {
            return Err("Deadlock path is not valid".to_string());
        }
        if config.deadlock_path == "" {
            return Err("Deadlock path not set".to_string());
        }
        let mod_path = PathBuf::from(config.deadlock_path.clone())
            .join("game")
            .join("citadel")
            .join("addons");
        std::fs::create_dir_all(&mod_path).map_err(|e| e.to_string())?;
        let mut mods_dir_entries = Vec::<DirEntry>::new();
        if mod_path.is_dir() {
            for entry in std::fs::read_dir(&mod_path).map_err(|e| e.to_string())? {
                let entry = entry.map_err(|e| e.to_string())?;
                if let Some(extension) = entry.path().extension() {
                    if extension == "vpk" {
                        mods_dir_entries.push(entry);
                    }
                }
            }
        }
        match operation {
            Operation::LoadMods => {
                //rename file to pak**_dir.vpk
                //check first available number (todo mod load order)
                for mod_to_load in mods {
                    for entry in &mods_dir_entries {
                        if mod_to_load.file_name == entry.file_name().to_string_lossy().to_string()
                        {
                            let mut pak_number = 1;
                            loop {
                                let new_name = format!("pak{:02}_dir.vpk", pak_number);
                                let new_path = mod_path.join(&new_name);
                                if !new_path.exists() {
                                    std::fs::rename(entry.path(), new_path)
                                        .map_err(|e| e.to_string())?;
                                    update_config_mod_name(&mut config, &mod_to_load, new_name);
                                    break;
                                }
                                if pak_number > 99 {
                                    log::error!("Unable to load more than 100 mods");
                                    return Err("Unable to load more than 100 mods"
                                        .parse()
                                        .unwrap());
                                }
                                pak_number += 1;
                            }
                            log::info!(
                                "Loading mod {}:{} with new file name {}",
                                &mod_to_load.file_name,
                                &mod_to_load.user_name,
                                format!("pak{:02}_dir.vpk", pak_number)
                            );
                        }
                    }
                }
            }
            Operation::UnloadMods => {
                //add random 4 numbers to start
                let mut rng = rand::rng();
                for mod_to_unload in mods {
                    for entry in &mods_dir_entries {
                        if mod_to_unload.file_name
                            == entry.file_name().to_string_lossy().to_string()
                        {
                            let random_prefix = rng.random_range(0..999999);
                            let new_name = format!(
                                "{}_{}",
                                random_prefix,
                                entry.file_name().to_string_lossy()
                            );
                            let new_path = mod_path.join(&new_name);
                            log::info!(
                                "Unloading mod {}:{} with new file name {}",
                                &mod_to_unload.file_name,
                                &mod_to_unload.user_name,
                                format!(
                                    "{}_{}",
                                    random_prefix,
                                    entry.file_name().to_string_lossy()
                                )
                            );
                            std::fs::rename(entry.path(), new_path).map_err(|e| e.to_string())?;
                            update_config_mod_name(&mut config, &mod_to_unload, new_name);
                        }
                    }
                }
            }
        }
        discovered_mods = process_mod_directory(&mod_path, &mut config)?;
    }
    save_config(&state).map_err(|e| e.to_string())?;
    Ok(discovered_mods)
}

/// This copies the vpk file to the addons folder
/// It will load the mod in a unloaded state
/// It does so by adding a random prefix at the start of the name (same as apply_changes)
#[tauri::command]
pub fn copy_mod_to_game(
    path: String,
    user_name: Option<String>,
    state: State<ConfigState>,
) -> Result<ModName, String> {
    {
        let mut config = state.config.lock().map_err(|e| e.to_string())?;
        if !is_deadlock_path_valid(&config.deadlock_path) {
            return Err("Deadlock path is not valid".to_string());
        }
        let fpath = PathBuf::from(&path);
        if !fpath.exists() {
            return Err(format!("File {} does not exist", path));
        }
        if let Some(extension) = fpath.extension() {
            if extension != "vpk" {
                return Err("Mod file must be a vpk".to_string());
            }
        }
        let addons_path = PathBuf::from(config.deadlock_path.clone())
            .join("game")
            .join("citadel")
            .join("addons");
        std::fs::create_dir_all(&addons_path).map_err(|e| e.to_string())?;
        let mut fname = fpath.file_name().unwrap().to_string_lossy().into_owned();
        let regex = Regex::new(VALID_MOD_REGEX).unwrap();
        if regex.is_match(fname.as_ref()) {
            let mut rng = rand::rng();
            let random_prefix = rng.random_range(0..9999);
            fname = format!("{}_{}", random_prefix, fname)
        }
        let mut mod_path = addons_path.join(&fname);

        if mod_path.exists() {
            let mut rng = rand::rng();
            let random_prefix = rng.random_range(0..9999);
            fname = format!("{}_{}", random_prefix, fname);
            mod_path = addons_path.join(&fname);
        }
        std::fs::copy(fpath, &mod_path).map_err(|e| e.to_string())?;
        log::info!("Copying mod {} to {}", &path, mod_path.display());
        if user_name.is_some() {
            config
                .mod_names
                .insert(fname.clone(), user_name.unwrap().to_string());
        }
    }
    save_config(&state).map_err(|e| e.to_string())?;
    Ok(ModName {
        user_name: "".to_string(),
        file_name: "".to_string(),
    })
}

#[tauri::command]
pub fn delete_mod(file_name: String, state: State<ConfigState>) -> Result<(), String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    if !is_deadlock_path_valid(&config.deadlock_path) {
        return Err("Deadlock path is not valid".to_string());
    }
    let mod_path = PathBuf::from(config.deadlock_path.clone())
        .join("game")
        .join("citadel")
        .join("addons")
        .join(&file_name);

    if !mod_path.exists() {
        return Err(format!(
            "File {} does not exist",
            mod_path.to_string_lossy()
        ));
    }

    std::fs::remove_file(mod_path).map_err(|e| e.to_string())?;
    log::info!("Deleted mod {}", &file_name);
    Ok(())
}

/// Takes in a path of a zip file or rar file
/// It will then extract every file to the cache folder
/// And will return an array of paths to those files
#[tauri::command]
pub async fn process_compressed_file(
    path: String,
    f_type: CompressedFileType,
    state: State<'_, ConfigState>,
) -> Result<Vec<String>, String> {
    let cache_dir = state.cache_path.clone();

    tauri::async_runtime::spawn_blocking(move || {
        let mut result: Vec<String> = Vec::new();
        let f_path = PathBuf::from(path);

        if !f_path.exists() {
            return Err(format!("File {} does not exist", f_path.to_string_lossy()));
        }

        match f_type {
            CompressedFileType::Zip => {
                let zip_file = std::fs::File::open(&f_path).map_err(|e| e.to_string())?;
                let mut archive = zip::ZipArchive::new(zip_file).map_err(|e| e.to_string())?;

                let extract_path = cache_dir.join(f_path.file_prefix().unwrap());

                if extract_path.exists() {
                    std::fs::remove_dir_all(&extract_path).map_err(|e| e.to_string())?;
                }

                archive.extract(&extract_path).map_err(|e| e.to_string())?;
                log::info!(
                    "Compressed Zip file {} extracted to {}",
                    f_path.to_string_lossy(),
                    extract_path.to_string_lossy()
                );
                list_vpk_files(extract_path, &mut result).map_err(|e| e.to_string())?;
            }

            CompressedFileType::Rar => {
                let extract_path = cache_dir.join(f_path.file_prefix().unwrap());

                let mut archive = Archive::new(&f_path)
                    .open_for_processing()
                    .map_err(|e| e.to_string())?;

                if extract_path.exists() {
                    std::fs::remove_dir_all(&extract_path).map_err(|e| e.to_string())?;
                }

                while let Some(header) = archive.read_header().map_err(|e| e.to_string())? {
                    archive = if header.entry().is_file() {
                        header
                            .extract_with_base(&extract_path)
                            .map_err(|e| e.to_string())?
                    } else {
                        header.skip().map_err(|e| e.to_string())?
                    };
                }
                log::info!(
                    "Compressed Rar file {} extracted to {}",
                    f_path.to_string_lossy(),
                    extract_path.to_string_lossy()
                );

                list_vpk_files(extract_path, &mut result).map_err(|e| e.to_string())?;
            }

            CompressedFileType::SevenZ => {
                let extract_path = cache_dir.join(f_path.file_prefix().unwrap());

                if extract_path.exists() {
                    std::fs::remove_dir_all(&extract_path).map_err(|e| e.to_string())?;
                }

                sevenz_rust2::decompress_file(&f_path, &extract_path).map_err(|e| e.to_string())?;

                log::info!(
                    "Compressed 7z file {} extracted to {}",
                    f_path.to_string_lossy(),
                    extract_path.to_string_lossy()
                );

                list_vpk_files(extract_path, &mut result).map_err(|e| e.to_string())?;
            }
        };
        log::info!(
            "Extracted files : {:?}",
            serde_json::to_string_pretty(&result).map_err(|e| e.to_string())?
        );
        Ok(result)
    })
    .await
    .unwrap()
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadStart {
    number_of_files: u64,
    file_ids: Vec<u64>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadEnd {
    id: u64,
}

#[tauri::command]
pub async fn download_mod_command(
    url: String,
    state: State<'_, ConfigState>,
    app: AppHandle,
) -> Result<Vec<String>, String> {
    log::info!("Downloading mod {}", url);
    let cache_dir = &state.cache_path;
    if let Some(id) = Url::parse(&url)
        .map_err(|e| e.to_string())?
        .path_segments()
        .and_then(|segments| segments.last())
    {
        let files = get_mod_files(id).await.map_err(|e| e.to_string())?;
        let mut values = files.files.iter().map(|x| x.1).collect::<Vec<&FileEntry>>();
        values.sort_by_key(|x1| x1.date_added);
        values.reverse();
        let mut newest_files: Vec<&FileEntry> = Vec::new();
        for i in 0..values.len() {
            if i == 0 {
                newest_files.push(values[i]);
                continue;
            }
            if values[i - 1].version == values[i].version {
                newest_files.push(values[i]);
                continue;
            } else {
                break;
            }
        }
        let mut paths: Vec<String> = Vec::new();
        let file_ids: Result<Vec<u64>, _> = newest_files
            .iter()
            .map(|x| x.id_row.parse::<u64>())
            .collect();
        app.emit(
            "download-start",
            DownloadStart {
                number_of_files: newest_files.len() as u64,
                file_ids: file_ids.map_err(|e| e.to_string())?,
            },
        )
        .map_err(|e| e.to_string())?;
        for newest_file in newest_files {
            let path = cache_dir.join(newest_file.file.clone());
            if path.exists() {
                std::fs::remove_file(&path).map_err(|e| e.to_string())?;
            }
            std::fs::write(
                &path,
                download_mod(&*newest_file.download_url, app.clone())
                    .await
                    .map_err(|e| e.to_string())?,
            )
            .map_err(|e| e.to_string())?;
            app.emit(
                "download-end",
                DownloadEnd {
                    id: newest_file
                        .id_row
                        .parse::<u64>()
                        .map_err(|e| e.to_string())?,
                },
            )
            .map_err(|e| e.to_string())?;
            paths.push(path.to_string_lossy().to_string());
        }
        log::info!(
            "Download mod with files at {}",
            serde_json::to_string_pretty(&paths).map_err(|e| e.to_string())?
        );
        Ok(paths)
    } else {
        Err(format!("Invalid URL: {}", url))
    }
}
