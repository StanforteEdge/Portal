interface StoreConfig {
  store: string;
  keyPath: string;
}

class LocalDBManager {
  private db: IDBDatabase | null = null;
  private stores = new Map<string, StoreConfig>();
  private dbVersion = 1;
  private readonly DB_NAME = 'portal-cache';
  private openPromise: Promise<IDBDatabase> | null = null;

  register(config: StoreConfig): void {
    if (this.stores.has(config.store)) return;
    this.stores.set(config.store, config);
    this.dbVersion += 1;
    // Force reconnect with new version on next open
    this.db = null;
    this.openPromise = null;
  }

  private open(): Promise<IDBDatabase> {
    if (this.openPromise) return this.openPromise;
    this.openPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.dbVersion);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        for (const cfg of this.stores.values()) {
          if (!db.objectStoreNames.contains(cfg.store)) {
            db.createObjectStore(cfg.store, { keyPath: cfg.keyPath });
          }
        }
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(this.db!);
      };
      req.onerror = () => {
        this.openPromise = null;
        reject(req.error);
      };
    });
    return this.openPromise;
  }

  async get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readonly').objectStore(store).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async put<T>(store: string, value: T): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readwrite').objectStore(store).put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async delete(store: string, key: IDBValidKey): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readwrite').objectStore(store).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clear(store: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const req = db.transaction(store, 'readwrite').objectStore(store).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

export const LocalDB = new LocalDBManager();
