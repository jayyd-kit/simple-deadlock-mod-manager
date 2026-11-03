import Button from "../../Button/Button.tsx";
import {checkGameinfoValidity, makeConfigValid} from "../../../generated";
import {useErrorStore} from "../../../stores/useErrorStore.ts";
import {ChangeEvent} from "react";

function DeadlockSettings({validConfig, setValidConfig, fovInputValue, setFovInputValue}: {
    validConfig: boolean,
    setValidConfig: (validConfig: boolean) => void,
    fovInputValue: number,
    setFovInputValue: (fovInputValue: number) => void
}) {
    const {setVisible, setError} = useErrorStore();

    return (
        <>
            <div className="text-white mt-8 text-xl font-extrabold border-b pb-2">
                Deadlock Settings
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
            <div className="mt-6 text-xl flex flex-col justify-between">
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
    )
}

export default DeadlockSettings;