import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Check authentication
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/pages/login']);
      return false;
    }

    // Check role if route has role data
    const expectedRole: string = route.data['role'];
    const userRoles: string[] = this.authService.getUserRoles(); // array of roles from login

    if (expectedRole && !userRoles.some(role => role.toLowerCase() === expectedRole.toLowerCase())) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }
}
