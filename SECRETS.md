# Secrets management (UI)

Public runtime keys are loaded from JSON at startup. **Never commit real API keys** in tracked config files.

## Local development (`ng serve`)

1. Copy the example:
   ```powershell
   copy public\assets\config.local.json.example public\assets\config.local.json
   copy src\assets\config.local.json.example src\assets\config.local.json
   ```
2. Set `apiUrl` to the local API (`https://localhost:7188/api`).
3. Keep `authUseCookies` **false** for local Bearer-token development (Postman / Swagger stay compatible).
4. Fill `turnstileSiteKey` only when testing captcha (public site key). Leave empty to skip the widget.

`config.local.json` and `config.secrets.json` are **gitignored**.

## Production / IIS deploy

1. Keep `public/assets/config.json` in source control with empty `turnstileSiteKey`.
2. On the server, add `public/assets/config.secrets.json` (gitignored) or inject keys during deployment:
   ```powershell
   copy public\assets\config.secrets.json.example public\assets\config.secrets.json
   ```
3. The app merges `config.secrets.json` over `config.json` at startup when the file exists.
4. Set `authUseCookies` to **true** so the SPA uses HttpOnly cookies (API `Auth:UseCookies` must match).
5. Confirm `apiUrl` and CSP `connect-src` match the production API origin.

## Key types

| Key | Sensitivity | Where it lives |
|-----|-------------|----------------|
| Turnstile site key | Public | UI `config.secrets.json` |
| Turnstile secret key | **Secret** | API `Turnstile:SecretKey` only |
| Firebase web config | Public (client) | UI `config.json` |
| JWT / DB / Graph / Azure | **Secret** | API only — see `digital-procurement-portal_API/SECRETS.md` |
