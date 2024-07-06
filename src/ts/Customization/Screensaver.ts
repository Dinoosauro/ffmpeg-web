import { get } from "svelte/store";
import Settings from "../TabOptions/Settings";
import { screensaverActivationTime, showScreensaver } from "../Writables";
/**
 * The number that identifies the timeout created, so that it can be deleted if the user presses somewhere in the screen
 */
let currentTimeout: number | undefined;
function handleScreensaver() {
    if (!Settings.screenSaver.enabled || (Date.now() - get(screensaverActivationTime)) < 1500) return;
    showScreensaver.set(false);
    clearTimeout(currentTimeout);
    currentTimeout = setTimeout(() => {
        if (!Settings.screenSaver.enabled) return;
        showScreensaver.set(true);
        screensaverActivationTime.set(Date.now());
    }, Settings.screenSaver.timeout) as unknown as number
}
for (const item of ["mousemove", "pointermove", "touchmove", "scroll", "keypress"]) window.addEventListener(item, handleScreensaver);
