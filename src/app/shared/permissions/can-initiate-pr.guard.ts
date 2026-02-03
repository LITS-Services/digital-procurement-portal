import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { PurchaseRequestService } from '../services/purchase-request-services/purchase-request.service';

@Injectable({
    providedIn: 'root'
})
export class CanInitiatePRGuard implements CanActivate {
    constructor(
        private purchaseRequestService: PurchaseRequestService,
        private toastr: ToastrService,
        private router: Router
    ) { }

    canActivate(route: ActivatedRouteSnapshot): Observable<boolean> {
        const userId = localStorage.getItem('userId');
        if (!userId) {
            this.toastr.error('User not logged in');
            this.router.navigate(['/login']);
            return of(false);
        }

        const mode = route.queryParams['mode'];
        if (mode === 'view') {
            // Allow navigation if viewing
            return of(true);
        }

        return this.purchaseRequestService.canInitiatePurchaseRequest(userId).pipe(
            map(canInitiate => {
                if (!canInitiate) {
                    this.toastr.error("You're not allowed to initiate the Purchase Request.");
                    this.router.navigate(['/']); // safe redirect
                }
                return canInitiate;
            }),
            catchError(() => {
                this.toastr.error('Failed to check permission');
                this.router.navigate(['/']);
                return of(false);
            })
        );
    }
}