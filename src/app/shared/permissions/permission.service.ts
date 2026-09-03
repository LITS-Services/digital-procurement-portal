import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { ROUTES } from '../vertical-menu/vertical-menu-routes.config';
import { firstReadableNavPath } from './nav-perm';

type Action = 'read' | 'write' | 'delete';

@Injectable({
    providedIn: 'root'
})

export class PermissionService {

    constructor(private _httpClient: HttpClient) {
        try {
            const stored = JSON.parse(localStorage.getItem('auth') || '{}')?.rolePermissions;
            if (Array.isArray(stored) && stored.length) {
                this.setPermissions(stored);
            }
        } catch {
            /* ignore corrupt session cache */
        }
    }
    getPermissionsByUserId(id: string) {
        return this._httpClient.get<any>(`${environment.apiUrl}/Acl/get-permissions-by-user-id?id=${id}`);
    }

    private permsByForm = new Map<string, any>();
    private permsList: any[] = [];
    setPermissions(perms: any[] | null | undefined): void {
        this.permsByForm.clear();
        this.permsList = Array.isArray(perms) ? perms : [];
        this.permsList.forEach(p => {
            this.permsByForm.set(String(p.formTypeId), p);
            const route = this.normalizeRoute(p.formRoute ?? p.FormRoute ?? p.route ?? p.Route);
            if (route) {
                this.permsByForm.set(route, p);
            }
        });
    }

    public permsSubject = new BehaviorSubject<void>(undefined);

    // refreshForCurrentUser$() {
    //     const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    //     const email = JSON.parse(localStorage.getItem('currentUser') || '{}')?.email as string | undefined;

    //     //if (!isAuthenticated || !email) return of(void 0);
    //     if (!isAuthenticated || !email) return this.permsSubject.asObservable();

    //     return this._httpClient
    //         .get<any[]>(`${environment.apiUrl}/Acl/get-permissions-by-email`, { params: { email } })
    //         .pipe(
    //             tap(perms => this.setPermissions(perms)),
    //             tap(() => this.permsSubject.next()),
    //             tap(perms => {
    //                 const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    //                 localStorage.setItem('auth', JSON.stringify({ ...auth, rolePermissions: perms }));
    //                 console.log("for refresh", perms);
    //             }),
    //             map(() => void 0),
    //             // catchError(() => of(void 0))
    //             catchError(err => {
    //                 console.warn("Permissions load failed", err);
    //                 return of(null); // still completes, but after a tick
    //             })
    //         );
    // }

    refreshForCurrentUser$() {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        const id = localStorage.getItem('userId');

        if (!isAuthenticated || !id) {
            this.permsSubject.next();
            return of(void 0); // completes immediately
        }

        return this._httpClient
            .get<any[]>(`${environment.apiUrl}/Acl/get-permissions-by-user-id`, { params: { id } })
            .pipe(
                tap(perms => this.setPermissions(perms)),
                tap(() => this.permsSubject.next()),
                tap(perms => {
                    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
                    localStorage.setItem('auth', JSON.stringify({ ...auth, rolePermissions: perms }));
                }),
                map(() => void 0),
                catchError(err => {
                    console.warn("Permissions load failed", err);
                    return of(null);
                })
            );
    }

    can(formId: number | string, action: Action): boolean {
        const rp = this.permsByForm.get(String(formId))
            ?? this.permsByForm.get(this.normalizeRoute(formId));

        if (!rp) {
            return false;
        }
        switch (action) {
            case 'read': return !!rp.read;
            case 'write': return !!rp.write;
            case 'delete': return !!rp.delete;
        }
    }

    private normalizeRoute(value: unknown): string {
        if (value === undefined || value === null) return '';
        const route = String(value).trim();
        if (!route || /^\d+$/.test(route)) return '';
        return route.startsWith('/') ? route : `/${route}`;
    }

    canRead(formId: number | string) { return this.can(formId, 'read'); }
    canWrite(formId: number | string) { return this.can(formId, 'write'); }
    canDelete(formId: number | string) { return this.can(formId, 'delete'); }

    /** First allowed app page after login: Dashboard if readable, else next sidebar form with read. */
    getDefaultLandingPath(): string {
        const fromMenu = firstReadableNavPath(ROUTES, id => this.canRead(id));
        if (fromMenu) return fromMenu;

        for (const p of this.permsList) {
            if (!p?.read) continue;
            const route = this.normalizeRoute(p.formRoute ?? p.FormRoute ?? p.route ?? p.Route);
            if (route) return route;
        }

        return '/pages/error';
    }

    // getAccessLevelId(formId: number | string): number | null {
    //     const rp = this.permsByForm.get(String(formId));
    //     return rp ? rp.accessLevelId : null;
    // }
}
