import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/auth";
import firebase from 'firebase/app';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user: Observable<firebase.User>;
  private userDetails: firebase.User = null;
  private baseUrl = environment.apiUrl;

  constructor(
    public _firebaseAuth: AngularFireAuth,
    private router: Router,
    private http: HttpClient
  ) {
    this.user = _firebaseAuth.authState;
    this.user.subscribe(user => this.userDetails = user || null);
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
          localStorage.setItem('token', res.token);
          localStorage.setItem('userId', res.userId || '');
          localStorage.setItem('userName', res.userName || '');

          // ✅ Save role as a single string (e.g., "Admin")
          const role = Array.isArray(res.roles) && res.roles.length > 0 ? res.roles[0] : '';
          localStorage.setItem('role', role);

          // ✅ Also optional: keep the full array in case you ever support multiple roles
          localStorage.setItem('roles', JSON.stringify(res.roles || []));

          // ✅ Save company IDs as array
          const companyIds = Array.isArray(res.companyIds) ? res.companyIds : [];
          localStorage.setItem('companyIds', JSON.stringify(companyIds));
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
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() < payload.exp * 1000;
    } catch (e) {
      return false;
    }
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
}
