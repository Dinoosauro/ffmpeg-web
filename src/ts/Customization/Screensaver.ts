import Settings from "../TabOptions/Settings";
import { showScreensaver } from "../Writables";
/**
 * The number that identifies the timeout created, so that it can be deleted if the user presses somewhere in the screen
 */
let currentTimeout: number | undefined;
/**
 * The number of ms of when the screensaver has been applied. This is done so that there's a minimum of ms before removing it
 */
let screensaverActivationTime = Date.now();
function handleScreensaver() {
    if (!Settings.screenSaver.enabled || (Date.now() - screensaverActivationTime) < 1500) return;
    showScreensaver.set(false);
    clearTimeout(currentTimeout);
    currentTimeout = setTimeout(() => {
        if (!Settings.screenSaver.enabled) return;
        showScreensaver.set(true);
        screensaverActivationTime = Date.now();
    }, Settings.screenSaver.timeout) as unknown as number
}
for (const item of ["mousemove", "pointermove", "touchmove", "scroll", "keypress"]) window.addEventListener(item, handleScreensaver);
