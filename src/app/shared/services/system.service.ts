import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SystemService {

  private baseUrl = `${environment.apiUrl}/System`;
  constructor(private http: HttpClient) { }

  createGlobalConfig(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/create-global-config`, data);
  }

  updateGlobalConfig(data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/update-global-config`, data);
  }

  getGlobalConfigById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/get-global-config-by-id`, {
      params: { id: id.toString() }
    });
  }

  getAllExceptionLogs(currentPage: number, pageSize: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/get-all-exception-logs?currentPage=${currentPage}&pageSize=${pageSize}`
    );
  }

  getAllHttpLogs(currentPage: number, pageSize: number, filters?: any): Observable<any> {
    let url = `${this.baseUrl}/get-all-http-logs?currentPage=${currentPage}&pageSize=${pageSize}`;
    
    // Add filter parameters if provided
    if (filters) {
      if (filters.search) {
        url += `&search=${encodeURIComponent(filters.search)}`;
      }
      if (filters.httpMethod) {
        url += `&httpMethod=${encodeURIComponent(filters.httpMethod)}`;
      }
    }
    
    return this.http.get<any>(url);
  }

  getAllAuditTrails(currentPage: number, pageSize: number, filters?: any): Observable<any> {
    let url = `${this.baseUrl}/get-all-audit-trails?currentPage=${currentPage}&pageSize=${pageSize}`;
    
    // Add filter parameters if provided
    if (filters) {
      if (filters.search) {
        url += `&search=${encodeURIComponent(filters.search)}`;
      }
      if (filters.actionType) {
        url += `&actionType=${encodeURIComponent(filters.actionType)}`;
      }
    }
    
    return this.http.get<any>(url);
  }
  getAllGlobalConfigs(currentPage: number, pageSize: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/get-all-global-configs?currentPage=${currentPage}&pageSize=${pageSize}`
    );
  }
}
