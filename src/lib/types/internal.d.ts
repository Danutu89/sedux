export interface Store {
	current: string;
	currentResolve: (value: any) => void;
	currentIsAsync: boolean;
	destination: symbol | null;
}

export type SetCurrent = (current: string) => void;
export type GetCurrent = () => string;
