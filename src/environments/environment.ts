import './runtime-config';
import { DEV_RUNTIME_CONFIG } from './dev-runtime-config';

const FALLBACK_FIREBASE = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: ''
};

export const environment = {
  production: false,
  configPath: 'assets/config.local.json',
  configPathIp: undefined as string | undefined,
  turnstileEnabled: false,
  turnstileSiteKey: '',
  get apiUrl() { return window.config?.apiUrl || DEV_RUNTIME_CONFIG.apiUrl || 'https://localhost:7188/api'; },
  get firebaseConfig() { return window.config?.firebaseConfig || FALLBACK_FIREBASE; },
  get resolvedTurnstileSiteKey() { return window.config?.turnstileSiteKey || this.turnstileSiteKey || ''; },
  get resolvedTurnstileEnabled() {
    if (typeof window.config?.turnstileEnabled === 'boolean') {
      return window.config.turnstileEnabled;
    }
    return this.turnstileEnabled;
  },
};
