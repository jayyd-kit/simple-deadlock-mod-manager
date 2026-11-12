import {Modal} from "@mui/material";
import Button from "../Button/Button.tsx";
import {useEffect, useState} from "react";
import {
    changePath,
    checkGameinfoValidity,
    GameConfig,
    getAutoDetectDeadlockPath,
    getConfig,
    getFov,
    setConfig,
    setFov,
    setGameconfig
} from "../../generated";
import {useModsStore} from "../../stores/useModsStore.ts";
import {useErrorStore} from "../../stores/useErrorStore.ts";
import {useSettingsStore} from "../../stores/useSettingsStore.ts";
import ModManagerSettings from "./ModManagerSettings/ModManagerSettings.tsx";
import DeadlockSettings from "./DeadlockSettings/DeadlockSettings.tsx";

function Settings({isOpen, onClose}: { isOpen: boolean, onClose: () => void }) {
    const {setVisible, setError} = useErrorStore();
    const {setMods, getModsFromRust} = useModsStore();
    const {
        setFileNameAlwaysVisible,
        fileNameAlwaysVisible,
        sortMethod,
        setSortMethod,
        chosenGameConfig
    } = useSettingsStore();
    const [validConfig, setValidConfig] = useState<boolean>(false);
    const [path, setPath] = useState("");
    const [loading, setLoading] = useState<boolean>(true);
    const [fovInputValue, setFovInputValue] = useState<number>(0);
    const [gameConfigs, setGameConfigs] = useState<GameConfig[]>([])
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
            setSortMethod(config.settings.sort_method)
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
            let config = await getConfig();
            config.settings.always_show_file_names = fileNameAlwaysVisible;
            config.settings.sort_method = sortMethod;
            await setGameconfig({newGameConfig: chosenGameConfig})
            await setConfig({newConfig: config});
            await setFov({newFov: fovInputValue});
            setMods(await getModsFromRust());
            onClose();
        } catch (e) {
            setVisible(true);
            setError(e as string);
        }
    }

    return (
        <Modal onClose={onClose} open={isOpen}>
            <div
                className="absolute top-1/2 left-1/2 -translate-1/2 w-2/4 h-2/3 bg-darkBlue rounded-md min-w-160 overflow-auto">
                <div className="mx-8 h-full">
                    <div className="flex flex-col justify-between h-full">
                        <div>
                            <div className="text-white mt-8 text-3xl font-extrabold">
                                Settings
                            </div>
                            {!loading && (
                                <>
                                    <ModManagerSettings path={path} setPath={setPath} setValidConfig={setValidConfig}/>
                                    <DeadlockSettings validConfig={validConfig} setValidConfig={setValidConfig}
                                                      fovInputValue={fovInputValue}
                                                      setFovInputValue={setFovInputValue}
                                                      setGameConfigs={setGameConfigs}
                                                      gameConfigs={gameConfigs}/>
                                </>
                            )}
                        </div>
                        <div className="mb-8 mt-4">
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