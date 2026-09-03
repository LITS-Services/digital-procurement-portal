// acl.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, CanMatch, Route, UrlSegment, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { PermissionService } from './permission.service';

type Action = 'read' | 'write' | 'delete';

@Injectable({ providedIn: 'root' })
export class AclGuard implements CanActivate, CanMatch {
  constructor(private perms: PermissionService, private router: Router) {}

  private check(formTypeId: number | string | undefined, action: Action, currentUrl: string): boolean | UrlTree {
    if (formTypeId === undefined || formTypeId === null) return true;
    if (this.perms.can(formTypeId, action)) return true;

    const landing = this.perms.getDefaultLandingPath();
    const current = this.normalizeUrl(currentUrl);
    if (current === this.normalizeUrl(landing)) {
      return this.router.createUrlTree(['/pages/error']);
    }
    return this.router.createUrlTree([landing]);
  }

  private normalizeUrl(url: string): string {
    const path = (url || '').split('?')[0].split('#')[0];
    if (!path || path === '/') return '/';
    return path.startsWith('/') ? path : `/${path}`;
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    const formTypeId = route.data?.['formTypeId'] as number | string | undefined;
    const action = (route.data?.['action'] as Action) ?? 'read';
    return this.check(formTypeId, action, state.url);
  }

  canMatch(route: Route, segments: UrlSegment[]): boolean | UrlTree {
    const formTypeId = route.data?.['formTypeId'] as number | string | undefined;
    const action = (route.data?.['action'] as Action) ?? 'read';
    const currentUrl = '/' + segments.map(s => s.path).join('/');
    return this.check(formTypeId, action, currentUrl);
  }
}
