interface EncoderInfo {
    displayName: string,
    extension: string,
    isLossless?: boolean,
    nvidia?: string,
    apple?: string,
    amd?: string,
    intel?: string,
    vaapi?: string
    NoHardwareAcceleration?: undefined // Note: this MUST NOT be added in the map. This is just a bad solution to tell the build script to not get the hardware accelerated codec if using WebAssembly
}
export default {
    video: new Map<string, EncoderInfo>([
        ["copy", { displayName: "Copy from input file", extension: "!" }],
        ["libx264", { displayName: "H264", extension: "mp4", nvidia: "h264_nvenc", intel: "h264_qsv", amd: "h264_amf", apple: "h264_videotoolbox", vaapi: "h264_vaapi" }],
        ["libx265", { displayName: "H265", extension: "mp4", nvidia: "hevc_nvenc", intel: "hevc_qsv", amd: "hevc_amf", apple: "hevc_videotoolbox", vaapi: "hevc_vaapi" }],
        ["libvpx-vp9", { displayName: "VP9", extension: "webm", nvidia: "vp9_nvenc", intel: "vp9_qsv", amd: "vp9_amf", vaapi: "vp9_vaapi" }],
        ["libvpx", { displayName: "VP8", extension: "webm", nvidia: "vp8_nvenc", intel: "vp8_qsv", amd: "vp8_amf", vaapi: "vp8_vaapi" }],
        ["libaom-av1", { displayName: "AV1", extension: "mp4", vaapi: "av1_vaapi", intel: "av1_qsv", amd: "av1_amf", nvidia: "av1_nvenc" }],
        ["libtheora", { displayName: "Theora", extension: "ogg" }],
        ["wmv1", { displayName: "Windows Media Video (7)", extension: "wmv" }],
        ["wmv2", { displayName: "Windows Media Video (8)", extension: "wmv" }]
    ]),
    audio: new Map<string, EncoderInfo>([
        ["copy", { displayName: "Copy from input file", extension: "!" }],
        ["libmp3lame", { displayName: "MP3", extension: "mp3" }],
        ["aac", { displayName: "AAC [aac]", extension: "m4a" }],
        ["libfdk_aac", { displayName: "AAC [libfdk_aac]", extension: "m4a" }],
        ["!0", { displayName: "Wave", extension: "wav", isLossless: true }],
        ["alac", { displayName: "Alac", extension: "m4a", isLossless: true }],
        ["flac", { displayName: "Flac", extension: "flac", isLossless: true }],
        ["libopus", { displayName: "Opus", extension: "ogg" }],
        ["libvorbis", { displayName: "Vorbis", extension: "ogg" }],
        ["wmav1", { displayName: "Windows Media Audio 1", extension: "wma" }],
        ["wmav2", { displayName: "Windows Media Audio 2", extension: "wma" }]
    ]),
    image: new Map<string, EncoderInfo>([
        ["!0", { displayName: "Bitmap", extension: "bmp" }],
        ["gif", { displayName: "GIF", extension: "gif" }],
        ["!1", { displayName: "JPEG", extension: "jpg" }],
        ["png", { displayName: "PNG", extension: "png" }],
        ["tiff", { displayName: "TIFF", extension: "tiff" }],
        ["libwebp", { displayName: "WebP", extension: "webp" }],
        ["apng", { displayName: "Animated PNG", extension: "apng" }],
        ["jpeg2000", { displayName: "JPEG 2000", extension: "jpg" }],
        ["jpegls", { displayName: "JPEG-LS", extension: "jpg" }],
        ["ljpeg", { displayName: "Lossless JPEG", extension: "jpg" }]
    ])
}