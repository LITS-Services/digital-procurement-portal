import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from 'environments/environment';

export interface UploadedFile {
  name: string;
  type: string;
  remarks: string;
  file: File;
  base64Data?: string;
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

  getPurchaseRequests(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetAllRequests`, {
      params: new HttpParams().set('userId', userId)
    });
  }

  deletePurchaseRequest(ids: number[]) {
    console.log(ids);
    return this.http.delete(`${this.baseUrl}/DeleteRequest/${ids}`);
  }
  updatePurchaseRequest(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/UpdateRequest/${id}`, data);
  }

  createPurchaseRequest(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/CreateRequest`, data);
  }

  getPurchaseRequestById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetRequestById/${id}`);
  }

  addRemarksWithActionTaken(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/addRemarksWithActionTaken`, data);
  }
}
