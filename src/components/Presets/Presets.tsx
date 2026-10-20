import Button from "../Button/Button.tsx";
import Preset from "./Preset.tsx";
import {CSSProperties, Ref, useEffect, useState} from "react";
import {useErrorStore} from "../../stores/useErrorStore.ts";
import {applyPreset, createPreset, deletePreset, getPresetsNames, PresetName} from "../../generated";
import {useModsStore} from "../../stores/useModsStore.ts";

function Presets({style, ref, setIsOpen}: { style?: CSSProperties, ref?: Ref<any>, setIsOpen: (isPresetWindowOpen: boolean) => void }) {

    const [presets, setPresets] = useState<PresetName[]>();
    const {setMods, getModsFromRust, emptySelectedMods, emptyChangedMods} = useModsStore()
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

    const onClose = () => {
        setIsOpen(false);
    }

    const onCreatePreset = async () => {
        try {
            await createPreset();
            await getPresets();
        } catch (e) {
            setVisible(true);
            setError(e);
        }
    }

    const onPresetDelete = async (id: string) => {
        try {
            await deletePreset({id})
            await getPresets();
        } catch (e) {
            setVisible(true);
            setError(e);
        }
    }

    const onPresetApply = async (id: string) => {
        try {
            await applyPreset({id})
            setMods(await getModsFromRust());
            emptyChangedMods();
            emptySelectedMods();
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
                        <Preset presetName={preset.name} id={preset.id} onPresetDelete={onPresetDelete} onPresetApply={onPresetApply}></Preset>
                    ))
                )}
            </div>
            <div className={"flex w-full justify-between p-2 mt-4 mb-1"}>
                <Button onClick={onClose}>Close</Button>
                <Button onClick={onCreatePreset}>Create New Preset</Button>
            </div>
        </div>
    )
}

export default Presets;