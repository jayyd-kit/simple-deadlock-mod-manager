import {useErrorStore} from "../../stores/useErrorStore.ts";
import {Modal} from "@mui/material";
import Button from "../Button/Button.tsx";
import {open} from "@tauri-apps/plugin-dialog";
import {downloadDir} from "@tauri-apps/api/path";
import processFiles from "../../utils/files.ts";
import {useModsStore} from "../../stores/useModsStore.ts";
import {useFileSelectStore} from "../../stores/useFileSelectStore.ts";
import {useEffect, useRef, useState} from "react";
import {downloadModCommand, onDownloadEnd, onDownloadProgress, onDownloadStart} from "../../generated";
import {UnlistenFn} from "@tauri-apps/api/event";
import {useLoadingStore} from "../../stores/useLoadingStore.ts";

function AddModModal({modalOpen, setModalOpen}: { modalOpen: boolean, setModalOpen: (open: boolean) => void }) {
    const {setVisible, setError} = useErrorStore();
    const {getModsFromRust, setMods} = useModsStore();
    const fileSelectStore = useFileSelectStore();
    const [downloadUrl, setDownloadUrl] = useState("");
    const {setIsLoading} = useLoadingStore();


    //download progress
    const downloadProgressRegistered = useRef(false);
    const [downloadProgress, setDownloadProgress] = useState<number>(0);
    useEffect(() => {
        if (downloadProgressRegistered.current) return;
        downloadProgressRegistered.current = true;
        let onDownloadProgressUnlisten: UnlistenFn;

        onDownloadProgress((e) => {
            setDownloadProgress(e.progressPercent)
        }).then((fn) => {
            onDownloadProgressUnlisten = fn
        })
        return () => {
            if (onDownloadProgressUnlisten) onDownloadProgressUnlisten()
        }
    }, [])

    //download start
    const downloadStartRegistered = useRef(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [numberOfFiles, setNumberOfFiles] = useState(0);
    useEffect(() => {
        if (downloadStartRegistered.current) return;
        downloadStartRegistered.current = true;
        let onDownloadStartUnlisten: UnlistenFn;

        onDownloadStart((e) => {
            setIsDownloading(true);
            setNumberOfFiles(e.numberOfFiles);
        }).then((fn) => onDownloadStartUnlisten = fn)
        return () => {
            if (onDownloadStartUnlisten) onDownloadStartUnlisten()
        }
    }, []);

    //download end
    const downloadEndRegistered = useRef(false);
    const [numberOfFilesCompleted, setNumberOfFilesCompleted] = useState(1);
    useEffect(() => {
        if (downloadEndRegistered.current) return;
        downloadEndRegistered.current = true;
        let onDownloadEndUnlisten: UnlistenFn;

        onDownloadEnd((_) => {
            setNumberOfFilesCompleted(numberOfFilesCompleted + 1)
        })
            .then(fn => onDownloadEndUnlisten = fn)

        return () => {
            if (onDownloadEndUnlisten) onDownloadEndUnlisten()
        }
    }, []);

    const onBrowseButtonClick = async () => {
        try {
            const files = await open({
                multiple: true,
                directory: false,
                defaultPath: await downloadDir(),
                filters: [
                    {
                        name: "Vpk files",
                        extensions: ["vpk"]
                    },
                    {
                        name: "Compressed files",
                        extensions: ["zip", "rar", "7z"]
                    }
                ]
            })

            if (files) {
                setIsLoading(true);
                await processFiles({
                    files,
                    setFilePaths: fileSelectStore.setFilePaths,
                    setFileSelectModalOpen: fileSelectStore.setModalOpen
                });
                setMods(await getModsFromRust());
                setIsLoading(false);
            }
        } catch (error) {
            setVisible(true);
            setError(error as string);
        } finally {
            setModalOpen(false);
        }
    }

    const onDownloadButtonClick = async () => {
        try {
            if (downloadUrl !== "") {
                let paths = await downloadModCommand({url: downloadUrl});
                setIsLoading(true);
                await processFiles({
                    files: paths,
                    setFilePaths: fileSelectStore.setFilePaths,
                    setFileSelectModalOpen: fileSelectStore.setModalOpen
                });
                setMods(await getModsFromRust());
                setIsLoading(false);
            }
        } catch (error) {
            setVisible(true);
            setError(error as string);
        } finally {
            onModalClose();
        }
    }

    const onModalClose = () => {
        if (isDownloading) return;
        setDownloadUrl("");
        downloadProgressRegistered.current = false;
        setDownloadProgress(0);
        downloadStartRegistered.current = false;
        setIsDownloading(false);
        setNumberOfFiles(0);
        downloadEndRegistered.current = false;
        setNumberOfFilesCompleted(0);
        setModalOpen(false);
    }

    return (
        <Modal open={modalOpen} onClose={onModalClose}>
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/4 h-2/8 bg-darkBlue rounded-md min-w-160 min-h-100 flex flex-col">
                <div className="mt-8 mx-8">
                    <div className="font-bold text-3xl">Add a mod</div>
                </div>
                <div className="flex-1 flex flex-col gap-4 mx-8 mt-8 ">
                    <div className="text-xl flex h-fit justify-between w-full">
                        Pick a .vpk or .zip/.rar file
                        <Button onClick={onBrowseButtonClick}>Browse</Button>
                    </div>
                    <div className="text-xl mb-2">
                        Download from GameBanana
                        <div className="flex">
                            <div className="bg-gray-800 grow mr-2">
                                <input className="text-lg m-1 w-full mr-2" type={"text"}
                                       onChange={(e) => setDownloadUrl(e.currentTarget.value)} onKeyDown={async (e) => {
                                    if (e.key === "Enter") {
                                        await onDownloadButtonClick();
                                    }
                                }}/>
                            </div>
                            <Button onClick={onDownloadButtonClick}>Download</Button>
                        </div>
                        {isDownloading &&
                            <>
                                <div className="mt-8">Download progress of
                                    file {`${numberOfFilesCompleted} / ${numberOfFiles}`}</div>
                                <progress max={100} value={downloadProgress}
                                          className={"w-full [&::-webkit-progress-value]:bg-spiritItem [&::-moz-progress-bar]:bg-spiritItem [&::-webkit-progress-bar]:bg-gray-800"}/>
                            </>
                        }
                    </div>
                </div>
                <div className="mb-4 mx-4 flex justify-between">
                    <Button onClick={onModalClose}>Cancel</Button>
                </div>
            </div>
        </Modal>
    )
}

export default AddModModal;