import { Router } from '@angular/router';
import { Injectable, Injector } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/compat/auth";
import firebase from 'firebase/compat/app';
import { Observable, of, Subject } from 'rxjs';
import { environment } from 'environments/environment';
import { HttpClient } from '@angular/common/http';
import { FirebaseMessagingService } from 'app/firebase-messaging.service';
import { AuthUtils } from './auth.util';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { PermissionService } from '../permissions/permission.service';
import { TokenStorageService } from './token-storage.service';
import { SessionIdleService } from './session-idle.service';
import { procurementWebLoginHeaders } from './procurement-client.headers';
import { withSkipToast } from '../interceptor/response-handler.interceptor';

const HTTP_CREDENTIALS = { withCredentials: true } as const;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user: Observable<firebase.User | null>;
  private userDetails: firebase.User | null = null;
  private baseUrl = environment.apiUrl;
  private _authState = new Subject<boolean>();
  private accessExpiresAt: string | null = null;
  private refreshExpiresAt: string | null = null;
  private sessionExpiryTimer: ReturnType<typeof setTimeout> | null = null;
  private loggingOut = false;

  constructor(
    public _firebaseAuth: AngularFireAuth,
    private router: Router,
    private http: HttpClient,
    private permissionService: PermissionService,
    private messagingService: FirebaseMessagingService,
    private tokenStorage: TokenStorageService,
    private injector: Injector
  ) {
    this.user = _firebaseAuth.authState as unknown as Observable<firebase.User | null>;
    this.user.subscribe(user => this.userDetails = user || null);
    this.tokenStorage.clearLegacyStorage();
  }

  useCookieAuth(): boolean {
    return !!window.config?.authUseCookies;
  }

  get accessToken(): string | null {
    if (this.useCookieAuth()) return null;
    const token = this.tokenStorage.getAccessToken();
    if (!token) return null;
    return AuthUtils.isTokenExpired(token) ? null : token;
  }

  set accessToken(token: string | null) {
    if (token) {
      this.tokenStorage.setTokens(token, this.tokenStorage.getRefreshToken() || '');
    }
  }

  get refreshToken(): string | null {
    return this.tokenStorage.getRefreshToken();
  }

  set refreshToken(token: string | null) {
    if (token) {
      this.tokenStorage.setTokens(this.tokenStorage.getAccessToken() || '', token);
    }
  }

  getCaptchaConfig(): Observable<{ enabled: boolean; siteKey: string }> {
    return this.http
      .get<Record<string, unknown>>(`${this.baseUrl}/Auth/captcha-config`, {
        ...HTTP_CREDENTIALS,
        headers: procurementWebLoginHeaders(),
        context: withSkipToast(),
      })
      .pipe(
        map(cfg => ({
          enabled: !!(cfg && (cfg['enabled'] === true || cfg['Enabled'] === true)),
          siteKey: String(cfg?.['siteKey'] ?? cfg?.['SiteKey'] ?? '').trim(),
        })),
        catchError(() => of({ enabled: false, siteKey: '' })),
      );
  }

  isCaptchaEnabled(): Observable<boolean> {
    return this.getCaptchaConfig().pipe(map(cfg => cfg.enabled));
  }

  setSSOSession(data: any): void {
    const roles = data.roles ?
      (Array.isArray(data.roles) ? data.roles : data.roles.split(',')) :
      [];

    const sessionData = {
      token: data.token,
      refreshToken: data.refreshToken || '',
      userId: data.id || data.userId || '',
      userName: data.username || data.userName || '',
      email: data.email || '',
      roles: roles,
      companyIds: data.companyIds || []
    };

    this._setSessionFromLogin(sessionData);
  }

  createEmailInvitation(userData: any): Observable<string> {
    return this.http.post(`${this.baseUrl}/Auth/create-email-invitation`, userData, { responseType: 'text', ...HTTP_CREDENTIALS });
  }

  getUserInvitation(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/Auth/get-email-logs`, HTTP_CREDENTIALS);
  }

  initiateSSOLogin(returnUrl: string = '/'): Observable<any> {
    return this.http.get(`${this.baseUrl}/Auth/procurement-sso/login-url?returnUrl=${encodeURIComponent(returnUrl)}`, HTTP_CREDENTIALS);
  }

  forgetPassword(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/Auth/ProcurementForgotPassword`, { email }, HTTP_CREDENTIALS);
  }

  ProcurementResetPassword(payload: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/Auth/ProcurementResetPassword`, payload, HTTP_CREDENTIALS);
  }

  resendOtp(username: string, portalType: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/Auth/ResendOtp`, { username, portalType }, { responseType: 'text', ...HTTP_CREDENTIALS });
  }

  verifyOtp(email: string, otp: string, resetOtp: boolean = true): Observable<string> {
    const payload = { email, otp: Number(otp), resetOtp };
    return this.http.post(`${this.baseUrl}/Auth/VerifyProcurementOtp`, payload, { responseType: 'text', ...HTTP_CREDENTIALS });
  }

  ResetPassword(payload: any) {
    return this.http.post(`${environment.apiUrl}/ProcurementUsers/ChangePassword/`, payload, HTTP_CREDENTIALS);
  }

  signinUser(username: string, password: string, turnstileToken?: string | null): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}/Auth/ProcurementLogin`,
      { username, password, turnstileToken: turnstileToken || null },
      { ...HTTP_CREDENTIALS, headers: procurementWebLoginHeaders() }
    ).pipe(
      tap((res) => {
        const auth = unwrapAuthPayload(res);
        if (auth && (authToken(auth) || this.useCookieAuth())) {
          this._setSessionFromLogin(auth);
        }
      })
    );
  }

  register(userData: any): Observable<string> {
    return this.http.post(`${this.baseUrl}/Auth/ProcurementUserRegister`, userData, { responseType: 'text', ...HTTP_CREDENTIALS });
  }

  logout(): Observable<any> {
    const refreshToken = this.useCookieAuth() ? undefined : this.tokenStorage.getRefreshToken() ?? undefined;
    const body = refreshToken ? { refreshToken } : {};
    return this.http.post(`${this.baseUrl}/Auth/Procurementlogout`, body, HTTP_CREDENTIALS);
  }

  performLogout(reason?: 'session-expired' | 'idle'): void {
    if (this.loggingOut) return;
    this.loggingOut = true;
    this.logout().pipe(catchError(() => of(null))).subscribe({
      complete: () => this.finishLogout(reason),
      error: () => this.finishLogout(reason),
    });
  }

  get isLoggingOut(): boolean {
    return this.loggingOut;
  }

  isAuthenticated(): boolean {
    if (this.useCookieAuth()) {
      return localStorage.getItem('isAuthenticated') === 'true' && !!localStorage.getItem('userId');
    }
    return !!this.accessToken;
  }

  hasPermission(permission: string): boolean {
    const [prefix, action] = permission.split('.');
    const formId = FORM_PREFIX_TO_ID[prefix];
    if (!formId) return false;
    if (action === 'view') return this.permissionService.canRead(formId);
    if (action === 'delete') return this.permissionService.canDelete(formId);
    return this.permissionService.canWrite(formId);
  }

  getUserRoles(): string[] {
    return JSON.parse(localStorage.getItem('roles') || '[]');
  }

  getUserRole(): string | null {
    const roles = this.getUserRoles();
    return roles.length > 0 ? roles[0] : null;
  }

  hasRole(role: string): boolean {
    return this.getUserRoles().includes(role);
  }

  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  getUserName(): string | null {
    return localStorage.getItem('userName');
  }

  getUserEmail(): string | null {
    return localStorage.getItem('userEmail');
  }

  getCompanyIds(): string[] {
    return JSON.parse(localStorage.getItem('companyIds') || '[]');
  }

  restoreSession$(): Observable<boolean> {
    this.tokenStorage.clearLegacyStorage();
    if (this.useCookieAuth()) {
      this.tokenStorage.clear();
    } else {
      this.tokenStorage.restorePersistedRefreshToken();
      if (!this.tokenStorage.getRefreshToken()) {
        return of(false);
      }
    }

    return this.refreshAccessToken$().pipe(
      map(token => this.useCookieAuth() ? this.isAuthenticated() : !!token),
      catchError(() => of(false)),
    );
  }

  ensureValidAccessToken$(): Observable<string | null> {
    const bufferSeconds = window.config?.accessTokenRefreshBufferSeconds ?? 5;

    if (this.useCookieAuth()) {
      if (this.accessExpiresAt && !AuthUtils.isUtcExpiredOrNear(this.accessExpiresAt, bufferSeconds)) {
        return of(null);
      }
      return this.refreshAccessToken$();
    }

    const token = this.accessToken;
    if (token && !AuthUtils.isTokenExpired(token, bufferSeconds)) {
      return of(token);
    }

    if (!this.tokenStorage.getRefreshToken()) {
      return of(null);
    }

    return this.refreshAccessToken$();
  }

  refreshAccessToken$(): Observable<string | null> {
    if (!this.tokenStorage.tryBeginRefresh()) {
      return this.tokenStorage.waitForRefresh();
    }

    const refreshToken = this.tokenStorage.getRefreshToken();
    if (!this.useCookieAuth() && !refreshToken) {
      this.tokenStorage.completeRefresh(null);
      return of(null);
    }

    const body = this.useCookieAuth() ? {} : { refreshToken };

    return this.http
      .post<any>(`${this.baseUrl}/Auth/Procurement-Refresh`, body, {
        ...HTTP_CREDENTIALS,
        context: withSkipToast(),
      })
      .pipe(
        tap((resp) => this._applySessionFromRefresh(resp)),
        map((resp) => resp?.token ?? this.tokenStorage.getAccessToken()),
        catchError(() => of(null)),
        finalize(() => this.tokenStorage.completeRefresh(this.accessToken))
      );
  }

  private _setSessionFromLogin(res: any): void {
    this.tokenStorage.clearLegacyStorage();
    const token = authToken(res);
    const refresh = authRefreshToken(res);
    if (this.useCookieAuth()) {
      this.tokenStorage.clear();
    } else if (token || refresh) {
      this.tokenStorage.setTokens(token, refresh);
    }

    this.accessExpiresAt = res.expiresAt ?? res.ExpiresAt ?? null;
    this.refreshExpiresAt = res.refreshExpiresAt ?? res.RefreshExpiresAt ?? null;

    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('role');
    localStorage.removeItem('roles');
    localStorage.removeItem('companyIds');

    const userId = res.userId || res.UserId || res.id || '';
    if (userId) localStorage.setItem('userId', userId);
    const userName = res.userName || res.UserName;
    if (userName) localStorage.setItem('userName', userName);
    const email = res.email || res.Email;
    if (email) localStorage.setItem('userEmail', email);

    const roles = res.roles || res.Roles || [];
    const role = Array.isArray(roles) && roles.length > 0 ? roles[0] : '';
    localStorage.setItem('role', role);
    localStorage.setItem('roles', JSON.stringify(Array.isArray(roles) ? roles : []));

    const companyIds = res.companyIds?.$values || res.companyIds || res.CompanyIds || [];
    localStorage.setItem('companyIds', JSON.stringify(Array.isArray(companyIds) ? companyIds : []));

    const rolePermissions = res.rolePermissions || res.RolePermissions;
    if (rolePermissions) {
      this.permissionService.setPermissions(rolePermissions);
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      localStorage.setItem('auth', JSON.stringify({ ...auth, rolePermissions }));
    }

    localStorage.setItem('isAuthenticated', 'true');
    this.scheduleSessionExpiry(this.refreshExpiresAt);
    this.bumpIdleTimer();
    this._notifyAuthStateChange();

    if (userId) {
      try {
        this.messagingService.requestPermission(userId);
      } catch (err) {
        console.error('FCM error:', err);
      }
    }
  }

  private _applySessionFromRefresh(res: any): void {
    if (this.useCookieAuth()) {
      this.tokenStorage.clear();
    } else {
      if (res?.token || res?.refreshToken) {
        this.tokenStorage.setTokens(res.token || this.tokenStorage.getAccessToken() || '', res.refreshToken || this.tokenStorage.getRefreshToken() || '');
      }
    }

    this.accessExpiresAt = res?.expiresAt ?? res?.ExpiresAt ?? this.accessExpiresAt;
    this.refreshExpiresAt = res?.refreshExpiresAt ?? res?.RefreshExpiresAt ?? this.refreshExpiresAt;

    if (res?.userId) localStorage.setItem('userId', res.userId);
    if (res?.userName) localStorage.setItem('userName', res.userName);
    if (res?.email) localStorage.setItem('userEmail', res.email);

    if (res?.roles) {
      const role = Array.isArray(res.roles) && res.roles.length > 0 ? res.roles[0] : '';
      localStorage.setItem('role', role);
      localStorage.setItem('roles', JSON.stringify(res.roles || []));
    }
    if (res?.companyIds) {
      const companyIds = res?.companyIds?.$values || res.companyIds || [];
      localStorage.setItem('companyIds', JSON.stringify(companyIds));
    }

    if (res?.rolePermissions) {
      this.permissionService.setPermissions(res.rolePermissions);
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      localStorage.setItem('auth', JSON.stringify({ ...auth, rolePermissions: res.rolePermissions }));
    }

    if (res?.userId || res?.token || this.useCookieAuth()) {
      localStorage.setItem('isAuthenticated', 'true');
    }

    this.scheduleSessionExpiry(this.refreshExpiresAt);
    this.bumpIdleTimer();
    this._notifyAuthStateChange();
  }

  private scheduleSessionExpiry(isoUtc: string | null): void {
    if (this.sessionExpiryTimer !== null) {
      clearTimeout(this.sessionExpiryTimer);
      this.sessionExpiryTimer = null;
    }
    if (!isoUtc) return;
    const delay = Date.parse(isoUtc) - Date.now();
    if (Number.isNaN(delay) || delay <= 0) return;
    this.sessionExpiryTimer = setTimeout(() => {
      if (this.isAuthenticated()) this.performLogout('session-expired');
    }, delay);
  }

  private bumpIdleTimer(): void {
    try { this.injector.get(SessionIdleService).start(); } catch { /* optional */ }
  }

  private finishLogout(reason?: 'session-expired' | 'idle'): void {
    if (this.sessionExpiryTimer !== null) {
      clearTimeout(this.sessionExpiryTimer);
      this.sessionExpiryTimer = null;
    }
    try { this.injector.get(SessionIdleService).stop(); } catch { /* optional */ }
    this.tokenStorage.clear();
    this.accessExpiresAt = null;
    this.refreshExpiresAt = null;
    localStorage.clear();
    this.loggingOut = false;
    if (reason === 'session-expired') {
      sessionStorage.setItem('authFlash', 'Your session has expired. Please sign in again.');
    } else if (reason === 'idle') {
      sessionStorage.setItem('authFlash', 'You were signed out due to inactivity.');
    } else {
      sessionStorage.removeItem('authFlash');
    }
    this.router.navigate(['/pages/login']);
  }

  private _notifyAuthStateChange(): void {
    this._authState.next(this.isAuthenticated());
  }

  get authState(): Observable<boolean> {
    return this._authState.asObservable();
  }
}

const FORM_PREFIX_TO_ID: Record<string, number | string> = {
  'purchase-request': 1,
  'rfq': 2,
  'purchase-order': 3,
  'vendor-companies': 4,
  'procurement-users': 6,
  'entities': 7,
  'global-configuration': 8,
  'logs': 9,
  'acl': 10,
  'workflow-setup': 11,
  'vendor-onboarding': 12,
  'invitation': 13,
  'email-template': 14,
  'bulk-company-onboarding': 15,
  'inventory-transfer': 16,
  'integration-manager': 17,
  'dashboard': '/dashboard/dashboard1',
  'turnstile': '/setup/turnstile',
  'security-audit': 9,
};

function unwrapAuthPayload(res: any): any {
  if (!res || typeof res !== 'object') return res;
  const inner = res.value ?? res.Value;
  if (inner && typeof inner === 'object' && (authToken(inner) || authRefreshToken(inner) || inner.userId || inner.UserId)) {
    return inner;
  }
  return res;
}

function authToken(res: any): string {
  return (res?.token || res?.Token || '').toString();
}

function authRefreshToken(res: any): string {
  return (res?.refreshToken || res?.RefreshToken || '').toString();
}
