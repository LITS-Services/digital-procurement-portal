import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShipmentService {
  private baseUrl = `${environment.apiUrl}/Shipment`;

  constructor(private http: HttpClient) { }
  
  getShipmentLinesByPoLineId(purchaseOrderLineId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/shipment-lines-by-po-line-id?purchaseOrderLineId=${purchaseOrderLineId}`);
  }

  getAllShipmentDetailByPurchaseOrder(purchaseOrderId: number, currentPage = 1, pageSize = 100): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/shipment-detail-all-by-purchase-order?purchaseOrderId=${purchaseOrderId}&currentPage=${currentPage}&pageSize=${pageSize}`
    );
  }

  getShipmentDetailById(id: number, purchaseOrderId?: number): Observable<any> {
    const poId = purchaseOrderId ?? id;
    return this.http.get<any>(`${this.baseUrl}/shipment-detail-by-id?id=${id}&purchaseOrderId=${poId}`);
  }
}
