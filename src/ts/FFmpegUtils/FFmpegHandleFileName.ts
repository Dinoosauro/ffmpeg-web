import Settings from "../TabOptions/Settings";
/**
 * According to the properties available of the file, get the path that'll be used for the FFmpeg command.
 * @param file the File object that'll be used for getting the path
 * @returns the path to use for FFmpeg
 */
export default function FFmpegFileNameHandler(file: File) {
    const suggestedVersion = Settings.version as "0.11.x" | "native";
    if (!(file instanceof File)) return file;
    return (suggestedVersion === "native" ? file.path : undefined) || file.webkitRelativePath || file.name;
}