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
    return this.http.get<any>(`${environment.apiUrl}/EmailTemplate/get-template-by-id`, {
      params: { id: id.toString() }
    });
  }

  updateEmailTemplate(id: number, template: Partial<any>): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/EmailTemplate/Update/${id}`, template);
  }

  deleteEmailTemplate(payload: { id: number }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/EmailTemplate/delete`, payload);
  }

  createEmailInvitation(userData: any): Observable<string> {
    return this.http.post(`${environment.apiUrl}/EmailLogs/create-email-invitation`, userData, { responseType: 'text' });
  }

  getUserInvitation(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/EmailLogs/get-email-logs`);
  }

  updateEmailInvitation(id: number, template: Partial<any>): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/EmailLogs/UpdateEmailinvitation${id}`, template);
  }
  getEmailInvitationById(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/EmailLogs/GetEmailinvitation${id}`);
  }

}