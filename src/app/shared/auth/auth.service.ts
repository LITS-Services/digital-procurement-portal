import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/auth";
import firebase from 'firebase/app';
import { Observable, of, ReplaySubject } from 'rxjs';
import { environment } from 'environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthUtils } from './auth.util';
import { catchError, finalize, map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user: Observable<firebase.User>;
  private userDetails: firebase.User = null;
  private baseUrl = environment.apiUrl;


  private _refreshInProgress = false;
  private _refreshSubject = new ReplaySubject<string | null>(1);
  constructor(
    public _firebaseAuth: AngularFireAuth,
    private router: Router,
    private http: HttpClient
  ) {
    this.user = _firebaseAuth.authState;
    this.user.subscribe(user => this.userDetails = user || null);
  }

  
  // ===== Token Work =====
    get accessToken(): string | null {
    return localStorage.getItem('token');
  }
 set accessToken(token: string | null) {
  if (token) {
    console.log('[AUTH] Setting accessToken:', token.slice(0, 12) + '...');
    localStorage.setItem('token', token);
  } else {
    console.log('[AUTH] Clearing accessToken');
    localStorage.removeItem('token');
  }
}

  get refreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }
set refreshToken(token: string | null) {
  if (token) {
    console.log('[AUTH] Setting refreshToken:', token.slice(0, 12) + '...');
    localStorage.setItem('refreshToken', token);
  } else {
    console.log('[AUTH] Clearing refreshToken');
    localStorage.removeItem('refreshToken');
  }
}

  // ===== SSO Login =====
  initiateSSOLogin(returnUrl: string = '/dashboard/dashboard1'): Observable<any> {
    return this.http.get(`${this.baseUrl}/Auth/sso/login-url?returnUrl=${encodeURIComponent(returnUrl)}`);
  }

  // ===== OTP =====
  resendOtp(username: string, portalType: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/Auth/ResendOtp`, { username, portalType }, { responseType: 'text' });
  }

  verifyOtp(otp: string): Observable<string> {
    return this.http.post(`${this.baseUrl}/Auth/VerifyProcurementOtp`, { otp }, { responseType: 'text' });
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
           console.log('[AUTH] Refresh success: new tokens received');
          this._applySessionFromRefresh(resp);
        }),
        map((resp) => resp?.token ?? null),
        tap((newToken) =>{
         
          this._refreshSubject.next(newToken)
        } ),
        catchError((err) => {
          // refresh failed → clean up & notify observers
           console.error('[REFRESH] Refresh failed:', err);
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

    console.log('[AUTH] Login session set. accessToken:', this.accessToken.slice(0, 12) + '...', 'refreshToken:',this.refreshToken.slice(0, 12) + '...');

    if (res.userId) localStorage.setItem('userId', res.userId);
    if (res.userName) localStorage.setItem('userName', res.userName);

     const role = Array.isArray(res.roles) && res.roles.length > 0 ? res.roles[0] : '';
    localStorage.setItem('role', role);
    
    localStorage.setItem('roles', JSON.stringify(res.roles || []));

     const companyIds = Array.isArray(res.companyIds) ? res.companyIds : [];
          localStorage.setItem('companyIds', JSON.stringify(companyIds));
  }

  private _applySessionFromRefresh(res: any): void {
    if (res?.token) this.accessToken = res.token;
    if (res?.refreshToken) this.refreshToken = res.refreshToken; // rotate if provided

    console.log('[REFRESH] Applied new tokens from refresh. accessToken:', 
      this.accessToken.slice(0, 12) + '...', 'refreshToken:', this.refreshToken.slice(0, 12) + '...');


    // If backend re-sends identity/roles on refresh, update them (optional)
    if (res?.userId) localStorage.setItem('userId', res.userId);
    if (res?.userName) localStorage.setItem('userName', res.userName);

    if (res?.roles) {
      
     const role = Array.isArray(res.roles) && res.roles.length > 0 ? res.roles[0] : '';
    localStorage.setItem('role', role);
    
    localStorage.setItem('roles', JSON.stringify(res.roles || []));
    }
    if (res?.companyIds) {
      const companyIds = res?.companyIds?.$values || res.companyIds || [];
      localStorage.setItem('companyIds', JSON.stringify(companyIds));
    }
  }

}
