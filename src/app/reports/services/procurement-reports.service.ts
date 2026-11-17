import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface ProcurementReportFilter {
  preset?: string;
  fromDate?: string;
  toDate?: string;
  entityId?: number | null;
  vendorUserId?: string;
  poStatus?: string;
  deliveryStatus?: string;
  deliveryTimeliness?: string;
  currency?: string;
  category?: string;
  showAllVendors?: boolean;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface FilterOptionItem {
  value: string;
  label: string;
}

export interface EntityFilterOption {
  id: number;
  name: string;
}

export interface ProcurementReportsMetadata {
  entities: EntityFilterOption[];
  vendors: FilterOptionItem[];
  poStatuses: FilterOptionItem[];
  deliveryStatuses: FilterOptionItem[];
  currencies: FilterOptionItem[];
  categories: FilterOptionItem[];
  dataLimitations: string[];
}

export interface PaginatedReportResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface StatusDistributionItem {
  status: string;
  count: number;
  amount: number;
  percentage: number;
  color: string;
}

// ==================== Report 1: Spend Analysis ====================

export interface SpendAnalysisSummary {
  totalProcurementSpend: number;
  totalProcurementSpendPrevious: number;
  spendGrowthPercentage: number | null;
  totalVendors: number;
  totalVendorsPrevious: number;
  vendorsGrowthPercentage: number | null;
  totalPurchaseOrders: number;
  totalPurchaseOrdersPrevious: number;
  poGrowthPercentage: number | null;
  averagePoValue: number;
  averagePoValuePrevious: number;
  avgPoGrowthPercentage: number | null;
  highestSpendingVendorName: string;
  highestSpendingVendorAmount: number;
  highestSpendingVendorShare: number;
  highestSpendingEntityName: string;
  highestSpendingEntityAmount: number;
  highestSpendingEntityShare: number;
  totalInvoicedAmount: number;
  totalInvoicedPrevious: number;
  invoicedGrowthPercentage: number | null;
  totalPaidAmount: number;
  totalPaidPrevious: number;
  paidGrowthPercentage: number | null;
  outstandingAmount: number;
  outstandingPrevious: number;
  outstandingGrowthPercentage: number | null;
  currency: string;
  hasMultipleCurrencies: boolean;
  currenciesPresent: string[];
  periodLabel: string;
  previousPeriodLabel: string;
  spendBasisNote: string;
}

export interface VendorSpendItem {
  vendorUserId: string;
  vendorName: string;
  vendorCode: string;
  purchaseOrderCount: number;
  totalSpend: number;
  totalInvoicedAmount: number;
  totalPaidAmount: number;
  outstandingAmount: number;
  percentageContribution: number;
  currency: string;
}

export interface EntitySpendItem {
  entityId: number;
  entityName: string;
  totalVendors: number;
  purchaseOrderCount: number;
  totalSpend: number;
  totalInvoicedAmount: number;
  totalPaidAmount: number;
  outstandingAmount: number;
  percentageContribution: number;
  currency: string;
}

export interface SpendTrendPoint {
  period: string;
  currentSpend: number;
  previousSpend: number;
  currentPoCount: number;
}

export interface SpendComposition {
  poAmount: number;
  invoicedAmount: number;
  paidAmount: number;
  outstandingAmount: number;
}

export interface SpendAnalysisCharts {
  vendorSpendDistribution: VendorSpendItem[];
  totalDistinctVendors: number;
  entitySpendDistribution: EntitySpendItem[];
  spendTrend: SpendTrendPoint[];
  topVendorsComparison: VendorSpendItem[];
  lowestVendorsComparison: VendorSpendItem[];
  entityComparison: EntitySpendItem[];
  poStatusDistribution: StatusDistributionItem[];
  spendComposition: SpendComposition;
}

export interface SpendPurchaseOrderRow {
  id: number;
  purchaseOrderNo: string;
  entityId: number | null;
  entityName: string;
  vendorUserId: string;
  vendorName: string;
  poDate: string;
  poAmount: number;
  currency: string;
  poStatus: string;
  orderedQuantity: number;
  deliveredQuantity: number;
  invoicedAmount: number;
  paymentStatus: string;
}

// ==================== Report 2: PO & Delivery Tracking ====================

export interface PoDeliverySummary {
  totalPurchaseOrders: number;
  totalPurchaseOrdersPrevious: number;
  poCountGrowthPercentage: number | null;
  totalPoValue: number;
  totalPoValuePrevious: number;
  poValueGrowthPercentage: number | null;
  openPurchaseOrders: number;
  deliveredPurchaseOrders: number;
  partiallyDeliveredPurchaseOrders: number;
  pendingDeliveries: number;
  overduePurchaseOrders: number;
  overduePurchaseOrdersPrevious: number;
  overdueGrowthPercentage: number | null;
  onTimeDeliveryRate: number | null;
  eligibleCompletedDeliveriesCount: number;
  onTimeDeliveriesCount: number;
  delayedDeliveriesCount: number;
  deliveryCompletionPercentage: number;
  totalOrderedQuantity: number;
  totalDeliveredQuantity: number;
  pendingDeliveryValue: number;
  currency: string;
  periodLabel: string;
  previousPeriodLabel: string;
}

export interface PoTrendPoint {
  period: string;
  poCount: number;
  poValue: number;
}

export interface DeliveryPerformanceTrendPoint {
  period: string;
  completedDeliveries: number;
  pendingDeliveries: number;
  delayedDeliveries: number;
}

export interface OnTimeVsDelayed {
  onTimeCount: number;
  delayedCount: number;
  missingDateCount: number;
  onTimePercentage: number;
  delayedPercentage: number;
}

export interface VendorDeliveryPerformanceRow {
  vendorUserId: string;
  vendorName: string;
  totalPos: number;
  deliveredPos: number;
  partiallyDeliveredPos: number;
  pendingPos: number;
  delayedPos: number;
  onTimeDeliveries: number;
  onTimeDeliveryRate: number | null;
  pendingDeliveryValue: number;
  pendingQuantity: number;
}

export interface EntityPoSummaryRow {
  entityId: number;
  entityName: string;
  totalPos: number;
  totalPoValue: number;
  deliveredPos: number;
  pendingPos: number;
  overduePos: number;
  deliveryCompletionRate: number;
}

export interface PoDeliveryCharts {
  poStatusDistribution: StatusDistributionItem[];
  deliveryStatusDistribution: StatusDistributionItem[];
  poTrend: PoTrendPoint[];
  deliveryPerformanceTrend: DeliveryPerformanceTrendPoint[];
  onTimeVsDelayed: OnTimeVsDelayed;
  vendorDeliveryPerformance: VendorDeliveryPerformanceRow[];
  entityPoAnalysis: EntityPoSummaryRow[];
  outstandingDeliveryAnalysis: VendorDeliveryPerformanceRow[];
}

export interface PoTrackingRow {
  id: number;
  purchaseOrderNo: string;
  entityId: number | null;
  entityName: string;
  vendorName: string;
  poDate: string;
  expectedDeliveryDate: string | null;
  poAmount: number;
  currency: string;
  poStatus: string;
  deliveryStatus: string;
  deliveryCompletionPercentage: number;
}

export interface DeliveryTrackingRow {
  id: number;
  deliveryReference: string;
  purchaseOrderId: number | null;
  purchaseOrderNo: string;
  entityName: string;
  vendorName: string;
  deliveryDate: string;
  expectedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  deliveredQuantity: number;
  deliveryStatus: string;
  timelinessStatus: string;
}

export interface PendingDeliveryRow {
  purchaseOrderId: number;
  purchaseOrderNo: string;
  entityName: string;
  vendorName: string;
  poDate: string;
  expectedDeliveryDate: string | null;
  poAmount: number;
  pendingValue: number;
  orderedQuantity: number;
  deliveredQuantity: number;
  pendingQuantity: number;
  daysOverdue: number | null;
  deliveryStatus: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProcurementReportsService {
  private readonly baseUrl = `${environment.apiUrl}/procurement-reports`;

  constructor(private http: HttpClient) {}

  private buildParams(filter: ProcurementReportFilter): HttpParams {
    let params = new HttpParams();
    if (filter.preset) params = params.set('preset', filter.preset);
    if (filter.fromDate) params = params.set('fromDate', filter.fromDate);
    if (filter.toDate) params = params.set('toDate', filter.toDate);
    if (filter.entityId !== null && filter.entityId !== undefined) params = params.set('entityId', String(filter.entityId));
    if (filter.vendorUserId) params = params.set('vendorUserId', filter.vendorUserId);
    if (filter.poStatus) params = params.set('poStatus', filter.poStatus);
    if (filter.deliveryStatus) params = params.set('deliveryStatus', filter.deliveryStatus);
    if (filter.deliveryTimeliness) params = params.set('deliveryTimeliness', filter.deliveryTimeliness);
    if (filter.currency) params = params.set('currency', filter.currency);
    if (filter.category) params = params.set('category', filter.category);
    if (filter.showAllVendors) params = params.set('showAllVendors', 'true');
    if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
    if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
    if (filter.sortDirection) params = params.set('sortDirection', filter.sortDirection);
    if (filter.pageNumber) params = params.set('pageNumber', String(filter.pageNumber));
    if (filter.pageSize) params = params.set('pageSize', String(filter.pageSize));
    return params;
  }

  getMetadata(entityId?: number | null): Observable<ProcurementReportsMetadata> {
    let params = new HttpParams();
    if (entityId !== null && entityId !== undefined) {
      params = params.set('entityId', String(entityId));
    }
    return this.http.get<ProcurementReportsMetadata>(`${this.baseUrl}/metadata`, { params });
  }

  // ==================== Report 1: Spend Analysis ====================
  getSpendSummary(filter: ProcurementReportFilter): Observable<SpendAnalysisSummary> {
    return this.http.get<SpendAnalysisSummary>(`${this.baseUrl}/spend-analysis/summary`, { params: this.buildParams(filter) });
  }

  getSpendCharts(filter: ProcurementReportFilter): Observable<SpendAnalysisCharts> {
    return this.http.get<SpendAnalysisCharts>(`${this.baseUrl}/spend-analysis/charts`, { params: this.buildParams(filter) });
  }

  getVendorSpendTable(filter: ProcurementReportFilter): Observable<PaginatedReportResult<VendorSpendItem>> {
    return this.http.get<PaginatedReportResult<VendorSpendItem>>(`${this.baseUrl}/spend-analysis/vendors`, { params: this.buildParams(filter) });
  }

  getEntitySpendTable(filter: ProcurementReportFilter): Observable<PaginatedReportResult<EntitySpendItem>> {
    return this.http.get<PaginatedReportResult<EntitySpendItem>>(`${this.baseUrl}/spend-analysis/entities`, { params: this.buildParams(filter) });
  }

  getSpendPurchaseOrders(filter: ProcurementReportFilter): Observable<PaginatedReportResult<SpendPurchaseOrderRow>> {
    return this.http.get<PaginatedReportResult<SpendPurchaseOrderRow>>(`${this.baseUrl}/spend-analysis/purchase-orders`, { params: this.buildParams(filter) });
  }

  exportSpendPdf(filter: ProcurementReportFilter, reportType: 'summary' | 'detailed' = 'summary'): Observable<Blob> {
    let params = this.buildParams(filter).set('reportType', reportType);
    return this.http.get(`${this.baseUrl}/spend-analysis/export-pdf`, { params, responseType: 'blob' });
  }

  // ==================== Report 2: PO & Delivery Tracking ====================
  getPoDeliverySummary(filter: ProcurementReportFilter): Observable<PoDeliverySummary> {
    return this.http.get<PoDeliverySummary>(`${this.baseUrl}/po-delivery/summary`, { params: this.buildParams(filter) });
  }

  getPoDeliveryCharts(filter: ProcurementReportFilter): Observable<PoDeliveryCharts> {
    return this.http.get<PoDeliveryCharts>(`${this.baseUrl}/po-delivery/charts`, { params: this.buildParams(filter) });
  }

  getPoTrackingTable(filter: ProcurementReportFilter): Observable<PaginatedReportResult<PoTrackingRow>> {
    return this.http.get<PaginatedReportResult<PoTrackingRow>>(`${this.baseUrl}/po-delivery/purchase-orders`, { params: this.buildParams(filter) });
  }

  getDeliveryTrackingTable(filter: ProcurementReportFilter): Observable<PaginatedReportResult<DeliveryTrackingRow>> {
    return this.http.get<PaginatedReportResult<DeliveryTrackingRow>>(`${this.baseUrl}/po-delivery/deliveries`, { params: this.buildParams(filter) });
  }

  getPendingDeliveriesTable(filter: ProcurementReportFilter): Observable<PaginatedReportResult<PendingDeliveryRow>> {
    return this.http.get<PaginatedReportResult<PendingDeliveryRow>>(`${this.baseUrl}/po-delivery/pending-deliveries`, { params: this.buildParams(filter) });
  }

  getVendorDeliveryPerformanceTable(filter: ProcurementReportFilter): Observable<PaginatedReportResult<VendorDeliveryPerformanceRow>> {
    return this.http.get<PaginatedReportResult<VendorDeliveryPerformanceRow>>(`${this.baseUrl}/po-delivery/vendor-performance`, { params: this.buildParams(filter) });
  }

  getEntityPoSummaryTable(filter: ProcurementReportFilter): Observable<PaginatedReportResult<EntityPoSummaryRow>> {
    return this.http.get<PaginatedReportResult<EntityPoSummaryRow>>(`${this.baseUrl}/po-delivery/entity-summary`, { params: this.buildParams(filter) });
  }

  exportPoDeliveryPdf(filter: ProcurementReportFilter, reportType: 'summary' | 'detailed' = 'summary'): Observable<Blob> {
    let params = this.buildParams(filter).set('reportType', reportType);
    return this.http.get(`${this.baseUrl}/po-delivery/export-pdf`, { params, responseType: 'blob' });
  }

  downloadPdfBlob(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
