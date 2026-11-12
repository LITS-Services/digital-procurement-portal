import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import * as Chartist from 'chartist';
import { ChartType, ChartEvent } from "ng-chartist";
import ChartistTooltip from 'chartist-plugin-tooltips-updated';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { DashboardService, DeliveryPerformanceVM, MonthlySpendingResponse, RfqPipelineGraphPoint } from 'app/shared/services/dashboard.service';
import { FirebaseMessagingService } from '../../firebase-messaging.service';
import { ToastrService } from 'ngx-toastr';
import { ms } from 'date-fns/locale';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexStroke,
  ApexXAxis,
  ApexYAxis,
  ApexFill,
  ApexTooltip,
  ApexGrid,
  ApexNonAxisChartSeries,
  ApexLegend,
  ApexResponsive,
  ApexTheme,
  ApexPlotOptions
} from 'ng-apexcharts';
import { Router } from '@angular/router';
// Import PermissionService and FORM_IDS
import { PermissionService } from 'app/shared/permissions/permission.service';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { finalize } from 'rxjs';
import { AuthService } from 'app/shared/auth/auth.service';

declare var require: any;

export interface PurchaseOrdersCountVM {
  totalPurchaseOrders: number;
  openPurchaseOrders: number;
  deliveredPurchaseOrders: number;
}

export interface VendorCompaniesCountVM {
  totalVendorCompanies: number;
  onboardedVendorCompanies: number;
}

export interface EntitiesCountVM {
  totalEntities: number;
  activeEntities: number;
}

export interface Chart {
  type: ChartType;
  data: any;
  options?: any;
  responsiveOptions?: any;
  events?: ChartEvent;
}

export interface ProcurementDashboardCountsVM {
  totalPR: number;
  newPR: number;
  inProgressPR: number;
  totalQR: number;
  inProgressQR: number;
  rejectedQR: number;
  totalPO: number;
  openPO: number;
  deliveredPO: number;
  totalVendorCompanies: number;
  onboardedVendorCompanies: number;
  totalProcurementCompanies: number;
  activeProcurementCompanies: number;
}

export interface PurchaseRequestsCountVM {
  totalRequests: number;
  newRequests: number;
  inProgressRequests: number;
  completedRequests: number;
}

export interface QuotationRequestsCountVM {
  totalQuotations: number;
  inProgressQuotations: number;
  completedQuotations: number;
  rejectedQuotations: number;
}

export type SpendChartOptions = {
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
  colors: string[];
};

export type SpendDonutOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  legend: ApexLegend;
  dataLabels: ApexDataLabels;
  responsive: ApexResponsive[];
  tooltip: ApexTooltip;
  theme: ApexTheme;
  colors: string[];
};

export type VendorDeliveryChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  plotOptions: ApexPlotOptions;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  fill: ApexFill;
  tooltip: ApexTooltip;
  legend: ApexLegend;
  grid: ApexGrid;
  colors: string[];
  theme: ApexTheme;
  responsive?: ApexResponsive[];
};

@Component({
  selector: 'app-dashboard1',
  templateUrl: './dashboard1.component.html',
  styleUrls: ['./dashboard1.component.scss'],
  standalone: false,
})
export class Dashboard1Component implements OnInit, AfterViewInit {
  prCounts!: PurchaseRequestsCountVM;
  rfqCounts!: QuotationRequestsCountVM;
  poCounts!: PurchaseOrdersCountVM;
  vendorCompaniesCounts!: VendorCompaniesCountVM;
  entitiesCounts!: EntitiesCountVM;
  procurementDashboardCounts!: ProcurementDashboardCountsVM;

  recentVendors = [];

  upcomingPurchases = [
  ];

  monthlyExpenses = [
    { label: 'Inventory', color: '#80ed99', value: '65%' },
    { label: 'Non-Inventory', color: '#219ebc', value: '35%' },
  ];

  monthlySpendAmount = '0';
  monthlySpendLabel = '';
  isMonthlySpendEmpty = true;

