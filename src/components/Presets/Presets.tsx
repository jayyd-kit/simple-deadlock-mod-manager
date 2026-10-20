import Button from "../Button/Button.tsx";
import Preset from "./Preset.tsx";
import {CSSProperties, Ref, useEffect, useState} from "react";
import {useErrorStore} from "../../stores/useErrorStore.ts";
import {getPresetsNames, PresetName} from "../../generated";

function Presets({style, ref}: { style?: CSSProperties, ref?: Ref<any>}) {

    const [presets, setPresets] = useState<PresetName[]>();
    const {setError, setVisible} = useErrorStore()

    useEffect(() => {
        getPresets();
    })

    const getPresets = async () => {
        try {
            const presets = await getPresetsNames();
            setPresets(presets)
        } catch (e) {
            setVisible(true);
            setError(e);
        }
    }

    return (
        <div className={"bg-topbar border-2 rounded-md min-w-90 max-w-110"} style={style} ref={ref}>
            <div className={"text-2xl w-full text-center font-bold"}>Presets</div>
            <div className={"border mx-2 min-h-10"}>
                {presets && presets.length > 0 && (
                    presets.map((preset) => (
                        <Preset presetName={preset.name}></Preset>
                    ))
                )}
            </div>
            <div className={"flex w-full justify-between p-2 mt-4 mb-1"}>
                <Button>Close</Button>
                <Button>Create New Preset</Button>
            </div>
        </div>
    )
}

export default Presets;