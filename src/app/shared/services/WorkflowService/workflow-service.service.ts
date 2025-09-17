import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WorkflowServiceService {

   private baseUrl = `${environment.apiUrl}/Workflow`;
 
   constructor(private http: HttpClient) { }


  /** ============== API Calls ============== **/

     getWorkflowTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetWorkflowTypes`);
  }
  getApproverList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetApproverList`);
  }
  setUpWorkflow(workflowVM: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/SetUpWorkflow`, workflowVM);
  }
  getWorkflowMasterList(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetWorkflowMaster`);
  }

getWorkflowDetails(workflowMasterId: number): Observable<any[]> { 
   return this.http.get<any[]>(`${this.baseUrl}/GetWorkflowDetails/${workflowMasterId}`);
}

GetWorkflowById(workflowMasterId: number): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/GetWorkflowById/${workflowMasterId}`);
}
updateWorkflowdetails(workflowVM: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/updateUpWorkflowdetails`, workflowVM);
  }

}

