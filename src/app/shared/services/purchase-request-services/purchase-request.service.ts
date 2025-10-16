import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'environments/environment';
import { ItemsDropdownVM } from 'app/shared/dropdowns/items';
import { unitOfMeasurementDropdownVM } from 'app/shared/dropdowns/units-of-measurement';
import { AccountsDropdownVM } from 'app/shared/dropdowns/accounts';

export interface UploadedFile {
  name: string;
  type: string;
  remarks: string;
  file: File;
  base64Data?: string;
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

  // getPurchaseRequests(userId: string): Observable<any[]> {
  //   return this.http.post<any[]>(`${this.baseUrl}/GetAllRequests`, {
  //     params: new HttpParams().set('userId', userId)
  //   });
  // }

  // getAllPurchaseRequests(currentPage: number, pageSize: number): Observable<any> {
  //   return this.http.post<any>(`${this.baseUrl}/get-all-purchase-requests`, {
  //     currentPage,
  //     pageSize
  //   });
  // }

  getAllPurchaseRequests(currentPage: number, pageSize: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/get-all-purchase-requests?currentPage=${currentPage}&pageSize=${pageSize}`
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

  // getPurchaseRequestById(id: number): Observable<any> {
  //   return this.http.get<any>(`${this.baseUrl}/get-request-by-id/${id}`);
  // }
  getPurchaseRequestById(id: number): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/get-request-by-id`, {
    params: { id: id.toString() }
  });
}


  addRemarksWithActionTaken(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/addRemarksWithActionTaken`, data);
  }

  // getAllRequestsByStatus(userId: string, status: string): Observable<any[]> {
  //   return this.http.get<any[]>(`${this.baseUrl}/get-requests-by-status?userId=${userId}&status=${status}`);
  // }

  // getAllPurchaseRequestsByStatus(status: string, currentPage: number, pageSize: number): Observable<any> {
  //   return this.http.post<any>(`${this.baseUrl}/get-all-purchase-requests-by-status`, {
  //     status,
  //     currentPage,
  //     pageSize
  //   });
  // }

  getAllPurchaseRequestsByStatus(status: string, currentPage: number, pageSize: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}/get-all-purchase-requests-by-status?status=${encodeURIComponent(status)}&currentPage=${currentPage}&pageSize=${pageSize}`
    );
  }


  getApprovalHistoryByReqNo(requisitionNo: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/get-request-approval-history?requisitionNo=${requisitionNo}`);
  }

  getUnitsOfMeasurementDropdown(): Observable<unitOfMeasurementDropdownVM[]> {
    return this.http.get<unitOfMeasurementDropdownVM[]>(`${this.baseUrl}/units-of-measurement-dropdown`);
  }

  getItemsDropdown(): Observable<ItemsDropdownVM[]> {
    return this.http.get<ItemsDropdownVM[]>(`${this.baseUrl}/items-dropdown`);
  }

  getAccountsDropdown(): Observable<AccountsDropdownVM[]> {
    return this.http.get<AccountsDropdownVM[]>(`${this.baseUrl}/accounts-dropdown`);
  }

  submitForApproval(purchaseRequestId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/submit-for-approval/${purchaseRequestId}`, {});
  }
}
