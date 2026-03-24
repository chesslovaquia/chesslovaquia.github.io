// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { LichessClient } from './LichessClient';
import { LichessError  } from './LichessError';

export type StreamEvent    = { type: string; [key: string]: unknown };
export type StreamCallback = (event: StreamEvent) => void;

const EventStreamPath                = '/api/stream/event';
const GameStreamPath = (id: string) => `/api/board/game/stream/${id}`;

const MaxBackoffMs = 60_000;

type StreamSlot = {
	controller: AbortController | null;
	active:     boolean;
};

function newSlot(): StreamSlot {
	return { controller: null, active: false };
}

export class LichessStream {
	private readonly client:    LichessClient;
	private readonly eventSlot: StreamSlot;
	private readonly gameSlot:  StreamSlot;

	constructor(client: LichessClient) {
		this.client    = client;
		this.eventSlot = newSlot();
		this.gameSlot  = newSlot();
	}

	public openEventStream(onEvent: StreamCallback): void {
		this.closeEventStream();
		this.eventSlot.active = true;
		void this.connectWithBackoff(EventStreamPath, onEvent, this.eventSlot);
	}

	public openGameStream(gameId: string, onEvent: StreamCallback): void {
		this.closeGameStream();
		this.gameSlot.active = true;
		void this.connectWithBackoff(GameStreamPath(gameId), onEvent, this.gameSlot);
	}

	public closeEventStream(): void {
		this.closeSlot(this.eventSlot);
	}

	public closeGameStream(): void {
		this.closeSlot(this.gameSlot);
	}

	public closeAll(): void {
		this.closeEventStream();
		this.closeGameStream();
	}

	private closeSlot(slot: StreamSlot): void {
		slot.active = false;
		if (slot.controller) {
			slot.controller.abort();
			slot.controller = null;
		}
	}

	private async connectWithBackoff(
		path:    string,
		onEvent: StreamCallback,
		slot:    StreamSlot,
	): Promise<void> {
		let attempt = 0;
		while (slot.active) {
			const controller  = new AbortController();
			slot.controller   = controller;
			try {
				await this.readStream(path, onEvent, controller.signal);
			} catch (err) {
				if (!slot.active) break;
				if (err instanceof Error && err.name === 'AbortError') break;
			}
			if (!slot.active) break;
			const delay = Math.min(Math.pow(2, attempt) * 1000, MaxBackoffMs);
			attempt++;
			await new Promise<void>(resolve => setTimeout(resolve, delay));
		}
	}

	private async readStream(
		path:    string,
		onEvent: StreamCallback,
		signal:  AbortSignal,
	): Promise<void> {
		const body = await this.client.getStream(path);
		await this.readNdjson(body, onEvent, signal);
	}

	private async readNdjson(
		stream:  ReadableStream<Uint8Array>,
		onEvent: StreamCallback,
		signal:  AbortSignal,
	): Promise<void> {
		const reader  = stream.getReader();
		const decoder = new TextDecoder();
		let buffer    = '';

		const onAbort = (): void => { void reader.cancel(); };
		signal.addEventListener('abort', onAbort);

		try {
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() ?? '';
				for (const line of lines) {
					const trimmed = line.trim();
					if (!trimmed) continue;
					try {
						const event = JSON.parse(trimmed) as StreamEvent;
						onEvent(event);
					} catch {
						throw new LichessError(`Invalid NDJSON line: ${trimmed}`);
					}
				}
			}
		} finally {
			signal.removeEventListener('abort', onAbort);
			reader.releaseLock();
		}
	}
}
