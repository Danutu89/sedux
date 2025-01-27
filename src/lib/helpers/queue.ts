import type { ActionWithPayload } from "../types/slicer.d.ts";

interface Element extends ActionWithPayload<any> {
	resolve: (value?: any) => void;
	reject: (reason?: any) => void;
	_id: string;
}

class Queue {
	elements: Element[] = [];
	length = this.elements.length;
	subscribers: Array<(message: any) => void> = [];

	constructor() {
		this.elements = [];
	}

	enqueue(element: Element): void {
		this.elements.push(element);
		this.length = this.elements.length;
		this.callSubscribers(element);
	}

	dequeue(): Element {
		const value = this.elements.shift();

		if (!value) throw new Error("There are no actions in the queue");

		this.length = this.elements.length;

		this.callSubscribers(value);
		return value;
	}

	isEmpty(): boolean {
		return this.elements.length === 0;
	}

	peek(): unknown {
		return !this.isEmpty() ? this.elements[0] : undefined;
	}

	subscribe(callback: (element: Element) => void): () => void {
		this.subscribers.push(callback);
		return () => this.unsubscribe(callback);
	}

	callSubscribers(element: Element): void {
		this.subscribers.forEach((callback) => callback(element));
	}

	unsubscribe(callback: (element: Element) => void): void {
		this.subscribers = this.subscribers.filter(
			(subscriber) => subscriber !== callback
		);
	}
}
const queue = new Queue();
export { queue, Queue };
