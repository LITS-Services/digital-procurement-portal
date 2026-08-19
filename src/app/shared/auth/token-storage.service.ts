import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';

export const LEGACY_TOKEN_KEY = 'token';
export const LEGACY_REFRESH_KEY = 'refreshToken';
export const SESSION_REFRESH_KEY = 'procurement_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshInProgress = false;
  private readonly refreshResult$ = new BehaviorSubject<string | null | undefined>(undefined);

  clearLegacyStorage(): void {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_REFRESH_KEY);
    localStorage.removeItem('fleet_access_token');
    localStorage.removeItem('fleet_refresh_token');
  }

  restorePersistedRefreshToken(): void {
    if (this.refreshToken) return;
    try {
      const stored = sessionStorage.getItem(SESSION_REFRESH_KEY);
      if (stored) this.refreshToken = stored;
    } catch { /* ignore */ }
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken || null;
    this.refreshToken = refreshToken || null;
    this.persistRefreshToken(refreshToken);
  }

  private persistRefreshToken(refreshToken: string): void {
    try {
      if (refreshToken) sessionStorage.setItem(SESSION_REFRESH_KEY, refreshToken);
      else sessionStorage.removeItem(SESSION_REFRESH_KEY);
    } catch { /* ignore */ }
  }

  getAccessToken(): string | null { return this.accessToken; }
  getRefreshToken(): string | null { return this.refreshToken; }

  clear(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.refreshInProgress = false;
    this.refreshResult$.next(undefined);
    try { sessionStorage.removeItem(SESSION_REFRESH_KEY); } catch { /* ignore */ }
    this.clearLegacyStorage();
  }

  tryBeginRefresh(): boolean {
    if (this.refreshInProgress) return false;
    this.refreshInProgress = true;
    this.refreshResult$.next(undefined);
    return true;
  }

  completeRefresh(accessToken: string | null): void {
    this.refreshInProgress = false;
    this.refreshResult$.next(accessToken);
  }

  waitForRefresh(): Observable<string | null> {
    return this.refreshResult$.pipe(
      filter((token): token is string | null => token !== undefined),
      take(1)
    );
  }
}
