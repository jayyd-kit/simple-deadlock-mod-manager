import Button from "../Button/Button.tsx";
import {Textfit} from "react-textfit";
import {useEffect, useState} from "react";
import {Tooltip} from "@mui/material";
import {useErrorStore} from "../../stores/useErrorStore.ts";
import {changePresetName} from "../../generated";

function Preset({presetName, id, onPresetDelete, onPresetApply}: {presetName: string, id: string, onPresetDelete: (id: string) => void, onPresetApply: (id: string) => void}) {
    const [isEditing, setEditing] = useState(false);
    const [inputValue, setInputValue] = useState(presetName);
    const {setError, setVisible} = useErrorStore();
    useEffect(() => {
        setInputValue(presetName);
    }, [presetName]);

    return (
        <div className={"w-full flex justify-between  border-b p-2 last:border-0"}>
            <div className={"text-xl min-w-0 overflow-hidden"}>
                {isEditing ? (
                    <input
                        value={inputValue}
                        autoFocus
                        maxLength={25}
                        onChange={(e) => setInputValue(e.target.value)}
                        onBlur={async () => {
                            if (inputValue === "") {
                                setInputValue(presetName);
                            }
                            setEditing(false);
                            try {
                                await changePresetName({id, newPresetName: inputValue});
                            } catch (e) {
                                setVisible(true);
                                setError(e)
                            }
                        }}
                        onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                                if (inputValue === "") {
                                    setInputValue(presetName);
                                }
                                setEditing(false);
                                try {
                                    await changePresetName({id, newPresetName: inputValue});
                                } catch (e) {
                                    setVisible(true);
                                    setError(e)
                                }
                            }
                        }}
                        className="bg-transparent outline-none border w-fit max-w-60"
                    />
                ) : (
                    <div onDoubleClick={() => {
                        setEditing(true);
                    }}>
                        <Tooltip title={"Double click to edit name"}>
                            <div>
                                <Textfit mode={"single"} min={10}>{inputValue}</Textfit>
                            </div>
                        </Tooltip>
                    </div>
                )}
            </div>
            <div className={"text-sm flex gap-4 ml-2"}>
                <Button onClick={() => onPresetDelete(id)}>Delete</Button>
                <Button onClick={() => onPresetApply(id)}>Apply</Button>
            </div>
        </div>
    )
}

export default Preset;