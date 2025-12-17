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

    console.log('[AUTH GUARD] Checking access for route:', state.url);
    console.log('[AUTH GUARD] Route data:', route.data);

    // 🔹 check if token is in the URL (SSO Callback to Protected Route)
    const urlToken = route.queryParams['token'];
    if (urlToken) {
      console.log('[AUTH GUARD] Token found in URL query params. Processing SSO login...');
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
    console.log('[AUTH GUARD] Token exists in localStorage:', !!token);

    if (token) {
      const isExpired = AuthUtils.isTokenExpired(token);
      console.log('[AUTH GUARD] Token expiration check:', isExpired ? 'EXPIRED' : 'VALID');
      console.log('[AUTH GUARD] Token content (partial):', token.substring(0, 50) + '...');

      // Decode token for debugging
      try {
        const payload = AuthUtils.decodeToken(token);
        console.log('[AUTH GUARD] Token payload:', payload);
        if (payload) {
          const expDate = new Date(payload.exp * 1000);
          console.log('[AUTH GUARD] Token expires at:', expDate.toISOString());
          console.log('[AUTH GUARD] Current time:', new Date().toISOString());
        }
      } catch (e) {
        console.error('[AUTH GUARD] Error decoding token:', e);
      }
    }

    // If we have a token and it's not expired, proceed with role check
    if (token && !AuthUtils.isTokenExpired(token)) {
      console.log('[AUTH GUARD] Token is valid, checking role access');
      return this.checkRoleAccess(route, true);
    }

    console.log('[AUTH GUARD] Token is missing or expired, attempting refresh...');

    // If no valid token, try to refresh it
    return this.auth.ensureValidAccessToken$().pipe(
      tap(token => {
        console.log('[AUTH GUARD] ensureValidAccessToken$ returned:', token ? 'VALID TOKEN' : 'NULL');
      }),
      switchMap(token => {
        if (!token) {
          console.log('[AUTH GUARD] No token after refresh attempt, redirecting to login');
          // Store the attempted URL for redirect after login
          if (state.url !== '/pages/login') {
            sessionStorage.setItem('redirectUrl', state.url);
            console.log('[AUTH GUARD] Stored redirect URL:', state.url);
          }
          return of(this.router.createUrlTree(['/pages/login']));
        }

        console.log('[AUTH GUARD] We have a valid token now, checking role access');
        return this.checkRoleAccess(route, false);
      }),
      catchError((error) => {
        console.error('[AUTH GUARD] Error in canActivate:', error);
        // Store the attempted URL for redirect after login
        if (state.url !== '/pages/login') {
          sessionStorage.setItem('redirectUrl', state.url);
          console.log('[AUTH GUARD] Stored redirect URL on error:', state.url);
        }
        return of(this.router.createUrlTree(['/pages/login']));
      }),
      tap(result => {
        console.log('[AUTH GUARD] Final result:', result instanceof UrlTree ? 'Redirect to ' + result.toString() : 'Access granted');
      })
    );
  }

  /**
   * Check if user has required role for the route
   */
  private checkRoleAccess(route: ActivatedRouteSnapshot, fromCache: boolean): Observable<boolean | UrlTree> {
    const expectedRole: string | undefined = route.data['role'];
    console.log('[AUTH GUARD] Expected role for route:', expectedRole || 'No role required');

    // If no role is specified, allow access
    if (!expectedRole) {
      console.log('[AUTH GUARD] No role required, access granted');
      return of(true);
    }

    // Get user roles
    const roles = this.auth.getUserRoles();
    console.log('[AUTH GUARD] User roles from localStorage:', roles);

    // Check if user has the required role
    if (roles.includes(expectedRole.toLowerCase())) {
      console.log('[AUTH GUARD] User has required role, access granted');
      return of(true);
    }

    console.warn(`[AUTH GUARD] Access denied. User roles: ${roles.join(', ')}, Required role: ${expectedRole}`);
    return of(this.router.createUrlTree(['/unauthorized']));
  }
}