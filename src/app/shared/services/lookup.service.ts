import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LookupService {

  private baseUrl = `${environment.apiUrl}/System`;
  constructor(private http: HttpClient) { }
  getAllItems() {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns?name=item`);
  }

  getAllUnitsOfMeasurement() {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns?name=uom`);
  }

  getAllAccounts() {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns?name=account`);
  }

  getAllGlobalConfigTypes() {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns?name=global-config-type`);
  }
}