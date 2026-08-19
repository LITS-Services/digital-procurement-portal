import { Injectable, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;

@Injectable({ providedIn: 'root' })
export class SessionIdleService implements OnDestroy {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private listening = false;
  private readonly onActivity = () => this.resetTimer();

  constructor(private auth: AuthService) {}

  start(): void {
    if (this.listening) {
      this.resetTimer();
      return;
    }
    this.listening = true;
    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, this.onActivity, { passive: true });
    }
    this.resetTimer();
  }

  stop(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (!this.listening) return;
    for (const event of ACTIVITY_EVENTS) {
      window.removeEventListener(event, this.onActivity);
    }
    this.listening = false;
  }

  resetTimer(): void {
    if (!this.auth.isAuthenticated()) return;
    if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => {
      if (this.auth.isAuthenticated()) {
        this.auth.performLogout('idle');
      }
    }, this.idleMs());
  }

  private idleMs(): number {
    const seconds = window.config?.sessionIdleSeconds;
    if (seconds != null && seconds > 0) return seconds * 1000;
    const minutes = window.config?.sessionIdleMinutes ?? 20;
    return Math.max(1, minutes) * 60_000;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}
