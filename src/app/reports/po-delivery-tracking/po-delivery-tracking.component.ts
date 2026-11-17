import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import {
  ProcurementReportsService,
  ProcurementReportFilter,
  ProcurementReportsMetadata,
  PoDeliverySummary,
  PoDeliveryCharts
} from '../services/procurement-reports.service';
import { ChartOptions } from '../spend-analysis/spend-analysis.component';

@Component({
  selector: 'app-po-delivery-tracking',
  templateUrl: './po-delivery-tracking.component.html',
  styleUrls: ['./po-delivery-tracking.component.scss'],
  standalone: false
})
export class PoDeliveryTrackingComponent implements OnInit {
  // Filters
  selectedPreset: string = 'ThisYear';
  customFromDate: string = '';
  customToDate: string = '';
  selectedEntityId: number | null = null;
  selectedVendorId: string = '';
  selectedPoStatus: string = '';
  selectedDeliveryStatus: string = '';
  selectedTimeliness: string = '';
  selectedCurrency: string = '';

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

  loadingSummary = false;
  loadingCharts = false;
  exportingPdf = false;
  errorMessage = '';

  // 8 Charts
  poStatusDonut: ChartOptions = {
    series: [],
    chart: { type: 'donut', height: 260 },
    labels: [],
    colors: ['#116aef', '#22c55e', '#f59e0b', '#ef4444', '#64748b'],
    legend: { position: 'bottom', horizontalAlign: 'center', fontWeight: 600 },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '13px', fontWeight: 700, color: '#334155' },
            value: { show: true, fontSize: '20px', fontWeight: 800, color: '#0f172a' },
            total: {
              show: true, label: 'Total POs', fontSize: '13px', fontWeight: 700, color: '#0f172a',
              formatter: () => `${this.summary?.totalPurchaseOrders ?? 0}`
            }
          }
        }
      }
    }
  };

  deliveryStatusDonut: ChartOptions = {
    series: [],
    chart: { type: 'donut', height: 260 },
    labels: [],
    colors: ['#22c55e', '#0ea5e9', '#f59e0b', '#ef4444'],
    legend: { position: 'bottom', horizontalAlign: 'center', fontWeight: 600 },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '13px', fontWeight: 700, color: '#334155' },
            value: { show: true, fontSize: '20px', fontWeight: 800, color: '#0f172a' },
            total: {
              show: true, label: 'Completion', fontSize: '13px', fontWeight: 700, color: '#0f172a',
              formatter: () => `${this.summary?.deliveryCompletionPercentage ?? 0}%`
            }
          }
        }
      }
    }
  };

  onTimeVsDelayedDonut: ChartOptions = {
    series: [],
    chart: { type: 'donut', height: 260 },
    labels: ['On-Time', 'Delayed'],
    colors: ['#22c55e', '#ef4444'],
    legend: { position: 'bottom', horizontalAlign: 'center', fontWeight: 600 },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '13px', fontWeight: 700, color: '#334155' },
            value: { show: true, fontSize: '20px', fontWeight: 800, color: '#0f172a' },
            total: {
              show: true, label: 'On-Time %', fontSize: '13px', fontWeight: 700, color: '#0f172a',
              formatter: () => this.summary?.onTimeDeliveryRate !== null && this.summary?.onTimeDeliveryRate !== undefined ? `${this.summary.onTimeDeliveryRate}%` : 'N/A'
            }
          }
        }
      }
    }
  };

  poTrendChart: ChartOptions = {
    series: [],
    chart: { type: 'area', height: 270, toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 2.5 },
    colors: ['#116aef', '#0ea5e9'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05 } },
    dataLabels: { enabled: false },
    xaxis: { categories: [], labels: { style: { colors: '#64748b', fontSize: '11px' } } },
    yaxis: { labels: { formatter: (val: any) => this.formatShortNum(val) } },
    grid: { strokeDashArray: 4, borderColor: '#f1f5f9' },
    legend: { position: 'top', horizontalAlign: 'right', fontWeight: 600 },
    tooltip: { y: { formatter: (val: any) => `${(Number(val) || 0).toLocaleString()}` } }
  };

  deliveryTrendChart: ChartOptions = {
    series: [],
    chart: { type: 'line', height: 270, toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 2.5 },
    colors: ['#22c55e', '#f59e0b', '#ef4444'],
    dataLabels: { enabled: false },
    xaxis: { categories: [], labels: { style: { colors: '#64748b', fontSize: '11px' } } },
    yaxis: { labels: { style: { colors: '#64748b' } } },
    grid: { strokeDashArray: 4, borderColor: '#f1f5f9' },
    legend: { position: 'top', horizontalAlign: 'right', fontWeight: 600 }
  };

  vendorDeliveryChart: ChartOptions = {
    series: [],
    chart: { type: 'bar', height: 280, stacked: true, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 4 } },
    colors: ['#22c55e', '#0ea5e9', '#f59e0b', '#ef4444'],
    dataLabels: { enabled: false },
    xaxis: { categories: [] },
    grid: { strokeDashArray: 4, borderColor: '#f1f5f9' },
    legend: { position: 'top', horizontalAlign: 'right', fontWeight: 600 }
  };

  entityPoChart: ChartOptions = {
    series: [],
    chart: { type: 'bar', height: 280, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: '50%', borderRadius: 4 } },
    colors: ['#116aef', '#22c55e', '#f59e0b', '#ef4444'],
    dataLabels: { enabled: false },
    xaxis: { categories: [], labels: { style: { colors: '#64748b', fontSize: '11px' } } },
    grid: { strokeDashArray: 4, borderColor: '#f1f5f9' },
    legend: { position: 'top', horizontalAlign: 'right', fontWeight: 600 }
  };

  outstandingVendorChart: ChartOptions = {
    series: [],
    chart: { type: 'bar', height: 260, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, barHeight: '55%', borderRadius: 4 } },
    colors: ['#f59e0b'],
    dataLabels: { enabled: false },
    xaxis: { categories: [], labels: { formatter: (val: any) => this.formatShortNum(val) } },
    grid: { strokeDashArray: 4, borderColor: '#f1f5f9' },
    tooltip: { y: { formatter: (val: any) => `${(Number(val) || 0).toLocaleString()} ${this.summary?.currency || 'SAR'}` } }
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
      currency: this.selectedCurrency || undefined
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
    this.selectedCurrency = '';
    this.loadMetadata();
  }

  loadSummary(): void {
    this.loadingSummary = true;
    this.reportsService.getPoDeliverySummary(this.getFilterParams()).subscribe({
      next: (data) => {
        this.summary = data;
        this.loadingSummary = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingSummary = false;
        this.errorMessage = err?.error?.message || 'Failed to load PO & Delivery summary.';
        this.toastr.error(this.errorMessage);
        this.cdr.detectChanges();
      }
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

  private bindCharts(data: PoDeliveryCharts): void {
    this.poStatusDonut = {
      ...this.poStatusDonut,
      series: data.poStatusDistribution.map(s => s.count),
      labels: data.poStatusDistribution.map(s => s.status),
      colors: data.poStatusDistribution.map(s => s.color)
    };

    this.deliveryStatusDonut = {
      ...this.deliveryStatusDonut,
      series: data.deliveryStatusDistribution.map(s => s.count),
      labels: data.deliveryStatusDistribution.map(s => s.status),
      colors: data.deliveryStatusDistribution.map(s => s.color)
    };

    const hasTimelinessData = (data.onTimeVsDelayed.onTimeCount + data.onTimeVsDelayed.delayedCount) > 0;
    this.onTimeVsDelayedDonut = {
      ...this.onTimeVsDelayedDonut,
      series: hasTimelinessData ? [data.onTimeVsDelayed.onTimeCount, data.onTimeVsDelayed.delayedCount] : [],
      labels: ['On-Time Deliveries', 'Delayed / Overdue']
    };

    this.poTrendChart = {
      ...this.poTrendChart,
      series: [
        { name: `PO Value (${this.summary?.currency || 'SAR'})`, data: data.poTrend.map(t => t.poValue) }
      ],
      xaxis: { ...this.poTrendChart.xaxis, categories: data.poTrend.map(t => `${t.period} (${t.poCount})`) }
    };

    this.deliveryTrendChart = {
      ...this.deliveryTrendChart,
      series: [
        { name: 'Completed Deliveries', data: data.deliveryPerformanceTrend.map(t => t.completedDeliveries) },
        { name: 'Pending Deliveries', data: data.deliveryPerformanceTrend.map(t => t.pendingDeliveries) },
        { name: 'Delayed / Overdue', data: data.deliveryPerformanceTrend.map(t => t.delayedDeliveries) }
      ],
      xaxis: { ...this.deliveryTrendChart.xaxis, categories: data.deliveryPerformanceTrend.map(t => t.period) }
    };

    this.vendorDeliveryChart = {
      ...this.vendorDeliveryChart,
      series: [
        { name: 'Delivered', data: data.vendorDeliveryPerformance.map(v => v.deliveredPos) },
        { name: 'Partial', data: data.vendorDeliveryPerformance.map(v => v.partiallyDeliveredPos) },
        { name: 'Pending', data: data.vendorDeliveryPerformance.map(v => v.pendingPos) },
        { name: 'Delayed', data: data.vendorDeliveryPerformance.map(v => v.delayedPos) }
      ],
      xaxis: { ...this.vendorDeliveryChart.xaxis, categories: data.vendorDeliveryPerformance.map(v => v.vendorName) }
    };

    this.entityPoChart = {
      ...this.entityPoChart,
      series: [
        { name: 'Total POs', data: data.entityPoAnalysis.map(e => e.totalPos) },
        { name: 'Delivered', data: data.entityPoAnalysis.map(e => e.deliveredPos) },
        { name: 'Pending', data: data.entityPoAnalysis.map(e => e.pendingPos) },
        { name: 'Overdue', data: data.entityPoAnalysis.map(e => e.overduePos) }
      ],
      xaxis: { ...this.entityPoChart.xaxis, categories: data.entityPoAnalysis.map(e => e.entityName) }
    };

    this.outstandingVendorChart = {
      ...this.outstandingVendorChart,
      series: [{ name: 'Pending Delivery Value', data: data.outstandingDeliveryAnalysis.map(v => v.pendingDeliveryValue) }],
      xaxis: {
        ...this.outstandingVendorChart.xaxis,
        categories: data.outstandingDeliveryAnalysis.map(v => `${v.vendorName} (${v.pendingPos} pending)`)
      }
    };
  }

  exportPdf(type: 'summary' | 'detailed'): void {
    this.exportingPdf = true;
    this.toastr.info(`Generating ${type === 'summary' ? 'Summary' : 'Detailed'} PO & Delivery PDF...`);
    const params = this.getFilterParams();

    this.reportsService.exportPoDeliveryPdf(params, type).subscribe({
      next: (blob) => {
        this.exportingPdf = false;
        const filename = `PO_Delivery_Tracking_${type}_${params.preset || 'Report'}_${new Date().toISOString().slice(0, 10)}.pdf`;
        this.reportsService.downloadPdfBlob(blob, filename);
        this.toastr.success('PDF exported successfully.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.exportingPdf = false;
        this.toastr.error('Failed to generate PO & Delivery Tracking PDF.');
        this.cdr.detectChanges();
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('delivered') && !s.includes('partial')) return 'badge-success';
    if (s.includes('on-time') || s.includes('completed')) return 'badge-success';
    if (s.includes('partial') || s.includes('open') || s.includes('new')) return 'badge-info';
    if (s.includes('pending')) return 'badge-warning';
    if (s.includes('delay') || s.includes('overdue') || s.includes('cancel') || s.includes('reject')) return 'badge-danger';
    return 'badge-secondary';
  }

  get activeEntityLabel(): string {
    if (!this.selectedEntityId) {
      return `All Authorized Entities (${this.metadata.entities.length})`;
    }
    return this.metadata.entities.find(e => e.id === this.selectedEntityId)?.name || 'Selected Entity';
  }
}
