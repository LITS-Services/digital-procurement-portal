import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class RfqService {
  private baseUrl = `${environment.apiUrl}/Quotation`;
  constructor(private http: HttpClient) { }

  getAllQuotations(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetAllQuotations/`, {
      params: new HttpParams().set('userId', userId)
    });
  }

  getQuotationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetQuotationById/${id}`);
  }

  createQuotation(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/CreateQuotation`, data);
  }

  updateQuotation(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/UpdateQuotation/${id}`, data);
  }

  deleteQuotation(ids: number[]) {
    return this.http.delete(`${this.baseUrl}/DeleteQuotation/${ids}`);
  }

  getBidSubmissionDetailsByQuotation(quotationRequestId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/${quotationRequestId}/bid-details`);
  }

  getVendorComparison(quotationRequestId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/vendor-comparison/${quotationRequestId}`);
  }

  addVendorsToQuotation(payload: any[]): Observable<any[]> {
    return this.http.post<any[]>(`${this.baseUrl}/submit-vendors`, payload);
  }

  getVendorsByQuotationRequestId(quotationRequestId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/vendors/${quotationRequestId}`);
  }

  removeVendorsFromQuotation(payload: any) {
    return this.http.post((`${this.baseUrl}/remove-vendors`), payload);
  }

  addRemarksWithActionTaken(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/addRemarksWithActionTaken`, data);
  }

  getAllQuotationsByStatus(userId: string, status: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get-quotations-by-status?userId=${userId}&status=${status}`);
  }

  getApprovalHistoryByRfqNo(rfqNo: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseUrl}/get-quotation-approval-history?rfqNo=${rfqNo}`);
}

  submitForApproval(quotationRequestId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/SubmitForApproval/${quotationRequestId}`, {});
  }

}
