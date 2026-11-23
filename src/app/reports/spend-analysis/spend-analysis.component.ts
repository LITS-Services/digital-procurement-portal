import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  ProcurementReportsService,
  ProcurementReportFilter,
  ProcurementReportsMetadata,
  SpendAnalysisSummary,
  SpendAnalysisCharts,
  VendorSpendItem,
  EntitySpendItem,
  SpendPurchaseOrderRow,
  PaginatedReportResult
} from '../services/procurement-reports.service';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexStroke,
  ApexPlotOptions,
  ApexTooltip,
  ApexLegend,
  ApexGrid,
  ApexNonAxisChartSeries,
  ApexFill
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries | any;
  chart: ApexChart;
  xaxis?: ApexXAxis;
  yaxis?: ApexYAxis;
  dataLabels?: ApexDataLabels;
  stroke?: ApexStroke;
  plotOptions?: ApexPlotOptions;
  tooltip?: ApexTooltip;
  legend?: ApexLegend;
  grid?: ApexGrid;
  labels?: string[];
  colors?: string[];
  fill?: ApexFill;
};

@Component({
  selector: 'app-spend-analysis',
  templateUrl: './spend-analysis.component.html',
  styleUrls: ['./spend-analysis.component.scss'],
  standalone: false
})
export class SpendAnalysisComponent implements OnInit {
  // Report Parameters
  selectedPreset: string = 'ThisYear';
  customFromDate: string = '';
  customToDate: string = '';
  selectedEntityId: number | null = null;
  selectedVendorId: string = '';
  selectedPoStatus: string = '';
  selectedCurrency: string = '';
  selectedCategory: string = '';
  generatedAt: Date = new Date();

  presets = [
    { value: 'Today', label: 'Today' },
    { value: 'ThisWeek', label: 'This Week' },
    { value: 'ThisMonth', label: 'This Month' },
    { value: 'ThisQuarter', label: 'This Quarter' },
    { value: 'ThisYear', label: 'This Year' },
    { value: 'Custom', label: 'Custom Date Range' }
  ];

  metadata: ProcurementReportsMetadata = {
    entities: [],
    vendors: [],
    poStatuses: [],
    deliveryStatuses: [],
    currencies: [],
    categories: [],
    dataLimitations: []
  };

  // Report Data
  summary: SpendAnalysisSummary | null = null;
  chartsData: SpendAnalysisCharts | null = null;

  // Report Schedules & Transaction Ledger
  vendorSchedule: VendorSpendItem[] = [];
  entitySchedule: EntitySpendItem[] = [];
  poLedger: PaginatedReportResult<SpendPurchaseOrderRow> = this.emptyPage();

  searchTerm: string = '';
  sortBy: string = 'podate';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Loading states
  loadingSummary = false;
  loadingCharts = true;
  loadingSchedules = false;
  loadingLedger = false;
  exportingPdf = false;
  errorMessage = '';
  showFilterBar = true;

