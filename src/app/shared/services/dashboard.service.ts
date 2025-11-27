import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PurchaseRequestsCountVM, QuotationRequestsCountVM } from 'app/dashboard/dashboard1/dashboard1.component';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

export interface RfqPipelineGraphPoint {
  totalRfq: number;
  rfqQuotation: number;
  quotesSelected: number;
  groupData: string;
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
}
