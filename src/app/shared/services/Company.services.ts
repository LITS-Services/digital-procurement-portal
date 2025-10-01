import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  constructor(private http: HttpClient) {}


getAllEmployees(): Observable<any[]> {
return this.http.get<any[]>(`${environment.apiUrl}/Employee/GetAllEmployees`);
  }

registerEmployee(data: any): Observable<any> {
  return this.http.post<any>(`${environment.apiUrl}/Employee/Create`, data);
}
getCompaniesByUserEntity(procurmentCompanyId: string): Observable<any[]> {
  return this.http.post<any[]>(`${environment.apiUrl}/Company/get-companies-by-user-entity`, {
    procurmentCompanyId: procurmentCompanyId
  });
}


// Create a new procurement company
createProCompany(data: any): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/register-procurement-company`, data);
}

   getProCompanies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get-all-procurement-companies`);
  }
  
 deleteProCompanies(id: number[]): Observable<any> {
  return this.http.delete<any>(`${this.apiUrl}/delete-procurement-company/${id}`);
}

  
  // Update multiple procurement companies (example)
  getproByid(id): Observable<any> {
   return this.http.get<any>(`${this.apiUrl}/get-procurement-company/${id}`);
  }
  
  // Update single procurement company by ID
  updateProCompaniesById(id: number, data: any): Observable<any> {
   return this.http.put<any>(`${this.apiUrl}/update-procurement-company/${id}`, data);
  }





  getVendorCompanies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/get-all-vendor-companies`);
  }

getVendorUsers(): Observable<VendorUserDropdown> {
  return this.http.get<VendorUserDropdown>(`${this.apiUrl}/get-all-vendor-users`);
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

// Done by Sahal
getVendorsAndCompaniesForRfq(): Observable<any[]> {
  return this.http.get<any[]>(`${this.apiUrl}/get-all-vendors-companies-for-rfq`);
}

}
