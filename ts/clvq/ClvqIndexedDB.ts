// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

const dbName    = 'clvqDB';
const dbVersion = 1;

export class ClvqIndexedDB {
	private readonly store:   string;

	private db;
	private promise;

	constructor(store: string) {
		this.store   = store;
		this.db      = null;
		this.promise = null;
	}

	private async getDB() {
		if (!this.promise) {
			this.promise = new Promise((resolve, reject) => {
				const req = indexedDB.open(dbName, dbVersion);
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

	public async getItem(key: string): Promise<any> {
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

	public async setItem(key: string, val: any): Promise<void> {
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
