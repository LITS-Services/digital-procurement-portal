import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PurchaseOrderService {
  private baseUrl = `${environment.apiUrl}/PurchaseOrder`;

  constructor(private http: HttpClient) { }

  // Fetch eligible items for PO creation
  getItemsForPurchaseOrder(purchaseRequestId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-eligible-items`, {
      params: { purchaseRequestId: purchaseRequestId.toString() }
    });
  }

  // Create Purchase Order
  createPurchaseOrder(payload: { purchaseRequestId: number; itemIds: number[] }): Observable<any> {
    return this.http.post(`${this.baseUrl}/create-purchase-order`, payload);
  }

  // Fetch all Purchase Orders
  getAllPurchaseOrders(currentPage: number, pageSize: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/get-all-purchase-orders?currentPage=${currentPage}&pageSize=${pageSize}`
    );
  }

  createPurchaseOrderFromPR(purchaseRequestId: number) {
    return this.http.post(`${this.baseUrl}/create-pr-purchase-order?purchaseRequestId=${purchaseRequestId}`, {});
  }

  createPurchaseOrderFromRFQ(quotationRequestId: number) {
    return this.http.post(`${this.baseUrl}/create-rfq-purchase-order?quotationRequestId=${quotationRequestId}`, {});
  }
}
