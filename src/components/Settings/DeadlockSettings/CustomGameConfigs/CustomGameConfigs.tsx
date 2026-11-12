import {useEffect} from "react";
import {useErrorStore} from "../../../../stores/useErrorStore.ts";
import {downloadGameconfigs, GameConfig, getGameconfigs} from "../../../../generated";
import Button from "../../../Button/Button.tsx";

function CustomGameConfigs({gameConfigs, setGameConfigs}: {
    gameConfigs: GameConfig[],
    setGameConfigs: (gameConfig) => void
}) {

    const {setVisible, setError} = useErrorStore();


    const getGameConfigsEffect = async () => {
        try {
            setGameConfigs(await getGameconfigs());
            setGameConfigs(prevState => [{path: "", name: "Default"}, ...prevState])
        } catch (e) {
            setVisible(true);
            setError(e);
        }
    }

    useEffect(() => {
        getGameConfigsEffect();
    }, []);

    const onDownloadClick = async () => {
        try {
            setGameConfigs(await downloadGameconfigs())
            setGameConfigs(prevState => [{path: "", name: "Default"}, ...prevState])
        } catch (e) {
            setVisible(true);
            setError(e);
        }
    }

    return (
        <div className="mt-8 text-xl">
            <label className="block mb-2">Custom Game Configs</label>
            <div className="flex w-full justify-between">
                <select className="w-60 text-black">
                    {gameConfigs.map((gameConfig: GameConfig) => (
                        <option>{gameConfig.name}</option>
                    ))}
                </select>
                <Button onClick={onDownloadClick}>Download GameConfigs</Button>
            </div>
        </div>
    )
}

export default CustomGameConfigs;