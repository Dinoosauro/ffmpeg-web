/**
 * Copy the properties of an Object from an object to another one
 * @param json the thing that has the value to update
 * @param update the thing that needs to be updated
 * @returns the updated object
 */
function UpdateJsonProperties(json: any, update: any) {
    // @ts-ignore
    for (let key in json) typeof json[key] === "object" && !Array.isArray(json[key]) ? UpdateJsonProperties(json[key], update[key]) : (typeof json[key] === "object" && Array.isArray(json[key])) || (typeof update !== "undefined") ? update[key] = json[key] : {};
    return update;
}
export default UpdateJsonProperties;