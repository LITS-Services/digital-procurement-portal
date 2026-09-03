import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable } from 'rxjs';

export interface SuperFormDto {
  id: number;
  name: string;
  route: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SuperAclService {
  constructor(private http: HttpClient) {}

  getAllForms(
    currentPage: number,
    pageSize: number,
    search?: string,
    isActive?: boolean
  ): Observable<{ result?: SuperFormDto[] }> {
    let params = new HttpParams()
      .set('currentPage', currentPage)
      .set('pageSize', pageSize);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    if (isActive === true || isActive === false) {
      params = params.set('isActive', String(isActive));
    }

    return this.http.get<{ result?: SuperFormDto[] }>(
      `${environment.apiUrl}/SuperAcl/get-all-forms`,
      { params }
    );
  }

  updateFormActive(id: number, isActive: boolean): Observable<any> {
    return this.http.post(`${environment.apiUrl}/SuperAcl/update-form-active`, {
      id,
      isActive
    });
  }
}
