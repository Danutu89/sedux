import { describe, expect, it, beforeAll } from "vitest";
import { createSlice } from "../dist/toolkit/slice.svelte.js";
import { queue } from "../dist/helpers/queue";
import { get } from "svelte/store";
import { updateQueue } from "../dist/dispatcher.svelte.js";
import { mainStore } from "../dist/store.svelte.js";

beforeAll(() => {
	queue.subscribe((value) => {
		updateQueue();
	});
});

describe("slice", () => {
	it("should create a slice", () => {
		const slice = createSlice({
			name: "test",
			initialState: {
				test: "1",
			},
			reducers: {
				test: (action, state) => {
					state.test = action.payload;
					return state;
				},
			},
		});

		expect(slice).toBeDefined();
	});

	it("should be added to the main store", () => {
		expect(mainStore.get().test).toBeDefined();
	});

	it("should dispatch an action", async () => {
		const [slice, { test }, store] = createSlice({
			name: "test",
			initialState: {
				test: "1",
			},
			reducers: {
				test: (action, state) => {
					state.test = action.payload;
					return state;
				},
			},
		});

		await test("test");

		expect(store.get().test).toBe("test");
	});
});
