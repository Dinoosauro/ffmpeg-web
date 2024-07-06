export default {
    /**
     * Make an element fullscreen, using Electron's native API if available
     * @param element the element to put in fullscreen
     */
    apply: (element: HTMLElement) => {
        typeof window.nativeOperations !== "undefined" ? window.nativeOperations.send("FullscreenChange", true) : element.requestFullscreen({ navigationUI: "hide" });
    },
    /**
     * Exit from fullscreen mode
     */
    remove: () => {
        typeof window.nativeOperations !== "undefined" ? window.nativeOperations.send("FullscreenChange", false) : document.exitFullscreen();
    }
}