use serde::{Deserialize, Serialize};

#[derive(Default, Deserialize, Serialize, Clone)]
pub struct Mods {
    pub loaded_mods: Vec<Mod>,
    pub unloaded_mods: Vec<Mod>,
}

/*#[derive(Default, Deserialize, Serialize, Clone)]
pub struct ModName {
    pub file_name: String,
    pub user_name: String,
}*/



#[derive(Clone, Default, Deserialize, Serialize)]
pub struct Mod {
    pub file_name: String,
    pub user_name: String,
    pub id: String,
}

impl PartialEq for Mod {
    fn eq(&self, other: &Mod) -> bool {
        self.file_name.eq(&other.file_name)
    }
}

#[derive(Clone, Default, Deserialize, Serialize)]
pub struct Preset {
    pub preset_name: String,
    pub mods: Vec<Mod>,
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
