import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface VendorUserDropdown {
  $id: string,
  $values: [];
}

export interface EmailTemplateQuery {
  currentPage: number,
  pageSize: number
}

@Injectable({
  providedIn: 'root'
})

export class EmailTemplateService {
  private baseUrlForEmailTemplate = `${environment.apiUrl}/EmailTemplate`;
  private baseUrlForEmailLogs = `${environment.apiUrl}/EmailLogs`;

  constructor(private http: HttpClient) { }

  creatEmailTemplate(payload: any) {
    return this.http.post(`${this.baseUrlForEmailTemplate}/create`, payload);
  }
  
  // getAllEmailTemplates(): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.baseUrlForEmailTemplate}/get-all-templates`);
  // }

  getAllEmailTemplates(q: {
    currentPage: number,
    pageSize: number
  }): Observable<any> {


    let params = new HttpParams()
      .set("currentPage", q.currentPage)
      .set("pageSize", q.pageSize);
    return this.http.get<any>(
      `${this.baseUrlForEmailTemplate}/get-all-templates`, { params }
    );
  }

  getEmailTemplateById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrlForEmailTemplate}/get-template-by-id`, {
      params: { id: id.toString() }
    });
  }

  updateEmailTemplate(payload: any): Observable<any> {
    return this.http.put<any>(
      `${this.baseUrlForEmailTemplate}/update`,
      payload
    );
  }

  deleteEmailTemplate(payload: { id: number }): Observable<any> {
    return this.http.post<any>(`${this.baseUrlForEmailTemplate}/delete`, payload);
  }

  createEmailInvitation(userData: any): Observable<string> {
    return this.http.post(`${this.baseUrlForEmailLogs}/create-email-invitation`, userData, { responseType: 'text' });
  }

  getUserInvitation(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrlForEmailLogs}/get-email-logs`);
  }

  updateEmailInvitation(id: number, template: Partial<any>): Observable<any> {
    return this.http.put<any>(`${this.baseUrlForEmailLogs}/UpdateEmailinvitation${id}`, template);
  }
  getEmailInvitationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrlForEmailLogs}/GetEmailinvitation${id}`);
  }
}