import { describe, expect, it, beforeAll } from "vitest";
import { createSlicer, storex, dispatch } from "../dist";
import type { Reducer } from "../dist/types/reducer.d";
import { mainStore } from "../dist/store.svelte.js";
import { updateQueue } from "../dist/dispatcher.svelte.js";
import { queue } from "../dist/helpers/queue.js";

const initialState = {
	test: "1",
};

const store = storex(initialState);

const reducer: Reducer<typeof initialState, any> = (action, state) => {
	switch (action.type) {
		case "test":
			return { ...state, test: action.payload };
	}
	return state;
};

beforeAll(() => {
	queue.subscribe((value) => {
		updateQueue();
	});
});

describe("slicer", () => {
	it("should create a slicer", () => {
		const slicer = createSlicer(() => {}, reducer, "test", store);
		expect(slicer).toBeDefined();
	});

	it("shout be added to the main store", () => {
		expect(mainStore.get().test).toBeDefined();
	});

	it("should dispatch an action", async () => {
		await dispatch({ type: "test", payload: "test" }, "test");
		expect(store.get().test).toBe("test");
	});
});
