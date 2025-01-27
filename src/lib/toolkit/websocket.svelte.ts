import { createSlicerToolkit } from "../slicer.svelte.js";
import type { Reducer } from "../types/reducer.js";
import type {
  Channels,
  WebSocketState,
  CreateWebSocketApi,
  WebSocketHook,
  CreateWebSocketApiResult,
  ReconnectionStrategy,
  Channel
} from "../types/websocket.d.ts";

export const createWebSocketApi = <T extends Channels>({
  reducerPath,
  channels,
  config,
  persist,
  type
}: CreateWebSocketApi<T>): CreateWebSocketApiResult<T> => {
  let socket: WebSocket | null = null;
  let reconnectAttempts = 0;
  let reconnectTimeout: ReturnType<typeof setTimeout>;
  const channelListeners = new Map<keyof T, Set<(payload: any) => void>>();

  const initialState: WebSocketState<T> = {
    connection: {
      status: 'idle',
      error: null
    },
    channels: Object.keys(channels).reduce((acc, channelName) => {
      const channel = channels[channelName as keyof T];
      acc[channelName as keyof T] = {
        messages: channel.initialState as T[keyof T] extends Channel<infer _, infer S> ? S : never,
        lastMessage: null as T[keyof T] extends Channel<infer M, any> ? M | null : never
      };
      return acc;
    }, {} as WebSocketState<T>['channels'])
  };

  const actions = {
    connect: () => ({
      type: 'ws/connect'
    }),
    connected: () => ({
      type: 'ws/connected'
    }),
    disconnect: () => ({
      type: 'ws/disconnect'
    }),
    error: (payload: Error) => ({
      type: 'ws/error',
      payload
    }),
    message: (channelName: keyof T, payload: any) => ({
      type: 'ws/message',
      payload: { channelName, data: payload }
    })
  };

  const reducerFn: Reducer<WebSocketState<T>> = (state, action) => {
    switch (action.type) {
      case 'ws/connect':
        return {
          ...state,
          connection: {
            ...state.connection,
            status: 'connecting',
            error: null
          }
        };
      case 'ws/connected':
        return {
          ...state,
          connection: {
            ...state.connection,
            status: 'connected',
            error: null
          }
        };
      case 'ws/disconnect':
        return {
          ...state,
          connection: {
            ...state.connection,
            status: 'disconnected',
            error: null
          }
        };
      case 'ws/error':
        return {
          ...state,
          connection: {
            ...state.connection,
            status: 'error',
            error: action.payload
          }
        };
      case 'ws/message': {
        const { channelName, data } = action.payload;
        const channel = channels[channelName];
        return {
          ...state,
          channels: {
            ...state.channels,
            [channelName]: {
              messages: channel.handleUpdate 
                ? channel.handleUpdate(state.channels[channelName].messages as any, data)
                : channel.initialState instanceof Array
                  ? [...(state.channels[channelName].messages as any[]), data]
                  : data,
              lastMessage: data
            }
          }
        };
      }
      default:
        return state;
    }
  };

  const getNextInterval = (
    strategy: ReconnectionStrategy,
    attempt: number,
    initialInterval: number,
    maxInterval: number
  ): number => {
    switch (strategy) {
      case 'exponential':
        return Math.min(Math.pow(2, attempt) * initialInterval, maxInterval);
      case 'fibonacci': {
        let prev = initialInterval;
        let next = initialInterval;
        for (let i = 0; i < attempt; i++) {
          const temp = next;
          next = prev + next;
          prev = temp;
        }
        return Math.min(next, maxInterval);
      }
      case 'linear':
        return Math.min(initialInterval * (attempt + 1), maxInterval);
      case 'none':
        return 0;
      default:
        return initialInterval;
    }
  };

  const setupWebSocket = () => {
    if (socket) {
      socket.close();
    }

    socket = new WebSocket(config.url, config.protocols);

    socket.onopen = (event) => {
      reconnectAttempts = 0;
      dispatchToSlicer(actions.connected());
      config.onOpen?.(event);
    };

    socket.onclose = (event) => {
      dispatchToSlicer(actions.disconnect());
      config.onClose?.(event);
      
      const reconnectConfig = config.reconnect;
      if (reconnectConfig && reconnectConfig.strategy !== 'none') {
        if (reconnectAttempts < (reconnectConfig.attempts || 5)) {
          const nextInterval = getNextInterval(
            reconnectConfig.strategy,
            reconnectAttempts,
            reconnectConfig.initialInterval || 1000,
            reconnectConfig.maxInterval || 30000
          );
          
          reconnectTimeout = setTimeout(() => {
            reconnectAttempts++;
            setupWebSocket();
          }, nextInterval);
        }
      }
    };

    socket.onerror = (event) => {
      dispatchToSlicer(actions.error(new Error('WebSocket connection error')));
      config.onError?.(event);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        Object.entries(channels).forEach(([channelName, channel]) => {
          if (channel.matcher(message)) {
            const transformedMessage = channel.transformMessage 
              ? channel.transformMessage(message)
              : message;

            dispatchToSlicer(actions.message(channelName, transformedMessage));
            
            channelListeners.get(channelName)?.forEach(listener => {
              listener(transformedMessage);
            });
          }
        });

        config.onMessage?.(event);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  };

  const slicer = createSlicerToolkit(
    reducerPath,
    reducerFn,
    initialState,
    () => {},
    persist,
    type
  );

  const { dispatch: dispatchToSlicer, store } = slicer;

  const useWebSocket = (): WebSocketHook<T> => {
    const connect = () => {
      dispatchToSlicer(actions.connect());
      setupWebSocket();
    };

    const disconnect = () => {
      if (socket) {
        socket.close();
        dispatchToSlicer(actions.disconnect());
        clearTimeout(reconnectTimeout);
      }
    };

    const send = (message: any) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        console.warn('WebSocket is not connected');
      }
    };

    const subscribe = (channelName: keyof T, listener: (message: any) => void) => {
      if (!channelListeners.has(channelName)) {
        channelListeners.set(channelName, new Set());
      }
      channelListeners.get(channelName)!.add(listener);

      return () => {
        channelListeners.get(channelName)?.delete(listener);
      };
    };

    return {
      connect,
      disconnect,
      send,
      subscribe,
      get status() {
        return store.value.connection.status;
      },
      get error() {
        return store.value.connection.error;
      },
      getChannel: (channelName: keyof T) => ({
        get messages() {
          return store.value.channels[channelName]?.messages || [];
        },
        get lastMessage() {
          return store.value.channels[channelName]?.lastMessage || null;
        }
      })
    };
  };

  return useWebSocket;
}; 