import Button from "../Button/Button.tsx";
import Options from "../Options/Options.tsx";
import {useState} from "react";
import {useModsStore} from "../../stores/useModsStore.ts";
import {useErrorStore} from "../../stores/useErrorStore.ts";
import AddModModal from "../AddMod/AddModModal.tsx";
import Search from "../Search/Search.tsx";


function TopBar() {

    const {applyModChanges} = useModsStore();
    const {setError, setVisible} = useErrorStore();
    const [addModModalOpen, setAddModModalOpen] = useState(false);

    const onModAddClick = async (): Promise<void> => {
        setAddModModalOpen(true);
    }

    const [openModal, setOpenModal] = useState<boolean>(false)
    const handleOpenModal = () => setOpenModal(true)
    const handleCloseModal = () => setOpenModal(false)

    return (
        <div className="w-full bg-topbar p-4 flex justify-between sticky top-0 z-10">
            <h1 className="text-3xl block font-bold">Simple Deadlock Mod Manager 0.6.4</h1>
            <div className="flex gap-4">
                <Button onClick={onModAddClick}>Add Mod</Button>
                <AddModModal modalOpen={addModModalOpen} setModalOpen={setAddModModalOpen}/>
                <Search/>
                <Button onClick={handleOpenModal}>Options</Button>
                <Options isOpen={openModal} onClose={handleCloseModal}/>
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