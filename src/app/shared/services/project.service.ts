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
  name: string;
  description?: string;
  projectActivities?: ProjectActivityItem[];
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private baseUrl = `${environment.apiUrl}/Project`;

  constructor(private http: HttpClient) {}

  getAllProjects(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetAll`);
  }

  getProjectById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/GetById/${id}`);
  }
}
