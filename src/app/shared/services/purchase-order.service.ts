import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AvgVendorRatingVM } from 'app/purchase-order/purchase-order-details/vendor-rating/vendor-rating';
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
  getAllPurchaseOrders(currentPage: number, pageSize: number, entityId: number, userId: string, status?: string): Observable<any> {
    let params = new HttpParams()
        if (currentPage) params = params.set("currentPage", currentPage);
        if (pageSize) params = params.set("pageSize", pageSize);
        if (entityId) params = params.set("entityId", entityId);
        if (userId) params = params.set("userId", userId);
        if (status) params = params.set("status", status);
    return this.http.get<any>(
      `${this.baseUrl}/get-all-purchase-orders`, { params } 
    );
  }

  // createPurchaseOrderFromPR(purchaseRequestId: number) {
  //   return this.http.post(`${this.baseUrl}/create-pr-purchase-order?purchaseRequestId=${purchaseRequestId}`, {});
  // }

  createPurchaseOrderFromPR(purchaseRequestId: number, vendorUpdates: any[] = []) {
    const payload = {
      purchaseRequestId,
      vendorUpdates
    };
    return this.http.post(`${this.baseUrl}/create-pr-purchase-order`, payload);
  }

  createPurchaseOrderFromRFQ(quotationRequestId: number) {
    return this.http.post(`${this.baseUrl}/create-rfq-purchase-order?quotationRequestId=${quotationRequestId}`, {});
  }

  getPurchaseOrderById(id: number) {
    return this.http.get<any>(`${this.baseUrl}/get-purchase-order-by-id?id=${id}`);
  }

  addVendorRating(payload: any) {
    return this.http.post(`${this.baseUrl}/add-vendor-rating`, payload);
  }

  getVendorRatingByPoId(poId: number) {
    return this.http.get<any>(
      `${this.baseUrl}/get-vendor-rating-by-id`,
      { params: { poId } }
    );
  }

  getGoodsReceiptNoteById(purchaseOrderId: number) {
    return this.http.get<any>(`${this.baseUrl}/get-grn?purchaseOrderId=${purchaseOrderId}`);
  }

  getInvoiceByPoId(purchaseOrderId: number) {
    return this.http.get<any>(`${this.baseUrl}/get-invoice-by-id?purchaseOrderId=${purchaseOrderId}`);
  }

  downloadInvoicePdf(invoiceId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download-pdf/${invoiceId}`, { responseType: 'blob' });
  }

  createGoodsReceiptNote(data: any) {
    return this.http.post(`${this.baseUrl}/create-grn`, data);
  }

  avgVendorRating(vendorUserId: string) {
    return this.http.get<AvgVendorRatingVM[]>(
      `${this.baseUrl}/avg-vendor-rating?vendorUserId=${vendorUserId}`
    );
  }
}