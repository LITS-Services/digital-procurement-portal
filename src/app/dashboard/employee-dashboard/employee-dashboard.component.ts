import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'app/shared/auth/auth.service';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { DashboardService } from 'app/shared/services/dashboard.service';
import { CompanyService } from 'app/shared/services/Company.services';
import { ProjectBudgetConsumptionVM, ProjectService } from 'app/shared/services/project.service';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexMarkers,
  ApexStroke,
  ApexTheme,
  ApexTooltip,
  ApexXAxis,
  ApexYAxis
} from 'ng-apexcharts';
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

export type ConsumedChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  stroke: ApexStroke;
  dataLabels: ApexDataLabels;
  fill: ApexFill;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  theme: ApexTheme;
  legend: ApexLegend;
  markers: ApexMarkers;
};

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

  // Project Consumed Amount Chart State
  public consumedChartOptions!: Partial<ConsumedChartOptions>;
  public isChartReady: boolean = false;
  public isLoadingChart: boolean = false;
  public filterMode: 'all' | 'project' = 'all';
  public selectedProjectId: number | null = null;
  public selectedProjectName: string = 'All Projects';
  public projectOptions: Array<{ id: number; name: string }> = [];
  public consumptionRows: ProjectBudgetConsumptionVM[] = [];
  public totalConsumedAmount: number = 0;
  public totalBudgetAmount: number = 0;
  public utilizationPercentage: number = 0;
  public userEmail: string = '';

  constructor(
    private router: Router,
    private authService: AuthService,
    private companyService: CompanyService,
    private dashboardService: DashboardService,
    private projectService: ProjectService,
    private purchaseRequestService: PurchaseRequestService,
    private permissionService: PermissionService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.userId = this.authService.getUserId() || localStorage.getItem('userId') || '';
    this.entityId = Number(localStorage.getItem('selectedCompanyId')) || 0;
    this.userName = this.authService.getUserName() || 'Employee';
    this.userEmail = (this.authService.getUserEmail() || localStorage.getItem('userEmail') || '').trim();

    this.checkPermissions();
    this.initConsumedChart();
    this.loadData();
  }

  private checkPermissions(): void {
    this.canViewPR = this.permissionService.can(FORM_IDS.PURCHASE_REQUEST, 'read');
    this.canCreatePR = this.permissionService.can(FORM_IDS.PURCHASE_REQUEST, 'write');
  }

  loadData(): void {
    this.loadCounts();
    this.loadRecentRequests();
    this.loadProjects();
    this.resolveEmailAndLoadConsumption();
  }

  private resolveEmailAndLoadConsumption(): void {
    const email = (this.userEmail || this.authService.getUserEmail() || localStorage.getItem('userEmail') || '').trim();
    if (email) {
      this.userEmail = email;
      this.loadConsumedAmounts();
      return;
    }

    if (this.userId) {
      this.companyService.getprocurementusersbyid(this.userId).subscribe({
        next: (res: any) => {
          if (res?.email) {
            this.userEmail = res.email.trim();
            localStorage.setItem('userEmail', this.userEmail);
          }
          this.loadConsumedAmounts();
        },
        error: () => {
          this.loadConsumedAmounts();
        }
      });
    } else {
      this.loadConsumedAmounts();
    }
  }

  private initConsumedChart(): void {
    this.consumedChartOptions = {
      series: [],
      chart: {
        type: 'area',
        height: 280,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      xaxis: {
        categories: [],
        labels: {
          style: { fontSize: '11px', colors: '#64748b' },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (val: number) => {
            if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
            if (val >= 1000) return (val / 1000).toFixed(1) + 'k';
            return val ? val.toFixed(0) : '0';
          },
          style: { fontSize: '11px', colors: '#64748b' },
        },
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      dataLabels: { enabled: false },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.8,
          opacityFrom: 0.25,
          opacityTo: 0.05,
          stops: [0, 90, 100],
        },
      },
      grid: {
        borderColor: 'rgba(148, 163, 184, 0.3)',
        strokeDashArray: 4,
        padding: { left: 8, right: 12 },
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number) => `AED ${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
      },
      legend: {
        horizontalAlign: 'left',
      },
      markers: {
        size: 5,
        strokeWidth: 2,
        strokeColors: '#ffffff',
        hover: {
          size: 7,
        },
      },
      theme: {
        mode: 'light',
        palette: 'palette2',
      },
    };
  }

  loadProjects(): void {
    this.projectService.getAllProjects().subscribe({
      next: (res: any) => {
        const val = res?.value || res?.data || res;
        const list = val?.result || val?.items || res?.result || res?.items || val || [];
        if (Array.isArray(list)) {
          this.projectOptions = list.map((p: any) => ({
            id: p.id,
            name: p.name || `Project #${p.id}`
          }));

          if (this.projectOptions.length > 0 && !this.selectedProjectId) {
            this.selectedProjectId = this.projectOptions[0].id;
            if (this.filterMode === 'project') {
              this.selectedProjectName = this.projectOptions[0].name;
            }
          }
        }
      },
      error: (err) => {
        console.error('Error loading projects list:', err);
      }
    });
  }

  setFilterMode(mode: 'all' | 'project'): void {
    if (this.filterMode === mode) return;
    this.filterMode = mode;

    if (mode === 'project') {
      if (!this.selectedProjectId && this.projectOptions.length > 0) {
        this.selectedProjectId = this.projectOptions[0].id;
      }
      const proj = this.projectOptions.find(p => p.id === Number(this.selectedProjectId));
      this.selectedProjectName = proj ? proj.name : 'Selected Project';
    } else {
      this.selectedProjectName = 'All Projects';
    }

    this.loadConsumedAmounts();
  }

  onProjectSelectChange(event: any): void {
    const pId = Number(this.selectedProjectId);
    const proj = this.projectOptions.find(p => p.id === pId);
    if (proj) {
      this.selectedProjectName = proj.name;
    }
    this.loadConsumedAmounts();
  }

  getCreatedByParam(): string {
    const email = (this.userEmail || this.authService.getUserEmail() || localStorage.getItem('userEmail') || '').trim();
    return email;
  }

  loadConsumedAmounts(): void {
    const createdBy = this.getCreatedByParam();
    if (!createdBy && this.userId && !this.userEmail) {
      this.companyService.getprocurementusersbyid(this.userId).subscribe({
        next: (res: any) => {
          if (res?.email) {
            this.userEmail = res.email.trim();
            localStorage.setItem('userEmail', this.userEmail);
          }
          this.executeLoadConsumedAmounts(this.getCreatedByParam());
        },
        error: () => {
          this.executeLoadConsumedAmounts('');
        }
      });
      return;
    }

    this.executeLoadConsumedAmounts(createdBy);
  }

  private executeLoadConsumedAmounts(createdBy: string): void {
    this.isLoadingChart = true;
    this.isChartReady = false;

    if (this.filterMode === 'all') {
      this.projectService.getConsumedAmounts(createdBy)
        .pipe(finalize(() => {
          this.isLoadingChart = false;
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: (res: any) => {
            const data = res?.value || res?.data || res?.result || res || [];
            this.consumptionRows = Array.isArray(data) ? data : [];
            this.updateChartWithData(this.consumptionRows);
          },
          error: (err) => {
            console.error('Error fetching consumed amounts:', err);
            this.consumptionRows = [];
            this.updateChartWithData([]);
          }
        });
    } else {
      if (!this.selectedProjectId) {
        this.isLoadingChart = false;
        this.consumptionRows = [];
        this.updateChartWithData([]);
        return;
      }

      this.projectService.getConsumedAmountsByProject(this.selectedProjectId, createdBy)
        .pipe(finalize(() => {
          this.isLoadingChart = false;
          this.cdr.detectChanges();
        }))
        .subscribe({
          next: (res: any) => {
            const data = res?.value || res?.data || res?.result || res || [];
            this.consumptionRows = Array.isArray(data) ? data : [];
            this.updateChartWithData(this.consumptionRows);
          },
          error: (err) => {
            console.error(`Error fetching consumed amounts for project ${this.selectedProjectId}:`, err);
            this.consumptionRows = [];
            this.updateChartWithData([]);
          }
        });
    }
  }

  private updateChartWithData(rows: ProjectBudgetConsumptionVM[]): void {
    if (!rows || rows.length === 0) {
      this.isChartReady = false;
      this.totalConsumedAmount = 0;
      this.totalBudgetAmount = 0;
      this.utilizationPercentage = 0;
      this.cdr.detectChanges();
      return;
    }

    const categories: string[] = [];
    const consumedData: number[] = [];
    const budgetData: number[] = [];

    this.totalConsumedAmount = 0;
    this.totalBudgetAmount = 0;

    if (this.filterMode === 'all') {
      // Group by Project
      const projectMap = new Map<number, { name: string; consumed: number; budget: number }>();

      rows.forEach(r => {
        const pId = r.projectId || 0;
        const pName = r.projectName || `Project #${pId}`;
        const existing = projectMap.get(pId) || { name: pName, consumed: 0, budget: 0 };
        existing.consumed += Number(r.consumedAmount) || 0;
        if (Number(r.activityBudgetAmount) > 0) {
          existing.budget += Number(r.activityBudgetAmount);
        }
        projectMap.set(pId, existing);
      });

      projectMap.forEach((val) => {
        categories.push(val.name);
        consumedData.push(Math.round(val.consumed * 100) / 100);
        budgetData.push(Math.round(val.budget * 100) / 100);
        this.totalConsumedAmount += val.consumed;
        this.totalBudgetAmount += val.budget;
      });
    } else {
      // Group by Activity or Requisition
      const hasActivities = rows.some(r => !!r.activityName);

      if (hasActivities) {
        const activityMap = new Map<string, { consumed: number; budget: number }>();
        rows.forEach(r => {
          const actName = r.activityName
            ? (isNaN(Number(r.activityName)) ? r.activityName : `Activity ${r.activityName}`)
            : (r.requisitionNo || `Activity #${r.activityId}`);
          const existing = activityMap.get(actName) || { consumed: 0, budget: Number(r.activityBudgetAmount) || 0 };
          existing.consumed += Number(r.consumedAmount) || 0;
          activityMap.set(actName, existing);
        });

        activityMap.forEach((val, actName) => {
          categories.push(actName);
          consumedData.push(Math.round(val.consumed * 100) / 100);
          budgetData.push(Math.round(val.budget * 100) / 100);
          this.totalConsumedAmount += val.consumed;
          this.totalBudgetAmount += val.budget;
        });
      } else {
        rows.forEach(r => {
          const label = r.requisitionNo || ('PR-' + r.id);
          categories.push(label);
          const c = Number(r.consumedAmount) || 0;
          const b = Number(r.activityBudgetAmount) || 0;
          consumedData.push(c);
          budgetData.push(b);
          this.totalConsumedAmount += c;
          this.totalBudgetAmount += b;
        });
      }
    }

    this.utilizationPercentage = this.totalBudgetAmount > 0
      ? Math.round((this.totalConsumedAmount / this.totalBudgetAmount) * 100)
      : 0;

    const hasAnyBudget = budgetData.some(b => b > 0);

    const series: ApexAxisChartSeries = [
      {
        name: 'Consumed Amount',
        data: consumedData,
      }
    ];

    if (hasAnyBudget) {
      series.push({
        name: 'Allocated Budget',
        data: budgetData,
      });
    }

    this.consumedChartOptions = {
      ...this.consumedChartOptions,
      series: series,
      xaxis: {
        ...this.consumedChartOptions.xaxis,
        categories: categories,
      },
    };

    this.isChartReady = true;
    this.cdr.detectChanges();
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
    this.router.navigate(['/purchase-request/new-purchase-request']);
  }

  viewRequestDetails(pr: RecentPR): void {
    if (pr && pr.id) {
      this.router.navigate(['/purchase-request/new-purchase-request'], { queryParams: { id: pr.id } });
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
