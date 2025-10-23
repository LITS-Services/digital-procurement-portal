import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) { }

   canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot)
  : Observable<boolean | UrlTree> {
    // Try to ensure a valid access token (will refresh if needed)
    return this.auth.ensureValidAccessToken$().pipe(
      map(token => {
        if (token) {
          // Optional: role check after token is ensured
          const expectedRole: string | undefined = route.data['role'];
          if (!expectedRole) return true;

          const roles = this.auth.getUserRoles().map(r => r.toLowerCase());
          return roles.includes(expectedRole.toLowerCase())
            ? true
            : this.router.createUrlTree(['/unauthorized']);
        }

        // No token even after refresh attempt
        return this.router.createUrlTree(['/pages/login']);
      }),
      catchError(() => of(this.router.createUrlTree(['/pages/login'])))
    );
  }
}