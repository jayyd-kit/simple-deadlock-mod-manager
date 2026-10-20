import Button from "../Button/Button.tsx";
import Settings from "../Settings/Settings.tsx";
import {useState} from "react";
import {useModsStore} from "../../stores/useModsStore.ts";
import {useErrorStore} from "../../stores/useErrorStore.ts";
import AddModModal from "../AddMod/AddModModal.tsx";
import Search from "../Search/Search.tsx";
import {useFloating} from "@floating-ui/react";
import Presets from "../Presets/Presets.tsx";


function TopBar() {

    const {applyModChanges} = useModsStore();
    const {setError, setVisible} = useErrorStore();
    const {refs, floatingStyles} = useFloating();
    const [addModModalOpen, setAddModModalOpen] = useState(false);

    const onModAddClick = async (): Promise<void> => {
        setAddModModalOpen(true);
    }

    const [openModal, setOpenModal] = useState<boolean>(false)
    const handleOpenSettingsModal = () => setOpenModal(true)
    const handleCloseSettingsModal = () => setOpenModal(false)

    const [isPresetWindowOpen, setIsPresetWindowOpen] = useState<boolean>(false);


    return (
        <div className="w-full bg-topbar p-4 flex justify-between sticky top-0 z-10">
            <h1 className="text-3xl block font-bold">Simple Deadlock Mod Manager 0.6.4</h1>
            <div className="flex gap-4">
                <Button onClick={onModAddClick}>Add Mod</Button>
                <Button ref={refs.setReference} onClick={() => setIsPresetWindowOpen(!isPresetWindowOpen)}>Presets</Button>
                {isPresetWindowOpen && (
                    <Presets setIsOpen={setIsPresetWindowOpen} style={floatingStyles} ref={refs.setFloating}/>
                )}
                <AddModModal modalOpen={addModModalOpen} setModalOpen={setAddModModalOpen}/>
                <Search/>
                <Button onClick={handleOpenSettingsModal}>Settings</Button>
                <Settings isOpen={openModal} onClose={handleCloseSettingsModal}/>
                <Button onClick={async () => {
                    try {
                        await applyModChanges();
                    } catch (error) {
                        setError(error as string);
                        setVisible(true);
                    }
                    //TODO: auto apply button in settings
                }}>Apply</Button>
            </div>
        </div>
    )
}

export default TopBar;