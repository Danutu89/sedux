import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
	plugins: [svelte()],
	test: {
		testTimeout: 10000,
		coverage: {
			provider: "istanbul", // or 'v8'
			reporter: ["cobertura"],
		},
		reporters: ["junit", "verbose"],
		outputFile: {
			junit: "test-results.xml",
		},
	},
});
