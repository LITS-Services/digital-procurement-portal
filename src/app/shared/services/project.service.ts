import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {

  constructor(private http: HttpClient) { }

  getAll(currentPage: number = 1, pageSize: number = 10): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/Project/GetAll?currentPage=${currentPage}&pageSize=${pageSize}`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/Project/GetById/${id}`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/Project/Create`, data);
  }

  update(data: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/Project/Update`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/Project/Delete/${id}`);
  }
}
