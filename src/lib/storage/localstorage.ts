import type { StorageAdapter } from "$lib/types/slicer.js";

const isBrowser = typeof window !== 'undefined';

export const localStorageAdapter: StorageAdapter = {
    read(name) {
        if (!isBrowser) return null;
        const result = localStorage.getItem(name);
        if (result === null) return null;
        return JSON.parse(result)
    },
    write(name, value) {
        if (!isBrowser) return;

        localStorage.setItem(name, JSON.stringify(value));
    },
    remove(name) {
        if (!isBrowser) return ;

        localStorage.removeItem(name);
    },
    clear() {
        if (!isBrowser) return ;

        localStorage.clear();
    },
    getKeys() {
        if (!isBrowser) return [];

        return Object.keys(localStorage);
    },
    hasKey(name) {
        if (!isBrowser) return false;

        return localStorage.getItem(name) !== null;
    },
}