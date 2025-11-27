import { AfterViewInit, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import * as Chartist from 'chartist';
import { ChartType, ChartEvent } from "ng-chartist";
import ChartistTooltip from 'chartist-plugin-tooltips-updated';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { DashboardService, RfqPipelineGraphPoint } from 'app/shared/services/dashboard.service';
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

declare var require: any;

export interface PurchaseOrdersCountVM {
  totalOrders: number;
  openOrders: number;
  completedOrders: number;
}

export interface Chart {
  type: ChartType;
  data: Chartist.IChartistData;
  options?: any;
  responsiveOptions?: any;
  events?: ChartEvent;
  // plugins?: any;
}

export interface PurchaseRequestsCountVM {
  totalRequests: number;
  newRequests: number;
  inProcessRequests: number;
  completedRequests: number;
}

export interface QuotationRequestsCountVM {
  totalQuotations: number;
  //newQuotations: number;
  inProcessQuotations: number;
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
  legend:ApexLegend;
  
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
};

@Component({
  selector: 'app-dashboard1',
  templateUrl: './dashboard1.component.html',
  styleUrls: ['./dashboard1.component.scss'],
})
export class Dashboard1Component implements OnInit,AfterViewInit {
  prCounts!: PurchaseRequestsCountVM;
  rfqCounts!: QuotationRequestsCountVM;

  poCounts: PurchaseOrdersCountVM = {
    totalOrders: 0,
    openOrders: 0,
    completedOrders: 0,
  };

  recentVendors = [
    { name: 'AlaMart', location: 'Karachi', timesBought: 6, successRate: '4 Success' },
    { name: 'Alpha Stores', location: 'Lahore', timesBought: 10, successRate: '7 Success' },
    { name: 'Metro Supplies', location: 'Islamabad', timesBought: 3, successRate: '2 Success' },
    { name: 'APT (PVT) Cental PART', location: 'Dubai', timesBought: 1, successRate: '0 Success' },
    { name: 'Geeks&Geeks', location: 'Faislabad', timesBought: 3, successRate: '1 Success' },
  ];

  upcomingAuctions = [
    { product: 'Desktops', quantity: '20 nos', date: '23-06-2024', budget: 'Rs 2,500,000' },
    { product: 'Sanitizers', quantity: '100 nos', date: '16-06-2024', budget: 'Rs 50,000' },
    { product: 'Billing Machines', quantity: '12 nos', date: '07-06-2024', budget: 'Rs 150,000' },
    {
      product: 'IT-204 Macbook',
      quantity: '100 nos',
      date: '16-06-2024',
      budget: 'Rs 50,000',
    },
    { product: 'Billing Machines', quantity: '12 nos', date: '07-06-2024', budget: 'Rs 150,000' },
  ];

  monthlyExpenses = [
    { label: 'Inventory', color: '#80ed99', value: '65%' },
    { label: 'Non-Inventory', color: '#219ebc', value: '35%' },
  ];

  monthlySpendAmount = 'Rs 1.5L';
  monthlySpendLabel = '8.5% higher than last month';

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
  constructor(
    private http: HttpClient,
    public translate: TranslateService,
    private dashboardService: DashboardService,
    private messagingService: FirebaseMessagingService,
    private toaster: ToastrService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.translate.onLangChange.subscribe(() => {
      // Check if the current language is Arabic
      this.isArabic = this.translate.currentLang === 'ar';

      // console.log(this.translate.currentLang);
      // console.log(this.isArabic);
    });
  }

  ngOnInit(): void {
    this.loadPurchaseRequestsCounts();
    this.loadQuotationRequestsCounts();
    this.initSpendChart();
    this.initSpendDonut();
    this.initVendorDeliveryChart();
    
  }

ngAfterViewInit(): void {
  // Ensure the chart DOM is fully laid out before we feed data
  this.ngZone.runOutsideAngular(() => {
    requestAnimationFrame(() => {
      this.ngZone.run(() => {
        this.setChartRange('month');
      });
    });
  });
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

  isArabic: boolean = false;

  productSale: string = 'PRODUCTSALES';

  goToPurchaseRequest() {
    this.router.navigateByUrl('/purchase-request');
  }

  goToRfq() {
    this.router.navigateByUrl('/rfq');
  }

  goToPurchaseOrder() {
    this.router.navigateByUrl('/purchase-order');
  }

  goToCompany() {
    this.router.navigateByUrl('/company');
  }

  goToEntity() {
    this.router.navigateByUrl('/procurment-companies');
  }

  private initSpendChart(): void {
    this.spendChartOptions = {
      series: [], // will be set by setChartRange(...)
      chart: {
        type: 'area',
        height: 280,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      xaxis: {
        categories: [],
        labels: {
          style: { fontSize: '11px' },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (val: number) => val.toString(),
          style: { fontSize: '11px' },
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
        x: {
          formatter: (val: number, opts?: any): string => {
            const idx = opts?.dataPointIndex;

            if (idx != null && this.rfqTooltipDates[idx]) {
              const raw = this.rfqTooltipDates[idx];

              // Remove time part — split by space and take the date only
              return raw.split(' ')[0];
            }

            return String(val);
          },
        },
        y: {
          formatter: (val: number) => `${val.toLocaleString()} RFQs`,
        },
      },
      legend: {
        horizontalAlign: 'left',
      },
      theme: {
        mode: 'light',
        palette: 'palette2',
      },
    };

  }

changeRange(range: 'month' | 'quarter' | 'year'): void {
  this.setChartRange(range);
}
private setChartRange(range: 'month' | 'quarter' | 'year'): void {
  this.activeRange = range;

  const filterType =
    range === 'month' ? 1 :
    range === 'quarter' ? 2 : 3;

  const userId = localStorage.getItem('userId') ?? '';
  const entity = localStorage.getItem('selectedCompanyId')
  var entityId;
  if(entity === 'All'){
    entityId = null
  }
  else{
    entityId = Number(localStorage.getItem('selectedCompanyId'));
  }


  this.dashboardService
    .getRfqPipelineGraph(userId, entityId, filterType)
    .subscribe({
      next: (rows: RfqPipelineGraphPoint[]) => {
        const categories: string[] = [];
        const totalRfq: number[] = [];
        const rfqQuotation: number[] = [];
        const selectedRfq: number[] = [];
         this.rfqTooltipDates = rows.map(r => r.groupData);

        rows.forEach((row, index) => {
          let label: string;

          if (filterType === 1) {
             label = this.formatDayLabel(row.groupData);
          } else if (filterType === 2) {
            label = this.formatWeekLabel(row.groupData);
          } else {
            // YEAR
            label = this.formatMonthLabel(row.groupData);
          }

          categories.push(label);
          totalRfq.push(row.totalRfq);
          rfqQuotation.push(row.rfqQuotation);
          selectedRfq.push(row.quotesSelected);
        });

        this.spendChartOptions = {
          ...this.spendChartOptions,
          series: [
            {
              name: 'Total RFQs',
              data: totalRfq,
            },
            {
              name: 'RFQs with Quotation',
              data: rfqQuotation,
            },
            {
              name: 'Selected RFQs',
              data: selectedRfq,
            },
          ],
          xaxis: {
            ...this.spendChartOptions.xaxis,
            categories,
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
  // groupData: "10/26/2025 12:00:00 AM"
  const d = new Date(groupData);

  if (!isNaN(d.getTime())) {
    const day = d.getDate(); // 26
    const monthShort = d.toLocaleString('en-US', { month: 'short' }); // "Oct"
    return `${day} ${monthShort}`; // "26 Oct"
  }

  // fallback – if parsing fails, just show the raw string
  return groupData;
}

private formatMonthLabel(groupData: string): string {
  // expects "YYYY-MM-00" or "YYYY-MM"
  const parts = groupData.split('-');
  if (parts.length >= 2) {
    const monthNumber = parseInt(parts[1], 10); // "09" → 9
    if (!isNaN(monthNumber) && monthNumber >= 1 && monthNumber <= 12) {
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return monthNames[monthNumber - 1];
    }
  }
  return groupData;
}
  private initSpendDonut(): void {
    this.spendDonutOptions = {
      series: [65, 35],
      chart: {
        type: 'donut',
        height: 200,
      },
      labels: this.monthlyExpenses.map((e) => e.label),
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
    // Top 3 vendors (dummy data – replace with your API data)
    const vendors = ['AlaMart', 'Alpha Stores', 'Metro Supplies'];

    const onTimeDeliveries = [41, 36, 32]; // e.g. number of on-time POs
    const lateDeliveries = [9, 4, 6]; // e.g. number of late POs

    this.vendorDeliveryOptions = {
      series: [
        {
          name: 'On-Time',
          data: onTimeDeliveries,
        },
        {
          name: 'Late',
          data: lateDeliveries,
        },
      ],
      colors: ['#116aef', '#f97316'], // green for on-time, orange for late
      chart: {
        type: 'bar',
        height: 210,
        stacked: true,
        toolbar: { show: false },
        parentHeightOffset: 0, // ← remove bottom padding
        offsetY: 0, // ← pull chart upward to remove dead space
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '55%',
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
        categories: vendors, // will show on LEFT because it's horizontal
        labels: {
          style: {
            fontSize: '12px',
          },
        },
        title: {
          text: 'Deliveries',
        },
      },
      yaxis: {
        labels: {
          style: { fontSize: '12px' },
          offsetX: 0, // ← pull vendor labels closer to bars
        },
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} orders`,
          // or `${val}%` if you’re passing percentages
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        offsetX: -30,
        offsetY: 0, // ← pull legend closer to chart
        markers: {
          radius: 12,
        },
        itemMargin: {
          horizontal: 8,
          vertical: 0, // ← remove vertical spacing between legend items
        },
      },
      theme: {
        mode: 'light',
      },
    };
  }
  // Line area chart configuration Starts
  //   lineArea: Chart = {
  //     type: 'Line',
  //     data: data['lineAreaDashboard'],
  //     options: {
  //       low: 0,
  //       showArea: true,
  //       fullWidth: true,
  //       onlyInteger: true,
  //       axisY: {
  //         low: 0,
  //         scaleMinSpace: 50,
  //       },
  //       plugins: [
  //         ChartistTooltip({
  //           appendToBody: true,
  //           pointClass: 'ct-point-regular'
  //         })
  //       ],
  //       axisX: {
  //         showGrid: false
  //       }
  //     },
  //     events: {
  //       created(data: any): void {
  //         var defs = data.svg.elem('defs');
  //         defs.elem('linearGradient', {
  //           id: 'gradient',
  //           x1: 0,
  //           y1: 1,
  //           x2: 1,
  //           y2: 0
  //         }).elem('stop', {
  //           offset: 0,
  //           'stop-color': 'rgba(0, 201, 255, 1)'
  //         }).parent().elem('stop', {
  //           offset: 1,
  //           'stop-color': 'rgba(146, 254, 157, 1)'
  //         });

  //         defs.elem('linearGradient', {
  //           id: 'gradient1',
  //           x1: 0,
  //           y1: 1,
  //           x2: 1,
  //           y2: 0
  //         }).elem('stop', {
  //           offset: 0,
  //           'stop-color': 'rgba(132, 60, 247, 1)'
  //         }).parent().elem('stop', {
  //           offset: 1,
  //           'stop-color': 'rgba(56, 184, 242, 1)'
  //         });
  //       },
  //       draw(data: any): void {
  //         if (data.type === 'point') {
  //           var circle = new Chartist.Svg('circle', {
  //             cx: data.x,
  //             cy: data.y,
  //             r: 4,
  //             'ct:value': data.value.y,
  //             'ct:meta': data.meta,
  //             style: 'pointer-events: all !important',
  //             class: 'ct-point-regular'
  //           });
  //           data.element.replace(circle);
  //         }
  //       }
  //     },
  //   };
  //   // Line area chart configuration Ends

  //   // Stacked Bar chart configuration Starts
  //   Stackbarchart: Chart = {
  //     type: 'Bar',
  //     data: data['Stackbarchart'],
  //     options: {
  //       stackBars: true,
  //       fullWidth: true,
  //       axisX: {
  //         showGrid: false,
  //       },
  //       axisY: {
  //         showGrid: false,
  //         showLabel: false,
  //         offset: 0
  //       },
  //       chartPadding: 30
  //     },
  //     events: {
  //       created(data: any): void {
  //         var defs = data.svg.elem('defs');
  //         defs.elem('linearGradient', {
  //           id: 'linear',
  //           x1: 0,
  //           y1: 1,
  //           x2: 0,
  //           y2: 0
  //         }).elem('stop', {
  //           offset: 0,
  //           'stop-color': '#7441DB'
  //         }).parent().elem('stop', {
  //           offset: 1,
  //           'stop-color': '#C89CFF'
  //         });
  //       },
  //       draw(data: any): void {
  //         if (data.type === 'bar') {
  //           data.element.attr({
  //             style: 'stroke-width: 5px',
  //             x1: data.x1 + 0.001
  //           });

  //         }
  //         else if (data.type === 'label') {
  //           data.element.attr({
  //             y: 270
  //           })
  //         }
  //       }
  //     },
  //   };
  //   // Stacked Bar chart configuration Ends

  //   // Line area chart 2 configuration Starts
  //   lineArea2: Chart = {
  //     type: 'Line',
  //     data: data['lineArea2'],
  //     options: {
  //       showArea: true,
  //       fullWidth: true,
  //       lineSmooth: Chartist.Interpolation.none(),
  //       axisX: {
  //         showGrid: false,
  //       },
  //       axisY: {
  //         low: 0,
  //         scaleMinSpace: 50
  //       },
  //       plugins: [
  //         ChartistTooltip({
  //           appendToBody: true,
  //           pointClass: 'ct-point-circle'
  //         })
  //       ],
  //     },
  //     responsiveOptions: [
  //       ['screen and (max-width: 640px) and (min-width: 381px)', {
  //         axisX: {
  //           labelInterpolationFnc: function (value, index) {
  //             return index % 2 === 0 ? value : null;
  //           }
  //         }
  //       }],
  //       ['screen and (max-width: 380px)', {
  //         axisX: {
  //           labelInterpolationFnc: function (value, index) {
  //             return index % 3 === 0 ? value : null;
  //           }
  //         }
  //       }]
  //     ],
  //     events: {
  //       created(data: any): void {
  //         var defs = data.svg.elem('defs');
  //         defs.elem('linearGradient', {
  //           id: 'gradient2',
  //           x1: 0,
  //           y1: 1,
  //           x2: 0,
  //           y2: 0
  //         }).elem('stop', {
  //           offset: 0,
  //           'stop-opacity': '0.2',
  //           'stop-color': 'transparent'
  //         }).parent().elem('stop', {
  //           offset: 1,
  //           'stop-opacity': '0.2',
  //           'stop-color': '#60AFF0'
  //         });

  //         defs.elem('linearGradient', {
  //           id: 'gradient3',
  //           x1: 0,
  //           y1: 1,
  //           x2: 0,
  //           y2: 0
  //         }).elem('stop', {
  //           offset: 0.3,
  //           'stop-opacity': '0.2',
  //           'stop-color': 'transparent'
  //         }).parent().elem('stop', {
  //           offset: 1,
  //           'stop-opacity': '0.2',
  //           'stop-color': '#6CD975'
  //         });
  //       },
  //       draw(data: any): void {
  //         var circleRadius = 4;
  //         if (data.type === 'point') {

  //           var circle = new Chartist.Svg('circle', {
  //             cx: data.x,
  //             cy: data.y,
  //             r: circleRadius,
  //             'ct:value': data.value.y,
  //             'ct:meta': data.meta,
  //             style: 'pointer-events: all !important',
  //             class: 'ct-point-circle'
  //           });
  //           data.element.replace(circle);
  //         }
  //         else if (data.type === 'label') {
  //           // adjust label position for rotation
  //           const dX = data.width / 2 + (30 - data.width)
  //           data.element.attr({ x: data.element.attr('x') - dX })
  //         }
  //       }
  //     },
  //   };
  //   // Line area chart 2 configuration Ends

  //   // Line chart configuration Starts
  // lineChart: Chart = {
  //   type: 'Line',
  //   data: {
  //     labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug'],
  //     series: [
  //       [5000, 6000, 1500, 500, 4000, 2000, 3000, 4000]
  //     ]
  //   },
  //   options: {
  //     fullWidth: true,
  //     low: 0,
  //     showArea: true,                                    // ← important
  //     lineSmooth: Chartist.Interpolation.cardinal({ tension: 0.3 }),
  //     axisX: { showGrid: false },
  //     axisY: {
  //       offset: 40,
  //       labelInterpolationFnc: (v: number) => v >= 1000 ? `${Math.round(v/1000)}k` : v
  //     },
  //     plugins: [
  //       ChartistTooltip({
  //         appendToBody: true,
  //         pointClass: 'ct-point-circle',
  //         transformTooltipTextFnc: (val: string) =>
  //           new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
  //             .format(Number(val))
  //       })
  //     ]
  //   },
  //   events: {
  //     created(ctx: any): void {
  //       const defs = ctx.svg.elem('defs');

  //       // line color (solid blue)
  //       defs.elem('linearGradient', {
  //         id: 'sbLine',
  //         x1: 0, y1: 1, x2: 1, y2: 0
  //       }).elem('stop', { offset: 0, 'stop-color': '#116aef' })
  //         .parent().elem('stop', { offset: 1, 'stop-color': '#116aef' });

  //       // area gradient (blue → transparent)
  //       defs.elem('linearGradient', {
  //         id: 'sbArea',
  //         x1: 0, y1: 0, x2: 0, y2: 1
  //       }).elem('stop', { offset: 0, 'stop-color': '#116aef', 'stop-opacity': 0.35 })
  //         .parent().elem('stop', { offset: 1, 'stop-color': '#116aef', 'stop-opacity': 0.02 });
  //     },

  //     draw(data: any): void {
  //       if (data.type === 'line') {
  //         data.element.attr({ style: 'stroke: url(#sbLine); stroke-width: 3px; fill: none;' });
  //       }
  //       if (data.type === 'area') {
  //         // ensure the area is visible and uses our gradient
  //         data.element.attr({ style: 'fill: url(#sbArea); opacity: 1;' });
  //       }
  //       if (data.type === 'point') {
  //         // styled dot so tooltip has a target
  //         const circle = new Chartist.Svg('circle', {
  //           cx: data.x, cy: data.y, r: 5,
  //           class: 'ct-point-circle',
  //           'ct:value': data.value.y, 'ct:meta': data.meta,
  //           style: 'pointer-events: all; fill:#116aef; stroke:#fff; stroke-width:2px;'
  //         });
  //         data.element.replace(circle);
  //       }
  //     }
  //   }
  // };
  //   // Line chart configuration Ends

  //   // Donut chart configuration Starts
  //   DonutChart: Chart = {
  //     type: 'Pie',
  //     data: data['donutDashboard'],
  //     options: {
  //       donut: true,
  //       startAngle: 0,
  //       labelInterpolationFnc: function (value) {
  //         var total = data['donutDashboard'].series.reduce(function (prev, series) {
  //           return prev + series.value;
  //         }, 0);
  //         return total + '%';
  //       }
  //     },
  //     events: {
  //       draw(data: any): void {
  //         if (data.type === 'label') {
  //           if (data.index === 0) {
  //             data.element.attr({
  //               dx: data.element.root().width() / 2,
  //               dy: data.element.root().height() / 2
  //             });
  //           } else {
  //             data.element.remove();
  //           }
  //         }

  //       }
  //     }
  //   };
  //   // Donut chart configuration Ends

  //   //  Bar chart configuration Starts
  //   BarChart: Chart = {
  //     type: 'Bar', data: data['DashboardBar'], options: {
  //       axisX: {
  //         showGrid: false,
  //       },
  //       axisY: {
  //         showGrid: false,
  //         showLabel: false,
  //         offset: 0
  //       },
  //       low: 0,
  //       high: 60, // creative tim: we recommend you to set the high sa the biggest value + something for a better look
  //     },
  //     responsiveOptions: [
  //       ['screen and (max-width: 640px)', {
  //         seriesBarDistance: 5,
  //         axisX: {
  //           labelInterpolationFnc: function (value) {
  //             return value[0];
  //           }
  //         }
  //       }]
  //     ],
  //     events: {
  //       created(data: any): void {
  //         var defs = data.svg.elem('defs');
  //         defs.elem('linearGradient', {
  //           id: 'gradient4',
  //           x1: 0,
  //           y1: 1,
  //           x2: 0,
  //           y2: 0
  //         }).elem('stop', {
  //           offset: 0,
  //           'stop-color': '#8E1A38'
  //         }).parent().elem('stop', {
  //           offset: 1,
  //           'stop-color': '#FAA750'
  //         });
  //         defs.elem('linearGradient', {
  //           id: 'gradient5',
  //           x1: 0,
  //           y1: 1,
  //           x2: 0,
  //           y2: 0
  //         }).elem('stop', {
  //           offset: 0,
  //           'stop-color': '#1750A5'
  //         }).parent().elem('stop', {
  //           offset: 1,
  //           'stop-color': '#40C057'
  //         });

  //         defs.elem('linearGradient', {
  //           id: 'gradient6',
  //           x1: 0,
  //           y1: 1,
  //           x2: 0,
  //           y2: 0
  //         }).elem('stop', {
  //           offset: 0,
  //           'stop-color': '#3B1C93'
  //         }).parent().elem('stop', {
  //           offset: 1,
  //           'stop-color': '#60AFF0'
  //         });
  //         defs.elem('linearGradient', {
  //           id: 'gradient7',
  //           x1: 0,
  //           y1: 1,
  //           x2: 0,
  //           y2: 0
  //         }).elem('stop', {
  //           offset: 0,
  //           'stop-color': '#562DB7'
  //         }).parent().elem('stop', {
  //           offset: 1,
  //           'stop-color': '#F55252'
  //         });

  //       },
  //       draw(data: any): void {
  //         var barHorizontalCenter, barVerticalCenter, label, value;
  //         if (data.type === 'bar') {

  //           data.element.attr({
  //             y1: 195,
  //             x1: data.x1 + 0.001
  //           });

  //         }
  //       }
  //     },

  //   };
  //   // Bar chart configuration Ends

  //   // line chart configuration Starts
  //   WidgetlineChart: Chart = {
  //     type: 'Line', data: data['Dashboard1_WidgetlineChart'],
  //     options: {
  //       axisX: {
  //         showGrid: false,
  //         showLabel: false,
  //         offset: 0
  //       },
  //       axisY: {
  //         showGrid: false,
  //         low: 40,
  //         showLabel: false,
  //         offset: 0
  //       },
  //       plugins: [
  //         ChartistTooltip({
  //           appendToBody: true,
  //           currency: '$',
  //           pointClass: 'ct-point-regular'
  //         })
  //       ],
  //       lineSmooth: Chartist.Interpolation.cardinal({
  //         tension: 0
  //       }),
  //       fullWidth: true
  //     },
  //     events: {
  //       draw(data: any): void {
  //         if (data.type === 'point') {
  //           var circle = new Chartist.Svg('circle', {
  //             cx: data.x,
  //             cy: data.y,
  //             r: 4,
  //             'ct:value': data.value.y,
  //             'ct:meta': data.meta,
  //             style: 'pointer-events: all !important',
  //             class: 'ct-point-regular'
  //           });
  //           data.element.replace(circle);
  //         }
  //       }
  //     }
  //   };
  //   // Line chart configuration Ends

  //     // line chart configuration Starts
  //     WidgetlineChart1: Chart = {
  //       type: 'Line', data: data['Dashboard1_WidgetlineChart1'],
  //       options: {
  //         axisX: {
  //           showGrid: false,
  //           showLabel: false,
  //           offset: 0
  //         },
  //         axisY: {
  //           showGrid: false,
  //           low: 40,
  //           showLabel: false,
  //           offset: 0
  //         },
  //         plugins: [
  //           ChartistTooltip({
  //             appendToBody: true,
  //             currency: '$',
  //             pointClass: 'ct-point-regular'
  //           })
  //         ],
  //         lineSmooth: Chartist.Interpolation.cardinal({
  //           tension: 0
  //         }),
  //         fullWidth: true
  //       },
  //       events: {
  //         draw(data: any): void {
  //           if (data.type === 'point') {
  //             var circle = new Chartist.Svg('circle', {
  //               cx: data.x,
  //               cy: data.y,
  //               r: 4,
  //               'ct:value': data.value.y,
  //               'ct:meta': data.meta,
  //               style: 'pointer-events: all !important',
  //               class: 'ct-point-regular'
  //             });
  //             data.element.replace(circle);
  //           }
  //         }
  //       }
  //     };
  //     // Line chart configuration Ends

  //       // line chart configuration Starts
  //   WidgetlineChart2: Chart = {
  //     type: 'Line', data: data['Dashboard1_WidgetlineChart2'],
  //     options: {
  //       axisX: {
  //         showGrid: false,
  //         showLabel: false,
  //         offset: 0
  //       },
  //       axisY: {
  //         showGrid: false,
  //         low: 40,
  //         showLabel: false,
  //         offset: 0
  //       },
  //       plugins: [
  //         ChartistTooltip({
  //           appendToBody: true,
  //           currency: '$',
  //           pointClass: 'ct-point-regular'
  //         })
  //       ],
  //       lineSmooth: Chartist.Interpolation.cardinal({
  //         tension: 0
  //       }),
  //       fullWidth: true
  //     },
  //     events: {
  //       draw(data: any): void {
  //         if (data.type === 'point') {
  //           var circle = new Chartist.Svg('circle', {
  //             cx: data.x,
  //             cy: data.y,
  //             r: 4,
  //             'ct:value': data.value.y,
  //             'ct:meta': data.meta,
  //             style: 'pointer-events: all !important',
  //             class: 'ct-point-regular'
  //           });
  //           data.element.replace(circle);
  //         }
  //       }
  //     }
  //   };
  //   // Line chart configuration Ends

  //     // line chart configuration Starts
  //     WidgetlineChart3: Chart = {
  //       type: 'Line', data: data['Dashboard1_WidgetlineChart3'],
  //       options: {
  //         axisX: {
  //           showGrid: false,
  //           showLabel: false,
  //           offset: 0
  //         },
  //         axisY: {
  //           showGrid: false,
  //           low: 40,
  //           showLabel: false,
  //           offset: 0
  //         },
  //         plugins: [
  //           ChartistTooltip({
  //             appendToBody: true,
  //             currency: '$',
  //             pointClass: 'ct-point-regular'
  //           })
  //         ],
  //         lineSmooth: Chartist.Interpolation.cardinal({
  //           tension: 0
  //         }),
  //         fullWidth: true
  //       },
  //       events: {
  //         draw(data: any): void {
  //           if (data.type === 'point') {
  //             var circle = new Chartist.Svg('circle', {
  //               cx: data.x,
  //               cy: data.y,
  //               r: 4,
  //               'ct:value': data.value.y,
  //               'ct:meta': data.meta,
  //               style: 'pointer-events: all !important',
  //               class: 'ct-point-regular'
  //             });
  //             data.element.replace(circle);
  //           }
  //         }
  //       }
  //     };
  //     // Line chart configuration Ends

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
