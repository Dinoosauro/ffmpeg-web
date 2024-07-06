import UpdateJsonProperties from "../UpdateJSONProperties";
import Settings from "./Settings";

let MergeOptions = {
    fileName: "",
    keepAlbumArt: false
}
if (localStorage.getItem("ffmpegWeb-SavePreferences") !== "a") {
    const json = JSON.parse(localStorage.getItem("ffmpegWeb-LastMergeSettings") ?? "{}");
    MergeOptions = UpdateJsonProperties(json, MergeOptions);
}
window.addEventListener("beforeunload", () => localStorage.getItem("ffmpegWeb-SavePreferences") !== "a" && localStorage.setItem(`ffmpegWeb-LastMergeSettings`, JSON.stringify(MergeOptions)));
export default MergeOptions;