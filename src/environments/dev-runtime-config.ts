import type { RuntimeConfig } from './runtime-config';

export const DEV_RUNTIME_CONFIG: RuntimeConfig = {
  apiUrl: 'https://localhost:7188/api',
  authUseCookies: false,
  sessionIdleMinutes: 20,
  accessTokenRefreshBufferSeconds: 5,
  httpTimeoutMs: 30_000,
  turnstileEnabled: false,
  turnstileSiteKey: '',
  firebaseConfig: {
    apiKey: 'AIzaSyBxm2YZhRXkQNU9kpK33SFYIrmW-rqTTcI',
    authDomain: 'portal-1d075.firebaseapp.com',
    projectId: 'portal-1d075',
    storageBucket: 'portal-1d075.firebasestorage.app',
    messagingSenderId: '552612021319',
    appId: '1:552612021319:web:8aecc40c6bb250f342dd62',
    measurementId: 'G-RP9QMZ2758'
  },
};
