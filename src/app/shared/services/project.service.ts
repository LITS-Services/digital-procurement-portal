import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

export interface ProjectActivityItem {
  id: number;
  projectId: number;
  name: string;
  description?: string;
  budgetAmount: number;
  allowedPercentage: number;
}

export interface ProjectItem {
  id: number;
  departmentId: number;
  departmentName?: string;
  name: string;
  description?: string;
  activityCount?: number;
  projectActivities?: ProjectActivityItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private baseUrl = `${environment.apiUrl}/Project`;

  constructor(private http: HttpClient) { }

  getAllProjects(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetAll?currentPage=1&pageSize=1000`);
  }

  getAll(currentPage: number = 1, pageSize: number = 10): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetAll?currentPage=${currentPage}&pageSize=${pageSize}`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetById/${id}`);
  }

  getProjectById(id: number): Observable<any> {
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
