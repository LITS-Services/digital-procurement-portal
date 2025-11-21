import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

type Action = 'read' | 'write' | 'delete';

@Injectable({
    providedIn: 'root'
})

export class PermissionService {

    constructor(private _httpClient: HttpClient) {
    }
    getPermissionsByUserId(id: string) {
        return this._httpClient.get<any>(`${environment.apiUrl}/Acl/get-permissions-by-user-id?id=${id}`);
    }

    private permsByForm = new Map<string, any>();
    setPermissions(perms: any[] | null | undefined): void {
        this.permsByForm.clear();
        (perms ?? []).forEach(p => {
            this.permsByForm.set(String(p.formTypeId), p);
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
                    console.log("Permissions fetched", perms);
                }),
                map(() => void 0),
                catchError(err => {
                    console.warn("Permissions load failed", err);
                    return of(null);
                })
            );
    }

    can(formId: number | string, action: Action): boolean {
        const rp = this.permsByForm.get(String(formId));

        if (!rp) {
            return false;
        }
        switch (action) {
            case 'read': return !!rp.read;
            case 'write': return !!rp.write;
            case 'delete': return !!rp.delete;
        }
    }

    canRead(formId: number | string) { return this.can(formId, 'read'); }
    canWrite(formId: number | string) { return this.can(formId, 'write'); }
    canDelete(formId: number | string) { return this.can(formId, 'delete'); }

    // getAccessLevelId(formId: number | string): number | null {
    //     const rp = this.permsByForm.get(String(formId));
    //     return rp ? rp.accessLevelId : null;
    // }
}
