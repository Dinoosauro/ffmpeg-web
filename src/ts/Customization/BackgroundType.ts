import IndexedDatabase from "../Storage/IndexedDatabase";
import Settings from "../TabOptions/Settings"


export default class BackgroundManager {
    /**
     * The element where the new image/video/iframe will be appended
     */
    #output!: HTMLElement;
    constructor(output: HTMLElement) {
        this.#output = output;
    }
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
                    img.src = URL.createObjectURL(entry.blob);
                    img.onload = () => {
                        img instanceof HTMLVideoElement && img.play();
                        this.filter(screenSaver);
                        !screenSaver && this.changeCardEffect();
                        resolve()
                    };
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
                    iframe.src = this.#getYoutubeUrl(await url.blob.text()); // Format the URL
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
    set = async (content: Blob, screenSaver?: boolean) => {
        await IndexedDatabase.set({ db: await IndexedDatabase.db(), object: { UserContent: `${screenSaver ? "Screensaver" : "Background"}${Settings.backgroundContent.type === "image" ? "Image" : Settings.backgroundContent.type === "video" ? "Video" : "YT"}`, blob: content } });
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