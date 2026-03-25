// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { LichessError } from './LichessError';

type NdjsonOptions = {
	signal?:  AbortSignal;
	onError?: 'throw' | 'skip';
};

export async function readNdjson<T>(
	stream:   ReadableStream<Uint8Array>,
	onLine:   (parsed: T) => void,
	options?: NdjsonOptions,
): Promise<void> {
	const signal  = options?.signal;
	const onError = options?.onError ?? 'throw';

	const reader  = stream.getReader();
	const decoder = new TextDecoder();
	let buffer    = '';

	const onAbort = (): void => { void reader.cancel(); };
	if (signal) signal.addEventListener('abort', onAbort);

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
					onLine(JSON.parse(trimmed) as T);
				} catch {
					if (onError === 'throw') {
						throw new LichessError(`Invalid NDJSON line: ${trimmed}`);
					} else {
						console.warn('NdjsonReader: skipping invalid JSON line');
					}
				}
			}
		}
	} finally {
		if (signal) signal.removeEventListener('abort', onAbort);
		reader.releaseLock();
	}
}
