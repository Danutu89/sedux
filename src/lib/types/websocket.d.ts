import type { StorageAdapter } from "./slicer.js";

type ReconnectionStrategy = 'linear' | 'exponential' | 'fibonacci' | 'none';

interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnect?: {
    strategy: ReconnectionStrategy;
    attempts?: number;
    initialInterval?: number;
    maxInterval?: number;
  };
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (event: MessageEvent) => void;
}

interface Channel<T = any, S = T[]> {
  matcher: (message: any) => boolean;
  transformMessage?: (message: any) => T;
  handleUpdate?: (state: S, message: T) => S;
  initialState?: S;
}

interface Channels {
  [key: string]: Channel;
}

interface WebSocketState<T extends Channels> {
  connection: {
    status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
    error: Error | null;
  };
  channels: {
    [K in keyof T]: {
      messages: T[K] extends Channel<infer _, infer S> ? S : never;
      lastMessage: T[K] extends Channel<infer M, any> ? M | null : never;
    }
  };
}

interface CreateWebSocketApi<T extends Channels> {
  reducerPath: string;
  channels: T;
  config: WebSocketConfig;
  persist?: StorageAdapter;
}

interface WebSocketHook<T extends Channels> {
  connect: () => void;
  disconnect: () => void;
  send: (message: any) => void;
  subscribe: (channelName: keyof T, listener: (message: any) => void) => () => void;
  status: 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';
  error: Error | null;
  getChannel: <K extends keyof T>(channelName: K) => {
    messages: ReturnType<T[K]['transformMessage']>;
    lastMessage: ReturnType<T[K]['transformMessage']> | null;
  };
}

type CreateWebSocketApiResult<T extends Channels> = () => WebSocketHook<T>;

export type {
  WebSocketConfig,
  Channel,
  Channels,
  WebSocketState,
  CreateWebSocketApi,
  WebSocketHook,
  CreateWebSocketApiResult,
  ReconnectionStrategy
};
