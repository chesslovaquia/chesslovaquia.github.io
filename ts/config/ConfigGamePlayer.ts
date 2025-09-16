// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ConfigError } from './ConfigError';

type PlayerID = "1" | "2";

export class ConfigGamePlayer {
	public readonly info: HTMLElement | null;
	public readonly clock: HTMLElement | null;
	public readonly material: HTMLElement | null;
	public readonly materialCount: HTMLElement | null;

	constructor(id: PlayerID) {
		this.info = document.getElementById(`gamePlayer${id}`);
		this.clock = document.getElementById(`gameClock${id}`);
		this.material = document.getElementById(`gameMaterial${id}`);
		this.materialCount = document.getElementById(`gameMaterialCount${id}`);
		this.validate(id);
	}

	private validate(id: PlayerID): void {
		if (!this.info) {
			throw new ConfigError(`gamePlayer${id}: element not found`);
		}
		if (!this.clock) {
			throw new ConfigError(`gameClock${id}: element not found`);
		}
		if (!this.material) {
			throw new ConfigError(`gameMaterial${id}: element not found`);
		}
		if (!this.materialCount) {
			throw new ConfigError(`gameMaterialCount${id}: element not found`);
		}
	}
}
