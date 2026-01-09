import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/compat/auth";
import firebase from 'firebase/compat/app';
import { Observable, of, ReplaySubject, Subject } from 'rxjs';
import { environment } from 'environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthUtils } from './auth.util';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { PermissionService } from '../permissions/permission.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user: Observable<firebase.User | null>;
  private userDetails: firebase.User | null = null;
  private baseUrl = environment.apiUrl;

  private _refreshInProgress = false;
  private _refreshSubject = new ReplaySubject<string | null>(1);
  private _authState = new Subject<boolean>();

  constructor(
    public _firebaseAuth: AngularFireAuth,
    private router: Router,
    private http: HttpClient,
    private permissionService: PermissionService
  ) {
    this.user = _firebaseAuth.authState as unknown as Observable<firebase.User | null>;
    this.user.subscribe(user => this.userDetails = user || null);
  }

  // ===== Token Work =====
  get accessToken(): string | null {
    return localStorage.getItem('token');
  }
  set accessToken(token: string | null) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  get refreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
  set refreshToken(token: string | null) {
    if (token) {
      localStorage.setItem('refreshToken', token);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }

  // ===== SSO Session Setup =====
  setSSOSession(data: any): void {
    // Extract data from SSO callback
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


    // Use the same session setup as regular login
    this._setSessionFromLogin(sessionData);
  }

  createEmailInvitation(userData: any): Observable<string> {
    return this.http.post(`${this.baseUrl}/Auth/create-email-invitation`, userData, { responseType: 'text' });
  }

  getUserInvitation(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/Auth/get-email-logs`);
  }

  // ===== SSO Login =====
  initiateSSOLogin(returnUrl: string = '/dashboard/dashboard1'): Observable<any> {
    return this.http.get(`${this.baseUrl}/Auth/procurement-sso/login-url?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  // =======ForgotPassword====
  forgetPassword(email: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/Auth/ProcurementForgotPassword`, { email });
  }

  ProcurementResetPassword(payload: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/Auth/ProcurementResetPassword`, payload);
  }

  // ===== OTP =====
  resendOtp(username: string, portalType: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/Auth/ResendOtp`, { username, portalType }, { responseType: 'text' });
  }

  verifyOtp(email: string, otp: string, resetOtp: boolean = true): Observable<string> {
    const payload = { email, otp: Number(otp), resetOtp };
    return this.http.post(`${this.baseUrl}/Auth/VerifyProcurementOtp`, payload, { responseType: 'text' });
  }

  ResetPassword(payload: any) {
    return this.http.post(`${environment.apiUrl}/ProcurementUsers/ChangePassword/`, payload);
  }

  // ===== Sign In =====
  signinUser(username: string, password: string): Observable<any> {
    return new Observable((observer) => {
      this.http.post<any>(`${this.baseUrl}/Auth/ProcurementLogin`, { username, password }).subscribe({
        next: (res) => {
          if (res && res.token) {
            this._setSessionFromLogin(res);
          }

          observer.next(res);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }

  // ===== Register =====
  register(userData: any): Observable<string> {
    return this.http.post(`${this.baseUrl}/Auth/ProcurementUserRegister`, userData, { responseType: 'text' });
  }

  // ===== Logout =====
  logout(): Observable<any> {
    return this.http.post(`${this.baseUrl}/Auth/logout`, {});
  }

  performLogout(): void {
    localStorage.clear();
    this.router.navigate(['/pages/login']);
  }

  // ===== Authentication Check =====
  isAuthenticated(): boolean {
    const token = this.accessToken;
    if (!token) return false;

    return !AuthUtils.isTokenExpired(token);
  }

  // ===== Role Helpers =====
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

  // ===== User Info Helpers =====
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

  /** Call this before protected calls (used by interceptor). */
  ensureValidAccessToken$(): Observable<string | null> {
    const token = this.accessToken;

    // still valid? give back current token
    if (token && !AuthUtils.isTokenExpired(token, 5)) {
      return of(token);
    }

    // no refresh token → cannot refresh
    if (!this.refreshToken) {
      return of(null);
    }

    // de-dupe refresh when multiple requests hit at once
    if (this._refreshInProgress) {
      return this._refreshSubject.asObservable();
    }

    this._refreshInProgress = true;

    return this.http
      .post<any>(`${this.baseUrl}/Auth/Procurement-Refresh`, { refreshToken: this.refreshToken })
      .pipe(
        tap((resp) => {
          // EXPECTED: { token, refreshToken? (optional rotation), userId?, userName?, roles?, companyIds? }
          this._applySessionFromRefresh(resp);
        }),
        map((resp) => resp?.token ?? null),
        tap((newToken) => {
          this._refreshSubject.next(newToken);
        }),
        catchError((err) => {
          // refresh failed → clean up & notify observers
          this._refreshSubject.next(null);
          return of(null);
        }),
        finalize(() => {
          this._refreshInProgress = false;
          // reset subject for the next refresh wave
          this._refreshSubject.complete();
          this._refreshSubject = new ReplaySubject<string | null>(1);
        })
      );
  }

  // -----------------------------
  // Internal helpers
  // -----------------------------
  private _setSessionFromLogin(res: any): void {
    this.accessToken = res.token ?? null;
    this.refreshToken = res.refreshToken ?? null;

      this.accessToken ? this.accessToken.slice(0, 12) + '...' : 'null',
      'refreshToken:',
      this.refreshToken ? this.refreshToken.slice(0, 12) + '...' : 'null';

    if (res.userId) localStorage.setItem('userId', res.userId);
    if (res.userName) localStorage.setItem('userName', res.userName);
    if (res.email) localStorage.setItem('userEmail', res.email);

    const role = Array.isArray(res.roles) && res.roles.length > 0 ? res.roles[0] : '';
    localStorage.setItem('role', role);

    localStorage.setItem('roles', JSON.stringify(res.roles || []));

    // Handle companyIds with potential $values wrapper
    const companyIds = res.companyIds?.$values || res.companyIds || [];
    localStorage.setItem('companyIds', JSON.stringify(Array.isArray(companyIds) ? companyIds : []));

    // Store permissions
    if (res.rolePermissions) {
      this.permissionService.setPermissions(res.rolePermissions);
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      localStorage.setItem('auth', JSON.stringify({ ...auth, rolePermissions: res.rolePermissions }));
    }

    localStorage.setItem('isAuthenticated', 'true');

    // Notify auth state change
    this._notifyAuthStateChange();
  }

  private _applySessionFromRefresh(res: any): void {
    if (res?.token) this.accessToken = res.token;
    if (res?.refreshToken) this.refreshToken = res.refreshToken; // rotate if provided

      this.accessToken ? this.accessToken.slice(0, 12) + '...' : 'null',
      'refreshToken:',
      this.refreshToken ? this.refreshToken.slice(0, 12) + '...' : 'null';

    // If backend re-sends identity/roles on refresh, update them (optional)
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

    // Update ACL permissions
    if (res?.rolePermissions) {
      this.permissionService.setPermissions(res.rolePermissions);
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      localStorage.setItem('auth', JSON.stringify({ ...auth, rolePermissions: res.rolePermissions }));
    }

    // Notify auth state change
    this._notifyAuthStateChange();
  }

  private _notifyAuthStateChange(): void {
    this._authState.next(this.isAuthenticated());
  }

  get authState(): Observable<boolean> {
    return this._authState.asObservable();
  }
}