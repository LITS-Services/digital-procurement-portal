import { Observable, Subject, shareReplay, startWith, switchMap } from 'rxjs';

interface CacheEntry {
  stream$: Observable<unknown>;
  invalidate$: Subject<void>;
}

const cache = new Map<string, CacheEntry>();

/** In-memory cache for shared list lookups; avoids duplicate concurrent HTTP calls. */
export function cachedObservable<T>(key: string, factory: () => Observable<T>): Observable<T> {
  let entry = cache.get(key);
  if (!entry) {
    const invalidate$ = new Subject<void>();
    const stream$ = invalidate$.pipe(
      startWith(void 0),
      switchMap(() => factory()),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    entry = { stream$, invalidate$ };
    cache.set(key, entry);
  }
  return entry.stream$ as Observable<T>;
}

/** Force the next subscriber to receive fresh data from the API. */
export function invalidateCachedObservable(key: string): void {
  cache.get(key)?.invalidate$.next();
}

/** Force all cached observables to receive fresh data from the API on next subscription. */
export function clearCachedObservables(): void {
  for (const entry of cache.values()) {
    entry.invalidate$.next();
  }
  cache.clear();
}
