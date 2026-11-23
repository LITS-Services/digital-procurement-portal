import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import {
  ProcurementReportsService,
  ProcurementReportFilter,
  ProcurementReportsMetadata,
  PoDeliverySummary,
  PoDeliveryCharts,
  PoTrackingRow,
  DeliveryTrackingRow,
  PendingDeliveryRow,
  PaginatedReportResult
} from '../services/procurement-reports.service';
import { ChartOptions } from '../spend-analysis/spend-analysis.component';

@Component({
  selector: 'app-po-delivery-tracking',
  templateUrl: './po-delivery-tracking.component.html',
  styleUrls: ['./po-delivery-tracking.component.scss'],
  standalone: false
})
export class PoDeliveryTrackingComponent implements OnInit {
  // Report Parameters
  selectedPreset: string = 'ThisYear';
  customFromDate: string = '';
  customToDate: string = '';
  selectedEntityId: number | null = null;
  selectedVendorId: string = '';
  selectedPoStatus: string = '';
  selectedDeliveryStatus: string = '';
  selectedTimeliness: string = '';

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

  summary: PoDeliverySummary | null = null;
  chartsData: PoDeliveryCharts | null = null;

  // Section 2: Operational Transactions
  activeSection: 'pos' | 'deliveries' | 'pending' = 'pos';
  searchTerm: string = '';
  sortBy: string = '';
  sortDirection: 'asc' | 'desc' = 'desc';

  poTable: PaginatedReportResult<PoTrackingRow> = this.emptyPage();
  deliveryTable: PaginatedReportResult<DeliveryTrackingRow> = this.emptyPage();
  pendingTable: PaginatedReportResult<PendingDeliveryRow> = this.emptyPage();

  loadingCharts = false;
  loadingTable = false;
  exportingPdf = false;
  errorMessage = '';
  showFilterBar = true;

