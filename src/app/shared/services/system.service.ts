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

  // getAllExceptionLogs(currentPage: number, pageSize: number): Observable<any> {
  //   return this.http.get<any>(
  //     `${this.baseUrl}/get-all-exception-logs?currentPage=${currentPage}&pageSize=${pageSize}`
  //   );
  // }

  getAllExceptionLogs(currentPage: number, pageSize: number, filters?: any): Observable<any> {
    let url = `${this.baseUrl}/get-all-exception-logs?currentPage=${currentPage}&pageSize=${pageSize}`;
    
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

  getAllSecurityAuditLogs(currentPage: number, pageSize: number, filters?: any): Observable<any> {
    let url = `${this.baseUrl}/get-all-security-audit-logs?currentPage=${currentPage}&pageSize=${pageSize}`;

    if (filters) {
      if (filters.search) {
        url += `&search=${encodeURIComponent(filters.search)}`;
      }
      if (filters.eventType) {
        url += `&EventType=${encodeURIComponent(filters.eventType)}`;
      }
    }

    return this.http.get<any>(url);
  }
  getAllGlobalConfigs(currentPage: number, pageSize: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/get-all-global-configs?currentPage=${currentPage}&pageSize=${pageSize}`
    );
  }

  createIntegrationManager(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/integration-manager`, data);
  }

  updateIntegrationManager(data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/integration-manager`, data);
  }

  deleteIntegrationManager(id: number, modifiedBy: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/integration-manager`, {
      params: {
        id: id.toString(),
        modifiedBy
      }
    });
  }

  getAllIntegrationManagers(currentPage: number, pageSize: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/integration-manager?currentPage=${currentPage}&pageSize=${pageSize}`
    );
  }

  getIntegrationManagerById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/integration-manager/${id}`);
  }

  // for downloading attachment from any source
  downloadAttachment(source: string, id: number): Observable<Blob> {
    return this.http.get(
      `${this.baseUrl}/download-attachment`,
      {
        params: {
          source: source,
          id: id.toString()
        },
        responseType: 'blob'
      }
    );
  }

}
