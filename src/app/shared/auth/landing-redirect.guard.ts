import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { PermissionService } from '../permissions/permission.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class LandingRedirectGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private perms: PermissionService,
    private router: Router
  ) {}

  canActivate(): boolean | UrlTree {
    if (!this.auth.isAuthenticated()) {
      return this.router.createUrlTree(['/pages/login']);
    }
    return this.router.createUrlTree([this.perms.getDefaultLandingPath()]);
  }
}