  // Exhibit 1.1: Delivery Status Donut
  deliveryStatusDonut: ChartOptions = {
    series: [],
    chart: { type: 'donut', height: 260, fontFamily: 'Poppins, sans-serif' },
    labels: [],
    colors: ['#16A34A', '#116AEF', '#D97706', '#DC2626'],
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontWeight: 500,
      fontSize: '12px'
    },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            name: { show: true, fontSize: '12px', fontWeight: 600, color: '#64748B' },
            value: { show: true, fontSize: '18px', fontWeight: 700, color: '#0F172A' },
            total: {
              show: true,
              label: 'Completion',
              fontSize: '12px',
              fontWeight: 600,
              color: '#0F172A',
              formatter: () => `${this.summary?.deliveryCompletionPercentage ?? 0}%`
            }
          }
        }
      }
    }
  };

  // Exhibit 1.2: Delivery Performance Trend
  deliveryTrendChart: ChartOptions = {
    series: [],
    colors: ['#16A34A', '#D97706', '#DC2626'],
    chart: {
      type: 'area',
      height: 260,
      fontFamily: 'Poppins, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    stroke: {
      curve: 'smooth',
      width: 2,
      lineCap: 'round'
    },
    fill: {
      type: 'gradient',
      colors: ['#16A34A', '#D97706', '#DC2626'],
      gradient: {
        type: 'vertical',
        shadeIntensity: 0,
        inverseColors: false,
        opacityFrom: 0.35,
        opacityTo: 0.0,
        stops: [0, 100],
        colorStops: [
          [
            { offset: 0, color: '#16A34A', opacity: 0.35 },
            { offset: 65, color: '#16A34A', opacity: 0.1 },
            { offset: 100, color: '#16A34A', opacity: 0.0 }
          ],
          [
            { offset: 0, color: '#D97706', opacity: 0.28 },
            { offset: 65, color: '#D97706', opacity: 0.08 },
            { offset: 100, color: '#D97706', opacity: 0.0 }
          ],
          [
            { offset: 0, color: '#DC2626', opacity: 0.28 },
            { offset: 65, color: '#DC2626', opacity: 0.08 },
            { offset: 100, color: '#DC2626', opacity: 0.0 }
          ]
        ]
      }
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: [],
      labels: {
        rotate: -45,
        rotateAlways: false,
        hideOverlappingLabels: true,
        offsetY: 2,
        style: { colors: '#64748B', fontSize: '11px', fontFamily: 'Poppins, sans-serif' }
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false }
    },
    yaxis: {
      min: 0,
      forceNiceScale: true,
      labels: {
        offsetX: -10,
        style: { colors: '#64748B', fontSize: '11px', fontFamily: 'Poppins, sans-serif' },
        formatter: (val: any) => `${Math.round(Number(val) || 0)}`
      }
    },
    grid: {
      borderColor: '#E2E8F0',
      strokeDashArray: 6,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: 4, left: 14, right: 16, bottom: 4 }
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontWeight: 500,
      fontSize: '12px'
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val: any) => `${Math.round(Number(val) || 0)} deliveries`
      }
    }
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
          this.errorMessage = 'Failed to load report metadata.';
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
      deliveryStatus: this.selectedDeliveryStatus || undefined,
      deliveryTimeliness: this.selectedTimeliness || undefined,
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

    this.loadSummary();
    this.loadCharts();
    this.loadAllCountsAndActiveTable(1);
  }

  resetFilters(): void {
    this.selectedPreset = 'ThisYear';
    this.customFromDate = '';
    this.customToDate = '';
    this.selectedEntityId = null;
    this.selectedVendorId = '';
    this.selectedPoStatus = '';
    this.selectedDeliveryStatus = '';
    this.selectedTimeliness = '';
    this.searchTerm = '';
    this.sortBy = '';
    this.sortDirection = 'desc';
    this.loadMetadata();
  }

  loadSummary(): void {
    this.reportsService.getPoDeliverySummary(this.getFilterParams()).subscribe({
      next: (data) => {
        this.summary = data;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadCharts(): void {
    this.loadingCharts = true;
    this.reportsService.getPoDeliveryCharts(this.getFilterParams()).subscribe({
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

  loadAllCountsAndActiveTable(page: number = 1): void {
    this.loadTable(page);
    const countParams = this.getFilterParams();
    countParams.pageNumber = 1;
    countParams.pageSize = 1;
    if (this.activeSection !== 'deliveries') {
      this.reportsService.getDeliveryTrackingTable(countParams).subscribe({
        next: (res) => { this.deliveryTable.totalCount = res.totalCount; this.cdr.detectChanges(); },
        error: () => {}
      });
    }
    if (this.activeSection !== 'pending') {
      this.reportsService.getPendingDeliveriesTable(countParams).subscribe({
        next: (res) => { this.pendingTable.totalCount = res.totalCount; this.cdr.detectChanges(); },
        error: () => {}
      });
    }
  }

  switchSection(sec: 'pos' | 'deliveries' | 'pending'): void {
    this.activeSection = sec;
    this.searchTerm = '';
    this.sortBy = '';
    this.loadTable(1);
  }

  loadTable(page: number = 1): void {
    this.loadingTable = true;
    const params = this.getFilterParams();
    params.pageNumber = page;
    params.pageSize = 10;

    if (this.activeSection === 'pos') {
      this.poTable.pageSize = 10;
      this.reportsService.getPoTrackingTable(params).subscribe({
        next: (res) => { this.poTable = res; this.loadingTable = false; this.cdr.detectChanges(); },
        error: () => { this.loadingTable = false; this.cdr.detectChanges(); }
      });
    } else if (this.activeSection === 'deliveries') {
      this.deliveryTable.pageSize = 10;
      this.reportsService.getDeliveryTrackingTable(params).subscribe({
        next: (res) => { this.deliveryTable = res; this.loadingTable = false; this.cdr.detectChanges(); },
        error: () => { this.loadingTable = false; this.cdr.detectChanges(); }
      });
    } else {
      this.pendingTable.pageSize = 10;
      this.reportsService.getPendingDeliveriesTable(params).subscribe({
        next: (res) => { this.pendingTable = res; this.loadingTable = false; this.cdr.detectChanges(); },
        error: () => { this.loadingTable = false; this.cdr.detectChanges(); }
      });
    }
  }

  onSearchTable(): void {
    this.loadTable(1);
  }

  onSortTable(column: string): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'desc';
    }
    this.loadTable(1);
  }

  private bindCharts(data: PoDeliveryCharts): void {
    this.deliveryStatusDonut = {
      ...this.deliveryStatusDonut,
      series: data.deliveryStatusDistribution.map(s => s.count),
      labels: data.deliveryStatusDistribution.map(s => s.status),
      colors: data.deliveryStatusDistribution.map(s => s.color)
    };

    this.deliveryTrendChart = {
      ...this.deliveryTrendChart,
      series: [
        { name: 'Completed (GRN)', data: data.deliveryPerformanceTrend.map(t => t.completedDeliveries) },
        { name: 'Pending', data: data.deliveryPerformanceTrend.map(t => t.pendingDeliveries) },
        { name: 'Delayed / Overdue', data: data.deliveryPerformanceTrend.map(t => t.delayedDeliveries) }
      ],
      xaxis: { ...this.deliveryTrendChart.xaxis, categories: data.deliveryPerformanceTrend.map(t => t.period) }
    };
  }

  printReport(): void {
    window.print();
  }

  exportPdf(): void {
    this.exportingPdf = true;
    this.toastr.info('Generating PO and Delivery Tracking Report PDF...');
    const params = this.getFilterParams();

    this.reportsService.exportPoDeliveryPdf(params, 'detailed').subscribe({
      next: (blob) => {
        this.exportingPdf = false;
        const filename = `PO_and_Delivery_Tracking_Report_${params.preset || 'Report'}_${new Date().toISOString().slice(0, 10)}.pdf`;
        this.reportsService.downloadPdfBlob(blob, filename);
        this.toastr.success('PDF exported successfully.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.exportingPdf = false;
        this.toastr.error('Failed to generate PO and Delivery Tracking Report PDF.');
        this.cdr.detectChanges();
      }
    });
  }

  get poPageTotal(): number { return this.poTable.items.reduce((s, r) => s + r.poAmount, 0); }
  get grnPageQty(): number { return this.deliveryTable.items.reduce((s, r) => s + r.deliveredQuantity, 0); }
  get pendingPageVal(): number { return this.pendingTable.items.reduce((s, r) => s + r.pendingValue, 0); }
  get pendingPageQty(): number { return this.pendingTable.items.reduce((s, r) => s + r.pendingQuantity, 0); }

  get currentActiveTable(): PaginatedReportResult<any> {
    if (this.activeSection === 'pos') return this.poTable;
    if (this.activeSection === 'deliveries') return this.deliveryTable;
    return this.pendingTable;
  }

  getPages(): number[] {
    const totalPages = this.currentActiveTable?.totalPages || 1;
    const current = this.currentActiveTable?.pageNumber || 1;
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

  getStatusChipClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('paid') || s.includes('delivered') || s.includes('completed') || s.includes('on-time')) return 'chip chip--success';
    if (s.includes('approved') || s.includes('open') || s.includes('new')) return 'chip chip--approved';
    if (s.includes('pending') || s.includes('partial')) return 'chip chip--pending';
    if (s.includes('delay') || s.includes('overdue') || s.includes('cancel') || s.includes('reject')) return 'chip chip--rejected';
    return 'chip chip--draft';
  }

  getStatusPillClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered') && !s.includes('partial')) return 'status-pill--success';
    if (s.includes('on-time') || s.includes('completed')) return 'status-pill--success';
    if (s.includes('partial') || s.includes('open') || s.includes('new')) return 'status-pill--info';
    if (s.includes('pending')) return 'status-pill--warning';
    if (s.includes('delay') || s.includes('overdue') || s.includes('cancel') || s.includes('reject')) return 'status-pill--danger';
    return 'status-pill--neutral';
  }
}
