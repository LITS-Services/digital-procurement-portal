import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  // Exhibit 1.1: Delivery Status Donut (compact)
  deliveryStatusDonut: ChartOptions = {
    series: [],
    chart: { type: 'donut', height: 225 },
    labels: [],
    colors: ['#16a34a', '#0284c7', '#d97706', '#dc2626'],
    legend: { position: 'bottom', horizontalAlign: 'center', fontWeight: 600, fontSize: '11px' },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            name: { show: true, fontSize: '12px', fontWeight: 700, color: '#334155' },
            value: { show: true, fontSize: '18px', fontWeight: 800, color: '#0f172a' },
            total: {
              show: true,
              label: 'Completion',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#0f172a',
              formatter: () => `${this.summary?.deliveryCompletionPercentage ?? 0}%`
            }
          }
        }
      }
    }
  };

  // Exhibit 1.2: Delivery Performance Trend (compact)
  deliveryTrendChart: ChartOptions = {
    series: [],
    chart: { type: 'line', height: 225, toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 2.2 },
    colors: ['#16a34a', '#d97706', '#dc2626'],
    dataLabels: { enabled: false },
    xaxis: { categories: [], labels: { style: { colors: '#64748b', fontSize: '10.5px' } } },
    yaxis: { labels: { style: { colors: '#64748b', fontSize: '10.5px' } } },
    grid: { strokeDashArray: 3, borderColor: '#e2e8f0' },
    legend: { position: 'top', horizontalAlign: 'right', fontWeight: 600, fontSize: '11px' }
  };

  constructor(
    private reportsService: ProcurementReportsService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const savedEntity = localStorage.getItem('selectedCompanyId');
    if (savedEntity && savedEntity !== 'All' && !isNaN(Number(savedEntity))) {
      this.selectedEntityId = Number(savedEntity);
    }
    this.loadMetadata();
  }

  private emptyPage<T>(): PaginatedReportResult<T> {
    return { items: [], totalCount: 0, pageNumber: 1, pageSize: 15, totalPages: 0, hasPreviousPage: false, hasNextPage: false };
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

    if (this.activeSection === 'pos') {
      params.pageSize = this.poTable.pageSize;
      this.reportsService.getPoTrackingTable(params).subscribe({
        next: (res) => { this.poTable = res; this.loadingTable = false; this.cdr.detectChanges(); },
        error: () => { this.loadingTable = false; this.cdr.detectChanges(); }
      });
    } else if (this.activeSection === 'deliveries') {
      params.pageSize = this.deliveryTable.pageSize;
      this.reportsService.getDeliveryTrackingTable(params).subscribe({
        next: (res) => { this.deliveryTable = res; this.loadingTable = false; this.cdr.detectChanges(); },
        error: () => { this.loadingTable = false; this.cdr.detectChanges(); }
      });
    } else {
      params.pageSize = this.pendingTable.pageSize;
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
