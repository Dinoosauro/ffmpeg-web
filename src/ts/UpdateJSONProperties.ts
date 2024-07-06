function UpdateJsonProperties(json: any, update: any) {
    // @ts-ignore
    for (let key in json) typeof json[key] === "object" && !Array.isArray(json[key]) ? UpdateJsonProperties(json[key], update[key]) : (typeof json[key] === "object" && Array.isArray(json[key])) || (typeof update !== "undefined") ? update[key] = json[key] : {};
    return update;
}
export default UpdateJsonProperties;