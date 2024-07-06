import Settings from "../TabOptions/Settings";

export default new class {
    /**
     * Save the new custom theme
     * @param name the name of the custom theme
     * @param keys an object, with the CSS property as a key and its value as the object
     */
    saveTheme = (name: string, keys: any) => {
        localStorage.setItem("ffmpegWeb-CustomThemes", JSON.stringify({ ...JSON.parse(localStorage.getItem("ffmpegWeb-CustomThemes") ?? "{}"), [name]: keys }));
        this.applyTheme(name, false);
    }
    /**
     * Apply a custom theme
     * @param name the name of the theme to apply
     * @param isDefault if it's a standard theme (or, if false or undefined, if it's a custom one)
     */
    applyTheme = (name: string, isDefault?: boolean) => {
        const theme = isDefault ? this.standardThemes[name as "Dracula Dark"] : JSON.parse(localStorage.getItem("ffmpegWeb-CustomThemes") ?? "{}")[name];
        if (!theme) return;
        for (let key in theme) document.body.style.setProperty(key, theme[key]);
        localStorage.setItem("ffmpegWeb-CurrentTheme", JSON.stringify({ name, isDefault }));
        if (!Settings.backgroundContent.allowCardBlur) { // Fixes for WebKit, since (obviously) things work differently there compared to decent browsers.
            document.body.style.setProperty("--card0Color", "var(--card)");
            document.body.style.setProperty("--card1Color", "var(--row)");
        }
        this.applyCustomSelect();
    }
    /**
     * Add the text color to the select arrow
     */
    applyCustomSelect = () => {
        let getSelect = (document.getElementById("customSelectColor") as HTMLStyleElement);
        let startSelect = getSelect.innerHTML.lastIndexOf("fill=") + 6;
        getSelect.innerHTML = `${getSelect.innerHTML.substring(0, startSelect)}${encodeURIComponent(getComputedStyle(document.body).getPropertyValue("--text"))}${getSelect.innerHTML.substring(getSelect.innerHTML.indexOf("'", startSelect))}`;
    }
    /**
     * The container of standard themes
     */
    standardThemes = {
        "Dracula Dark": {
            "--text": "#fcf7f2",
            "--background": "#282a36",
            "--card": "#44475A",
            "--row": "#787b90",
            "--select": "#30abb6"
        },
        "Simple Dark": {
            "--text": "#fcf7f2",
            "--background": "#191919",
            "--card": "#393939",
            "--row": "#6b6b6b",
            "--select": "#e2b54c"
        },
        "Simple Light": {
            "--text": "#171717",
            "--background": "#f5f5f5",
            "--card": "#d3d3d3",
            "--row": "#b9b9b9",
            "--select": "#c03b43"
        }
    }
}