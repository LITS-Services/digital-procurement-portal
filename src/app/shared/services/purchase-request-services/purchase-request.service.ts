import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'environments/environment';

export interface UploadedFile {
  name: string;
  type: string;
  remarks: string;
  file: File;
  base64Data?: string;
}

export interface PRQuery {
    currentPage: number,
    pageSize: number,
    userId: string | null,
    status: string | null,
    prNo: string | null
  }

export interface Dropdown {
  $id: string,
  $values: [];
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseRequestService {

  private baseUrl = `${environment.apiUrl}/Requests`;

  constructor(private http: HttpClient) { }

  /** ============== Convert File to Base64 ============== **/

  public toBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /** ============== API Calls ============== **/

  getAllPurchaseRequests( q: {
    currentPage: number, 
    pageSize: number,
    userId?: string | null,
    status?: string | null,
    prNo?: string | null
  }): Observable<any> {

    
    let params = new HttpParams()
      .set("currentPage", q.currentPage)
      .set("pageSize", q.pageSize);

    if (q.status) params = params.set("status", q.status);
    if (q.prNo) params = params.set("prNo", q.prNo);
    if (q.userId) params = params.set("userId", q.userId);
      
    return this.http.get<any>(
      `${this.baseUrl}/get-all-purchase-requests`, { params }
    );
  }

  deletePurchaseRequest(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/delete-request`, { ids });
  }

  updatePurchaseRequest(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/update-request/${id}`, data);
  }

  createPurchaseRequest(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/create-request`, data);
  }

  getPurchaseRequestById(id: number, forRfq: boolean = false): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/get-request-by-id`, {
      params: { id: id.toString(), forRfq }
    });
  }

  addRemarksWithActionTaken(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/addRemarksWithActionTaken`, data);
  }

  getAllPurchaseRequestsByStatus(status: string, currentPage: number, pageSize: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/get-all-purchase-requests-by-status?status=${encodeURIComponent(status)}&currentPage=${currentPage}&pageSize=${pageSize}`
    );
  }

  getApprovalHistoryByReqNo(requisitionNo: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get-request-approval-history?requisitionNo=${requisitionNo}`);
  }

  submitForApproval(purchaseRequestId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/submit-for-approval/${purchaseRequestId}`, {});
  }
}