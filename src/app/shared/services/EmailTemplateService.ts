import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';



export interface VendorUserDropdown {
  $id: string,
  $values: [];
}

@Injectable({
  providedIn: 'root'
})
export class EmailTemplateService {
  private apiUrl = `${environment.apiUrl}/Company`;

  constructor(private http: HttpClient) { }

 getEmailTemplate(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/EmailTemplate/GetAllEmailTemplates`);
  }

getEmailTemplateById(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/EmailTemplate/${id}`);
  }



  updateEmailTemplate(id: number, template: Partial<any>): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/EmailTemplate/Update/${id}`, template);
  }

//   // Soft delete template
//   deleteEmailTemplate(id: number, modifiedBy: string): Observable<any> {
//     let params = new HttpParams().set('modifiedBy', modifiedBy);
//     return this.http.delete<any>(`${this.apiUrl}/Delete/${id}`, { params });
//   }

 deleteEmailTemplate(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/EmailTemplate/Delete/${id}`);
  }




}