  progressReport = [
    { month: 'Jan', value: 68 },
    { month: 'Feb', value: 72 },
    { month: 'Mar', value: 81 },
    { month: 'Apr', value: 76 },
  ];

  activeRange: 'month' | 'quarter' | 'year' = 'month';

  public spendChartOptions!: Partial<SpendChartOptions>;
  public spendDonutOptions!: Partial<SpendDonutOptions>;
  public vendorDeliveryOptions!: Partial<VendorDeliveryChartOptions>;
  public isRfqChartReady = false;
  rfqTooltipDates: string[] = [];

  // Permission flags
  canAccessPurchaseRequest = false;
  canAccessRFQ = false;
  canAccessPurchaseOrder = false;
  canAccessCompany = false;
  canAccessEntity = false;

  isVendorsLoading:boolean = false;
  isPurchasesLoading:boolean = false;
  constructor(
    private http: HttpClient,
    public translate: TranslateService,
    private dashboardService: DashboardService,
    private messagingService: FirebaseMessagingService,
    private toaster: ToastrService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private ngZone: NgZone,
    private permissionService: PermissionService, // Inject PermissionService
    private authService: AuthService
  ) {
    this.translate.onLangChange.subscribe(() => {
      this.isArabic = this.translate.currentLang === 'ar';
    });
  }

  ngOnInit(): void {
    this.loadProcurementDashboardCounts();
    //this.loadPurchaseRequestsCounts();
    //this.loadQuotationRequestsCounts();
    //this.loadPurchaseOrdersCounts();
    //this.loadVendorCompaniesCounts();
    //this.loadEntitiesCounts();
    this.initSpendChart();
    this.initSpendDonut();
    this.getMonthlySpending();
    this.initVendorDeliveryChart();
    this.loadTopVendors();
    this.loadUpcomingPurchases();
    // Check permissions for dashboard cards
    this.checkPermissions();
  }

  // Check permissions for each dashboard card
  private checkPermissions(): void {
    // Check Purchase Request permission (at least read access)
    this.canAccessPurchaseRequest = this.permissionService.can(FORM_IDS.PURCHASE_REQUEST, 'read');

    // Check RFQ permission (at least read access)
    this.canAccessRFQ = this.permissionService.can(FORM_IDS.REQUEST_FOR_QUOTATION, 'read');

    // Check Purchase Order permission (at least read access)
    this.canAccessPurchaseOrder = this.permissionService.can(FORM_IDS.PURCHASE_ORDER, 'read');

    // Check Company permission (at least read access)
    this.canAccessCompany = this.permissionService.can(FORM_IDS.VENDOR_COMPANIES, 'read');

    // Check Entity permission (at least read access)
    this.canAccessEntity = this.permissionService.can(FORM_IDS.ENTITIES, 'read');

    this.cdr.detectChanges();
  }

