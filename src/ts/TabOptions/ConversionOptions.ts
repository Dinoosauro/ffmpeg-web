import UpdateJsonProperties from "../UpdateJSONProperties";
import Settings from "./Settings";

let ConversionOptions = {
    isAudioSelected: true,
    isVideoSelected: true,
    videoTypeSelected: "libx264",
    audioTypeSelected: "aac",
    imageTypeSelected: "png",
    videoOptions: {
        useSlider: true,
        value: "22",
        fps: {
            keepFps: true,
            inputFps: 30,
            outputFps: 30
        },
        aspectRatio: {
            isBeingEdited: false,
            width: -1,
            height: -1,
            rotation: -1
        },
        pixelSpace: {
            change: false,
            with: ""
        },
        extraFilters: {
            videoCut: {
                width: -1,
                height: -1,
                positionX: "center-w",
                positionY: "center-h"
            },
            deinterlace: false,
            videoFilter: "none",
            custom: ""
        }
    },
    audioOptions: {
        useSlider: true,
        value: "6",
        channels: -1,
        keepAlbumArt: false,
        extraFilters: {
            audioDB: 0,
            noiseRemoval: {
                noise: 0,
                floor: ""
            },
            custom: ""
        }
    },
    imageOptions: {
        useSlider: true,
        value: "80"
    },
    forceCopyMetadata: false,
    conversionOption: 4,
    folderSelect: false,
    trimOptions: {
        id: 0,
        singleTimestamp: ["", ""],
        multipleTimestamps: {
            text: "",
            divider: "",
            timestampAtLeft: true,
            smartMetadata: false,
            startFrom: 1
        }
    }
};
if (localStorage.getItem("ffmpegWeb-SavePreferences") !== "a") {
    const json = JSON.parse(localStorage.getItem("ffmpegWeb-LastSettings") ?? "{}");
    ConversionOptions = UpdateJsonProperties(json, ConversionOptions);
}
window.addEventListener("beforeunload", () => localStorage.getItem("ffmpegWeb-SavePreferences") !== "a" && localStorage.setItem(`ffmpegWeb-LastSettings`, JSON.stringify(ConversionOptions)));
export default ConversionOptions;