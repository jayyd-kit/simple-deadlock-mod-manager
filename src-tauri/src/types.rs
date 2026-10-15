use serde::{Deserialize, Serialize};

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct Mods {
    pub loaded_mods: Vec<DeadlockMod>,
    pub unloaded_mods: Vec<DeadlockMod>,
}

/*#[derive(Default, Deserialize, Serialize, Clone)]
pub struct ModName {
    pub file_name: String,
    pub user_name: String,
}*/



#[derive(Clone, Default, Deserialize, Serialize)]
pub struct DeadlockMod {
    pub file_name: String,
    pub user_name: String,
    pub id: String,
}

impl PartialEq for DeadlockMod {
    fn eq(&self, other: &DeadlockMod) -> bool {
        self.file_name.eq(&other.file_name)
    }
}

#[derive(Clone, Default, Deserialize, Serialize)]
pub struct Preset {
    pub preset_name: String,
    pub id: String,
    pub mods: Vec<DeadlockMod>,
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
