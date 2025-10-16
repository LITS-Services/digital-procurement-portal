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

  getAllQuotations(currentPage: number, pageSize: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/get-all-quotations?currentPage=${currentPage}&pageSize=${pageSize}`
    );
  }

  getQuotationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/get-quotation-by-id`, {
      params: { id: id.toString() }
    });
  }

  createQuotation(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/create-Quotation`, data);
  }

  updateQuotation(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/update-quotation/${id}`, data);
  }

  deleteQuotatioRequests(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/delete-quotation`, { ids });
  }

  getBidSubmissionDetailsByQuotation(quotationRequestId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/bid-details?quotationRequestId=${quotationRequestId}`);
  }

  getVendorComparison(quotationRequestId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/vendor-comparison?quotationRequestId=${quotationRequestId}`);
  }

  addVendorsToQuotation(payload: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/submit-vendors`, {
      quotationRequestVendors: payload
    });
  }

  getVendorsByQuotationRequestId(quotationRequestId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/vendors`, {
      params: { quotationRequestId: quotationRequestId.toString() }
    });
  }

  removeVendorsFromQuotation(payload: any) {
    return this.http.post((`${this.baseUrl}/remove-vendors`), payload);
  }

  addRemarksWithActionTaken(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/addRemarksWithActionTaken`, data);
  }

  getVendorsAndCompaniesForRfq(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get-all-vendors-companies-for-rfq`);
  }

  getAllQuotationsByStatus(status: string, currentPage: number, pageSize: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/get-all-quotations-by-status?status=${encodeURIComponent(status)}&currentPage=${currentPage}&pageSize=${pageSize}`
    );
  }

  getApprovalHistoryByRfqNo(rfqNo: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get-quotation-approval-history?rfqNo=${rfqNo}`);
  }

  submitForApproval(quotationRequestId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/submit-for-approval/${quotationRequestId}`, {});
  }

}
