import {Modal} from "@mui/material";
import {useModManageStore} from "../../../stores/useModManageStore.ts";
import Button from "../../Button/Button.tsx";
import {changeModName} from "../../../generated";
import {useState} from "react";
import {useErrorStore} from "../../../stores/useErrorStore.ts";
import {useModsStore} from "../../../stores/useModsStore.ts";
import {useDeleteStore} from "../../../stores/useDeleteStore.ts";

function ManageModModal() {

    const {modManageModalOpen, fileName, userName, setModManageModalOpen} = useModManageStore();
    const {setMods, getModsFromRust} = useModsStore();
    const deleteStore = useDeleteStore();

    const [changedUserName, setChangedUserName] = useState<string>("");
    const {setVisible, setError} = useErrorStore();

    const onCloseModal = () => {
        setModManageModalOpen(false);
    }

    const onApply = async () => {
        setModManageModalOpen(false);
        if (changedUserName === "") {
            throw "User name cannot be blank";
        }
        await changeModName({userName: changedUserName, fileName});
        setMods(await getModsFromRust());
        onCloseModal();
    }

    const onDeleteButtonClick = () => {
        deleteStore.setFileName([fileName]);
        deleteStore.setUserName([userName]);
        deleteStore.setModalOpen(true);
        onCloseModal();
    }

    return (
        <Modal open={modManageModalOpen} onClose={onCloseModal}>
            <div
                className="absolute top-1/2 left-1/2 -translate-1/2 w-2/4 h-2/6 bg-darkBlue rounded-md min-w-160 min-h-100 flex flex-col">
                <div className="mt-8 ml-8 text-3xl font-extrabold">
                    Manage Mod
                </div>
                <div className="mx-8 mt-8 text-xl grow">
                    <div className="flex gap-2">
                        <label>File Name</label>
                        <div className="bg-gray-800 grow">{fileName}</div>
                    </div>
                    <div className="flex gap-2 mt-8">
                        <label>User Name</label>
                        <div className="bg-gray-800 grow">
                            <input id="pathInput" defaultValue={userName}
                                   onChange={(e) => {
                                       setChangedUserName(e.target.value)
                                   }}
                                   onKeyDown={async (e) => {
                                       if (e.key === "Enter") {
                                           try {
                                               await onApply();
                                           } catch (e) {
                                               setVisible(true);
                                               setError(e as string);
                                           }
                                       }
                                   }}
                                   className="text-lg m-1 w-full mr-1"/>
                        </div>
                    </div>
                    {/*<div className="flex gap-2 mt-8">
                        <label>GameBanana Link</label>
                        <div className="bg-gray-800 grow">WIP</div>
                    </div>*/}
                    <div className="flex gap-2 mt-8">
                        <Button onClick={onDeleteButtonClick}>Delete Mod</Button>
                    </div>
                </div>
                <div className="flex w-full justify-between px-8 mb-8 text-xl">
                    <Button onClick={onCloseModal}>Close</Button>
                    <Button onClick={onApply}>Apply</Button>
                </div>
            </div>
        </Modal>
    )
}

export default ManageModModal;