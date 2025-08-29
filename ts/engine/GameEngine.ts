// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export type EngineColor = 'b' | 'w';

export interface GameEngine {
	turn(): EngineColor;
	reset(): void;
}