  // Exhibit 2.1: Spend Trend (matching Dashboard RFQ Pipeline chart UI)
  spendTrendChart: ChartOptions = {
    series: [],
    colors: ['#116AEF', '#93C5FD'],
    chart: {
      type: 'area',
      height: 260,
      fontFamily: 'Poppins, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2,
      lineCap: 'round'
    },
    fill: {
      type: 'gradient',
      colors: ['#116AEF', '#93C5FD'],
      gradient: {
        type: 'vertical',
        shadeIntensity: 0,
        inverseColors: false,
        opacityFrom: 0.35,
        opacityTo: 0.0,
        stops: [0, 100],
        colorStops: [
          [
            { offset: 0, color: '#116AEF', opacity: 0.35 },
            { offset: 65, color: '#116AEF', opacity: 0.1 },
            { offset: 100, color: '#116AEF', opacity: 0.0 }
          ],
          [
            { offset: 0, color: '#93C5FD', opacity: 0.25 },
            { offset: 65, color: '#93C5FD', opacity: 0.07 },
            { offset: 100, color: '#93C5FD', opacity: 0.0 }
          ]
        ]
      }
    },
    xaxis: {
      categories: [],
      labels: {
        rotate: -45,
        rotateAlways: true,
        hideOverlappingLabels: true,
        offsetY: 2,
        style: { fontSize: '11px', colors: '#64748B' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false }
    },
    yaxis: {
      labels: {
        offsetX: -10,
        formatter: (val: any) => this.formatShortNum(val),
        style: { fontSize: '12px', colors: '#64748B' }
      }
    },
    grid: {
      borderColor: '#E2E8F0',
      strokeDashArray: 6,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 4, left: 14, right: 16, bottom: 4 }
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (val: any) => `${(Number(val) || 0).toLocaleString()} SAR` }
    },
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'left',
      offsetY: 4,
      fontSize: '12px',
      labels: { colors: '#64748B' },
      markers: { strokeWidth: 0 },
      itemMargin: { horizontal: 12, vertical: 4 }
    }
  };

  // Exhibit 2.2: Spend Composition
  spendCompositionChart: ChartOptions = {
    series: [],
    chart: {
      type: 'bar',
      height: 250,
      fontFamily: 'Poppins, sans-serif',
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '38%',
        borderRadius: 4,
        distributed: true
      }
    },
    dataLabels: { enabled: false },
    colors: ['#116AEF', '#0284C7', '#16A34A', '#D97706'],
    xaxis: {
      categories: ['PO Spend', 'Invoiced', 'Paid', 'Outstanding'],
      labels: {
        style: { colors: '#64748B', fontSize: '12px', fontWeight: 500 },
        offsetY: 4
      },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        offsetX: -10,
        formatter: (val: any) => this.formatShortNum(val),
        style: { colors: '#64748B', fontSize: '12px' }
      }
    },
    grid: {
      borderColor: '#E2E8F0',
      strokeDashArray: 6,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 4, left: 14, right: 16, bottom: 4 }
    },
    legend: { show: false },
    tooltip: { y: { formatter: (val: any) => `${(Number(val) || 0).toLocaleString()} SAR` } }
  };

  constructor(
    private reportsService: ProcurementReportsService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  homePage(): void {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  toggleFilterBar(): void {
    this.showFilterBar = !this.showFilterBar;
  }

  onLedgerPageChange(event: any): void {
    const page = (event?.offset ?? 0) + 1;
    this.loadPoLedger(page);
  }

  ngOnInit(): void {
    const savedEntity = localStorage.getItem('selectedCompanyId');
    if (savedEntity && savedEntity !== 'All' && !isNaN(Number(savedEntity))) {
      this.selectedEntityId = Number(savedEntity);
    }
    this.loadMetadata();
  }

  private emptyPage<T>(): PaginatedReportResult<T> {
    return { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0, hasPreviousPage: false, hasNextPage: false };
  }

  private formatShortNum(val: any): string {
    const n = Number(val) || 0;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
    return n.toFixed(0);
  }

  loadMetadata(): void {
    this.reportsService.getMetadata(this.selectedEntityId).subscribe({
      next: (meta) => {
        this.metadata = meta;
        if (this.selectedEntityId !== null && !meta.entities.some(e => e.id === this.selectedEntityId)) {
          this.selectedEntityId = null;
        }
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err?.status === 403) {
          this.selectedEntityId = null;
          this.loadMetadata();
        } else {
          this.errorMessage = 'Failed to load procurement report metadata.';
          this.cdr.detectChanges();
        }
      }
    });
  }

  onEntityFilterChange(): void {
    this.selectedVendorId = '';
    this.reportsService.getMetadata(this.selectedEntityId).subscribe({
      next: (meta) => {
        this.metadata = meta;
        this.applyFilters();
      },
      error: () => this.applyFilters()
    });
  }

  getFilterParams(): ProcurementReportFilter {
    const filter: ProcurementReportFilter = {
      preset: this.selectedPreset,
      entityId: this.selectedEntityId,
      vendorUserId: this.selectedVendorId || undefined,
      poStatus: this.selectedPoStatus || undefined,
      currency: this.selectedCurrency || undefined,
      category: this.selectedCategory || undefined,
      showAllVendors: true,
      searchTerm: this.searchTerm || undefined,
      sortBy: this.sortBy || undefined,
      sortDirection: this.sortDirection
    };

    if (this.selectedPreset === 'Custom') {
      if (this.customFromDate) filter.fromDate = this.customFromDate;
      if (this.customToDate) filter.toDate = this.customToDate;
    }

    return filter;
  }

  applyFilters(): void {
    this.errorMessage = '';
    if (this.selectedPreset === 'Custom') {
      if (!this.customFromDate || !this.customToDate) {
        this.toastr.warning('Please select both From Date and To Date for custom range.');
        return;
      }
      if (new Date(this.customFromDate) > new Date(this.customToDate)) {
        this.toastr.warning('From Date cannot be greater than To Date.');
        return;
      }
    }

    this.generatedAt = new Date();
    this.loadSummary();
    this.loadCharts();
    this.loadSchedules();
    this.loadPoLedger(1);
  }

  resetFilters(): void {
    this.selectedPreset = 'ThisYear';
    this.customFromDate = '';
    this.customToDate = '';
    this.selectedEntityId = null;
    this.selectedVendorId = '';
    this.selectedPoStatus = '';
    this.selectedCurrency = '';
    this.selectedCategory = '';
    this.searchTerm = '';
    this.sortBy = 'podate';
    this.sortDirection = 'desc';
    this.loadMetadata();
  }

  loadSummary(): void {
    this.loadingSummary = true;
    this.reportsService.getSpendSummary(this.getFilterParams()).subscribe({
      next: (data) => {
        this.summary = data;
        this.loadingSummary = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingSummary = false;
        this.errorMessage = err?.error?.message || 'Failed to load spend summary.';
        this.toastr.error(this.errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  loadCharts(): void {
    this.loadingCharts = true;
    this.reportsService.getSpendCharts(this.getFilterParams()).subscribe({
      next: (data) => {
        this.chartsData = data;
        this.bindCharts(data);
        this.loadingCharts = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingCharts = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadSchedules(): void {
    this.loadingSchedules = true;
    const baseFilter = this.getFilterParams();
    baseFilter.searchTerm = undefined;
    baseFilter.pageNumber = 1;
    baseFilter.pageSize = 50;

    this.reportsService.getVendorSpendTable(baseFilter).subscribe({
      next: (res) => {
        this.vendorSchedule = res.items || [];
        this.loadingSchedules = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.vendorSchedule = [];
        this.loadingSchedules = false;
        this.cdr.detectChanges();
      }
    });

    this.reportsService.getEntitySpendTable(baseFilter).subscribe({
      next: (res) => {
        this.entitySchedule = res.items || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.entitySchedule = [];
        this.cdr.detectChanges();
      }
    });
  }

  loadPoLedger(page: number = 1): void {
    this.loadingLedger = true;
    const params = this.getFilterParams();
    params.pageNumber = page;
    params.pageSize = 10;
    this.poLedger.pageSize = 10;

    this.reportsService.getSpendPurchaseOrders(params).subscribe({
      next: (res) => {
        this.poLedger = res;
        this.loadingLedger = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingLedger = false;
        this.cdr.detectChanges();
      }
    });
  }

  private bindCharts(data: SpendAnalysisCharts): void {
    this.spendTrendChart = {
      ...this.spendTrendChart,
      series: [
        { name: 'Current Period', data: data.spendTrend.map(t => t.currentSpend) },
        { name: 'Prior Period', data: data.spendTrend.map(t => t.previousSpend) }
      ],
      xaxis: { ...this.spendTrendChart.xaxis, categories: data.spendTrend.map(t => t.period) }
    };

    this.spendCompositionChart = {
      ...this.spendCompositionChart,
      series: [{
        name: 'Amount (SAR)',
        data: [
          data.spendComposition.poAmount,
          data.spendComposition.invoicedAmount,
          data.spendComposition.paidAmount,
          data.spendComposition.outstandingAmount
        ]
      }]
    };
  }

  onSearchLedger(): void {
    this.loadPoLedger(1);
  }

  onSortLedger(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'desc';
    }
    this.loadPoLedger(1);
  }

  printReport(): void {
    window.print();
  }

  exportPdf(): void {
    this.exportingPdf = true;
    this.toastr.info('Generating Spend Analysis Report PDF...');
    const params = this.getFilterParams();

    this.reportsService.exportSpendPdf(params, 'detailed').subscribe({
      next: (blob) => {
        this.exportingPdf = false;
        const filename = `Spend_Analysis_Report_${params.preset || 'Report'}_${new Date().toISOString().slice(0, 10)}.pdf`;
        this.reportsService.downloadPdfBlob(blob, filename);
        this.toastr.success('PDF exported successfully.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.exportingPdf = false;
        this.toastr.error('Failed to generate Spend Analysis Report PDF.');
        this.cdr.detectChanges();
      }
    });
  }

  // Schedule Totals
  get vendorTotalPos(): number { return this.vendorSchedule.reduce((s, r) => s + r.purchaseOrderCount, 0); }
  get vendorTotalSpend(): number { return this.vendorSchedule.reduce((s, r) => s + r.totalSpend, 0); }
  get vendorTotalInvoiced(): number { return this.vendorSchedule.reduce((s, r) => s + r.totalInvoicedAmount, 0); }
  get vendorTotalPaid(): number { return this.vendorSchedule.reduce((s, r) => s + r.totalPaidAmount, 0); }
  get vendorTotalOutstanding(): number { return this.vendorSchedule.reduce((s, r) => s + r.outstandingAmount, 0); }

  get entityTotalPos(): number { return this.entitySchedule.reduce((s, r) => s + r.purchaseOrderCount, 0); }
  get entityTotalSpend(): number { return this.entitySchedule.reduce((s, r) => s + r.totalSpend, 0); }
  get entityTotalInvoiced(): number { return this.entitySchedule.reduce((s, r) => s + r.totalInvoicedAmount, 0); }
  get entityTotalPaid(): number { return this.entitySchedule.reduce((s, r) => s + r.totalPaidAmount, 0); }
  get entityTotalOutstanding(): number { return this.entitySchedule.reduce((s, r) => s + r.outstandingAmount, 0); }

  get poPageTotalAmount(): number { return this.poLedger.items.reduce((s, r) => s + r.poAmount, 0); }
  get poPageTotalInvoiced(): number { return this.poLedger.items.reduce((s, r) => s + r.invoicedAmount, 0); }

  getStatusPillClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('paid') || s.includes('delivered') || s.includes('completed')) return 'status-pill--success';
    if (s.includes('approved') || s.includes('open') || s.includes('new')) return 'status-pill--info';
    if (s.includes('pending') || s.includes('partial')) return 'status-pill--warning';
    if (s.includes('cancel') || s.includes('reject')) return 'status-pill--danger';
    return 'status-pill--neutral';
  }

  getStatusChipClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('paid') || s.includes('delivered') || s.includes('completed')) return 'chip chip--success';
    if (s.includes('approved') || s.includes('open') || s.includes('new')) return 'chip chip--approved';
    if (s.includes('pending') || s.includes('partial')) return 'chip chip--pending';
    if (s.includes('cancel') || s.includes('reject')) return 'chip chip--rejected';
    return 'chip chip--draft';
  }

  get activeEntityLabel(): string {
    if (!this.selectedEntityId) {
      return `All Authorized Entities (${this.metadata.entities.length})`;
    }
    return this.metadata.entities.find(e => e.id === this.selectedEntityId)?.name || 'Selected Entity';
  }

  getPages(): number[] {
    const totalPages = this.poLedger?.totalPages || 1;
    const current = this.poLedger?.pageNumber || 1;
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, current - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
