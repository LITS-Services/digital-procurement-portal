export interface RuntimeConfig {
  apiUrl?: string;
  authUseCookies?: boolean;
  sessionIdleMinutes?: number;
  sessionIdleSeconds?: number;
  accessTokenRefreshBufferSeconds?: number;
  httpTimeoutMs?: number;
  httpRetryCount?: number;
  httpRetryBaseDelayMs?: number;
  turnstileSiteKey?: string;
  turnstileEnabled?: boolean;
  firebaseConfig?: Record<string, string>;
}

declare global {
  interface Window {
    config?: RuntimeConfig;
  }
}

export {};
