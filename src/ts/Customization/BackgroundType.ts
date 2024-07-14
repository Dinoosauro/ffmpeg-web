import IndexedDatabase from "../Storage/IndexedDatabase";
import Settings from "../TabOptions/Settings"

/**
 * Save the timeout of the image change so that multiple timeouts aren't set
 */
let changeTimeout: number[] = [];

export default class BackgroundManager {
    /**
     * The element where the new image/video/iframe will be appended
     */
    #output!: HTMLElement;
    constructor(output: HTMLElement) {
        this.#output = output;
    }
    /**
     * The number of the array that will be used for getting the image to show
     */
    #blobId = 0;
    /**
     * The previous number of video playback, and if the video should be changed if the previous number is greater than the current number.
     */
    #previousTimeId: [number, boolean] = [0, false];
    /**
     * Get the URL for the YouTube video embed
     * @param url the YouTube Embed ID
     * @returns the link for the YouTube video embed
     */
    #getYoutubeUrl = (url: string) => {
        return `https://www.youtube-nocookie.com/embed/${url}${url.indexOf("?") !== -1 ? "&" : "?"}autoplay=1&mute=1&loop=1`;
    }
    /**
     * Apply the previously stored backdrop to the output HTMLElement
     * @param screenSaver if the database entries should be the ones of the screensaver background
     */
    apply = (screenSaver?: boolean) => {
        return new Promise<void>(async (resolve) => {
            changeTimeout[screenSaver ? 1 : 0] && clearTimeout(changeTimeout[screenSaver ? 1 : 0]);
            this.#output.querySelector(".backgroundContent")?.remove();
            switch (Settings[`${screenSaver ? "screenSaver" : "backgroundContent"}`].type) {
                case "color":
                    this.changeCardEffect(true); // Disable backdrop
                    resolve();
                    return;
                case "image": case "video": {
                    const img = document.createElement(Settings[`${screenSaver ? "screenSaver" : "backgroundContent"}`].type === "image" ? "img" : "video");
                    img.classList.add("backgroundContent");
                    if (img instanceof HTMLVideoElement) {
                        img.autoplay = true;
                        img.loop = true;
                        img.muted = true;
                    }
                    const entry = await IndexedDatabase.get({ db: await IndexedDatabase.db(), query: `${screenSaver ? "Screensaver" : "Background"}${Settings[`${screenSaver ? "screenSaver" : "backgroundContent"}`].type === "image" ? "Image" : "Video"}` });
                    if (!entry) throw new Error("Failed image fetching");
                    const changeImage = async (timeout?: boolean) => {
                        this.#previousTimeId[1] = true;
                        const entry = await IndexedDatabase.get({ db: await IndexedDatabase.db(), query: `${screenSaver ? "Screensaver" : "Background"}${Settings[`${screenSaver ? "screenSaver" : "backgroundContent"}`].type === "image" ? "Image" : "Video"}` }); // Get again the Blob values since they might have changed since the last timeout
                        if (!entry) throw new Error("Failed image fetching");
                        if (Array.isArray(entry.blob) && entry.blob.length !== 1) { // Apply opacity transition
                            img.style.transition = "opacity 0.5s ease-in-out";
                            img.style.opacity = "0.05";
                            await new Promise((resolve) => setTimeout(resolve, 300));
                            setTimeout(() => { img.style.opacity = "1" }, 200); // Give the script 200ms to load the new image
                        }
                        URL.revokeObjectURL(img.src);
                        img.src = URL.createObjectURL((Array.isArray(entry.blob) ? entry.blob[this.#blobId] : entry.blob));
                        Array.isArray(entry.blob) && (entry.blob.length - 1) <= this.#blobId ? this.#blobId = 0 : this.#blobId++; // Avoid setting the #blobId value higher than the array length
                        if (timeout && Array.isArray(entry.blob) && img) changeTimeout[screenSaver ? 1 : 0] = setTimeout(() => changeImage(timeout), Settings[screenSaver ? "screenSaver" : "backgroundContent"].refreshImage); // Add a timeout (and not an interval, since the timeout length might be modified from Settings)
                    }
                    changeImage(img instanceof HTMLImageElement);
                    img.onload = () => {
                        this.filter(screenSaver);
                        img instanceof HTMLVideoElement && img.play();
                        !screenSaver && this.changeCardEffect();
                        resolve()
                    };
                    img.onplay = () => {
                        this.#previousTimeId[1] = false;
                        this.filter(screenSaver);
                    }
                    img.ontimeupdate = () => {
                        if (!(img instanceof HTMLVideoElement)) return;
                        this.#previousTimeId[0] > img.currentTime && !this.#previousTimeId[1] && changeImage(); // Since the new video has started (this.#previousTimeId[1] is false), the application needs to keep track if it has finished or not
                        this.#previousTimeId[0] = img.currentTime;
                    }
                    img.onerror = () => { throw new Error("Failed image loading") }
                    this.#output.append(img);
                    break;
                }
                case "yt": {
                    let mainDiv = document.createElement("div");
                    mainDiv.classList.add("backgroundContent", "video-background");
                    let iframe = document.createElement("iframe");
                    let url = await IndexedDatabase.get({ db: await IndexedDatabase.db(), query: `${screenSaver ? "Screensaver" : "Background"}YT` }) // The video/playlist ID is stored as a Blob
                    if (!url) return;
                    iframe.allow = "autoplay"
                    iframe.frameBorder = "0";
                    iframe.setAttribute("credentialless", ""); // This is necessary to load the iframe with Cross-Origin Embed Policy
                    iframe.src = this.#getYoutubeUrl(await (Array.isArray(url.blob) ? url.blob[0] : url.blob).text()); // Format the URL
                    mainDiv.append(iframe);
                    this.#output.append(mainDiv);
                    resolve();
                    break;
                }
            }

        });
    }
    /**
     * Set a file as the background content
     * @param content the Blob to save
     * @param screenSaver if the item should be saved in the ScreenSaver keys
     */
    set = async (content: Blob[], screenSaver?: boolean) => {
        const db = await IndexedDatabase.db();
        const query = `${screenSaver ? "Screensaver" : "Background"}${Settings.backgroundContent.type === "image" ? "Image" : Settings.backgroundContent.type === "video" ? "Video" : "YT"}`;
        const getResource = await IndexedDatabase.get({ db, query });
        const blobs: Blob[] = [];
        blobs.push(...(Array.isArray(getResource?.blob) ? [...getResource.blob, ...content] : getResource?.blob !== undefined ? [getResource.blob, ...content] : content));
        await IndexedDatabase.set({ db: await IndexedDatabase.db(), object: { UserContent: query, blob: blobs } });
        await this.apply();
    }
    /**
     * Apply CSS filters to the backgroundContent
     * @param screenSaver if the filters should be the ones of the screensaver or not
     */
    filter = (screenSaver?: boolean) => {
        const content = this.#output.querySelector(".backgroundContent") as HTMLElement | null;
        if (!content) throw new Error("No background content available");
        content.style.filter = `blur(${Settings[`${screenSaver ? "screenSaver" : "backgroundContent"}`].effects.blur}px) brightness(${Settings[`${screenSaver ? "screenSaver" : "backgroundContent"}`].effects.brightness}%)`;
    }
    /**
     * Add or remove a backdrop filter to cards
     * @param normal disable card backdrop filter
     */
    changeCardEffect = (normal?: boolean) => {
        if (!Settings.backgroundContent.allowCardBlur) normal = true;
        document.body.style.setProperty("--cardBackdropShow", normal ? "none" : "block"); // Display property for the ::before backdrop
        document.body.style.setProperty("--card0Color", normal ? "var(--card)" : "Invalid"); // Default card color
        document.body.style.setProperty("--card1Color", normal ? "var(--row)" : "Invalid"); // Default card color
    }

}