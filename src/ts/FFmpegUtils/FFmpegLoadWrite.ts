import type ffmpeg from "./FFmpegClass";
/**
 * Load FFmpeg and write the files to the virtual FS
 * @param ffmpeg the FFmpeg object that'll be used
 * @param files the Files to write
 */
export default async function FfmpegCommonOperations(ffmpeg: ffmpeg, files: File[]) {
    await ffmpeg.load();
    for (let file of files) await ffmpeg.writeFile(file);

}