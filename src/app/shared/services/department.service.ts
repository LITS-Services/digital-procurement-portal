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

  constructor(private http: HttpClient) {}

  getAllDepartments(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetAll`);
  }
}
