// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

class ClvqIndexedDB {
	private readonly name:    string;
	private readonly store:   string;
	private readonly version: number;

	private db;
	private promise;

	constructor(name: string, store: string, version: number) {
		this.name    = name;
		this.store   = store;
		this.version = version;
		this.db      = null;
		this.promise = null;
	}

	private async getDB() {
		if (!this.promise) {
			this.promise = new Promise((resolve, reject) => {
				const req = indexedDB.open(this.name, this.version);
				req.onerror = () => reject(req.error);
				req.onsuccess = () => {
					this.db = req.result;
					resolve(this.db);
				}
				req.onupgradeneeded = (event) => {
					const evt = (event as any);
					if (evt.target) {
						const db = evt.target.result;
						if (!db.objectStoreNames.contains(this.store)) {
							db.createObjectStore(this.store, { keyPath: 'key' });
						}
					}
				}
			});
		}
		return this.promise;
	}

	public async hasItem(key: string): Promise<boolean> {
		const db = await this.getDB();
		const transaction = db.transaction([this.store], 'readonly');
		const store = transaction.objectStore(this.store);
		return new Promise((resolve, reject) => {
			const req = store.count(key);
			req.onsuccess = () => resolve(req.result > 0);
			req.onerror = () => reject(req.error);
		});
	}

	public async getItem(key: string): Promise<string> {
		const db = await this.getDB();
		const transaction = db.transaction([this.store], 'readonly');
		const store = transaction.objectStore(this.store);
		return new Promise((resolve, reject) => {
			const req = store.get(key);
			req.onsuccess = () => {
				const result = req.result;
				resolve(result ? result.value : "");
			}
			req.onerror = () => reject(req.error);
		});
	}

	public async setItem(key: string, val: string): Promise<void> {
		const db = await this.getDB();
		const transaction = db.transaction([this.store], 'readwrite');
		const store = transaction.objectStore(this.store);
		return new Promise((resolve, reject) => {
			const req = store.put({ key: key, value: val });
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error);
		});
	}

	public async removeItem(key: string): Promise<void> {
		const db = await this.getDB();
		const transaction = db.transaction([this.store], 'readwrite');
		const store = transaction.objectStore(this.store);
		return new Promise((resolve, reject) => {
			const req = store.delete(key);
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error);
		});
	}

	public async clearAll(): Promise<void> {
		const db = await this.getDB();
		const transaction = db.transaction([this.store], 'readwrite');
		const store = transaction.objectStore(this.store);
		return new Promise((resolve, reject) => {
			const req = store.clear();
			req.onsuccess = () => resolve();
			req.onerror = () => reject(req.error);
		});
	}
}

export { ClvqIndexedDB };
