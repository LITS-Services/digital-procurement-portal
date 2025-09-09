import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = `${environment.apiUrl}/Company`;

  constructor(private http: HttpClient) {}

  getVendorCompanies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get-all-vendor-companies`);
  }

//   // Get company by ID
//   getCompanyById(id: number): Observable<any> {
//     return this.http.get<any>(`${this.apiUrl}/${id}`);
//   }

//   // Create company
//   createCompany(data: any): Observable<any> {
//     return this.http.post<any>(this.apiUrl, data);
//   }

//   // Update company
//   updateCompany(id: number, data: any): Observable<any> {
//     return this.http.put<any>(`${this.apiUrl}/${id}`, data);
//   }

//   // Delete company
//   deleteCompany(id: number): Observable<any> {
//     return this.http.delete<any>(`${this.apiUrl}/${id}`);
//   }
}
