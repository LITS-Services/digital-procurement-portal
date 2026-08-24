import './runtime-config';

function isIpHostname(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

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
  production: true,
  configPath: 'assets/config.json',
  configPathIp: 'assets/config.ip.json',
  turnstileEnabled: true,
  turnstileSiteKey: '',
  get apiUrl() {
    if (window.config?.apiUrl) return window.config.apiUrl;
    return isIpHostname(window.location.hostname)
      ? 'http://192.168.7.105:8085/api'
      : 'https://procurement-portal.lits.services:8087/api';
  },
  get firebaseConfig() { return window.config?.firebaseConfig || FALLBACK_FIREBASE; },
  get resolvedTurnstileSiteKey() { return window.config?.turnstileSiteKey || this.turnstileSiteKey || ''; },
  get resolvedTurnstileEnabled() {
    if (typeof window.config?.turnstileEnabled === 'boolean') {
      return window.config.turnstileEnabled;
    }
    return this.turnstileEnabled;
  },
};
