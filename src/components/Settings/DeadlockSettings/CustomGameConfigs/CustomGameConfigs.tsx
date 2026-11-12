import {ChangeEvent, Dispatch, useEffect} from "react";
import {useErrorStore} from "../../../../stores/useErrorStore.ts";
import {GameConfig, getGameconfigs} from "../../../../generated";
import Button from "../../../Button/Button.tsx";
import {useSettingsStore} from "../../../../stores/useSettingsStore.ts";

function CustomGameConfigs({gameConfigs, setGameConfigs}: {
    gameConfigs: GameConfig[],
    setGameConfigs: Dispatch<GameConfig[]>
}) {
    const {setChosenGameConfig} = useSettingsStore();
    const {setVisible, setError} = useErrorStore();


    const getGameConfigsEffect = async () => {
        try {
            let gameConfigs = await getGameconfigs();
            gameConfigs = [{path: "", name: "Default"}, ...gameConfigs]
            setGameConfigs(gameConfigs);
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
            let gameConfigs = await getGameconfigs();
            gameConfigs = [{path: "", name: "Default"}, ...gameConfigs]
            setGameConfigs(gameConfigs);
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

    return (
        <div className="mt-8 text-xl">
            <label className="block mb-2">Custom Game Configs</label>
            <div className="flex w-full justify-between">
                <select onChange={onSelectChange} className="w-60 text-black text-sm">
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