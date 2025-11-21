// acl.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, CanMatch, Route, UrlSegment, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { PermissionService } from './permission.service';

type Action = 'read' | 'write' | 'delete';

@Injectable({ providedIn: 'root' })
export class AclGuard implements CanActivate, CanMatch {
  constructor(private perms: PermissionService, private router: Router) {}

  private check(formTypeId: number | string | undefined, action: Action = 'read'): boolean {
    if (formTypeId === undefined || formTypeId === null) return true;    
    const ok = this.perms.can(formTypeId, action);
    if (!ok) this.router.navigate(['/error/500']);               
    return ok;
  }

  canActivate(route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): boolean {
    const formTypeId = route.data?.['formTypeId'] as number | string | undefined;
    const action = (route.data?.['action'] as Action) ?? 'read';
    return this.check(formTypeId, action);
  }

  canMatch(route: Route, _segments: UrlSegment[]): boolean {
    const formTypeId = route.data?.['formTypeId'] as number | string | undefined;
    const action = (route.data?.['action'] as Action) ?? 'read';
    return this.check(formTypeId, action);
  }
}