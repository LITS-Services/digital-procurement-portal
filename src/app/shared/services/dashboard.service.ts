import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EntitiesCountVM, PurchaseOrdersCountVM, PurchaseRequestsCountVM, QuotationRequestsCountVM, VendorCompaniesCountVM } from 'app/dashboard/dashboard1/dashboard1.component';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

export interface RfqPipelineGraphPoint {
  totalRfq: number;
  rfqQuotation: number;
  quotesSelected: number;
  groupData: string;
}

export interface MonthlySpendingResponse {
  inventory: number;
  nonInventory: number;
  totalThisMonth: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private baseUrl = `${environment.apiUrl}/ProcurementDashboard`;
  constructor(private http: HttpClient) { }

  getPurchaseRequestsCount(userId: string, entityId: number): Observable<PurchaseRequestsCountVM> {
    let params = new HttpParams()
    if (userId) params = params.set("userId", userId);
    if (entityId) params = params.set("entityId", entityId);
    return this.http.get<PurchaseRequestsCountVM>(
      `${this.baseUrl}/purchase-requests-count`, { params }
    );
  }

  getQuotationRequestsCount(userId: string, entityId: number): Observable<QuotationRequestsCountVM> {
    let params = new HttpParams()
    if (userId) params = params.set("userId", userId);
    if (entityId) params = params.set("entityId", entityId);
    return this.http.get<QuotationRequestsCountVM>(
      `${this.baseUrl}/quotation-requests-count`, { params }
    );
  }

  getRfqPipelineGraph(
    userId?: string,
    entityId?: number,
    filterType?: number
  ) {
    let params = new HttpParams();

    if (userId) params = params.set("userId", userId);
    if (entityId) params = params.set("entityId", entityId.toString());
    if (filterType !== undefined && filterType !== null)
      params = params.set("filterType", filterType.toString());

    return this.http.get<any[]>(
      `${this.baseUrl}/dashboard-getgraphdata`,
      { params }
    );
  }

  getPurchaseOrdersCount(entityId: number): Observable<PurchaseOrdersCountVM> {
    let params = new HttpParams()
    if (entityId) params = params.set("entityId", entityId);
    return this.http.get<PurchaseOrdersCountVM>(
      `${this.baseUrl}/purchase-orders-count`, { params }
    );
  }

  getMonthlySpendingData(filterType?: number): Observable<any[]> {
    let params = new HttpParams()
    if (filterType) params = params.set("filterType", filterType);
    return this.http.get<any[]>(
      `${this.baseUrl}/monthly-spending-graph`, { params }
    );
  }

  getVendorCompaniesCount(entityId: number): Observable<VendorCompaniesCountVM> {
    let params = new HttpParams()
    if (entityId) params = params.set("entityId", entityId);
    return this.http.get<VendorCompaniesCountVM>(
      `${this.baseUrl}/vendor-companies-count`, { params }
    );
  }

  getEntitiesCount(entityId: number): Observable<EntitiesCountVM> {
    let params = new HttpParams()
    if (entityId) params = params.set("entityId", entityId);
    return this.http.get<EntitiesCountVM>(
      `${this.baseUrl}/entities-count`, { params }
    );
  }
}