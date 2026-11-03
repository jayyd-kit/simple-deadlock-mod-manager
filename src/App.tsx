import "./style.css";
import TopBar from "./components/TopBar/TopBar.tsx";
import ModTab, {ModTabVariant} from "./components/ModTab/ModTab.tsx";
import {useModsStore} from "./stores/useModsStore.ts";
import {useEffect, useState} from "react";
import LoadModButtons from "./components/LoadModButtons/LoadModButtons.tsx";
import ErrorSnackbar from "./components/ErrorSnackbar/ErrorSnackbar.tsx";
import {useErrorStore} from "./stores/useErrorStore.ts";
import DragDrop from "./components/DragDrop/DragDrop.tsx";
import DeleteModal from "./components/DeleteModal/DeleteModal.tsx";
import FileSelectModal from "./components/FileSelect/FileSelectModal.tsx";
import LoadingSnackBar from "./components/LoadingSnackbar/LoadingSnackBar.tsx";
import ManageModModal from "./components/Mod/ManageModModal/ManageModModal.tsx";


function App() {

    const {setError, setVisible} = useErrorStore();
    const {mods, setMods, getModsFromRust} = useModsStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMods();
    }, [])

    const getMods = async () => {
        try {
            setMods(await getModsFromRust())
        } catch (error) {
            setVisible(true);
            setError(error as string);
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex h-full flex-col">
            <TopBar/>
            <div className="flex flex-1 gap-4">
                <DeleteModal/>
                <ModTab variant={ModTabVariant.UnloadedMods} mods={mods.unloaded_mods} loading={loading}/>
                <LoadModButtons/>
                <ModTab variant={ModTabVariant.LoadedMods} mods={mods.loaded_mods} loading={loading}/>
            </div>
            <DragDrop/>
            <FileSelectModal/>
            <ErrorSnackbar/>
            <LoadingSnackBar/>
            <ManageModModal/>
        </main>
    );
}

export default App;


