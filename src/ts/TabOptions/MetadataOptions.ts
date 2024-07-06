import UpdateJsonProperties from "../UpdateJSONProperties";
import Settings from "./Settings";

interface Metadata {
    keepCurrentMetadata: boolean;
    keepMP4Thumbnail: boolean;
    metadataAdded: { key: string, value: string, id: string, custom?: boolean }[],
    customAlbumArt: File | false,
    deleteVideo: boolean
}
let MetadataOptions: Metadata = {
    keepCurrentMetadata: true,
    keepMP4Thumbnail: true,
    customAlbumArt: false,
    deleteVideo: false,
    metadataAdded: []
}
if (localStorage.getItem("ffmpegWeb-SavePreferences") !== "a") {
    const json = JSON.parse(localStorage.getItem("ffmpegWeb-LastMetadataEditOptions") ?? "{}");
    MetadataOptions = UpdateJsonProperties(json, MetadataOptions);
}
window.addEventListener("beforeunload", () => localStorage.getItem("ffmpegWeb-SavePreferences") !== "a" && localStorage.setItem(`ffmpegWeb-LastMetadataEditOptions`, JSON.stringify({ ...MetadataOptions, customAlbumArt: false, metadataAdded: [] })))
export default MetadataOptions;