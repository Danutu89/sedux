import { describe, expect, it, beforeAll, vi } from "vitest";
import { createApi, baseQuery } from "../dist/toolkit/query.svelte.js";
import { queue } from "../dist/helpers/queue.js";
import { updateQueue } from "../dist/dispatcher.svelte.js";

beforeAll(() => {
	queue.subscribe((value) => {
		updateQueue();
	});
});

describe("query", () => {
	it("should create a query", () => {
		const api = createApi({
			baseQuery: baseQuery("https://pokeapi.co/api/v2/"),
			endpoints: () => ({
				getPokemonByName: {
					query: (name) => ({
						url: `pokemon/${name}`,
						method: "GET",
					}),
				},
			}),
			reducerPath: "pokemonApi",
		});

		expect(api).toBeDefined();
	});

	it("should make the query", async () => {
		const { UseGetPokemonByNameQuery } = createApi({
			baseQuery: baseQuery("https://pokeapi.co/api/v2/"),
			endpoints: () => ({
				getPokemonByName: {
					query: (name) => ({
						url: `pokemon/${name}`,
						method: "GET",
					}),
				},
			}),
			reducerPath: "pokemonApi",
		});

		const [getPokemon, state] =  UseGetPokemonByNameQuery();
		console.log(state);
		expect(state).toBeDefined();

		await getPokemon("ditto");

		await new Promise((resolve) => {
			const timeout = setTimeout(() => {
				if (state.status === "completed") {
					clearTimeout(timeout);
					resolve(true);
				}
				if (state.status === "failed") {
					clearTimeout(timeout);
					resolve(true);
				}
			}, 100);
		});

		expect(state.status).toBe("completed");

		expect(state.data?.name).toBe("ditto");
	});

	//it should give an error if the query is not valid
	it("should give an error if the query is not valid", async () => {
		const { UseGetPokemonByNameQuery } = createApi({
			baseQuery: baseQuery("https://pokeapi.co/api/v2/"),
			endpoints: () => ({
				getPokemonByName: {
					query: (name) => ({
						url: `pokemojhnsa/${name}`,
						method: "GET",
					}),
					parseError: (error) => {
						return {
							error: error.message as string,
							status: "failed",
						};
					},
				},
			}),

			reducerPath: "pokemonApi",
		});

		const [getPokemon, state] = await UseGetPokemonByNameQuery();
		expect(state).toBeDefined();

		await getPokemon("ditto");

		await new Promise((resolve) => {
			const timeout = setTimeout(() => {
				if (state.status === "completed") {
					clearTimeout(timeout);
					resolve(true);
				}
				if (state.status === "failed") {
					clearTimeout(timeout);
					resolve(true);
				}
			}, 100);
		});

		expect(state.status).toBe("failed");

		//state.error to be a string
		expect(typeof state.error).toBe("object");
	});

	it("should make the request with unwrap", async () => {
		const { UseGetPokemonByNameQuery } = createApi({
			baseQuery: baseQuery("https://pokeapi.co/api/v2/"),
			endpoints: () => ({
				getPokemonByName: {
					query: (name) => ({
						url: `pokemon/${name}`,
						method: "GET",
					}),
					transformResponse: (response: { name: string }) => response,
					transformError(error) {
						return {
							error: error.message,
							status: "failed",
						};
					},
				},
			}),
			reducerPath: "pokemonApi",
		});

		const { unwrap } = UseGetPokemonByNameQuery;
		const getPokemon = unwrap(fetch);
		const response = await getPokemon("ditto");

		expect(response.status).toBe("completed");
		expect(response.data.name).toBe("ditto");
	});
});
