import Button from "../Button/Button.tsx";
import {useModsStore} from "../../stores/useModsStore.ts";
import {ModTabVariant} from "../ModTab/ModTab.tsx";
import {useSearchStore} from "../../stores/useSearchStore.ts";

enum ButtonType {
    LEFT,
    RIGHT
}

function LoadModButtons() {
    const {selectedMods, changeModLoadStatus} = useModsStore();
    const {setSearch} = useSearchStore();
    const onClick = (buttonType: ButtonType) => {
        if (selectedMods.length === 0) { // if no mods were selected
            return;
        }
        if (buttonType === ButtonType.LEFT && selectedMods[0].variant === ModTabVariant.UnloadedMods // if no mods were selected of the right category
            ||
            buttonType === ButtonType.RIGHT && selectedMods[0].variant === ModTabVariant.LoadedMods) {
            return;
        }
        setSearch("");
        changeModLoadStatus(selectedMods);
    }
    return (
        <div className="h-screen flex justify-center items-center bottom-0">
            <div className="flex flex-col gap-2 fixed">
                <Button onClick={() => onClick(ButtonType.LEFT)}>&lt;&lt;</Button>
                <Button onClick={() => onClick(ButtonType.RIGHT)}>&gt;&gt;</Button>
            </div>
        </div>
    )
}

export default LoadModButtons;