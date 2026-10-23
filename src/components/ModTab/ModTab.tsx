import Mod from "../Mod/Mod.tsx";
import {DeadlockMod} from "../../generated";
import {SearchType, useSearchStore} from "../../stores/useSearchStore.ts";
import {useEffect, useState} from "react";
import Fuse from "fuse.js"

export enum ModTabVariant {
    LoadedMods,
    UnloadedMods
}

function ModTab({variant, mods, loading}: { variant: ModTabVariant, mods: DeadlockMod[], loading: boolean }) {
    const {search, searchType} = useSearchStore();
    const [filteredMods, setFilteredMods] = useState<DeadlockMod[]>([]);


    useEffect(() => {
        let list: string[] = [];
        switch (searchType) {
            case SearchType.FileName: {
                const regex = /\d+/g;

                const filteredMods = mods.filter(mod => {
                    const num = parseInt(mod.file_name.match(regex)?.join("") ?? "");
                    return !isNaN(num) && num.toString().includes(search);
                });

                setFilteredMods(filteredMods);
                break;
            }
            case SearchType.UserName: {
                list = mods.map((m) => m.user_name)
                const fuse = new Fuse(list, {
                    findAllMatches: true,
                });

                const result = fuse.search(search)

                setFilteredMods(result.map(m => mods[m.refIndex]))
                return;
            }
        }
    }, [search]);

    useEffect(() => {
        setFilteredMods(mods);
    }, [mods]);

    const getTabName = (variant: ModTabVariant) => {
        let tabName = "";
        if (variant === ModTabVariant.LoadedMods) {
            tabName = "Loaded Mods";
        } else if (variant === ModTabVariant.UnloadedMods) {
            tabName = "Unloaded Mods";
        }
        if (search.length > 0) {
            tabName += ` (Results Filtered)`;
        }
        return tabName;
    }

    return (
        <div className="flex-1 bg-cream p-3 first:pr-1.5 last:pl-1.5">
            <div className="border-3 h-full border-t-0 border-darker-cream">
                <div
                    className="bg-darker-cream text-white h-8.75 leading-8.75 pl-2">{getTabName(variant)} ({filteredMods.length})</div>
                <div className="px-2 pt-2 pb-2 grid grid-cols-3 gap-2">
                    {loading ? (
                        <></>
                    ) : filteredMods.map((mod) => (
                        <Mod id={mod.id} modName={mod.user_name} key={mod.id} fileName={mod.file_name} variant={variant}/>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default ModTab;