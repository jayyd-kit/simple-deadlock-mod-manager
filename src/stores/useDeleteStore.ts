import {create} from "zustand";

interface DeleteStore {
    fileNames: string[];
    setFileName: (fileName: string[]) => void;
    userNames: string[];
    setUserName: (userName: string[]) => void;
    modalOpen: boolean;
    setModalOpen: (modalOpen: boolean) => void;
}

export const useDeleteStore = create<DeleteStore>((set) => ({
    fileNames: [],
    setFileName: (fileName) => {
        set({fileNames: fileName})
    },
    userNames: [],
    setUserName: (userName) => {
        set({userNames: userName})
    },
    modalOpen: false,
    setModalOpen: (modalOpen: boolean) => {
        set({modalOpen})
    },
}))