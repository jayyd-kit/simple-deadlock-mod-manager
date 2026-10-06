import {useEffect, useRef, useState} from "react";
import {Textfit} from 'react-textfit';
import {Tooltip} from "@mui/material";
import {useModsStore} from "../../stores/useModsStore.ts";
import {ModTabVariant} from "../ModTab/ModTab.tsx";
import {useErrorStore} from "../../stores/useErrorStore.ts";
import {Settings} from "@mui/icons-material";
import {useModManageStore} from "../../stores/useModManageStore.ts";

function Mod({modName, fileName, variant}: { modName: string, fileName: string, variant: ModTabVariant }) {
    const {setVisible, setError} = useErrorStore();
    const colors = ["bg-gunItem", "bg-vitalityItem", "bg-spiritItem"];
    const {changeModName, addSelectedMod, removeSelectedMod, selectedMods, changedMods} = useModsStore();
    //const {setFileName, setUserName, setModalOpen} = useDeleteStore();
    const {setUserName, setFileName, setModManageModalOpen} = useModManageStore();
    const checkboxRef = useRef<HTMLInputElement>(null);
    const [selected, setSelected] = useState(false)
    const [isChanged, setIsChanged] = useState<boolean>(false);

    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(modName);

    useEffect(() => {
        setInputValue(modName);
    }, [modName]);

    useEffect(() => {
        setIsChanged(changedMods.some((x) => x.fileName === fileName));
    }, [changedMods]);

    const [color] = useState(colors[Math.floor(Math.random() * colors.length)]);

    const onManageClick = () => {
        if (isChanged) {
            return;
        }
        setUserName(modName);
        setFileName(fileName);
        setModManageModalOpen(true);
    }


    const onSelect = (checkbox: HTMLInputElement) => {
        if (selectedMods.filter((f) => (f.variant !== variant)).length > 0) { // can't select two mods from different categories
            checkbox.checked = !checkbox.checked;
            return;
        }
        checkbox.checked = !checkbox.checked;
        switch (selected) { // value before clicking
            case true:
                removeSelectedMod({variant, fileName, userName: modName})
                setSelected(false)
                break;
            case false:
                addSelectedMod({variant, fileName, userName: modName})
                setSelected(true)
                break;
        }
    }

    return (
        <div
            className={`${color} h-30 relative flex flex-col items-center justify-center text-black font-bold rounded-lg border-3 border-white shadow-2xl ${isChanged ? "border-red-500!" : ""}`}
            onClick={(e) => {
                e.stopPropagation()
                if (checkboxRef.current) {
                    onSelect(checkboxRef.current)
                }
            }}>
            {isEditing ? (
                <input
                    value={inputValue}
                    autoFocus
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={async () => {
                        if (inputValue === "") {
                            setInputValue(fileName);
                        }
                        setIsEditing(false)
                        try {
                            await changeModName(inputValue, fileName)
                        } catch (error) {
                            setVisible(true);
                            setError(error as string);
                        }
                    }}
                    onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                            if (inputValue === "") {
                                setInputValue(fileName);
                            }
                            setIsEditing(false);
                            try {
                                await changeModName(inputValue, fileName)
                            } catch (error) {
                                setVisible(true);
                            }
                        }
                    }}
                    className="bg-transparent text-center outline-none border"
                />
            ) : (
                <div onDoubleClick={() => {
                    if (isChanged) {
                        return;
                    }
                    setIsEditing(true)
                }} className={"w-full text-center px-2"}>
                    <Tooltip title={"Double click to edit name"}>
                        <div>
                            <Textfit mode={"multi"} max={25}>
                                {inputValue}
                            </Textfit>
                        </div>
                    </Tooltip>
                </div>
            )}
            {/* Not sure if load order matters, todo at a later date if it does
            <div className="flex gap-2 h-7">
                <Button>&lt;</Button>
                <Button>&gt;</Button>
            </div>
            */}
            <div className="absolute top-2 right-2">
                <input
                    className="w-6 h-6 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft"
                    type={"checkbox"}
                    ref={checkboxRef}
                    onClick={(e) => {
                        e.stopPropagation()
                        if (checkboxRef.current) {
                            checkboxRef.current.checked = !checkboxRef.current.checked;
                            onSelect(checkboxRef.current)
                        }
                    }}
                />
            </div>
            <div className="absolute top-2 left-2">
                <button
                    disabled={isChanged}
                    className="bg-blue-800/80 hover:bg-blue-800 active:bg-blue-950 disabled:bg-black transition-colors duration-200 rounded-lg p-0.5"
                    onClick={onManageClick}>
                    <Settings htmlColor={"#FFFFFF"}/></button>
            </div>
        </div>
    );
}

export default Mod;