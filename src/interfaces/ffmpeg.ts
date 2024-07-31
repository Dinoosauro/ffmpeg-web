export type FFmpegVersions = "0.11.x" | "0.12.x" | "native";
export interface FfmpegUrls {
    coreURL: string,
    wasmURL: string
}
export interface FfmpegConsole {
    operation: number,
    str: string
}
interface FfmpegEventDetails extends FfmpegConsole {
    progress: number
}
export interface FFmpegEvent extends CustomEvent {
    detail: FfmpegEventDetails
}