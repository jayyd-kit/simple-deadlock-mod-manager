import {ChangeEvent, Dispatch, useEffect, useState} from "react";
import {useErrorStore} from "../../../../stores/useErrorStore.ts";
import {downloadGameconfigs, GameConfig, getGameconfigs} from "../../../../generated";
import Button from "../../../Button/Button.tsx";
import {useSettingsStore} from "../../../../stores/useSettingsStore.ts";
import {openUrl} from "@tauri-apps/plugin-opener";

function CustomGameConfigs({gameConfigs, setGameConfigs}: {
    gameConfigs: GameConfig[],
    setGameConfigs: Dispatch<GameConfig[]>
}) {
    const {setChosenGameConfig} = useSettingsStore();
    const {setVisible, setError} = useErrorStore();
    const [loading, setLoading] = useState(false);


    const getGameConfigsEffect = async () => {
        try {
            setLoading(true);
            let gameConfigs = await getGameconfigs();
            gameConfigs = [{path: "", name: "Default"}, ...gameConfigs]
            setGameConfigs(gameConfigs);
            setLoading(false);
        } catch (e) {
            setVisible(true);
            setError(e as string);
        }
    }

    useEffect(() => {
        getGameConfigsEffect();
    }, []);

    const onDownloadClick = async () => {
        try {
            setLoading(true);
            let gameConfigs = await downloadGameconfigs();
            gameConfigs = [{path: "", name: "Default"}, ...gameConfigs]
            setGameConfigs(gameConfigs);
            setLoading(false);
        } catch (e) {
            setVisible(true);
            setError(e as string);
        }
    }

    const onSelectChange = async (e: ChangeEvent<HTMLSelectElement>) => {
        const chosenGameConfig = gameConfigs.find((g) => g.name === e.target.value);
        if (chosenGameConfig) {
            setChosenGameConfig(chosenGameConfig);
        } else {
            setVisible(true);
            setError("Invalid Choice")
        }
    }

    const onSourceClick = async () => {
        await openUrl("https://github.com/Sqooky/OptimizationLock")
    }

    return (
        <div className="mt-8">
            <div className={"flex justify-between mb-2"}>
                <label className="block mb-2 text-xl">Custom Game Configs</label>
                <div className="">
                    <Button onClick={onSourceClick}><span>Source</span></Button>
                </div>
            </div>
            <div className="flex w-full justify-between">
                <select disabled={loading} onChange={onSelectChange} className="w-60 text-black text-sm bg-white">
                    {gameConfigs.map((gameConfig: GameConfig) => (
                        <option value={gameConfig.name}>{gameConfig.name}</option>
                    ))}
                </select>

                <Button onClick={onDownloadClick}>Download GameConfigs</Button>
            </div>
        </div>
    )
}

export default CustomGameConfigs;