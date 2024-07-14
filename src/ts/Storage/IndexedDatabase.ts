interface GetObj {
    db: IDBDatabase,
    query: string
}
interface SetObj {
    db: IDBDatabase,
    object: SetInnerObject
}
interface SetInnerObject {
    UserContent: string,
    blob: Blob | Blob[]
}
export default {
    /**
     * Get the Indexed DB Database
     * @returns The IDBDatabase
     */
    db: () => {
        return new Promise<IDBDatabase>((resolve, reject) => {
            let request = indexedDB.open("ffmpegWebDB", 1);
            request.onupgradeneeded = () => { // Create the new entry. "UserContent" will be the key that will identify the resource
                let db = request.result;
                let storage = db.createObjectStore("ContentBuffer", { keyPath: "UserContent" });
                storage.createIndex("blob", "blob", { unique: true });
                storage.transaction.oncomplete = () => resolve(db);
                storage.transaction.onerror = (ex) => reject(ex);
            }
            request.onsuccess = () => resolve(request.result);
            request.onblocked = (ex) => reject(ex);
            request.onerror = (ex) => reject(ex)
        })
    },
    /**
     * Get an element from the IndexedDB
     * @param db The IndexedDB used for the transaction
     * @param query The query to do on the database
     * @returns The object associated with the query
     */
    get: ({ db, query }: GetObj) => { // Get a content from the database
        return new Promise<SetInnerObject | undefined>((resolve, reject) => {
            let transaction = db.transaction(["ContentBuffer"], "readonly");
            let objectStore = transaction.objectStore("ContentBuffer");
            let request = objectStore.get(query);
            request.onsuccess = () => {
                db.close();
                resolve(request.result);
            }
            request.onerror = (ex) => {
                db.close();
                reject(ex);
            }
        })
    },
    /**
     * Set content to the database
     * @param db the IndexedDB where this operation will be made
     * @param object the object to store in the Database
     * @returns A promise, resolved or rejected when the operation has ended
     */
    set: ({ db, object }: SetObj) => {
        return new Promise<void>((resolve, reject) => {
            let transaction = db.transaction(["ContentBuffer"], "readwrite");
            let objectStore = transaction.objectStore("ContentBuffer");
            let storage = objectStore.get(object.UserContent ?? "Unknown"); // Check if the value already exists, so that it can be updated rather than added as a new entry
            storage.onsuccess = () => {
                let requestUpdate = storage.result === undefined ? objectStore.add(object) : objectStore.put(object);
                requestUpdate.onsuccess = () => {
                    db.close();
                    resolve();
                }
                requestUpdate.onerror = (ex) => {
                    db.close();
                    reject(ex);
                }
            }
            storage.onerror = (ex) => {
                db.close();
                reject(ex);
            }
        })
    },
    /**
     * Remove an item from the Database
     * @param db The IndexedDB
     * @param query The query that'll be deleted
     * @returns A promise, resolved or rejected when the operation finished
     */
    remove: ({ db, query }: GetObj) => { // Remove an item from the Database
        return new Promise<void>((resolve, reject) => {
            let transaction = db.transaction(["ContentBuffer"], "readwrite");
            let objectStore = transaction.objectStore("ContentBuffer");
            let request = objectStore.delete(query);
            request.onsuccess = () => resolve();
            request.onerror = (ex) => reject(ex);
        })
    }
}