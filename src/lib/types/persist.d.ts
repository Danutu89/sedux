import type { mainStore } from "../store";

export type SyncMainState = (name: string) => void;
export type SyncPersist = <T>(name: string, state: T) => void;

export type SyncSessionMainState = (name: string, derived?: string) => void;
export type SyncSession = <T>(name: string, state: T) => void;

export type SyncDBMainState = (name: string, derived: string) => void;
export type SyncDB = <T>(name: string, state: T, derived: string) => void;

export type Sync = <K>(name: string, value: K) => Promise<void>;
export type Hydrate = <K>(
	name: string,
	state: K extends typeof mainStore ? K : never
) => Promise<K>;
