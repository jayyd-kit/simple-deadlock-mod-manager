import {create} from "zustand";
import {GameConfig, SortMethod} from "../generated";

interface SettingStore {
    fileNameAlwaysVisible: boolean;
    setFileNameAlwaysVisible: (fileNameAlwaysVisible: boolean) => void;
    sortMethod: SortMethod;
    setSortMethod: (sortMethod: SortMethod) => void;
    chosenGameConfig: GameConfig;
    setChosenGameConfig: (chosenGameConfig: GameConfig) => void;
}

export const useSettingsStore = create<SettingStore>((set) => ({
    fileNameAlwaysVisible: false,
    setFileNameAlwaysVisible: (fileNameAlwaysVisible: boolean) => {
        set({fileNameAlwaysVisible});
    },
    sortMethod: "None",
    setSortMethod: (sortMethod: SortMethod) => {
        set({sortMethod});
    },
    chosenGameConfig: {name: "Default", path: ""},
    setChosenGameConfig: (chosenGameConfig: GameConfig) => {
        set({chosenGameConfig});
    }
}))