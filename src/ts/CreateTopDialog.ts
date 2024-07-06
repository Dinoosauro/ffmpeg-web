import TopDialog from "../lib/UIElements/TopDialog.svelte";
import Settings from "./TabOptions/Settings";

/**
 * Create a new dialog at the top of the page
 * @param str the text to show
 * @param id the ID of the new dialog
 */
export default function CreateTopDialog(str: string, id: string) {
    if (Settings.alerts.ignored.indexOf(id) !== -1) return;
    const div = document.createElement("div");
    document.body.append(div);
    setTimeout(() => {
        const alert = new TopDialog({ target: div, props: { alternativeText: str, closeDialog: () => { alert.$destroy(); div.remove(); }, dialogId: id } });
    }, 25);

}