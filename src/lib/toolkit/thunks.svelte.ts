import { dispatch } from "../dispatcher.svelte.js";
import type { CreateAsyncThunk, PreThunk, Thunk } from "../types/thunks.js";

export const createAsynctThunk: CreateAsyncThunk =
	(type, payloadCreator, resultCreator) => (name) => {
		const preThunk: PreThunk =
			(payload, { dispatch, name }) =>
			async () => {
				dispatch({ type: `${type}/pending`, payload });
				try {
					const result = await payloadCreator(payload, { dispatch, name });
					dispatch({
						type: `${type}/fulfilled`,
						payload: resultCreator(result),
					});
				} catch (err) {
					dispatch({ type: `${type}/rejected`, payload: err });
				}
			};

		const thunk = ((
			payload: Parameters<typeof payloadCreator>[0],
			api: { dispatch: <P>(action: any) => Promise<unknown>; name: string }
		): Promise<void> => {
			return preThunk(payload, {
				dispatch: (action) => dispatch(action, name),
				name,
			})();
		}) as unknown as Thunk<Parameters<typeof payloadCreator>[0], typeof type>;

		thunk.pending = `${type}/pending` as const;
		thunk.fulfilled = `${type}/fulfilled` as const;
		thunk.rejected = `${type}/rejected` as const;

		return thunk;
	};
