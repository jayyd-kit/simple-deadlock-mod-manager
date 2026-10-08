import {applyChanges, changeModName, listMods, DeadlockMod, Mods, ModOperation} from "../generated";
import {create} from "zustand";
import {ModTabVariant} from "../components/ModTab/ModTab.tsx";

interface SelectedMod {
    variant: ModTabVariant,
    fileName: string,
    userName: string,
    id: string
}

interface ChangedMod {
    operation: ModOperation,
    fileName: string,
    userName: string,
    id: string
}

interface ModsStore {
    mods: Mods,
    selectedMods: SelectedMod[],
    changedMods: ChangedMod[],
    applyModChanges: () => Promise<void>,
    addSelectedMod: (mod: SelectedMod) => void,
    removeSelectedMod: (mod: SelectedMod) => void,
    changeModLoadStatus: (mods: SelectedMod[]) => void,
    setMods: (mods: Mods) => void;
    getModsFromRust: () => Promise<Mods>;
    changeModName: (userName: string, fileName: string) => Promise<void>;
}

//functions that invoke commands can throw and should be try catched
export const useModsStore = create<ModsStore>((set, get) => ({
    mods: {
        loaded_mods: [],
        unloaded_mods: []
    },
    selectedMods: [],
    changedMods: [],
    applyModChanges: async () => {
        const state = get();

        let changed = [...state.changedMods];

        if (changed.length === 0) {
            return;
        }

        let modsToLoad = changed.filter((x) => x.operation === "LoadMods").map((x) => ({
            file_name: x.fileName,
            user_name: x.userName,
            id: x.id
        })) as DeadlockMod[];
        let modsToUnload = changed.filter((x) => x.operation === "UnloadMods").map((x) => ({
            file_name: x.fileName,
            user_name: x.userName,
            id: x.id
        })) as DeadlockMod[];
        let results: {
            loaded_mods: { file_name: string; user_name: string; id: string }[];
            unloaded_mods: { file_name: string; user_name: string; id: string }[];
        };
        if (modsToLoad.length > 0) {
            results = await applyChanges({mods: modsToLoad, operation: "LoadMods"})
        }
        if (modsToUnload.length > 0) {
            results = await applyChanges({mods: modsToUnload, operation: "UnloadMods"})
        }

        set(() => {
            return {
                mods: results,
                changedMods: [],
            }
        })
    },
    addSelectedMod: (mod: SelectedMod) => {
        set((s) => ({
            selectedMods: [...s.selectedMods, mod]
        }));
    },
    removeSelectedMod: (mod: SelectedMod) => {
        set((s) => ({
            selectedMods: s.selectedMods.filter((selectedMod) => selectedMod.fileName !== mod.fileName)
        }));
    },
    changeModLoadStatus: (selectedMods: SelectedMod[]) => {
        set((state) => {
            let loaded = [...state.mods.loaded_mods];
            let unloaded = [...state.mods.unloaded_mods];
            let changed = [...state.changedMods];

            selectedMods.forEach((mod) => {
                let operation: ModOperation;

                if (mod.variant === ModTabVariant.LoadedMods) {
                    // move from loaded -> unloaded
                    loaded = loaded.filter(m => m.file_name !== mod.fileName);
                    const moved = state.mods.loaded_mods.find(m => m.file_name === mod.fileName);
                    if (moved) unloaded.push(moved);

                    operation = "UnloadMods";
                } else {
                    // move from unloaded -> loaded
                    unloaded = unloaded.filter(m => m.file_name !== mod.fileName);
                    const moved = state.mods.unloaded_mods.find(m => m.file_name === mod.fileName);
                    if (moved) loaded.push(moved);

                    operation = "LoadMods";
                }

                const existingIndex = changed.findIndex( //check if we already have an operation on this mod
                    c => c.fileName === mod.fileName
                );

                if (existingIndex === -1) { // -1 means not found
                    changed.push({
                        operation,
                        fileName: mod.fileName,
                        userName: mod.userName,
                        id: mod.id,
                    });
                } else {
                    const existing = changed[existingIndex];

                    // opposite operation = cancel out
                    if (existing.operation !== operation) {
                        changed.splice(existingIndex, 1);
                    }
                    // same operation should not happen regardless
                }
            });

            return {
                mods: {
                    loaded_mods: loaded,
                    unloaded_mods: unloaded
                },
                changedMods: changed,
                selectedMods: [] //reset selected mods, but keep changedMods
            };
        });
    },
    setMods: (mods: Mods) => set({mods: mods}),
    getModsFromRust: async () => {
        return await listMods();
    },
    changeModName: async (userName: string, fileName: string) => {
        await changeModName({fileName, userName});
        set({mods: await listMods()});
    },
}));