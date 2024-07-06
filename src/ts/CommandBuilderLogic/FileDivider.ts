import ConversionOptions from "../TabOptions/ConversionOptions";

/**
 * Get the files that should be converted, according to the user's preference
 * @param pickedFiles the array of files selected by the user
 */
export default function FileDivider(pickedFiles: File[]) {
    let outputFiles: File[][] = [];
    switch (ConversionOptions.conversionOption) {
        case 0: // Keep only the first file
            outputFiles = [[pickedFiles[0]]];
            break;
        case 1: // Add all files to the output one
            outputFiles = [[...pickedFiles]];
            break;
        case 2: // Add all the files that have the same name as the first file
            outputFiles = [pickedFiles.filter(file => file.name.substring(0, file.name.lastIndexOf(".")) === pickedFiles[0].name.substring(0, pickedFiles[0].name.lastIndexOf(".")))];
            break;
        case 3: { // Add all the files that have the same name (for every file)
            let outputMap = new Map<string, Set<File>>([]);
            for (const file of pickedFiles) {
                const getMapContent = outputMap.get(file.name.substring(0, file.name.lastIndexOf("."))) ?? new Set();
                getMapContent.add(file);
                outputMap.set(file.name.substring(0, file.name.lastIndexOf(".")), getMapContent);
            }
            return Array.from(outputMap).map(item => Array.from(item[1]));
        }
        case 4: // Same command for every file
            for (let item of pickedFiles) outputFiles.push([item]);
            break;
    }
    return outputFiles;

}