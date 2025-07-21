// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ClvqError } from './ClvqError';

class ClvqLocalStorage {

	public setItem(key: string, val: string): void {
		try {
			localStorage.setItem(key, val);
		} catch(err) {
			console.error(`ClvqLocalStorage setItem ${key}:`, err);
			throw new ClvqError(`${err}`);
		}
	}

	public getItem(key: string, defaultValue: string = ""): string {
		try {
			const val = localStorage.getItem(key);
			if (val !== null) {
				return (val as string);
			}
			return defaultValue;
		} catch(err) {
			console.error(`ClvqLocalStorage getItem ${key}:`, err);
			return defaultValue;
		}
	}

	public removeItem(key: string): void {
		try {
			localStorage.removeItem(key);
		} catch(err) {
			console.error(`ClvqLocalStorage removeItem ${key}:`, err);
		}
	}

}

export { ClvqLocalStorage };
