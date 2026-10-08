use serde::{Deserialize, Serialize};

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct Mods {
    pub loaded_mods: Vec<ModName>,
    pub unloaded_mods: Vec<ModName>,
}

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct ModName {
    pub file_name: String,
    pub user_name: String,
}

impl PartialEq for ModName {
    fn eq(&self, other: &ModName) -> bool {
        self.file_name.eq(&other.file_name)
    }
}

#[derive(Deserialize, Serialize)]
pub enum ModOperation {
    LoadMods,
    UnloadMods,
}

#[derive(Deserialize, Serialize)]
pub enum CompressedFileType {
    Zip,
    Rar,
    SevenZ,
}
