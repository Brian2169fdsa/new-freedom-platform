import { DEMO_DATA } from './data';

type Listener = () => void;

/**
 * Wrap a plain Date object into a Timestamp-like object so that code
 * calling `.toDate()` (Firestore pattern) still works.
 */
function wrapDate(d: Date) {
  return {
    toDate: () => d,
    seconds: Math.floor(d.getTime() / 1000),
    nanoseconds: 0,
  };
}

/** Recursively walk an object and wrap any `Date` instances. */
function wrapDates(obj: any): any {
  if (obj instanceof Date) return wrapDate(obj);
  if (Array.isArray(obj)) return obj.map(wrapDates);
  if (obj !== null && typeof obj === 'object' && !('toDate' in obj)) {
    const out: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      out[key] = wrapDates(value);
    }
    return out;
  }
  return obj;
}

class DemoStore {
  private collections: Record<string, Record<string, any>> = {};
  private listeners: Map<string, Set<Listener>> = new Map();
  private initialized = false;

  private init() {
    if (this.initialized) return;
    // Deep clone DEMO_DATA into collections, wrapping Date → Timestamp-like
    for (const [name, docs] of Object.entries(DEMO_DATA)) {
      const wrapped: Record<string, any> = {};
      for (const [docId, docData] of Object.entries(docs)) {
        wrapped[docId] = wrapDates(docData);
      }
      this.collections[name] = wrapped;
    }
    this.initialized = true;
  }

  private notify(collection: string) {
    const listeners = this.listeners.get(collection);
    if (listeners) {
      listeners.forEach(fn => fn());
    }
  }

  private ensureCollection(name: string) {
    this.init();
    if (!this.collections[name]) {
      this.collections[name] = {};
    }
  }

  getDoc(collection: string, docId: string): any | null {
    this.ensureCollection(collection);
    return this.collections[collection][docId] ?? null;
  }

  getDocs(collection: string): any[] {
    this.ensureCollection(collection);
    return Object.values(this.collections[collection]);
  }

  setDoc(collection: string, docId: string, data: any): void {
    this.ensureCollection(collection);
    this.collections[collection][docId] = { ...data, id: docId };
    this.notify(collection);
  }

  updateDoc(collection: string, docId: string, data: Partial<any>): void {
    this.ensureCollection(collection);
    const existing = this.collections[collection][docId];
    if (existing) {
      this.collections[collection][docId] = { ...existing, ...data };
      this.notify(collection);
    }
  }

  deleteDoc(collection: string, docId: string): void {
    this.ensureCollection(collection);
    delete this.collections[collection][docId];
    this.notify(collection);
  }

  addDoc(collection: string, data: any): string {
    this.ensureCollection(collection);
    const id = 'demo-' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    this.collections[collection][id] = { ...data, id };
    this.notify(collection);
    return id;
  }

  subscribe(collection: string, callback: Listener): () => void {
    if (!this.listeners.has(collection)) {
      this.listeners.set(collection, new Set());
    }
    this.listeners.get(collection)!.add(callback);
    return () => {
      this.listeners.get(collection)?.delete(callback);
    };
  }

  subscribeDoc(collection: string, docId: string, callback: Listener): () => void {
    // Wrap the callback to only fire when the specific doc changes
    let lastSnapshot = JSON.stringify(this.getDoc(collection, docId));
    const wrappedCallback = () => {
      const currentSnapshot = JSON.stringify(this.getDoc(collection, docId));
      if (currentSnapshot !== lastSnapshot) {
        lastSnapshot = currentSnapshot;
        callback();
      }
    };
    return this.subscribe(collection, wrappedCallback);
  }
}

export const demoStore = new DemoStore();
