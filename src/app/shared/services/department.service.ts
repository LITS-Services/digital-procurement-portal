import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

export interface DepartmentItem {
  id: number;
  name: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private baseUrl = `${environment.apiUrl}/Department`;

  constructor(private http: HttpClient) { }

  getAllDepartments(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetAll`);
  }

  getAll(currentPage: number = 1, pageSize: number = 10): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetAll?currentPage=${currentPage}&pageSize=${pageSize}`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetById/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Create`, data);
  }

  update(data: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/Update`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/Delete/${id}`);
  }
}
