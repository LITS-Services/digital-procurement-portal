import { HttpClient, HttpParams } from '@angular/common/http';
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
  utilisedBudget?: number;
  availableBudget?: number;
  isException?: boolean;
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

export interface ProjectBudgetConsumptionVM {
  id: number;
  prno: string;
  purchaseRequestId: number;
  requisitionNo: string;
  subject?: string;
  createdBy?: string;
  requestDate?: string;
  projectId: number;
  projectName: string;
  projectDescription?: string;
  activityId?: number;
  activityName?: string;
  activityBudgetAmount?: number;
  departmentId?: number;
  departmentName?: string;
  itemId?: number;
  consumedAmount: number;
  createdDate: string;
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

  getConsumedAmounts(createdBy?: string, projectId?: number): Observable<any> {
    let params = new HttpParams();
    if (createdBy) params = params.set('createdBy', createdBy);
    if (projectId) params = params.set('projectId', projectId.toString());
    return this.http.get<any>(`${this.baseUrl}/ConsumedAmounts`, { params });
  }

  getConsumedAmountsByProject(projectId: number, createdBy?: string): Observable<any> {
    let params = new HttpParams();
    if (createdBy) params = params.set('createdBy', createdBy);
    return this.http.get<any>(`${this.baseUrl}/ConsumedAmounts/${projectId}`, { params });
  }

  getLogs(projectId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/Logs/${projectId}`);
  }
}
