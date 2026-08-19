import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot)
    : Observable<boolean | UrlTree> {

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
      return of(true);
    }

    if (this.auth.isAuthenticated()) {
      return this.checkRoleAccess(route);
    }

    return this.auth.ensureValidAccessToken$().pipe(
      switchMap(token => {
        if (!this.auth.isAuthenticated() && !token) {
          if (state.url !== '/pages/login') {
            sessionStorage.setItem('redirectUrl', state.url);
          }
          return of(this.router.createUrlTree(['/pages/login']));
        }
        return this.checkRoleAccess(route);
      }),
      catchError(() => {
        if (state.url !== '/pages/login') {
          sessionStorage.setItem('redirectUrl', state.url);
        }
        return of(this.router.createUrlTree(['/pages/login']));
      })
    );
  }

  private checkRoleAccess(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const expectedRole: string | undefined = route.data['role'];
    if (!expectedRole) return of(true);

    const roles = this.auth.getUserRoles();
    if (roles.includes(expectedRole.toLowerCase()) || roles.includes(expectedRole)) {
      return of(true);
    }

    return of(this.router.createUrlTree(['/pages/error']));
  }
}
