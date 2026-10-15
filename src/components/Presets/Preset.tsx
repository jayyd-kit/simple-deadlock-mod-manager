import Button from "../Button/Button.tsx";
import {Textfit} from "react-textfit";
import {useEffect, useState} from "react";
import {Tooltip} from "@mui/material";

function Preset({presetName}: {presetName: string}) {
    const [isEditing, setEditing] = useState(false);
    const [inputValue, setInputValue] = useState(presetName);
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
                        onBlur={() => {
                            if (inputValue === "") {
                                setInputValue(presetName);
                            }
                            setEditing(false);
                            //TODO change preset name in backend
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                if (inputValue === "") {
                                    setInputValue(presetName);
                                }
                                setEditing(false);
                                //TODO change preset name in backend
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
                <Button>Delete</Button>
                <Button>Apply</Button>
            </div>
        </div>
    )
}

export default Preset;