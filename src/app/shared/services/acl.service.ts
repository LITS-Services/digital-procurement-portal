import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AclService {

  constructor(private _httpClient: HttpClient) { }

  submitPermissions(payload: any): Observable<any> {
    return this._httpClient.post(`${environment.apiUrl}/Acl/create-permission`, payload);
  }
  
  getAllForms(currentPage: number, pageSize: number) {
    return this._httpClient.get<any>(`${environment.apiUrl}/Acl/get-all-forms?currentPage=${currentPage}&pageSize=${pageSize}`);
  }

  getAllPermissions(currentPage: number, pageSize: number) {
    return this._httpClient.get<any>(`${environment.apiUrl}/Acl/get-all-permissions?currentPage=${currentPage}&pageSize=${pageSize}`);
  }
}
