/**
 * Get the file name of a file from a path, handling both folders with "/" or with "\"
 * @param str the path
 * @returns the file name
 */
export default function handleFileStringForOS(str: string) {
    if (str.indexOf("/") !== -1) str = str.substring(str.lastIndexOf("/") + 1);
    if (str.indexOf("\\") !== -1) str = str.substring(str.lastIndexOf("\\") + 1);
    return str;
}
