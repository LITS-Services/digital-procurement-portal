import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import {
  ProcurementReportsService,
  ProcurementReportFilter,
  ProcurementReportsMetadata,
  SpendAnalysisSummary,
  SpendAnalysisCharts
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
  // Filters
  selectedPreset: string = 'ThisYear';
  customFromDate: string = '';
  customToDate: string = '';
  selectedEntityId: number | null = null;
  selectedVendorId: string = '';
  selectedPoStatus: string = '';
  selectedCurrency: string = '';
  selectedCategory: string = '';
  showAllVendorsChart: boolean = false;

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

  // Summary & Charts
  summary: SpendAnalysisSummary | null = null;
  chartsData: SpendAnalysisCharts | null = null;

  // Loading states
  loadingSummary = false;
  loadingCharts = false;
  exportingPdf = false;
  errorMessage = '';

  // ApexCharts configs
  spendTrendChart: ChartOptions = {
    series: [],
    chart: { type: 'area', height: 290, toolbar: { show: false } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    colors: ['#116aef', '#94a3b8'],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05 } },
    xaxis: { categories: [], labels: { style: { colors: '#64748b', fontSize: '11px' } } },
    yaxis: { labels: { formatter: (val: any) => this.formatShortNum(val), style: { colors: '#64748b' } } },
    grid: { strokeDashArray: 4, borderColor: '#f1f5f9' },
    tooltip: { y: { formatter: (val: any) => `${(Number(val) || 0).toLocaleString()} ${this.summary?.currency || 'SAR'}` } },
    legend: { position: 'top', horizontalAlign: 'right', fontWeight: 600 }
  };

  entityDonutChart: ChartOptions = {
    series: [],
    chart: { type: 'donut', height: 270 },
    labels: [],
    colors: ['#116aef', '#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'],
    legend: { position: 'bottom', horizontalAlign: 'center', fontWeight: 600 },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '13px', fontWeight: 700, color: '#334155' },
            value: { show: true, fontSize: '18px', fontWeight: 800, color: '#0f172a', formatter: (val: any) => `${this.formatShortNum(val)}` },
            total: {
              show: true,
              label: 'Total Spend',
              fontSize: '13px',
              fontWeight: 700,
              color: '#0f172a',
              formatter: () => `${this.formatShortNum(this.summary?.totalProcurementSpend ?? 0)}`
            }
          }
        }
      }
    }
  };

  vendorSpendChart: ChartOptions = {
    series: [],
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false }
    },
    plotOptions: { bar: { horizontal: true, barHeight: '60%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    colors: ['#116aef'],
    xaxis: { categories: [], labels: { formatter: (val: any) => this.formatShortNum(val) } },
    grid: { strokeDashArray: 4, borderColor: '#f1f5f9' },
    tooltip: { y: { formatter: (val: any) => `${(Number(val) || 0).toLocaleString()} ${this.summary?.currency || 'SAR'}` } }
  };

  entityComparisonChart: ChartOptions = {
    series: [],
    chart: { type: 'bar', height: 280, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: '52%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    colors: ['#116aef', '#0ea5e9', '#22c55e'],
    xaxis: { categories: [], labels: { style: { colors: '#64748b', fontSize: '11px' } } },
    yaxis: { labels: { formatter: (val: any) => this.formatShortNum(val) } },
    grid: { strokeDashArray: 4, borderColor: '#f1f5f9' },
    legend: { position: 'top', horizontalAlign: 'right', fontWeight: 600 },
    tooltip: { y: { formatter: (val: any) => `${(Number(val) || 0).toLocaleString()} ${this.summary?.currency || 'SAR'}` } }
  };

  poStatusDonutChart: ChartOptions = {
    series: [],
    chart: { type: 'donut', height: 265 },
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
              show: true,
              label: 'Total POs',
              fontSize: '13px',
              fontWeight: 700,
              color: '#0f172a',
              formatter: () => `${this.summary?.totalPurchaseOrders ?? 0}`
            }
          }
        }
      }
    }
  };

  spendCompositionChart: ChartOptions = {
    series: [],
    chart: { type: 'bar', height: 265, toolbar: { show: false } },
    plotOptions: { bar: { horizontal: false, columnWidth: '45%', borderRadius: 5, distributed: true } },
    dataLabels: { enabled: false },
    colors: ['#116aef', '#0ea5e9', '#22c55e', '#f59e0b'],
    xaxis: { categories: ['PO Amount', 'Invoiced', 'Paid', 'Outstanding'], labels: { style: { colors: '#64748b', fontSize: '11px' } } },
    yaxis: { labels: { formatter: (val: any) => this.formatShortNum(val) } },
    grid: { strokeDashArray: 4, borderColor: '#f1f5f9' },
    legend: { show: false },
    tooltip: { y: { formatter: (val: any) => `${(Number(val) || 0).toLocaleString()} ${this.summary?.currency || 'SAR'}` } }
  };

  constructor(
    private reportsService: ProcurementReportsService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Sync initial Procurement Entity with navbar switcher if present
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
        // Validate savedEntity against user's authorized entities
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
      showAllVendors: this.showAllVendorsChart
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
    this.selectedCurrency = '';
    this.selectedCategory = '';
    this.showAllVendorsChart = false;
    this.loadMetadata();
  }

  toggleAllVendorsChart(): void {
    this.showAllVendorsChart = !this.showAllVendorsChart;
    this.loadCharts();
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

  private bindCharts(data: SpendAnalysisCharts): void {
    // 1. Spend Trend
    this.spendTrendChart = {
      ...this.spendTrendChart,
      series: [
        { name: 'Current Period Spend', data: data.spendTrend.map(t => t.currentSpend) },
        { name: 'Previous Period Spend', data: data.spendTrend.map(t => t.previousSpend) }
      ],
      xaxis: { ...this.spendTrendChart.xaxis, categories: data.spendTrend.map(t => t.period) }
    };

    // 2. Entity Spend Donut
    this.entityDonutChart = {
      ...this.entityDonutChart,
      series: data.entitySpendDistribution.map(e => e.totalSpend),
      labels: data.entitySpendDistribution.map(e => `${e.entityName} (${e.percentageContribution}%)`)
    };

    // 3. Vendor Spend Distribution (Horizontal Bar)
    const chartHeight = Math.max(270, data.vendorSpendDistribution.length * 36);
    this.vendorSpendChart = {
      ...this.vendorSpendChart,
      chart: { ...this.vendorSpendChart.chart, height: chartHeight },
      series: [{ name: 'Procurement Spend', data: data.vendorSpendDistribution.map(v => v.totalSpend) }],
      xaxis: {
        ...this.vendorSpendChart.xaxis,
        categories: data.vendorSpendDistribution.map(v => `${v.vendorName} (${v.purchaseOrderCount} POs, ${v.percentageContribution}%)`)
      }
    };

    // 4. Entity Comparison
    this.entityComparisonChart = {
      ...this.entityComparisonChart,
      series: [
        { name: 'PO Spend', data: data.entityComparison.map(e => e.totalSpend) },
        { name: 'Invoiced', data: data.entityComparison.map(e => e.totalInvoicedAmount) },
        { name: 'Paid', data: data.entityComparison.map(e => e.totalPaidAmount) }
      ],
      xaxis: { ...this.entityComparisonChart.xaxis, categories: data.entityComparison.map(e => e.entityName) }
    };

    // 5. PO Status Donut
    this.poStatusDonutChart = {
      ...this.poStatusDonutChart,
      series: data.poStatusDistribution.map(s => s.count),
      labels: data.poStatusDistribution.map(s => s.status),
      colors: data.poStatusDistribution.map(s => s.color)
    };

    // 6. Spend Composition
    this.spendCompositionChart = {
      ...this.spendCompositionChart,
      series: [{
        name: 'Amount',
        data: [
          data.spendComposition.poAmount,
          data.spendComposition.invoicedAmount,
          data.spendComposition.paidAmount,
          data.spendComposition.outstandingAmount
        ]
      }]
    };
  }

  exportPdf(type: 'summary' | 'detailed'): void {
    this.exportingPdf = true;
    this.toastr.info(`Generating ${type === 'summary' ? 'Summary' : 'Detailed'} Spend Analysis PDF...`);
    const params = this.getFilterParams();

    this.reportsService.exportSpendPdf(params, type).subscribe({
      next: (blob) => {
        this.exportingPdf = false;
        const filename = `Spend_Analysis_${type}_${params.preset || 'Report'}_${new Date().toISOString().slice(0, 10)}.pdf`;
        this.reportsService.downloadPdfBlob(blob, filename);
        this.toastr.success('PDF exported successfully.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.exportingPdf = false;
        this.toastr.error('Failed to generate Spend Analysis PDF.');
        this.cdr.detectChanges();
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase();
    if (s.includes('paid') || s.includes('delivered') || s.includes('completed')) return 'badge-success';
    if (s.includes('approved') || s.includes('open') || s.includes('new')) return 'badge-info';
    if (s.includes('pending') || s.includes('partial')) return 'badge-warning';
    if (s.includes('cancel') || s.includes('reject')) return 'badge-danger';
    return 'badge-secondary';
  }

  get activeEntityLabel(): string {
    if (!this.selectedEntityId) {
      return `All Authorized Entities (${this.metadata.entities.length})`;
    }
    return this.metadata.entities.find(e => e.id === this.selectedEntityId)?.name || 'Selected Entity';
  }
}
