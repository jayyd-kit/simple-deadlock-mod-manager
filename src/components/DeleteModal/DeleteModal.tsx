import {Modal} from "@mui/material";
import {useDeleteStore} from "../../stores/useDeleteStore.ts";
import {Textfit} from "react-textfit";
import Button from "../Button/Button.tsx";
import {useErrorStore} from "../../stores/useErrorStore.ts";
import {deleteMod} from "../../generated";
import {useModsStore} from "../../stores/useModsStore.ts";

function DeleteModal() {
    const {modalOpen, setModalOpen, fileNames, userNames} = useDeleteStore();
    const {setMods, getModsFromRust} = useModsStore()
    const {setError, setVisible} = useErrorStore();
    const onDeleteClick = async () => {
        try {
            for (const fileName of fileNames) {
                await deleteMod({fileName: fileName});
            }
            setMods(await getModsFromRust());
        } catch (e) {
            setVisible(true);
            setError(e as string);
        } finally {
            setModalOpen(false);
        }
    }
    return (
        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
            <div
                className="absolute top-1/2 left-1/2 -translate-1/2 w-2/8 h-2/14 bg-darkBlue rounded-md min-w-100 min-h-30">
                <div className="flex flex-col justify-around h-full w-full">
                    <div className="text-center w-full">
                        <Textfit mode={"multi"}>
                            Are you sure you want to delete these mods?
                            {fileNames.map((_, idx) => (
                                <div>
                                    - <span className="font-bold">"{userNames[idx]}"</span> ({fileNames[idx]})
                                </div>
                            ))}
                        </Textfit>
                    </div>
                    <div className="w-full flex justify-between px-4">
                        <Button onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button onClick={onDeleteClick}>Delete</Button>
                    </div>
                </div>
            </div>
        </Modal>
    )
}

export default DeleteModal;

