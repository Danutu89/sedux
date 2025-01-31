import type { StorageAdapter } from "$lib/types/slicer.js";
const DB_NAME = "sedux";
const VERSION_KEY = "sedux_db_version";
const isBrowser = typeof window !== 'undefined';
let DB_VERSION = 1;

const connectDB = async (options?: { stores: string[] }): Promise<IDBDatabase> => {
	if (!isBrowser) {
		return Promise.reject(new Error('IndexedDB is not available (server-side)'));
	}

	return new Promise((resolve, reject) => {
		const request = window.indexedDB.open(DB_NAME, DB_VERSION);
		
		request.onerror = () => reject(new Error("Failed to connect to IndexedDB"));
		
		request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
			const db = (event.target as IDBOpenDBRequest).result;
			const storeNames = options?.stores || [];
			
			storeNames.forEach(storeName => {
				if (db.objectStoreNames.contains(storeName)) {
					db.deleteObjectStore(storeName);
				}
				const store = db.createObjectStore(storeName, { 
					keyPath: 'id'
				});
				store.createIndex('_timestamp', '_timestamp', { unique: false });
			});
		};

		request.onsuccess = (event: Event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			
			const storeNames = options?.stores || [];
			const missingStores = storeNames.filter(
				name => !db.objectStoreNames.contains(name)
			);

			if (missingStores.length > 0) {
				db.close();
				DB_VERSION++;
				localStorage.setItem(VERSION_KEY, DB_VERSION.toString());
				connectDB(options).then(resolve).catch(reject);
				return;
			}

			resolve(db);
		};
	});
};


export const indexedDbStorageAdapter: StorageAdapter = {
    async read(name: string) {
        const storeName = 'sedux_store';
        const db = await connectDB({ stores: [storeName] });

        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const objectStore = tx.objectStore(storeName);
            
            const request = objectStore.get(name);

            request.onsuccess = () => {
                const record = request.result;
                db.close();
                resolve(record);
            };

            request.onerror = () => {
                db.close();
                reject(new Error("Failed to read from database"));
            };
        });
    },

    async write(name: string, value: any) {
        const storeName = 'sedux_store';
        const db = await connectDB({ stores: [storeName] });

        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readwrite");
            const objectStore = tx.objectStore(storeName);

            tx.oncomplete = () => {
                db.close();
                resolve(() => {});
            };

            tx.onerror = () => {
                db.close();
                reject(new Error("Failed to write to database"));
            };

            const timestamp = Date.now();
            const record = {
                id: name,
                _timestamp: timestamp,
                _type: 'regular',
                state: value
            };

            objectStore.put(record);
        });
    },

    async remove(name: string) {
        const storeName = 'sedux_store';
        const db = await connectDB({ stores: [storeName] });

        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readwrite");
            const objectStore = tx.objectStore(storeName);
            
            const request = objectStore.delete(name);

            request.onsuccess = () => {
                db.close();
                resolve(() => {});
            };

            request.onerror = () => {
                db.close();
                reject(new Error("Failed to remove from database"));
            };
        });
    },

    async clear() {
        const storeName = 'sedux_store';
        const db = await connectDB({ stores: [storeName] });

        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readwrite");
            const objectStore = tx.objectStore(storeName);
            
            const request = objectStore.clear();

            request.onsuccess = () => {
                db.close();
                resolve(() => {});
            };

            request.onerror = () => {
                db.close();
                reject(new Error("Failed to clear database"));
            };
        });
    },

    async getKeys() {
        const storeName = 'sedux_store';
        const db = await connectDB({ stores: [storeName] });

        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const objectStore = tx.objectStore(storeName);
            
            const request = objectStore.getAllKeys();

            request.onsuccess = () => {
                db.close();
                resolve(request.result);
            };

            request.onerror = () => {
                db.close();
                reject(new Error("Failed to get keys from database"));
            };
        });
    },

    async hasKey(name: string) {
        const storeName = 'sedux_store';
        const db = await connectDB({ stores: [storeName] });

        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, "readonly");
            const objectStore = tx.objectStore(storeName);
            
            const request = objectStore.count(name);

            request.onsuccess = () => {
                db.close();
                resolve(request.result > 0);
            };

            request.onerror = () => {
                db.close();
                reject(new Error("Failed to check key existence in database"));
            };
        });
    },
}