import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface VendorUserDropdown {
  $id: string,
  $values: [];
}

@Injectable({
  providedIn: 'root'
})
export class CompanyService {
  private apiUrl = `${environment.apiUrl}/Company`;

  constructor(private http: HttpClient) { }

  getAllEmployees(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/Employee/GetAllEmployees`);
  }

  registerEmployee(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/Employee/Create`, data);
  }
  getCompaniesByUserEntity(userId: string): Observable<any[]> {
    return this.http.post<any[]>(`${environment.apiUrl}/Company/get-companies-by-user-entity`, {
      userId: userId
    });
  }

  // Create a new procurement company
  createProCompany(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register-procurement-company`, data);
  }

  getProCompanies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get-all-procurement-companies`);
  }

  deleteProcurementCompanies(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/delete-procurement-companies`, { ids });
  }

  // Update multiple procurement companies (example)
  getProcurementCompanyById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-procurement-company-by-id`, {
      params: { id: id.toString() }
    });
  }

  // Update single procurement company by ID
  updateProCompaniesById(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update-procurement-company/${id}`, data);
  }

  //ProcurementUsers
  getprocurementusers(entityId: number): Observable<any[]> {
    let params = new HttpParams()
    if (entityId) params = params.set("entityId", entityId);
    return this.http.get<any[]>(`${environment.apiUrl}/ProcurementUsers/GetAll`, { params });

  }

  deleteprocurementusers(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/ProcurementUsers/Delete`);
  }

  enableProcurementUser(id: string): Observable<any> {
    return this.http.put<any>(`${environment}ProcurementUsers/Activate/${id}`, null);
  }

  getprocurementusersbyid(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/ProcurementUsers/GetUserWithCompanies/${id}`);
  }

  getUserByEntity(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/ProcurementUsers/get-procurement-users-by-company/${id}`);
  }

  getcompanydatabyid(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/Procurement/GetUserCompanies/GetUserWithCompanies/${id}`);
  }

  getRoles(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/ProcurementUsers/GetRoles`);
  }

  resetPassword(payload: any) {
    return this.http.post(`${environment.apiUrl}/ProcurementUsers/ChangePassword/`, payload);
  }

  ProcurmentuserUpdate(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/ProcurementUsers/Update/${id}`, data);
  }

  getVendorCompanies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get-all-vendor-companies`);
  }

  // company
  VendorCompanyAction(payload: any) {
    return this.http.post(`${environment.apiUrl}/Company/VendorCompanyAction`, payload);
  }

  getApprovalHistoryByProcurmentcompanyId(ProcurementCompanyId: number, vendorComapnyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/Company/get-company-approval-history?ProcurementCompanyId=${ProcurementCompanyId}&VendorCompanyId=${vendorComapnyId}`);
  }

  setupId(associationId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/Company/SetupHistory?vendorEntityAssociationId=${associationId}`);
  }

  GetAllCompanyOnboardingSetup(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/Workflow/get-all-company-onboarding-setup`);
  }

  GetCompanyOnboardingSetupById(id: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/Workflow/get-company-onboarding-setup-by-id?Id=${id}`);
  }

  CreateCompanyOnboardingSetup(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/Workflow/save-company-onboarding-setup`, data);
  }

  UpdateCompanyOnboardingSetup(data: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/Workflow/update-company-onboarding-setup`, data);
  }

  DeleteCompanyOnboardingSetupById(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/Workflow/delete-company-onboarding-setup-by-id?Id=${id}`);
  }

  // getVendorUsers(): Observable<VendorUserDropdown> {
  //   return this.http.get<VendorUserDropdown>(`${this.apiUrl}/get-all-vendor-users`);
  // }
  getAllVendorUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get-all-vendor-users`);
  }

  //   // Get company by ID
  getCompanyById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  //   // Create company
  //   createCompany(data: any): Observable<any> {
  //     return this.http.post<any>(this.apiUrl, data);
  //   }

  //   // Update company
  updateCompany(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update-vendor-company/${id}`, data);
  }

  //   // Delete company
  //   deleteCompany(id: number): Observable<any> {
  //     return this.http.delete<any>(`${this.apiUrl}/${id}`);
  //   }

  getFilteredReceivers(EntityId: number, RoleId: string): Observable<any[]> {
    const url = `${environment.apiUrl}/Employee/get-receivers`;
    const params = {
      RoleId: RoleId,
      EntityId: EntityId.toString()
    };

    return this.http.get<any[]>(url, { params });
  }

  getReceiversSetupid(SetupId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/Employee/get-by-setupid`, {
      params: { setupId: SetupId.toString() }
    });
  }

  assignedMe(vendorEntityAssociationId: number, approverId: string, remarks: string, setUpId: number): Observable<any> {
    const params = new HttpParams()
      .set('VendorEntityAssociationId', vendorEntityAssociationId)
      .set('ApproverId', approverId)
      .set('Remarks', remarks)
      .set('SetUpId', setUpId)
    return this.http.get<any>(`${this.apiUrl}/assigned-me`, { params });
  }

  takeAction(data: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/Workflow/take-action`, data);
  }


  registerCompanyInBulk(payload: any) {
  return this.http.post(
    `${environment.apiUrl}/company/register-company-in-bulk`,
    payload
  );
}


}
