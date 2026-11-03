import {ChangeEvent} from "react";
import {changePath, checkGameinfoValidity, getAutoDetectDeadlockPath} from "../../../generated";
import {useModsStore} from "../../../stores/useModsStore.ts";
import {useErrorStore} from "../../../stores/useErrorStore.ts";
import {open} from "@tauri-apps/plugin-dialog";
import {useSettingsStore} from "../../../stores/useSettingsStore.ts";
import Button from "../../Button/Button.tsx";

function ModManagerSettings({path, setPath, setValidConfig}: {
    path: string,
    setPath: (path: string) => void,
    setValidConfig: (validConfig: boolean) => void
}) {


    const {setMods, getModsFromRust} = useModsStore();
    const {setError, setVisible} = useErrorStore();
    const {setFileNameAlwaysVisible, fileNameAlwaysVisible} = useSettingsStore();


    const onAutoDetectClick = async () => {
        try {
            setPath(await getAutoDetectDeadlockPath());
            await changePath({path: path});
            setValidConfig(await checkGameinfoValidity());
            setMods(await getModsFromRust());
        } catch (e) {
            setVisible(true);
            setError(e as string);
        }
    }

    const onBrowseClick = async () => {
        try {
            const dir = await open({
                multiple: false,
                directory: true,
            })
            if (dir) {
                setPath(dir);
                await changePath({path: dir})
                setValidConfig(await checkGameinfoValidity())
                setMods(await getModsFromRust());
            }
        } catch (e) {
            setVisible(true);
            setError(e as string);
        }
    }

    return (
        <>
            <div className="text-white mt-8 text-xl font-extrabold border-b pb-2">
                Mod Manager Settings
            </div>
            <div className="mt-6 text-xl">
                <label className="block mb-2" htmlFor="pathInput">
                    Deadlock Path
                </label>
                <div className="flex gap-4">
                    <div className="bg-gray-800 grow mr-8"><input id="pathInput" value={path}
                                                                  onChange={(e) => {
                                                                      setPath(e.target.value)
                                                                  }}
                                                                  onKeyDown={async (e) => {
                                                                      if (e.key === "Enter") {
                                                                          try {
                                                                              await changePath({path: path});
                                                                              setMods(await getModsFromRust());
                                                                              setValidConfig(await checkGameinfoValidity());
                                                                          } catch (e) {
                                                                              setVisible(true);
                                                                              setError(e as string);
                                                                          }
                                                                      }
                                                                  }}
                                                                  className="text-lg m-1 w-full pr-2"/>
                    </div>
                    <Button onClick={onBrowseClick}>
                        Browse
                    </Button>
                    <Button onClick={onAutoDetectClick}>
                        Auto-Detect
                    </Button>
                </div>
            </div>
            <div className="mt-8 text-xl flex gap-2 justify-between">
                <div className="text-xl">Always display File name</div>
                <input
                    checked={fileNameAlwaysVisible}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        setFileNameAlwaysVisible(e.target.checked);
                    }}
                    className={"w-6 h-6 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"}
                    type={"checkbox"}/>
            </div>
        </>
    )
}

export default ModManagerSettings;