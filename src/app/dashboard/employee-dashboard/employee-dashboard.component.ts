import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/shared/auth/auth.service';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { DashboardService } from 'app/shared/services/dashboard.service';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

export interface PurchaseRequestsCountVM {
  totalRequests: number;
  newRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  rejectedRequests?: number;
}

export interface RecentPR {
  id: number;
  requisitionNo: string;
  requestDate?: string;
  createdDate?: string;
  requestStatus?: string;
  status?: string;
  entityName?: string;
  department?: string;
}

@Component({
  selector: 'app-employee-dashboard',
  templateUrl: './employee-dashboard.component.html',
  styleUrls: ['./employee-dashboard.component.scss'],
  standalone: false
})
export class EmployeeDashboardComponent implements OnInit {
  userId: string = '';
  entityId: number = 0;
  userName: string = '';

  isLoadingCounts: boolean = false;
  isLoadingRequests: boolean = false;

  counts: PurchaseRequestsCountVM = {
    totalRequests: 0,
    newRequests: 0,
    inProgressRequests: 0,
    completedRequests: 0,
    rejectedRequests: 0
  };

  recentRequests: RecentPR[] = [];

  canCreatePR: boolean = false;
  canViewPR: boolean = true;

  constructor(
    private router: Router,
    private authService: AuthService,
    private dashboardService: DashboardService,
    private purchaseRequestService: PurchaseRequestService,
    private permissionService: PermissionService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId() || localStorage.getItem('userId') || '';
    this.entityId = Number(localStorage.getItem('selectedCompanyId')) || 0;
    this.userName = this.authService.getUserName() || 'Employee';

    this.checkPermissions();
    this.loadData();
  }

  private checkPermissions(): void {
    this.canViewPR = this.permissionService.can(FORM_IDS.PURCHASE_REQUEST, 'read');
    this.canCreatePR = this.permissionService.can(FORM_IDS.PURCHASE_REQUEST, 'write');
  }

  loadData(): void {
    this.loadCounts();
    this.loadRecentRequests();
  }

  loadCounts(): void {
    this.isLoadingCounts = true;
    const lsCompany = localStorage.getItem('selectedCompanyId');
    const entityId = (!lsCompany || lsCompany === 'All') ? 0 : Number(lsCompany) || 0;

    this.dashboardService.getPurchaseRequestsCount(this.userId, entityId)
      .pipe(finalize(() => {
        this.isLoadingCounts = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          if (res) {
            const data = res?.value || res?.data || res?.result || res;
            this.counts = {
              totalRequests: Number(data?.totalRequests ?? data?.TotalRequests) || 0,
              newRequests: Number(data?.newRequests ?? data?.NewRequests) || 0,
              inProgressRequests: Number(data?.inProgressRequests ?? data?.InProgressRequests) || 0,
              completedRequests: Number(data?.completedRequests ?? data?.CompletedRequests) || 0,
              rejectedRequests: Number(data?.rejectedRequests ?? data?.RejectedRequests) || 0
            };
          }
        },
        error: (err) => {
          console.error('Error fetching employee PR counts:', err);
        }
      });
  }

  loadRecentRequests(): void {
    this.isLoadingRequests = true;
    const lsCompany = localStorage.getItem('selectedCompanyId');
    const entityId = (!lsCompany || lsCompany === 'All') ? null : Number(lsCompany) || null;

    this.purchaseRequestService.getAllPurchaseRequests({
      currentPage: 1,
      pageSize: 5,
      userId: this.userId,
      entityId: entityId,
      forInventoryTransfer: false
    })
    .pipe(finalize(() => {
      this.isLoadingRequests = false;
      this.cdr.detectChanges();
    }))
    .subscribe({
      next: (res: any) => {
        const val = res?.value || res?.data || res;
        const list = val?.result || val?.items || res?.result || res?.items || val || [];
        this.recentRequests = Array.isArray(list) ? list.slice(0, 5) : [];
      },
      error: (err) => {
        console.error('Error loading recent requests:', err);
      }
    });
  }

  goToPurchaseRequests(status?: string): void {
    if (!this.canViewPR) {
      this.toastr.warning('You do not have permission to view Purchase Requests.');
      return;
    }
    if (status) {
      this.router.navigate(['/purchase-request'], { queryParams: { status } });
    } else {
      this.router.navigate(['/purchase-request']);
    }
  }

  createNewPurchaseRequest(): void {
    if (!this.canCreatePR) {
      this.toastr.warning('You do not have permission to create Purchase Requests.');
      return;
    }
    this.router.navigate(['/new-purchase-request']);
  }

  viewRequestDetails(pr: RecentPR): void {
    if (pr && pr.id) {
      this.router.navigate(['/new-purchase-request', pr.id]);
    } else {
      this.goToPurchaseRequests();
    }
  }

  getStatusClass(status?: string): string {
    const s = (status || '').toLowerCase().trim();
    if (s.includes('new') || s.includes('draft')) return 'badge-new';
    if (s.includes('progress') || s.includes('pending') || s.includes('submitted')) return 'badge-in-progress';
    if (s.includes('approved') || s.includes('complete')) return 'badge-completed';
    if (s.includes('rejected') || s.includes('cancel')) return 'badge-rejected';
    return 'badge-default';
  }

  getNewPercentage(): number {
    if (!this.counts.totalRequests) return 0;
    return Math.round((this.counts.newRequests / this.counts.totalRequests) * 100);
  }

  getInProgressPercentage(): number {
    if (!this.counts.totalRequests) return 0;
    return Math.round((this.counts.inProgressRequests / this.counts.totalRequests) * 100);
  }

  getCompletedPercentage(): number {
    if (!this.counts.totalRequests) return 0;
    return Math.round((this.counts.completedRequests / this.counts.totalRequests) * 100);
  }

  getRejectedPercentage(): number {
    if (!this.counts.totalRequests) return 0;
    return Math.round(((this.counts.rejectedRequests || 0) / this.counts.totalRequests) * 100);
  }
}
