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
        maxRate: "1000k",
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
    },
    audioToVideo: {
        ms: 2000,
        extension: "mkv",
        fps: 1,
        videoBitrate: "1100k",
        audioBitrate: "192k",
        font: "Work Sans",
        content: {
            /**
             * Show album art
             */
            showAlbumArt: true,
            /**
             * Show essential metadata information
             */
            showQuickInfo: true,
            /**
             * Show all metadata information
             */
            showMetadataRecap: true,
            /**
             * Show the selected custom background image
             */
            showImportedImage: false
        },
        scale: 2,
        /**
         * Save temporary images on device
         */
        saveTemp: false,
        /**
         * Disable 0.11.x only for this section (since it's unstable)
         */
        disable011: true,
        /**
         * Get loop from audio duration. Disable it if you're having issues with the length of the file.
         */
        useDuration: true,
        /**
         * Set `max_interleave_delta` to 0. This *might* help fixing wrong timestamps in Matroska files.
         */
        useInterleaveDelta: false,
        /**
         * Restore presentation timestamps to START. This *might* help fixing wrong timestamps.
         */
        restorePTS: false
    }
};
if (localStorage.getItem("ffmpegWeb-SavePreferences") !== "a") {
    const json = JSON.parse(localStorage.getItem("ffmpegWeb-LastSettings") ?? "{}");
    ConversionOptions = UpdateJsonProperties(json, ConversionOptions);
}
window.addEventListener("beforeunload", () => localStorage.getItem("ffmpegWeb-SavePreferences") !== "a" && localStorage.setItem(`ffmpegWeb-LastSettings`, JSON.stringify(ConversionOptions)));
export default ConversionOptions;