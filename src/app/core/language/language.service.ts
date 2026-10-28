import { Injectable, inject, signal, computed, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable, of, tap, catchError, shareReplay, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../shared/auth/auth.service';
import { clearCachedObservables } from '../cached-observable';
import {
  AppLanguage,
  LANGUAGE_STORAGE_KEY,
  LanguageOption,
  SUPPORTED_LANGUAGES,
  isAppLanguage,
  languageDir,
} from './language.types';

/**
 * Central language & RTL orchestration service for Digital Procurement Portal.
 * Manages active language state, updates document direction (LTR/RTL),
 * drives ngx-translate, and synchronizes user preference with backend API.
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly http = inject(HttpClient, { optional: true });
  private readonly injector = inject(Injector);

  readonly languages: readonly LanguageOption[] = SUPPORTED_LANGUAGES;

  private readonly _language = signal<AppLanguage>(this.readStored());
  private readonly languageSubject = new BehaviorSubject<AppLanguage>(this._language());

  readonly language = this._language.asReadonly();
  readonly isRtl = computed(() => this._language() === 'ar');
  readonly languageChanges$: Observable<AppLanguage> = this.languageSubject.asObservable();

  /** Apply stored language on boot (called from APP_INITIALIZER). */
  init(): void {
    const lang = this._language();
    try {
      this.translate.addLangs([...SUPPORTED_LANGUAGES.map(l => l.code)]);
      this.translate.setDefaultLang('en');
      this.applyDocument(lang);
      this.translate.use(lang).subscribe({ error: () => undefined });
    } catch {
      this.applyDocument(lang);
    }
  }

  current(): AppLanguage {
    return this._language();
  }

  setLanguage(lang: AppLanguage, persistToApi = true): Observable<any> {
    if (!isAppLanguage(lang)) return of(null);
    this._language.set(lang);
    this.languageSubject.next(lang);
    clearCachedObservables();

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      localStorage.setItem('language', lang);
    } catch {
      /* ignore */
    }

    this.applyDocument(lang);
    const use$ = this.translate.use(lang);

    if (persistToApi && this.http) {
      try {
        const auth = this.injector.get(AuthService);
        if (auth.isAuthenticated()) {
          const req$ = this.http
            .put<any>(
              `${environment.apiUrl}/Auth/me/language`,
              { language: lang },
              { withCredentials: true }
            )
            .pipe(
              tap((res) => {
                if (res) {
                  auth.applyAuthResult(res);
                }
              }),
              catchError(() => of(null)),
              shareReplay(1)
            );
          req$.subscribe({ error: () => undefined });
          return forkJoin([use$.pipe(catchError(() => of(null))), req$]).pipe(
            map(([_, res]) => res)
          );
        }
      } catch {
        /* optional */
      }
    }

    return use$.pipe(
      map(() => null),
      catchError(() => of(null))
    );
  }

  private readStored(): AppLanguage {
    try {
      const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) || localStorage.getItem('language');
      return isAppLanguage(stored) ? stored : 'en';
    } catch {
      return 'en';
    }
  }

  private applyDocument(lang: AppLanguage): void {
    const dir = languageDir(lang);
    if (typeof document === 'undefined') return;
    const html = document.documentElement;
    html.lang = lang;
    html.dir = dir;
    html.setAttribute('data-lang', lang);
    html.setAttribute('data-textdirection', dir);
    html.classList.toggle('rtl', dir === 'rtl');
    html.classList.toggle('ltr', dir === 'ltr');
    if (document.body) {
      document.body.setAttribute('data-textdirection', dir);
      document.body.classList.toggle('rtl', dir === 'rtl');
      document.body.classList.toggle('ltr', dir === 'ltr');
    }
  }
}
