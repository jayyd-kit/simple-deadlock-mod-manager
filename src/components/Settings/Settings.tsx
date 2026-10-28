import {Modal} from "@mui/material";
import Button from "../Button/Button.tsx";
import {ChangeEvent, useEffect, useState} from "react";
import {
    changePath,
    checkGameinfoValidity,
    getAutoDetectDeadlockPath,
    getConfig, getFov,
    makeConfigValid, setConfig, setFov
} from "../../generated";
import {useModsStore} from "../../stores/useModsStore.ts";
import {useErrorStore} from "../../stores/useErrorStore.ts";
import {open} from "@tauri-apps/plugin-dialog";
import {useSettingsStore} from "../../stores/useSettingsStore.ts";
import {Numbers} from "@mui/icons-material";

function Settings({isOpen, onClose}: { isOpen: boolean, onClose: () => void }) {
    const {setVisible, setError} = useErrorStore();
    const {setMods, getModsFromRust} = useModsStore();
    const {setFileNameAlwaysVisible, fileNameAlwaysVisible} = useSettingsStore();
    const [path, setPath] = useState("");
    const [validConfig, setValidConfig] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [fovInputValue, setFovInputValue] = useState<number>(0);
    useEffect(() => {
        getSettingsConfig();
    }, [isOpen])

    const getSettingsConfig = async () => {
        try {
            const config = await getConfig();
            if (config.deadlock_path === "") {
                const path = await getAutoDetectDeadlockPath();
                await changePath({path: path});
                setMods(await getModsFromRust());
                setPath(path);
            } else {
                setPath(config.deadlock_path);
            }
            setFileNameAlwaysVisible(config.settings.always_show_file_names)
            setValidConfig(await checkGameinfoValidity())
            setFovInputValue(await getFov());
        } catch (e) {
            setVisible(true);
            setError(e as string);
        } finally {
            setLoading(false);
        }
    }

    const onApply = async () => {
        try {
            await changePath({path: path});
            setMods(await getModsFromRust());
            let config = await getConfig();
            config.settings.always_show_file_names = fileNameAlwaysVisible;
            await setConfig({newConfig: config});
            await setFov({newFov: fovInputValue});
            onClose();
        } catch (e) {
            setVisible(true);
            setError(e as string);
        }
    }

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
        <Modal onClose={onClose} open={isOpen}>
            <div className="absolute top-1/2 left-1/2 -translate-1/2 w-2/4 h-2/3 bg-darkBlue rounded-md min-w-160">
                <div className="mx-8 h-full">
                    <div className="flex flex-col justify-between h-full">
                        <div>
                            <div className="text-white mt-8 text-3xl font-extrabold">
                                Settings
                            </div>
                            {!loading && (
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
                                    <div className="mt-8 text-xl">
                                        <label className="block mb-2">gameinfo.gi file status</label>
                                        <div className="flex gap-2">
                                            <div
                                                className={`bg-gray-800 grow pl-2 ${validConfig ? "bg-green-500" : "bg-red-500"}`}>{validConfig ? "Valid" : "Not valid"}</div>
                                            <Button onClick={async () => {
                                                try {
                                                    setValidConfig(await checkGameinfoValidity());
                                                } catch (e) {
                                                    setVisible(true);
                                                    setError(e as string);
                                                }
                                            }}>Check Validity</Button>
                                            <Button onClick={async () => {
                                                try {
                                                    await makeConfigValid();
                                                    setValidConfig(await checkGameinfoValidity());
                                                } catch (e) {
                                                    setVisible(true);
                                                    setError(e as string);
                                                }
                                            }}>Make valid</Button>
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
                                    <div className="text-white mt-8 text-xl font-extrabold border-b pb-2">
                                        Deadlock Settings
                                    </div>
                                    <div className="mt-6 text-xl flex gap-2 justify-between">
                                        <div className="text-xl">Field Of View</div>
                                        <div className="flex gap-2">
                                            <input
                                                value={fovInputValue}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                                    setFovInputValue(parseInt(e.target.value));
                                                }}
                                                className={"no-spinner bg-gray-800 border border-default-medium rounded-xs text-center w-20"}
                                                type={"number"}/>
                                        </div>

                                    </div>
                                </>
                            )}
                        </div>
                        <div className="mb-8">
                            <div className="flex w-full justify-between">
                                <Button onClick={onClose}>Close</Button>
                                <Button onClick={onApply}>Apply</Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default Settings;