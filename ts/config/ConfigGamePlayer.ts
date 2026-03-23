// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ConfigError } from './ConfigError';

import { ElementIds } from '../clvq/ElementIds';

type PlayerID = '1' | '2';

export class ConfigGamePlayer {
	public readonly info: HTMLElement | null;
	public readonly clock: HTMLElement | null;
	public readonly material: HTMLElement | null;
	public readonly materialCount: HTMLElement | null;

	constructor(id: PlayerID) {
		this.info = document.getElementById(`${ElementIds.gamePlayer}${id}`);
		this.clock = document.getElementById(`${ElementIds.gameClock}${id}`);
		this.material = document.getElementById(`${ElementIds.gameMaterial}${id}`);
		this.materialCount = document.getElementById(`${ElementIds.gameMaterialCount}${id}`);
		this.validate(id);
	}

	private validate(id: PlayerID): void {
		if (!this.info) {
			throw new ConfigError(`${ElementIds.gamePlayer}${id}: element not found`);
		}
		if (!this.clock) {
			throw new ConfigError(`${ElementIds.gameClock}${id}: element not found`);
		}
		if (!this.material) {
			throw new ConfigError(`${ElementIds.gameMaterial}${id}: element not found`);
		}
		if (!this.materialCount) {
			throw new ConfigError(`${ElementIds.gameMaterialCount}${id}: element not found`);
		}
	}
}
