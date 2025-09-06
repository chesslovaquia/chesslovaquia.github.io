// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

const dbName    = 'clvqDB';
const dbVersion = 1;

export enum Store {
	state = 'state',
}

export class ClvqIndexedDB {
	private readonly store: Store;

	private db:      IDBDatabase | null;
	private promise: Promise<IDBDatabase> | null;

	constructor(store: Store) {
		this.store   = store;
		this.db      = null;
		this.promise = null;
	}

	private async getDB(): Promise<IDBDatabase> {
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
						const db = evt.target.result as IDBDatabase;
						this.upgrade(db);
					}
				}
			});
		}
		return this.promise;
	}

	private upgrade(db: IDBDatabase): void {
		Object.values(Store).forEach(store => {
			if (!db.objectStoreNames.contains(store)) {
				db.createObjectStore(store, { keyPath: 'key' });
			}
		});
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
				resolve(result ? result.value : null);
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
