import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LookupService {

  private baseUrl = `${environment.apiUrl}/System`;
  constructor(private http: HttpClient) { }
  getAllItems() {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns?name=item`);
  }

  getItemsByEntity(entityGuid: string) {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns`, {
      params: { name: 'Item', id: entityGuid }
    });
  }

  getAllUnitsOfMeasurement() {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns?name=uom`);
  }

  getUomByItem(itemId: number | string) {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns`, {
      params: { name: 'unitofmeasuresymbol', parentId: String(itemId) }
    });
  }

  getVatProdPostingGroups(entityGuid: string) {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns`, {
      params: { name: 'vatprodpostinggroups', id: entityGuid }
    });
  }

  getAllAccounts() {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns?name=account`);
  }

  getAllGlobalConfigTypes() {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns?name=global-config-type`);
  }

  getFinalVendorsForSelectionOnPr(userId: string) {
    const url = `${this.baseUrl}/dropdowns`;
    const params = {
      name: 'pr-final-vendors',
      id: userId
    };
    return this.http.get<any[]>(url, { params });
  }

  getAllRequestStatus() {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns?name=status`);
  }

  getProcCompaniesByProcUserId(userId: string) {
    const url = `${this.baseUrl}/dropdowns`;
    const params = {
      name: 'proc-user-companies-by-user-id',
      id: userId
    };
    return this.http.get<any[]>(url, { params });
  }

  getAddressByProcCompany(procCompanyId: number) {
    const url = `${this.baseUrl}/dropdowns`;
    const params = {
      name: 'address-by-proc-company',
      id: procCompanyId.toString()
    };
    return this.http.get<any[]>(url, { params });
  }

  getAllPlaceHoldersByWorkflowType(workflowTypeId: number) {
    const url = `${this.baseUrl}/dropdowns`;
    const params = {
      name: 'email-temp-placeholders',
      id: workflowTypeId
    };
    return this.http.get<any[]>(url, { params });
  }

  getProcurementRoles() {
    return this.http.get<any>(`${this.baseUrl}/dropdowns?name=proc-roles`);
  }

  getAllEmailActions() {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns?name=email-actions`);
  }

  getAllWorkflowTypes() {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns?name=workflow-types`);
  }

  getAddressByEntity(entityId: number) {
    const url = `${this.baseUrl}/dropdowns`;
    const params = {
      name: 'addr-code-by-entity',
      id: entityId.toString()
    };
    return this.http.get<any[]>(url, { params });
  }

  getAllProcurementCompanies() {
    return this.http.get<any[]>(`${this.baseUrl}/dropdowns?name=procurement-companies`);
  }
  // getAddress2ByEntity(entityId: number) {
  //   const url = `${this.baseUrl}/dropdowns`;
  //   const params = {
  //     name: 'address2-by-entity',
  //     id: entityId.toString()
  //   };
  //   return this.http.get<any[]>(url, { params });
  // }
}