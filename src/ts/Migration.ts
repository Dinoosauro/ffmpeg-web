import ConversionOptions from "./TabOptions/ConversionOptions";
import InputOptions from "./TabOptions/InputOptions";
import MergeOptions from "./TabOptions/MergeOptions";
import MetadataOptions from "./TabOptions/MetadataOptions";
import Settings from "./TabOptions/Settings";

interface OldSelection {
    ref: string,
    value: string | boolean
}
interface OldCustomTheme {
    name: string,
    color: any,
    custom: string
}
if (localStorage.getItem("ffmpegWeb-MigrationV3Completed") !== "a") {
    localStorage.setItem("ffmpegWeb-MigrationV3Completed", "a");
    for (const { ref, value } of (JSON.parse(localStorage.getItem("ffmpegWeb-LastSelection") ?? "[]") as OldSelection[])) {
        const [bool, str] = [typeof value === "string" ? value === "true" : value, value.toString()];
        switch (ref) {
            case "#vidOutput":
                ConversionOptions.isVideoSelected = bool;
                break;
            case "#audOutput":
                ConversionOptions.isAudioSelected = bool;
                break;
            case "#keepAlbumArt":
                MergeOptions.keepAlbumArt = bool;
                break;
            case "#mp4Keep":
                MetadataOptions.keepMP4Thumbnail = bool;
                break;
            case "#metadataKeep":
                MetadataOptions.keepCurrentMetadata = bool;
                break;
            case "#smartMetadata":
                ConversionOptions.trimOptions.multipleTimestamps.smartMetadata = bool;
                break;
            case "#removeOlderArt":
                MetadataOptions.deleteVideo = bool;
                break;
            case "#checkFps":
                ConversionOptions.videoOptions.fps.keepFps = bool;
                break;
            case "#checkOrientation":
                ConversionOptions.videoOptions.aspectRatio.isBeingEdited = bool;
                break;
            case "#checkPixelSpace":
                ConversionOptions.videoOptions.pixelSpace.change = bool;
                break;
            case "#albumArtCheck":
                ConversionOptions.audioOptions.keepAlbumArt = bool;
                break;
            case "#saveFiles":
                Settings.fileSaver.keepInMemory = bool;
                break;
            case "#deinterlaceCheck":
                ConversionOptions.videoOptions.extraFilters.deinterlace = bool;
                break;
            case "#zipSave":
                Settings.storageMethod = "zip";
                break;
            case "#cutVideoSelect":
                ConversionOptions.trimOptions.id = +str;
                break;
            case "#trackStart":
                ConversionOptions.trimOptions.multipleTimestamps.startFrom = +str;
                break;
            case "[data-select=bitrate][data-child=vid]":
                ConversionOptions.videoOptions.useSlider = str === "0";
                break;
            case "[data-update=vidBitLength]:not([type=range])":
                if (!ConversionOptions.videoOptions.useSlider) ConversionOptions.videoOptions.value = str;
                break;
            case "[data-update=vidBitLength][type=range]":
                if (ConversionOptions.videoOptions.useSlider) ConversionOptions.videoOptions.value = str;
                break;
            case "#orientationChoose":
                ConversionOptions.videoOptions.aspectRatio.rotation = Math.max(+str, 0);
                break;
            case "#pixelSpace":
                ConversionOptions.videoOptions.pixelSpace.change = (str || "") !== "";
                ConversionOptions.videoOptions.pixelSpace.with = str;
                break;
            case "[data-select=bitrate][data-child=aud]":
                ConversionOptions.audioOptions.useSlider = str === "0";
                break;
            case "[data-update=audBitLength]:not([type=range])":
                if (!ConversionOptions.audioOptions.useSlider) ConversionOptions.audioOptions.value = str;
                break;
            case "[data-update=audBitLength][type=range]":
                if (ConversionOptions.audioOptions.useSlider) ConversionOptions.audioOptions.value = str;
                break;
            case "#audioChannelSelect":
                ConversionOptions.audioOptions.channels = +str;
                break;
            case "#volumeRange":
                ConversionOptions.audioOptions.extraFilters.audioDB = +str;
                break;
            case "#noiseFloorReduction":
                ConversionOptions.audioOptions.extraFilters.noiseRemoval.floor = str;
                break;
            case "#customAudio":
                ConversionOptions.audioOptions.extraFilters.custom = str;
                break;
            case "#cropWidth":
                ConversionOptions.videoOptions.extraFilters.videoCut.width = +str;
                break;
            case "#cropHeight":
                ConversionOptions.videoOptions.extraFilters.videoCut.height = +str;
                break;
            case "#positionItemX":
                ConversionOptions.videoOptions.extraFilters.videoCut.positionX = str;
                break;
            case "#positionItemY":
                ConversionOptions.videoOptions.extraFilters.videoCut.positionY = str;
                break;
            case "#curveSelect":
                ConversionOptions.videoOptions.extraFilters.videoFilter = str;
                if (str !== "none") {
                    ConversionOptions.videoOptions.pixelSpace.change = true;
                    ConversionOptions.videoOptions.pixelSpace.with = "yuv420p";
                }
                break;
            case "#customVideo":
                ConversionOptions.videoOptions.extraFilters.custom = str;
                break;
            case "#hwAccelSelect":
                Settings.hardwareAcceleration.type = str;
                break;
        }
    };
    const getHWArgs = JSON.parse(localStorage.getItem("ffmpegWeb-Argshwaccel") ?? "[]");
    if (Array.isArray(getHWArgs)) Settings.hardwareAcceleration.additionalProps = getHWArgs.filter(e => typeof e === "string").map((e: any) => { return { id: crypto.randomUUID(), display: e } });
    const getCustomArgs = JSON.parse(localStorage.getItem("ffmpegWeb-Argscustom") ?? "[]");
    if (Array.isArray(getCustomArgs)) InputOptions.val = getCustomArgs.filter((e: any) => typeof e === "string").map((e: any) => { return { id: crypto.randomUUID(), display: e } });
    const prepareCustomTheme: any = {};
    const parseOldThemes = JSON.parse(localStorage.getItem("ffmpegWeb-customThemes") ?? JSON.stringify({ themes: [] }));
    for (const theme of parseOldThemes.themes as OldCustomTheme[]) prepareCustomTheme[theme.name] = theme.color;
    localStorage.setItem("ffmpegWeb-CustomThemes", JSON.stringify(prepareCustomTheme));
    const currentThemeName = localStorage.getItem("ffmpegWeb-currentTheme");
    if (currentThemeName) {
        const findTheme = (parseOldThemes.themes as OldCustomTheme[]).find((item) => item.custom === currentThemeName);
        if (findTheme) localStorage.setItem("ffmpegWeb-CurrentTheme", JSON.stringify([findTheme.name, false])); else {
            switch (currentThemeName) {
                case "a0":
                    localStorage.setItem("ffmpegWeb-CurrentTheme", JSON.stringify(["Dracula Dark", true]));
                    break;
                case "a1":
                    localStorage.setItem("ffmpegWeb-CurrentTheme", JSON.stringify(["Simple Dark", true]));
                    break;
                case "a2":
                    localStorage.setItem("ffmpegWeb-CurrentTheme", JSON.stringify(["Simple Light", true]));
                    break;
            }
        }
    }
    const alertDuration = localStorage.getItem("ffmpegWeb-alertDuration");
    if (alertDuration) Settings.alerts.time = +alertDuration;
    const ignoredAlerts = (localStorage.getItem("ffmpegWeb-ignoredAlert") ?? "").split(",");
    if (ignoredAlerts.length > 1) Settings.alerts.ignored = ignoredAlerts;
    Settings.alerts.show = localStorage.getItem("ffmpegWeb-showAlert") !== "b";
    Settings.language = localStorage.getItem("ffmpegWeb-CurrentLanguage") ?? "en"; // TODO: Implement language change
    localStorage.setItem("ffmpegWeb-SavePreferences", localStorage.getItem("ffmpegWeb-StoreOnlySettings") !== "b" ? "b" : "a");
}