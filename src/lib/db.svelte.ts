import { mainStore } from "./store.svelte.js";
import type { Storex, Value } from "./types/store.js";
import type { SyncDB, SyncDBMainState } from "./types/persist.js";

const DB_NAME = "sedux";
const VERSION_KEY = "sedux_db_version";
const isBrowser = typeof window !== 'undefined';

let DB_VERSION = 1;
try {
	const storedVersion = localStorage.getItem(VERSION_KEY);
	if (storedVersion) {
		DB_VERSION = parseInt(storedVersion, 10);
	} else {
		localStorage.setItem(VERSION_KEY, DB_VERSION.toString());
	}
} catch (e) {
	console.warn('Could not access localStorage for version management');
}

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

const checkIfQueryToolkit = (value: any) => {
	//if the value contains keys and in that object contains data,status,error
	return Object.keys(value).some(key => {
		if (typeof value[key] === 'object' && 'data' in value[key] && 'status' in value[key] && 'error' in value[key]) {
			return true;
		}
	});
};

export const syncDb: SyncDB = async <T>(name: string, value: T) => {
	if (!isBrowser) return;

	const store = mainStore.value;
	if (!(name in store)) {
		return { error: { message: `Logic name "${name}" not valid.`, code: 'INVALID_STORE' }};
	}

	const { persist } = store[name];
	if (!persist) return;

	const storeName = typeof persist === "string" ? persist : "default";

	try {
		const db = await connectDB({ stores: [storeName] });

		return new Promise((resolve, reject) => {
			const tx = db.transaction(storeName, "readwrite");
			const objectStore = tx.objectStore(storeName);

			tx.oncomplete = () => {
				db.close();
				resolve();
			};

			tx.onerror = () => {
				db.close();
				resolve();
			};

			const timestamp = Date.now();
			let record;

			// Determine the type and structure of data
			if (value && typeof value === 'object') {
				if ('channels' in value) {
					// WebSocket toolkit type
					record = {
						id: name,
						_timestamp: timestamp,
						_type: 'websocket',
						channels: (value as any).channels
					};
				} else if (checkIfQueryToolkit(value)) {
					// REST API toolkit type
					record = {
						id: name,
						_timestamp: timestamp,
						_type: 'rest',
						endpoints: value
					};
				} else {
					// Regular state type
					record = {
						id: name,
						_timestamp: timestamp,
						_type: 'regular',
						state: value
					};
				}
			}

			if (record) {
				objectStore.put(record);
			}
		});

	} catch (error) {
		return {
			error: {
				message: 'Failed to sync with IndexedDB',
				code: 'SYNC_FAILED',
				details: error instanceof Error ? error.message : String(error)
			}
		};
	}
};

export const syncDbMainState: SyncDBMainState = async (name: string) => {
	if (!isBrowser) return;

	const store = mainStore.value;
	if (!(name in store)) return;

	const { persist } = store[name];
	if (!persist) return;

	const storeName = typeof persist === "string" ? persist : "default";

	try {
		const db = await connectDB({ stores: [storeName] });
		
		return new Promise((resolve, reject) => {
			const tx = db.transaction(storeName, "readonly");
			const objectStore = tx.objectStore(storeName);
			
			const request = objectStore.get(name);

			request.onsuccess = () => {
				const record = request.result;
				
				if (record) {
					switch (record._type) {
						case 'websocket':
							mainStore.value[name].state.set({
								channels: record.channels
							});
							break;

						case 'rest':
							// Set the state directly with the stored structure
							mainStore.value[name].state.set(record);
							break;

						case 'regular':
							mainStore.value[name].state.set({
								state: {
									default: record.state
								}
							});
							break;
					}
				} else {
					// Initialize empty state if no record found
					mainStore.value[name].state.set({
						state: {
							default: {}
						}
					});
				}

				db.close();
				resolve(undefined);
			};

			request.onerror = () => {
				console.error("Error reading from database");
				db.close();
				reject(new Error("Failed to read from database"));
			};
		});
	} catch (error) {
		console.error("Failed to sync main state:", error);
		throw error;
	}
};
