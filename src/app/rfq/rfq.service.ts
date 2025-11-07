import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

export interface RFQQuery {
  currentPage: number,
  pageSize: number,
  userId: string | null,
  status: string | null,
  rfqNo: string | null
}

@Injectable({
  providedIn: 'root'
})


export class RfqService {
  private baseUrl = `${environment.apiUrl}/Quotation`;
  constructor(private http: HttpClient) { }

  getAllQuotations(q: {
    currentPage: number,
    pageSize: number,
    userId?: string | null,
    status?: string | null,
    rfqNo?: string | null
  }

  ): Observable<any> {

    let params = new HttpParams()
      .set('currentPage', q.currentPage)
      .set('pageSize', q.pageSize);

    if (q.status) params = params.set('status', q.status);
    if (q.rfqNo) params = params.set('rfqNo', q.rfqNo);
    if (q.userId) params = params.set('userId', q.userId);


    return this.http.get<any>(
      `${this.baseUrl}/get-all-quotations`, { params }
    );
  }

  // getQuotationById(id: number): Observable<any> {
  //   return this.http.get<any>(`${this.baseUrl}/get-quotation-by-id`, {
  //     params: { id: id.toString() }
  //   });
  // }
  getQuotationById(id: number): Observable<any> {
  const params = new HttpParams()
    .set('id', id)
    .set('isVendor', false); // procurement always false

  return this.http.get<any>(
    `${this.baseUrl}/get-quotation-by-id`,
    { params }
  );
}

  getItemsQuotationById(id: number): Observable<any> {
  const params = new HttpParams()
    .set('quotationRequestId', id)

  return this.http.get<any>(
    `${this.baseUrl}/get-items-by-quotation-id`,
    { params }
  );
}

  postFinalVendors(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/select-final-vendor`, data);
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
  getRFQComments(vendorId: string, quotationId: number, vendorComapnyId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/quotation-request-comment`, {
      params: { vendorId: vendorId, quotationId: quotationId, vendorComapnyId: vendorComapnyId }
    });
  }

  addRfqComment(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/quotation-request-comment`, data);
  }

  removeVendorsFromQuotation(payload: any) {
    return this.http.post((`${this.baseUrl}/remove-vendors`), payload);
  }

  addRemarksWithActionTaken(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/addRemarksWithActionTaken`, data);
  }

  // getVendorsAndCompaniesForRfq(): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.baseUrl}/get-all-vendors-companies-for-rfq`);
  // }
  getVendorsAndCompaniesForRfq(procurementUserId: string): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/get-all-vendors-companies-for-rfq`,
      { params: { procurementUserId } });
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

  rejectOrReviseBid(payload: any) {
    return this.http.post(`${this.baseUrl}/reject-or-revise-bid`, payload);
  }

}
