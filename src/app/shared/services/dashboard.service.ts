import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PurchaseRequestsCountVM, QuotationRequestsCountVM } from 'app/dashboard/dashboard1/dashboard1.component';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private baseUrl = `${environment.apiUrl}/ProcurementDashboard`;
  constructor(private http: HttpClient) { }

   getPurchaseRequestsCount(): Observable<PurchaseRequestsCountVM> {
    return this.http.get<PurchaseRequestsCountVM>(`${this.baseUrl}/purchase-requests-count`);
  }

     getQuotationRequestsCount(): Observable<QuotationRequestsCountVM> {
    return this.http.get<QuotationRequestsCountVM>(`${this.baseUrl}/quotation-requests-count`);
  }
}
