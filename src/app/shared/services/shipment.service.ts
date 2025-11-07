import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ShipmentService {
  private baseUrl = `${environment.apiUrl}/Shipment`;

  constructor(private http: HttpClient) { }
  
  getShipmentDetailById(id: number) {
    return this.http.get<any>(`${this.baseUrl}/shipment-detail-by-purchase-order?purchaseOrderId=${id}`);
  }
}