  ngAfterViewInit(): void {
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(() => {
        this.ngZone.run(() => {
          this.setChartRange('month');
        });
      });
    });
  }

  // Updated navigation methods with permission checks
  goToPurchaseRequest() {
    if (!this.canAccessPurchaseRequest) {
      this.toaster.warning('You do not have permission to access Purchase Requests');
      return;
    }
    this.router.navigateByUrl('/purchase-request');
  }

  goToRfq() {
    if (!this.canAccessRFQ) {
      this.toaster.warning('You do not have permission to access RFQs');
      return;
    }
    this.router.navigateByUrl('/rfq');
  }

  goToPurchaseOrder() {
    if (!this.canAccessPurchaseOrder) {
      this.toaster.warning('You do not have permission to access Purchase Orders');
      return;
    }
    this.router.navigateByUrl('/purchase-order');
  }

  goToCompany() {
    if (!this.canAccessCompany) {
      this.toaster.warning('You do not have permission to access Companies');
      return;
    }
    this.router.navigateByUrl('/company');
  }

  goToEntity() {
    if (!this.canAccessEntity) {
      this.toaster.warning('You do not have permission to access Entities');
      return;
    }
    this.router.navigateByUrl('/procurment-companies');
  }

  loadTopVendors(): void {
    this.isVendorsLoading = true;

    this.dashboardService
      .getTopVendors()
      .pipe(finalize(() => (this.isVendorsLoading = false)))
      .subscribe({
        next: (data) => (this.recentVendors = data ?? []),
        error: (err) => console.error(err),
      });
  }

  loadUpcomingPurchases(): void {
    this.isPurchasesLoading = true;
    const loggedInUser = this.authService.getUserId();
    const entityId = Number(localStorage.getItem('selectedCompanyId'));
    this.dashboardService
      .getUpcomingPurchases(entityId, loggedInUser)
      .pipe(finalize(() => (this.isPurchasesLoading = false)))
      .subscribe({
        next: (data) => (this.upcomingPurchases = data ?? []),
        error: (err) => console.error(err),
      })
  }

  loadProcurementDashboardCounts(): void {
    const loggedInUser = this.authService.getUserId();
    const entityId = Number(localStorage.getItem('selectedCompanyId'));
    this.dashboardService
      .getProcurementDashboardCounts(loggedInUser, entityId)
      .subscribe({
        next: (data) => 
          {
            this.procurementDashboardCounts = data
            this.cdr.detectChanges();
          },
        error: (err) => console.error(err),
      })
  }

  loadPurchaseRequestsCounts(): void {
    const userId = localStorage.getItem('userId');
    const entityId = Number(localStorage.getItem('selectedCompanyId'));
    this.dashboardService.getPurchaseRequestsCount(userId, entityId).subscribe({
      next: (data) => {
        this.prCounts = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching purchase requests count:', err);
      },
    });
  }

  loadQuotationRequestsCounts(): void {
    const userId = localStorage.getItem('userId');
    const entityId = Number(localStorage.getItem('selectedCompanyId'));
    this.dashboardService.getQuotationRequestsCount(userId, entityId).subscribe({
      next: (data) => {
        this.rfqCounts = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching quotation requests count:', err);
      },
    });
  }

  loadPurchaseOrdersCounts(): void {
    const userId = localStorage.getItem('userId');
    const entityId = Number(localStorage.getItem('selectedCompanyId'));
    this.dashboardService.getPurchaseOrdersCount(entityId, userId).subscribe({
      next: (data) => {
        this.poCounts = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching purchase orders count:', err);
      },
    });
  }

  getMonthlySpending() {
    const loggedInUser = this.authService.getUserId();
    const entityId = Number(localStorage.getItem('selectedCompanyId'));
    this.dashboardService.getMonthlySpendingData(0, entityId, loggedInUser).subscribe({
      next: (res: any) => {
        

        const data: MonthlySpendingResponse = Array.isArray(res) ? res[0] : res;

        const inventory = Number(data?.inventory ?? 0);
        const nonInventory = Number(data?.nonInventory ?? 0);
        this.isMonthlySpendEmpty = inventory <= 0 && nonInventory <= 0;

        this.spendDonutOptions = {
          ...this.spendDonutOptions,
          series: [inventory, nonInventory],
          labels: ['Inventory', 'Non-Inventory'],
        };

        this.monthlyExpenses = [
          {
            label: 'Inventory',
            color: '#80ed99',
            value: `${inventory.toFixed(2)}%`,
          },
          {
            label: 'Non-Inventory',
            color: '#219ebc',
            value: `${nonInventory.toFixed(2)}%`,
          },
        ];

        // Optional: update amount text under chart
        if (data?.totalThisMonth != null) {
          this.monthlySpendAmount = Number(data.totalThisMonth).toLocaleString();
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error getting monthly spending', err);
      },
    });
  }

  // getMonthlySpending() {
  //   this.dashboardService.getMonthlySpendingData().subscribe({
  //     next: (res: any) => {
  //       const data: MonthlySpendingResponse = Array.isArray(res) ? res[0] : res;

  //       const inventory = Number(data?.inventory ?? 0);
  //       const nonInventory = Number(data?.nonInventory ?? 0);

  //       this.spendDonutOptions = {
  //         ...this.spendDonutOptions,
  //         series: [inventory, nonInventory],
  //         labels: ['Inventory', 'Non-Inventory'],
  //       };

  //       this.monthlyExpenses = [
  //         {
  //           label: 'Inventory',
  //           color: '#80ed99',
  //           value: `${inventory.toFixed(2)}%`,
  //         },
  //         {
  //           label: 'Non-Inventory',
  //           color: '#219ebc',
  //           value: `${nonInventory.toFixed(2)}%`,
  //         },
  //       ];

  //       if (data?.totalThisMonth != null) {
  //         this.monthlySpendAmount = `Rs ${Number(data.totalThisMonth).toLocaleString()}`;
  //       }

  //       this.cdr.detectChanges();
  //     },
  //     error: (err) => {
  //       console.error('Error getting monthly spending', err);
  //     },
  //   });
  // }

  loadVendorCompaniesCounts(): void {
    const entityId = Number(localStorage.getItem('selectedCompanyId'));
    this.dashboardService.getVendorCompaniesCount(entityId).subscribe({
      next: (data) => {
        this.vendorCompaniesCounts = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching vendor companies count:', err);
      },
    });
  }

  loadEntitiesCounts(): void {
    const userId = localStorage.getItem('userId');
    const entityId = Number(localStorage.getItem('selectedCompanyId'));
    this.dashboardService.getEntitiesCount(entityId, userId).subscribe({
      next: (data) => {
        this.entitiesCounts = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching entities count:', err);
      },
    });
  }

  isArabic: boolean = false;

  productSale: string = 'PRODUCTSALES';

  private initSpendChart(): void {
    this.spendChartOptions = {
      series: [],
      colors: ['#116AEF', '#60A5FA', '#93C5FD'],
      chart: {
        type: 'area',
        height: 290,
        fontFamily: 'Poppins, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      xaxis: {
        categories: [],
        labels: {
          rotate: 0,
          rotateAlways: false,
          hideOverlappingLabels: true,
          offsetY: 6,
          style: { fontSize: '12px', colors: '#64748B' },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        min: 0,
        max: 6,
        tickAmount: 6,
        decimalsInFloat: 0,
        labels: {
          offsetX: -10,
          formatter: (val: number) => Math.round(val).toString(),
          style: { fontSize: '12px', colors: '#64748B' },
        },
      },
      stroke: {
        curve: 'smooth',
        width: 2,
        lineCap: 'round',
      },
      dataLabels: { enabled: false },
      fill: {
        type: 'gradient',
        colors: ['#116AEF', '#60A5FA', '#93C5FD'],
        gradient: {
          type: 'vertical',
          shadeIntensity: 0,
          inverseColors: false,
          opacityFrom: 0.3,
          opacityTo: 0.0,
          stops: [0, 100],
          colorStops: [
            [
              { offset: 0, color: '#116AEF', opacity: 0.3 },
              { offset: 65, color: '#116AEF', opacity: 0.1 },
              { offset: 100, color: '#116AEF', opacity: 0.0 },
            ],
            [
              { offset: 0, color: '#60A5FA', opacity: 0.22 },
              { offset: 65, color: '#60A5FA', opacity: 0.07 },
              { offset: 100, color: '#60A5FA', opacity: 0.0 },
            ],
            [
              { offset: 0, color: '#93C5FD', opacity: 0.15 },
              { offset: 65, color: '#93C5FD', opacity: 0.05 },
              { offset: 100, color: '#93C5FD', opacity: 0.0 },
            ],
          ],
        },
      },
      grid: {
        borderColor: '#E2E8F0',
        strokeDashArray: 6,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 8, left: 14, right: 16, bottom: 8 },
      },
      tooltip: {
        shared: true,
        intersect: false,
        x: {
          formatter: (val: number, opts?: any): string => {
            const idx = opts?.dataPointIndex;
            if (idx != null && this.rfqTooltipDates[idx]) {
              const raw = this.rfqTooltipDates[idx];
              return raw.split(' ')[0];
            }
            return String(val);
          },
        },
        y: {
          formatter: (val: number) => `${val != null ? val.toLocaleString() : 0} RFQs`,
        },
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'left',
        offsetY: 6,
        fontSize: '12px',
        labels: {
          colors: '#64748B',
        },
        markers: {
          strokeWidth: 0,
        },
        itemMargin: {
          horizontal: 12,
          vertical: 4,
        },
      },
      theme: {
        mode: 'light',
      },
    };
  }

  changeRange(range: 'month' | 'quarter' | 'year'): void {
    if (this.activeRange === range && this.isRfqChartReady) {
      return;
    }
    this.setChartRange(range);
  }

  private setChartRange(range: 'month' | 'quarter' | 'year'): void {
    this.activeRange = range;
    this.cdr.detectChanges();

    const filterType = range === 'month' ? 1 : range === 'quarter' ? 2 : 3;

    const userId = localStorage.getItem('userId') ?? '';
    const entity = localStorage.getItem('selectedCompanyId');
    var entityId;
    if (entity === 'All') {
      entityId = null;
    } else {
      entityId = Number(localStorage.getItem('selectedCompanyId'));
    }

    this.dashboardService.getRfqPipelineGraph(userId, entityId, filterType).subscribe({
      next: (rows: RfqPipelineGraphPoint[]) => {
        const categories: string[] = [];
        const totalRfq: number[] = [];
        const rfqQuotation: number[] = [];
        const selectedRfq: number[] = [];
        this.rfqTooltipDates = rows.map((r) => r.groupData);

        rows.forEach((row, index) => {
          let label: string;

          if (filterType === 1) {
            label = this.formatDayLabel(row.groupData);
          } else if (filterType === 2) {
            label = this.formatWeekLabel(row.groupData);
          } else {
            label = this.formatMonthLabel(row.groupData);
          }

          categories.push(label);
          totalRfq.push(row.totalRfq);
          rfqQuotation.push(row.rfqQuotation);
          selectedRfq.push(row.quotesSelected);
        });

        const maxDataVal = Math.max(...totalRfq, ...rfqQuotation, ...selectedRfq, 0);
        const yMax = maxDataVal <= 6 ? 6 : Math.ceil(maxDataVal / 5) * 5;
        const yTickAmount = maxDataVal <= 6 ? 6 : 5;

        this.spendChartOptions = {
          ...this.spendChartOptions,
          series: [
            {
              name: this.translate.instant('DASHBOARD_MODULE.TOTAL_RFQS') || 'Total RFQs',
              data: totalRfq,
            },
            {
              name: this.translate.instant('DASHBOARD_MODULE.TOTAL_QUOTATIONS') || 'Total Quotations',
              data: rfqQuotation,
            },
            {
              name: this.translate.instant('DASHBOARD_MODULE.SELECTED_QUOTATIONS') || 'Selected Quotations',
              data: selectedRfq,
            },
          ],
          xaxis: {
            ...this.spendChartOptions.xaxis,
            categories,
            tickAmount: categories.length > 12 ? 11 : undefined,
          },
          yaxis: {
            ...this.spendChartOptions.yaxis,
            min: 0,
            max: yMax,
            tickAmount: yTickAmount,
          },
        };
        this.isRfqChartReady = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading RFQ pipeline graph data', err);
      },
    });
  }

  private formatWeekLabel(groupData: string): string {
    const match = groupData.match(/W(\d+)/);
    if (match) {
      return `W${match[1]}`;
    }
    const parts = groupData.split('-');
    return parts[parts.length - 1] || groupData;
  }

  private formatDayLabel(groupData: string): string {
    const d = new Date(groupData);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const monthShort = d.toLocaleString('en-US', { month: 'short' });
      return `${day} ${monthShort}`;
    }
    return groupData;
  }

  private formatMonthLabel(groupData: string): string {
    const parts = groupData.split('-');
    if (parts.length >= 2) {
      const monthNumber = parseInt(parts[1], 10);
      if (!isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
        const monthNames = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'May',
          'Jun',
          'Jul',
          'Aug',
          'Sep',
          'Oct',
          'Nov',
          'Dec',
        ];
        return monthNames[monthNumber - 1];
      }
    }
    return groupData;
  }

  private initSpendDonut(): void {
    this.spendDonutOptions = {
      series: [0, 0], // will be replaced by API
      chart: {
        type: 'donut',
        height: 200,
      },
      // default labels & colors (also overwritten if needed)
      labels: ['Inventory', 'Non-Inventory'],
      colors: this.monthlyExpenses.map((e) => e.color),
      legend: {
        show: false,
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val.toFixed(1)}%`,
        },
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 180,
            },
          },
        },
      ],
      theme: {
        mode: 'light',
      },
    };
  }

private initVendorDeliveryChart(): void {
  this.dashboardService.getDeliveryPerformance().subscribe({
    next: (rows: DeliveryPerformanceVM[]) => {
      const vendors = (rows ?? []).map(r => r.vendorCompanyName);
      const onTimeDeliveries = (rows ?? []).map(r => r.onTimeCount);
      const lateDeliveries = (rows ?? []).map(r => r.lateCount);

      this.vendorDeliveryOptions = {
        series: [
          {
            name: this.translate.instant('DASHBOARD_MODULE.ON_TIME') || 'On-Time',
            data: onTimeDeliveries,
          },
          {
            name: this.translate.instant('DASHBOARD_MODULE.LATE') || 'Late',
            data: lateDeliveries,
          },
        ],
        colors: ['#116aef', '#f97316'],
        chart: {
          type: 'bar',
          height: 200,
          width: '100%',
          stacked: true,
          toolbar: { show: false },
          parentHeightOffset: 0,
          offsetY: 0,
          redrawOnParentResize: true,
          redrawOnWindowResize: true,
        },
        plotOptions: {
          bar: {
            horizontal: true,
            barHeight: '55%',
            borderRadius: 2,
          },
        },
        grid: {
          borderColor: 'rgba(148,163,184,0.35)',
          strokeDashArray: 4,
          xaxis: { lines: { show: true } },
          yaxis: { lines: { show: false } },
        },
        dataLabels: {
          enabled: false,
        },
        stroke: {
          width: 1,
          colors: ['#ffffff'],
        },
        xaxis: {
          categories: vendors,
          labels: {
            style: {
              fontSize: '12px',
            },
          },
          title: {
            text: this.translate.instant('DASHBOARD_MODULE.DELIVERIES') || 'Deliveries',
            offsetY: 4,
          },
        },
        yaxis: {
          labels: {
            style: { fontSize: '12px' },
            offsetX: 0,
            maxWidth: 280,
          },
        },
        fill: {
          opacity: 1,
        },
        tooltip: {
          y: {
            formatter: (val: number) => `${val} ${this.translate.instant('DASHBOARD_MODULE.ORDERS') || 'orders'}`,
          },
        },
        legend: {
          position: 'top',
          horizontalAlign: 'left',
          offsetX: -30,
          offsetY: 0,
          markers: {},
          itemMargin: {
            horizontal: 8,
            vertical: 0,
          },
        },
        responsive: [
          {
            breakpoint: 768,
            options: {
              yaxis: {
                labels: {
                  maxWidth: 130,
                },
              },
              legend: {
                offsetX: 0,
              },
            },
          },
        ],
        theme: {
          mode: 'light',
        },
      };

      this.cdr.detectChanges();
    },
    error: (err) => {
      console.error('Error loading delivery performance', err);
    },
  });
}


  onResized(event: any) {
    setTimeout(() => {
      this.fireRefreshEventOnWindow();
    }, 300);
  }

  fireRefreshEventOnWindow = function () {
    var evt = document.createEvent('HTMLEvents');
    evt.initEvent('resize', true, false);
    window.dispatchEvent(evt);
  };
}