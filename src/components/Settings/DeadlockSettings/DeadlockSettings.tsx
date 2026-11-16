import Button from "../../Button/Button.tsx";
import {checkGameinfoValidity, GameConfig, makeConfigValid} from "../../../generated";
import {useErrorStore} from "../../../stores/useErrorStore.ts";
import {ChangeEvent, Dispatch, useState} from "react";
import {KeyboardArrowDown, KeyboardArrowRight} from "@mui/icons-material";
import CustomGameConfigs from "./CustomGameConfigs/CustomGameConfigs.tsx";

function DeadlockSettings({
                              validConfig,
                              setValidConfig,
                              fovInputValue,
                              setFovInputValue,
                              gameConfigs,
                              setGameConfigs,
                              alwaysShowHealthNumbers,
                              setAlwaysShowHealthNumbers
                          }: {
    validConfig: boolean,
    setValidConfig: (validConfig: boolean) => void,
    fovInputValue: number,
    setFovInputValue: (fovInputValue: number) => void,
    gameConfigs: GameConfig[],
    setGameConfigs: Dispatch<GameConfig[]>,
    alwaysShowHealthNumbers: boolean,
    setAlwaysShowHealthNumbers: Dispatch<boolean>,
}) {
    const {setVisible, setError} = useErrorStore();

    const [settingsVisible, setSettingsVisible] = useState(true);

    return (
        <>
            <div className="text-white mt-8 text-xl font-extrabold border-b pb-2">
                <button onClick={() => setSettingsVisible(!settingsVisible)}>Deadlock Settings {settingsVisible ?
                    <KeyboardArrowDown/> : <KeyboardArrowRight/>}</button>
            </div>
            {settingsVisible && (
                <>
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
                    <CustomGameConfigs gameConfigs={gameConfigs} setGameConfigs={setGameConfigs}/>
                    <div className="mt-8 text-xl flex flex-col justify-between">
                        <div className="text-xl mb-2">Field Of View</div>
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
                    <div className="mt-8 text-xl flex gap-2 justify-between">
                        <div className="text-xl">Always display health numbers</div>
                        <input
                            checked={alwaysShowHealthNumbers}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                setAlwaysShowHealthNumbers(e.target.checked)
                            }}
                            className={"w-6 h-6 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"}
                            type={"checkbox"}/>
                    </div>
                </>
            )}
        </>
    )
}

export default DeadlockSettings;