import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { AuthUtils } from './auth.util';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot)
    : Observable<boolean | UrlTree> {

    // 🔹 check if token is in the URL (SSO Callback to Protected Route)
    const urlToken = route.queryParams['token'];
    if (urlToken) {
      this.auth.setSSOSession({
        token: urlToken,
        refreshToken: route.queryParams['refreshToken'],
        id: route.queryParams['id'],
        username: route.queryParams['username'],
        email: route.queryParams['email'],
        roles: route.queryParams['roles']
      });

      // Clean URL (optional, but good for security so token doesn't stay in browser history if we can help it, 
      // but Router might handle it. For now, just allow access.)
      // We allow access immediately because we just set the session.
      return of(true);
    }

    // First, check if we have a valid token in localStorage
    const token = this.auth.accessToken;

    if (token) {
      const isExpired = AuthUtils.isTokenExpired(token);

      // Decode token for debugging
      try {
        const payload = AuthUtils.decodeToken(token);
        if (payload) {
          const expDate = new Date(payload.exp * 1000);
        }
      } catch (e) {
        console.error('[AUTH GUARD] Error decoding token:', e);
      }
    }

    // If we have a token and it's not expired, proceed with role check
    if (token && !AuthUtils.isTokenExpired(token)) {
      return this.checkRoleAccess(route, true);
    }

    // If no valid token, try to refresh it
    return this.auth.ensureValidAccessToken$().pipe(
      tap(token => {
      }),
      switchMap(token => {
        if (!token) {
          // Store the attempted URL for redirect after login
          const redirectUrl = state.url !== '/pages/login' ? state.url : null;
          this.auth.performLogout();
          if (redirectUrl) {
            sessionStorage.setItem('redirectUrl', redirectUrl);
          }
          return of(false); // Router handle navigation via performLogout
        }

        return this.checkRoleAccess(route, false);
      }),
      catchError((error) => {
        // Store the attempted URL for redirect after login
        const redirectUrl = state.url !== '/pages/login' ? state.url : null;
        this.auth.performLogout();
        if (redirectUrl) {
          sessionStorage.setItem('redirectUrl', redirectUrl);
        }
        return of(false);
      }),
      tap(result => {
      })
    );
  }

  /**
   * Check if user has required role for the route
   */
  private checkRoleAccess(route: ActivatedRouteSnapshot, fromCache: boolean): Observable<boolean | UrlTree> {
    const expectedRole: string | undefined = route.data['role'];

    // If no role is specified, allow access
    if (!expectedRole) {
      return of(true);
    }

    // Get user roles
    const roles = this.auth.getUserRoles();

    // Check if user has the required role
    if (roles.includes(expectedRole.toLowerCase())) {
      return of(true);
    }

    return of(this.router.createUrlTree(['/unauthorized']));
  }
}