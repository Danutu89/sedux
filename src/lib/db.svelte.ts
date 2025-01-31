import { mainStore } from "./store.svelte.js";
import type { Hydrate, Sync, SyncDB, SyncDBMainState } from "./types/persist.js";

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

export const syncStorage: Sync = async (name, value, adapter) => {
	if (!isBrowser) return;

	const store = mainStore.value;
	if (!(name in store)) {
		throw { error: { message: `Logic name "${name}" not valid.`, code: 'INVALID_STORE' }};
	}

	const { persist } = store[name];
	if (!persist) return;

	try {
		await adapter.write(name, value);
	} catch (error) {
		throw {
			error: {
				message: 'Failed to sync with storage',
				code: 'SYNC_FAILED',
				details: error instanceof Error ? error.message : String(error)
			}
		};
	}
};

export const hydrateFromStorage: Hydrate = async (name, adapter) => {
	if (!isBrowser) return;

	const store = mainStore.value;
	if (!(name in store)) return;

	const { persist } = store[name];
	if (!persist) return;


	try {
		const present = await adapter.hasKey(name);
		if (!present) return;
		const value = await adapter.read(name);
		if (value) {
			mainStore.value[name].state.set(value);
		}
		// const db = await connectDB({ stores: [storeName] });
		
		
	} catch (error) {
		console.error("Failed to sync main state:", error);
		throw error;
	}
};
