import {create} from "zustand";

interface SettingStore {
    fileNameAlwaysVisible: boolean;
    setFileNameAlwaysVisible: (fileNameAlwaysVisible: boolean) => void;
}

export const useSettingsStore = create<SettingStore>((set) => ({
    fileNameAlwaysVisible: false,
    setFileNameAlwaysVisible: (fileNameAlwaysVisible: boolean) => {
        set({fileNameAlwaysVisible});
    }
}))