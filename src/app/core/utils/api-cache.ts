import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiCache {
  private store = new Map<string, { data: unknown; expiry: number }>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set(key: string, data: unknown, ttlMs = 300_000): void {
    this.store.set(key, { data, expiry: Date.now() + ttlMs });
  }

  clear(pattern?: string): void {
    if (!pattern) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(pattern)) this.store.delete(key);
    }
  }
}
