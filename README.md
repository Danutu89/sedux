# Sedux

A powerful state management library for Svelte applications that combines Redux-like patterns with Svelte's reactivity system.

> ⚠️ **Warning**
> - This library is currently in beta stage
> - Documentation is still under development
> - Some features may contain bugs
> - API might change without prior notice
> - Please report any issues on our GitHub repository

## Table of Contents

1. [Overview](#overview)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core Concepts](#core-concepts)
   - [Store Management](#store-management)
   - [Actions and Reducers](#actions-and-reducers)
   - [Selectors](#selectors)
   - [Interceptors](#interceptors)
   - [Listeners](#listeners)
5. [Advanced Features](#advanced-features)
   - [Async Operations](#async-operations)
   - [Persistence](#persistence)
   - [DevTools](#devtools)
6. [Toolkit](#toolkit)
   - [API Integration](#api-integration)
   - [Cache Management](#cache-management)
   - [Enhanced Slices](#enhanced-slices)
   - [Toolkit Exports](#toolkit-exports)
   - [WebSocket Integration](#websocket-integration)
7. [Data Flow](#data-flow)
8. [API Reference](#api-reference)
9. [TypeScript Support](#typescript-support)
10. [Examples](#examples)
11. [Contributing](#contributing)
12. [License](#license)
13. [Error Handling](#error-handling)
14. [Best Practices](#best-practices)

## Overview

Sedux is a state management solution that brings Redux-like patterns to Svelte while leveraging Svelte's built-in reactivity system. It provides:

- 🔄 Redux-like state management with Svelte's reactivity
- ⚡ Seamless Svelte store integration
- 📦 Predictable action dispatching and handling
- 🔌 Powerful middleware/interceptor system
- ⏳ First-class async state management
- 🛠️ Built-in Redux DevTools support
- 💾 Flexible persistence options
- 📝 Full TypeScript support

## Installation

```bash
# Using npm
npm install @navitech/edux

# Using yarn
yarn add @navitech/sedux

# Using pnpm
pnpm add @navitech/sedux
```

## Quick Start

Here's a basic counter example to get you started:

````svelte
<script lang="ts">
import { Sedux, createSlicer, dispatch, select } from '@navitech/sedux';

// 1. Create a slice of state
const counterSlice = createSlicer({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (action, state) => ({ value: state.value + 1 }),
    addAmount: (action: ActionWithPayload<number>, state) => ({
      value: state.value + action.payload
    })
  }
});

// 2. Select state using a selector
const count = select(counterSlice, state => state.value);

// 3. Create action handlers
function handleIncrement() {
  dispatch({ type: 'increment' }, 'counter');
}

function handleAddAmount(amount: number) {
  dispatch({
    type: 'addAmount',
    payload: amount
  }, 'counter');
}
</script>

<!-- 4. Wrap your app with Sedux -->
<Sedux>
  <div>
    <p>Current count: {$count}</p>
    <button on:click={handleIncrement}>
      Increment
    </button>
    <button on:click={() => handleAddAmount(5)}>
      Add 5
    </button>
  </div>
</Sedux>

### Initialization

```typescript
// 1. Import Sedux
import { Sedux } from '@navitech/sedux';

// 2. Wrap your app
<Sedux>
  <App />
</Sedux>

// 3. Optional configuration
<Sedux
  devTools={true}     // Enable/disable DevTools
  persist={true}      // Enable global persistence
  storage="local"     // Storage type
>
  <App />
</Sedux>
````

## Core Concepts

### Store Management

Sedux provides several ways to manage your application state:

#### Basic Store

```typescript
import { storex, select } from "@navitech/sedux";

// Create a store
const store = storex({ count: 0 });

// Create a derived store
const count = select(store, (state) => state.value);

// Use in component
$count; // Reactive value
```

#### State Slices

```typescript
import { createSlicer } from "@navitech/sedux";

interface CounterState {
	value: number;
	lastUpdated: Date;
}

const counterSlice = createSlicer({
	name: "counter",
	initialState: {
		value: 0,
		lastUpdated: new Date(),
	} as CounterState,
	reducers: {
		increment: (action, state) => ({
			...state,
			value: state.value + 1,
			lastUpdated: new Date(),
		}),
	},
	// Optional persistence
	persist: true,
});
```

### Actions and Reducers

Actions are payloads of information that send data to your store:

```typescript
// Action Types
interface Action {
	type: string | symbol;
	name?: string;
}

interface ActionWithPayload<T> extends Action {
	payload: T;
}

// Dispatching Actions
dispatch({ type: "increment" }, "counter");
dispatch(
	{
		type: "addAmount",
		payload: 5,
	},
	"counter"
);

// Timed Actions
timedDispatch({ type: "increment" }, 5, "counter"); // After 5 minutes
```

### Selectors

Selectors are functions that select and transform state data:

```typescript
import { select, dynamicSelect } from "@navitech/sedux";

// Basic selector
const count = select(store, (state) => state.value);

// Dynamic selector
const dynamicSelector = dynamicSelect(store);
const userById = (id: string) => dynamicSelector(`users.${id}`);

// Using in components
$count; // Access value
$userById("123"); // Dynamic access
```

### Interceptors

Interceptors provide a way to handle side effects and transform actions:

```typescript
import { createSmartInterceptor, addInterceptor } from "@navitech/sedux";

// Create an interceptor
const loggingInterceptor = createSmartInterceptor(async (payload, api) => {
	console.log("Before action:", payload);
	const result = await api.dispatch(payload);
	console.log("After action:", result);
	return result;
});

// Add pre-action interceptor
addInterceptor("ACTION_TYPE", loggingInterceptor, "pre");

// Add post-action interceptor
addInterceptor("ACTION_TYPE", loggingInterceptor, "post");

// Error handling
loggingInterceptor.rejected = (error, api) => {
	console.error("Action failed:", error);
};
```

### Listeners

Listeners allow you to react to actions:

```typescript
import { addListener, addOnceListener } from "@navitech/sedux";

// Persistent listener
const { destroy } = addListener("increment", (action) => {
	console.log("Counter incremented");
});

// One-time listener
addOnceListener(["increment", "decrement"], (action) => {
	console.log("Counter changed once");
});

// Cleanup
destroy(); // Remove listener when needed
```

## Advanced Features

### Async Operations

#### Async Slices

```typescript
const userSlice = await createSlicerAsync({
	name: "users",
	initialState: {
		data: [],
		loading: false,
		error: null,
	},
	reducers: {
		setLoading: (action, state) => ({ ...state, loading: true }),
		setData: (action: ActionWithPayload<User[]>, state) => ({
			...state,
			data: action.payload,
			loading: false,
		}),
		setError: (action: ActionWithPayload<Error>, state) => ({
			...state,
			error: action.payload,
			loading: false,
		}),
	},
});
```

#### Async Actions

```typescript
// Using async thunks
const fetchUsers = createAsyncThunk(
	"users/fetch",
	async () => {
		const response = await fetch("/api/users");
		return response.json();
	},
	(response) => response.data // Optional result transformer
);

// Usage
const usersThunk = fetchUsers("users");
await usersThunk();
```

### Persistence

Sedux offers flexible persistence options:

```typescript
// Local Storage persistence
const persistedSlice = createSlicer({
	name: "persisted",
	initialState: { value: 0 },
	reducers: {
		/*...*/
	},
	persist: true, // or 'localStorage'
});

// Session Storage
const sessionSlice = createSlicer({
	name: "session",
	initialState: { value: 0 },
	reducers: {
		/*...*/
	},
	persist: "sessionStorage",
});

// Custom Storage
const customSlice = createSlicerAsync({
	name: "custom",
	initialState: { value: 0 },
	reducers: {
		/*...*/
	},
	persist: true,
	type: "custom",
	storageHandler: {
		sync: async (name, value) => {
			// Custom sync logic
		},
		hydrate: async (name) => {
			// Custom hydration logic
		},
	},
});
```

### DevTools

Redux DevTools integration is automatic when you wrap your app with `Sedux`:

```svelte
<script>
import { Sedux } from '@navitech/sedux';
</script>

<Sedux>
  <App />
</Sedux>
```

Features available in DevTools:

- Action logging with payloads
- State timeline
- Time-travel debugging
- Action replay
- State export/import

## Toolkit

### API Integration

The toolkit provides a powerful RTK Query-like API integration:

```typescript
import { createApi, baseQuery } from "@navitech/sedux";

const api = createApi({
	baseQuery: baseQuery("https://api.example.com"),
	endpoints: () => ({
		getPosts: {
			query: () => ({
				url: "/posts",
				method: "GET",
			}),
			transformResponse: (response) => response.data,
			cache: {
				ttl: 5000,
				key: "posts",
				autoRefresh: true,
			},
		},
	}),
	reducerPath: "api",
});

// Regular usage in components
const [fetchPosts, posts] = api.UseGetPostsQuery();

// Using unwrap for direct API calls
const makeRequest = api.UseGetPostsQuery.unwrap();

// Basic unwrap usage
const result = await makeRequest();
// Returns: { data: T | null, error: any | null, status: "idle" | "loading" | "completed" | "failed" }

// With custom fetch implementation
const customFetch = api.UseGetPostsQuery.unwrap(myCustomFetch);
const result = await customFetch();

// Handling results
const { data, error, status } = await makeRequest();
if (status === "completed") {
	// Handle success
	console.log(data);
} else if (status === "failed") {
	// Handle error
	console.error(error);
}
```

### Unwrap API

The `unwrap` functionality allows you to make API calls without store integration:

```typescript
interface UnwrappedResult<T> {
	data: T | null;
	error: any | null;
	status: "idle" | "loading" | "completed" | "failed";
}

// Each endpoint query hook provides an unwrap method
const { UseGetPostsQuery } = api;

// Get the unwrapped function
const makeRequest = UseGetPostsQuery.unwrap();

// Usage with parameters
const result = await makeRequest({ id: 1 });

// With custom fetch implementation
const customRequest = UseGetPostsQuery.unwrap((url, options) => {
	return customFetch(url, {
		...options,
		headers: {
			...options.headers,
			Authorization: "Bearer token",
		},
	});
});

// Error handling
try {
	const { data, error, status } = await makeRequest();
	if (status === "completed") {
		return data;
	}
	throw new Error(error);
} catch (e) {
	// Handle error
}
```

Key features of unwrap:

- Direct API calls without store subscription
- Custom fetch implementation support
- Full type safety for parameters and responses
- Consistent error handling
- Status tracking
- Transforms and error handling still apply


### SvelteKit Data loading integration

- +page.server.ts/+page.ts
```typescript
export const load({fetch}) {
	const getData = useGetData.unwrap(fetch);

	const result = await getData();

	if (result.status === 'failed') {
		error(result.error.message)
	}

	return {
		result
	}
 }
```

- +page.svelte
```svelte
<script lang='ts'>

const {data} = $props();
const [getData, getState] = useGetData(data.result);
```

Now getState is hydrated with the serverside data and you can use all of the features of the library

### Cache Management

Sedux provides sophisticated cache management:

```typescript
const api = createApi({
	endpoints: (builder) => ({
		getPosts: {
			query: () => ({ url: "/posts" }),
			// Cache configuration
			cache: {
				ttl: 5000, // Time to live in ms
				key: "posts", // Cache key
				autoRefresh: true, // Auto refresh on expiry
			},
			// Cache invalidation
			tag: "Posts",
			invalidateTags: ["Comments"],
		},
		addPost: {
			query: (post) => ({
				url: "/posts",
				method: "POST",
				body: post,
			}),
			// Invalidate cache after mutation
			invalidateTags: ["Posts"],
		},
	}),
});
```

### Enhanced Slices

The toolkit provides enhanced slice creation with additional features:

```typescript
import { createSlice } from "@navitech/sedux";

const [counterSlice, actions, store] = createSlice({
	name: "counter",
	initialState: { value: 0 },
	reducers: {
		increment: (action, state) => ({ value: state.value + 1 }),
		addAmount: (action: ActionWithPayload<number>, state) => ({
			value: state.value + action.payload,
		}),
	},
	// Optional async thunks
	thunks: [
		createAsyncThunk("counter/fetch", async () => {
			const response = await fetch("/api/counter");
			return response.json();
		}),
	],
	// Extra reducers for handling async actions
	extraReducers: {
		"counter/fetch/fulfilled": (action, state) => ({
			value: action.payload,
		}),
	},
	persisted: true,
});

// Accessing actions
actions.increment();
actions.addAmount(5);
```

### Toolkit Exports

```typescript
import { createApi, baseQuery } from "./toolkit";
import { createSlice } from "./toolkit";
import { createAsyncThunk } from "./toolkit";
```

These exports provide enhanced functionality similar to Redux Toolkit:

- `createApi`: RTK Query-like data fetching
- `createSlice`: Enhanced slice creation with simplified syntax
- `createAsyncThunk`: Async action creator utilities

## Data Flow

```mermaid
graph TD
    A[Action Dispatched] --> B[Action Queue]
    B --> C{Pre-Interceptors}
    C --> D[Reducers]
    D --> E{Post-Interceptors}
    E --> F[Store Updated]
    F --> G[Listeners Notified]
    F --> H[UI Updated]
    F --> I[Cache Updated]
    F --> J[Persistence Layer]

    K[API Call] --> L{Cache Check}
    L -->|Cache Hit| M[Return Cached Data]
    L -->|Cache Miss| N[Make Request]
    N --> O[Transform Response]
    O --> P[Update Store]
    P --> Q[Update Cache]
```

## API Reference

### Core Exports

#### Store Functions

```typescript
import { storex, select, dynamicSelect } from "@navitech/sedux";

// Create a store
const store = storex<State>(initialState);

// Create a selector
const value = select(store, (state) => state.value);

// Create a dynamic selector
const selector = dynamicSelect(store);
const dynamicValue = selector("path.to.value");
```

#### Action Dispatching

```typescript
import { dispatch, timedDispatch } from "@navitech/sedux";

// Immediate dispatch
await dispatch(
	{
		type: "actionType",
		payload: data,
	},
	"sliceName"
);

// Delayed dispatch (in minutes)
timedDispatch(
	{
		type: "actionType",
		payload: data,
	},
	5,
	"sliceName"
);
```

#### Event System

```typescript
import { addListener, addOnceListener } from "@navitech/sedux";

// Add persistent listener
const { destroy } = addListener("actionType", (action) => {
	// Handle action
});

// Add one-time listener
addOnceListener(["actionType1", "actionType2"], (action) => {
	// Handle action once
});
```

#### Interceptors

```typescript
import { createSmartInterceptor, addInterceptor } from "@navitech/sedux";

const interceptor = createSmartInterceptor(async (payload, api) => {
	// Handle action
});

addInterceptor("actionType", interceptor, "pre");
```

#### State Slices

```typescript
import { createSlicer, createSlicerAsync, createSlicerToolkit } from "@navitech/sedux";

// Synchronous slice
const slice = createSlicer({
	name: "slice",
	initialState,
	reducers: {
		/*...*/
	},
});

// Async slice
const asyncSlice = await createSlicerAsync({
	name: "async",
	initialState,
	reducers: {
		/*...*/
	},
});

// Toolkit slice
const toolkitSlice = createSlicerToolkit({
	name: "toolkit",
	initialState,
	reducers: {
		/*...*/
	},
});
```

#### Utility Functions

```typescript
import { waitUntilSliceInitialized, waitUntilWindowLoaded } from "@navitech/sedux";

// Wait for slice
await waitUntilSliceInitialized("sliceName");

// Wait for window
await waitUntilWindowLoaded();
```

### Type Definitions

```typescript
// Action Types
interface Action {
	type: symbol | string;
	name?: string;
	_id?: string;
}

interface ActionWithPayload<T> extends Action {
	payload: T;
}

// Store Types
interface Storex<T> extends Writable<T> {
	reset: () => void;
	resetAllSubscribers: () => void;
	unsubscribeById: (id: string) => void;
	get: () => T;
}

// Interceptor Types
interface InterceptorApi {
	getState: (name?: string) => any;
	dispatch: <A>(action: GeneralAction<A>) => void;
	dispatchGlobal: <A>(action: GeneralAction<A>, name: string) => void;
}

// Listener Types
interface ListenerDestroyable {
	listener: Listener;
	destroy: () => void;
}
```

## Error Handling

### Action Errors

```typescript
try {
	await dispatch({ type: "someAction" }, "sliceName");
} catch (error) {
	// Handle dispatch error
}
```

### API Errors

```typescript
const api = createApi({
  endpoints: (builder) => ({
    getPosts: {
      query: () => ({ url: '/posts' }),
      // Custom error transformation
      transformError: (error) => ({
        message: error.message,
        code: error.status
      }),
      // Error handling hook
      onError: (error, api) => {
        // Handle error
      }
    })
  })
});
```

### Interceptor Errors

```typescript
const interceptor = createSmartInterceptor(async (payload, api) => {
	// Your logic
});

// Error handling
interceptor.rejected = (error, api) => {
	// Handle error
};
```

## Best Practices

### State Organization

- Keep state slices small and focused
- Use selectors for derived state
- Normalize complex data structures

### Performance

- Use memoized selectors for expensive computations
- Implement proper cleanup in interceptors and listeners
- Leverage the cache system for API calls

### TypeScript

- Define interfaces for your state
- Use strict action typing
- Leverage generic constraints

### Testing

- Test reducers in isolation
- Mock API calls in tests
- Test interceptors independently

## TypeScript Support

### Configuration

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "types": ["@navitech/sedux"]
  }
}
```

### Type Inference

Sedux provides full type inference for:

- Store state
- Action payloads
- Selectors
- API responses

```typescript
// Example with full type safety
interface State {
	value: number;
}

const slice = createSlicer<State>({
	name: "typed",
	initialState: { value: 0 },
	reducers: {
		increment: (action, state): State => ({
			value: state.value + 1,
		}),
	},
});
```

## Examples

### Basic Counter

```svelte
<script lang="ts">
import { Sedux, createSlicer, dispatch, select } from '@navitech/sedux';

const counterSlice = createSlicer({
	name: 'counter',
	initialState: { value: 0 },
	reducers: {
		increment: (action, state) => ({ value: state.value + 1 }),
		decrement: (action, state) => ({ value: state.value - 1 }),
		addAmount: (action: ActionWithPayload<number>, state) => ({
			value: state.value + action.payload
		})
	}
});

const count = select(counterSlice, state => state.value);
</script>

<div>
	<h1>Count: {$count}</h1>
	<button on:click={() => dispatch({ type: 'increment' }, 'counter')}>
		Increment
	</button>
	<button on:click={() => dispatch({ type: 'decrement' }, 'counter')}>
		Decrement
	</button>
</div>
```

### Todo List with API Integration

```typescript
// api.ts
import { createApi, baseQuery } from "@navitech/sedux";

interface Todo {
	id: number;
	title: string;
	completed: boolean;
}

export const api = createApi({
	baseQuery: baseQuery("https://api.example.com"),
	endpoints: () => ({
		getTodos: {
			query: () => ({
				url: "/todos",
				method: "GET",
			}),
			cache: {
				ttl: 5000,
				key: "todos",
			},
		},
		addTodo: {
			query: (todo: Omit<Todo, "id">) => ({
				url: "/todos",
				method: "POST",
				body: todo,
			}),
			invalidateTags: ["Todos"],
		},
		toggleTodo: {
			query: ({ id, completed }: Pick<Todo, "id" | "completed">) => ({
				url: `/todos/${id}`,
				method: "PATCH",
				body: { completed },
			}),
			onOptimisticUpdate: (currentData, newData) => ({
				...currentData,
				todos: currentData.todos.map((todo) =>
					todo.id === newData.id
						? { ...todo, completed: newData.completed }
						: todo
				),
			}),
		},
	}),
});
```

```svelte
<!-- TodoList.svelte -->
<script lang="ts">
import { api } from './api';

const [fetchTodos, todos] = api.useGetTodosQuery();
const [addTodo] = api.useAddTodoMutation();
const [toggleTodo] = api.useToggleTodoMutation();

let newTodoTitle = '';

async function handleSubmit() {
	if (!newTodoTitle.trim()) return;

	await addTodo({
		title: newTodoTitle,
		completed: false
	});

	newTodoTitle = '';
}
</script>

<div>
	<form on:submit|preventDefault={handleSubmit}>
		<input
			bind:value={newTodoTitle}
			placeholder="What needs to be done?"
		/>
		<button type="submit">Add Todo</button>
	</form>

	{#if $todos.loading}
		<p>Loading...</p>
	{:else if $todos.error}
		<p>Error: {$todos.error}</p>
	{:else}
		<ul>
			{#each $todos.data as todo}
				<li>
					<input
						type="checkbox"
						checked={todo.completed}
						on:change={() => toggleTodo({
							id: todo.id,
							completed: !todo.completed
						})}
					/>
					<span class:completed={todo.completed}>
						{todo.title}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.completed {
		text-decoration: line-through;
		opacity: 0.6;
	}
</style>
```

### Authentication Example

```typescript
// authSlice.ts
import { createSlice } from "@navitech/sedux";

interface AuthState {
	user: User | null;
	token: string | null;
	loading: boolean;
	error: string | null;
}

const [authSlice, actions] = createSlice({
	name: "auth",
	initialState: {
		user: null,
		token: null,
		loading: false,
		error: null,
	} as AuthState,
	reducers: {
		setUser: (action: ActionWithPayload<User>, state) => ({
			...state,
			user: action.payload,
			error: null,
		}),
		setToken: (action: ActionWithPayload<string>, state) => ({
			...state,
			token: action.payload,
		}),
		setError: (action: ActionWithPayload<string>, state) => ({
			...state,
			error: action.payload,
			loading: false,
		}),
		logout: () => ({
			user: null,
			token: null,
			loading: false,
			error: null,
		}),
	},
	persist: true, // Persist auth state
});
```

```svelte
<!-- Login.svelte -->
<script lang="ts">
import { authSlice, actions } from './authSlice';
import { api } from './api';

const [login] = api.useLoginMutation();

let email = '';
let password = '';

async function handleSubmit() {
	try {
		const result = await login({ email, password });
		if (result.data) {
			actions.setUser(result.data.user);
			actions.setToken(result.data.token);
		}
	} catch (error) {
		actions.setError(error.message);
	}
}
</script>

<form on:submit|preventDefault={handleSubmit}>
	<input
		type="email"
		bind:value={email}
		placeholder="Email"
	/>
	<input
		type="password"
		bind:value={password}
		placeholder="Password"
	/>
	<button type="submit">Login</button>
</form>
```

### WebSocket Integration

Sedux provides a powerful WebSocket integration with features like:
- Channel-based message handling
- Automatic reconnection strategies
- Message transformation
- State persistence
- Type-safe message handling

```typescript
import { createWebSocketApi } from '@navitech/sedux';

const useWebSocket = createWebSocketApi({
  reducerPath: 'websocket',
  config: {
    url: 'ws://your-websocket-server.com',
    protocols: ['v1'],
    reconnect: {
      strategy: 'exponential', // 'linear' | 'exponential' | 'fibonacci' | 'none'
      attempts: 5,
      initialInterval: 1000,
      maxInterval: 30000
    }
  },
  channels: {
    chat: {
      matcher: (message) => message.type === 'chat',
      transformMessage: (message) => ({
        id: message.id,
        text: message.text,
        timestamp: new Date(message.timestamp)
      }),
      handleUpdate: (state, message) => [...state, message],
      initialState: []
    },
    presence: {
      matcher: (message) => message.type === 'presence',
      transformMessage: (message) => ({
        userId: message.userId,
        status: message.status
      }),
      handleUpdate: (state, message) => ({
        ...state,
        [message.userId]: message.status
      }),
      initialState: {}
    }
  },
  persist: 'websocket-state'
});

// Usage in component
const ws = useWebSocket();
const chatChannel = ws.getChannel('chat');
const presenceChannel = ws.getChannel('presence');

// Connect to WebSocket
ws.connect();

// Send message
ws.send({ type: 'chat', text: 'Hello!' });

// Subscribe to channel
const unsubscribe = ws.subscribe('chat', (message) => {
  console.log('New chat message:', message);
});

// Access channel state
$chatChannel.messages    // Array of messages
$chatChannel.lastMessage // Most recent message
```
