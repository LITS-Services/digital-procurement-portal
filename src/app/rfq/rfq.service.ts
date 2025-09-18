import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class RfqService {
  private baseUrl = `${environment.apiUrl}/Quotation`;
  constructor(private http: HttpClient) { }

  getAllQuotations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetAllQuotations`);
  }

  getQuotationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetQuotationById/${id}`);
  }

  createQuotation(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/CreateQuotation`, data);
  }

  updateQuotation(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/UpdateQuotation/${id}`, data );
  }

  deleteQuotation(ids: number[]) {
    return this.http.delete(`${this.baseUrl}/DeleteQuotation/${ids}`);
  }
}
