import Button from "../Button/Button.tsx";
import Preset from "./Preset.tsx";

function Presets({style, ref}: { style?: React.CSSProperties, ref?: React.Ref<any>}) {
    return (
        <div className={"bg-topbar border-2 rounded-md min-w-90 max-w-110"} style={style} ref={ref}>
            <div className={"text-2xl w-full text-center font-bold"}>Presets</div>
            <div className={"border mx-2 min-h-10"}>
                <Preset presetName={"Preset 1"}/>
                <Preset presetName={"Preset 2"}/>
            </div>
            <div className={"flex w-full justify-between p-2 mt-4 mb-1"}>
                <Button>Close</Button>
                <Button>Create New Preset</Button>
            </div>
        </div>
    )
}

export default Presets;