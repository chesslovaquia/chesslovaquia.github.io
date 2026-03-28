// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ClvqLocalStorage } from './ClvqLocalStorage';

export type PlayMode = 'otb' | 'lichess';

export const PlayModeLabels: Record<PlayMode, string> = {
	otb:     'Over the board',
	lichess: 'Lichess',
};

const storageKey   = 'clvq.play_mode';
const defaultMode: PlayMode = 'otb';

function isValidPlayMode(value: string): value is PlayMode {
	return value === 'otb' || value === 'lichess';
}

export class PlayModeStorage {
	private readonly storage: ClvqLocalStorage;

	constructor(storage: ClvqLocalStorage) {
		this.storage = storage;
	}

	public getMode(): PlayMode {
		const raw = this.storage.getItem(storageKey);
		return isValidPlayMode(raw) ? raw : defaultMode;
	}

	public setMode(mode: PlayMode): void {
		this.storage.setItem(storageKey, mode);
	}
}
