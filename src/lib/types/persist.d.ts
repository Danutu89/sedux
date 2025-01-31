import type { mainStore } from "../store";
import type { StorageAdapter } from "./slicer.js";

export type SyncMainState = (name: string) => void;
export type SyncPersist = <T>(name: string, state: T) => void;

export type SyncSessionMainState = (name: string, derived?: string) => void;
export type SyncSession = <T>(name: string, state: T) => void;

export type SyncDBMainState = (name: string, adapter: StorageAdapter) => Promise<void>;
export type SyncDB = <T>(name: string, state: T, adapter: StorageAdapter) => Promise<void>;

export type Sync = <K>(name: string, value: K, adapter: StorageAdapter) => Promise<void>;
export type Hydrate = <K>(
	name: string,
	adapter: StorageAdapter
) => Promise<void>;
