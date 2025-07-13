// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

import { ClvqError } from './ClvqError'

class ClvqLocalStorage {

	public setItem(key: string, val: string): void {
		try {
			localStorage.setItem(key, val)
		} catch(err) {
			console.error('ClvqLocalStorage setItem:', err)
			throw new ClvqError(`${err}`)
		}
	}

	public getItem(key: string, defaultValue: string = ""): string {
		try {
			const val: string | null = localStorage.getItem(key)
			return val !== null ? val : defaultValue
		} catch(err) {
			console.error('ClvqLocalStorage getItem:', err)
			return defaultValue
		}
	}

}

export { ClvqLocalStorage }
