import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'environments/environment';

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string | number;
      reset: (widgetId: string | number) => void;
      remove: (widgetId: string | number) => void;
    };
  }
}

@Injectable({ providedIn: 'root' })
export class LoginTurnstileProtectionService {
  private readonly TURNSTILE_SCRIPT_ID = 'turnstile-script';
  private readonly TURNSTILE_SCRIPT_SRC =
    'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

  private widgetId: string | number | null = null;
  private scriptLoadPromise: Promise<void> | null = null;

  private readonly tokenSubject = new BehaviorSubject<string | null>(null);
  readonly captchaTokenChanged$: Observable<string | null> = this.tokenSubject.asObservable();

  private readonly loadErrorSubject = new BehaviorSubject<string | null>(null);
  readonly turnstileLoadError$: Observable<string | null> = this.loadErrorSubject.asObservable();

  get captchaToken(): string | null {
    return this.tokenSubject.value;
  }

  private resolveSiteKey(): string {
    return environment.resolvedTurnstileSiteKey || environment.turnstileSiteKey || '';
  }

  async renderTurnstile(containerSelector: string): Promise<void> {
    this.loadErrorSubject.next(null);
    this.clearToken();

    const siteKey = this.resolveSiteKey();
    if (!siteKey) {
      this.loadErrorSubject.next('Captcha is currently unavailable (missing Turnstile site key).');
      return;
    }

    try {
      await this.ensureTurnstileScriptLoaded();
    } catch {
      this.scriptLoadPromise = null;
      this.loadErrorSubject.next(
        'Captcha failed to load. Allow challenges.cloudflare.com in the browser/firewall, and add localhost to the Turnstile widget hostnames in Cloudflare.'
      );
      return;
    }

    if (!window.turnstile?.render) {
      this.scriptLoadPromise = null;
      this.loadErrorSubject.next(
        'Captcha failed to load. Allow challenges.cloudflare.com in the browser/firewall, and add localhost to the Turnstile widget hostnames in Cloudflare.'
      );
      return;
    }

    const container = await this.waitForContainer(containerSelector);
    if (!container) {
      this.loadErrorSubject.next('Captcha failed to load. Please try again.');
      return;
    }

    this.teardownWidget();

    try {
      this.widgetId = window.turnstile.render(container, {
        sitekey: siteKey,
        theme: 'light',
        size: 'flexible',
        callback: (token: string) => {
          this.loadErrorSubject.next(null);
          this.tokenSubject.next(token);
        },
        'expired-callback': () => this.tokenSubject.next(null),
        'error-callback': () => {
          this.tokenSubject.next(null);
          this.loadErrorSubject.next(
            'Captcha could not verify this site. In Cloudflare Turnstile, add localhost (and your deployed hostname) to the widget’s allowed domains.'
          );
        },
      });
    } catch {
      this.loadErrorSubject.next('Captcha failed to load. Please try again.');
    }
  }

  teardownWidget(): void {
    try {
      if (this.widgetId != null && window.turnstile?.remove) {
        window.turnstile.remove(this.widgetId);
      }
    } catch {
      // ignore
    } finally {
      this.widgetId = null;
      this.clearToken();
    }
  }

  clearToken(): void {
    this.tokenSubject.next(null);
  }

  teardownOnNoCaptchaNeeded(): void {
    this.teardownWidget();
  }

  resetTurnstile(containerSelector = '#turnstile-container'): void {
    this.loadErrorSubject.next(null);
    this.clearToken();
    this.scriptLoadPromise = null;

    if (this.widgetId == null || !window.turnstile?.reset) {
      void this.renderTurnstile(containerSelector);
      return;
    }

    try {
      window.turnstile.reset(this.widgetId);
    } catch {
      this.teardownWidget();
      void this.renderTurnstile(containerSelector);
    }
  }

  recordLoginSuccess(): void {
    this.teardownWidget();
  }

  private waitForContainer(selector: string, timeoutMs = 2000): Promise<HTMLElement | null> {
    const startedAt = Date.now();
    return new Promise(resolve => {
      const tick = () => {
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) {
          resolve(el);
          return;
        }
        if (Date.now() - startedAt > timeoutMs) {
          resolve(null);
          return;
        }
        setTimeout(tick, 50);
      };
      tick();
    });
  }

  private async ensureTurnstileScriptLoaded(): Promise<void> {
    if (window.turnstile?.render) {
      this.scriptLoadPromise = Promise.resolve();
      return this.scriptLoadPromise;
    }

    if (this.scriptLoadPromise) return this.scriptLoadPromise;

    this.scriptLoadPromise = new Promise<void>((resolve, reject) => {
      const existing = document.getElementById(this.TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null
        || document.querySelector<HTMLScriptElement>('script[src*="challenges.cloudflare.com/turnstile"]');

      if (!existing) {
        const script = document.createElement('script');
        script.id = this.TURNSTILE_SCRIPT_ID;
        script.src = this.TURNSTILE_SCRIPT_SRC;
        script.async = true;
        script.onerror = () => {
          this.scriptLoadPromise = null;
          reject(new Error('Turnstile script failed to load'));
        };
        document.head.appendChild(script);
      }

      const startedAt = Date.now();
      const maxWaitMs = 15000;

      const tick = () => {
        if (window.turnstile?.render) {
          resolve();
          return;
        }
        if (Date.now() - startedAt > maxWaitMs) {
          this.scriptLoadPromise = null;
          reject(new Error('Turnstile script load timeout'));
          return;
        }
        setTimeout(tick, 150);
      };

      tick();
    });

    try {
      await this.scriptLoadPromise;
    } catch (err) {
      this.scriptLoadPromise = null;
      throw err;
    }
  }
}
