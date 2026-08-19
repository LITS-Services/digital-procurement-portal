import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import type { RuntimeConfig } from './environments/runtime-config';
import { DEV_RUNTIME_CONFIG } from './environments/dev-runtime-config';

function isIpHostname(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

function resolveConfigPath(): string {
  if (environment.production && isIpHostname(window.location.hostname) && environment.configPathIp) {
    return environment.configPathIp;
  }
  return environment.configPath;
}

async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const configPath = resolveConfigPath();
  const baseResponse = await fetch(configPath);
  if (!baseResponse.ok) {
    throw new Error(`Failed to load config: ${baseResponse.statusText}`);
  }
  const base = (await baseResponse.json()) as RuntimeConfig;

  try {
    const secretsResponse = await fetch('assets/config.secrets.json');
    if (secretsResponse.ok) {
      const secrets = (await secretsResponse.json()) as RuntimeConfig;
      return { ...base, ...secrets };
    }
  } catch {
    // Optional deploy-time secrets overlay.
  }

  return base;
}

function bootstrapApp(): void {
  if (environment.production) {
    enableProdMode();
  }
  platformBrowserDynamic().bootstrapModule(AppModule).catch(err => console.error(err));
}

loadRuntimeConfig()
  .then(config => {
    window.config = config;
    bootstrapApp();
  })
  .catch(err => {
    console.error('Could not load runtime config — using development defaults.', err);
    if (!environment.production) {
      window.config = DEV_RUNTIME_CONFIG;
    }
    bootstrapApp();
  });
