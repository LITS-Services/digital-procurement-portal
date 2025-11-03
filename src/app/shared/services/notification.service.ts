import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { Observable } from "rxjs";
export enum ReferenceType {
    PR = 1,
    RFQ = 2,
    PO = 3,
    Default = 99
}

@Injectable({
  providedIn: 'root'
})

export class NotifcationService {
     private apiUrl = `${environment.apiUrl}`;

     constructor(private http: HttpClient) { }

    getNotification(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/System/get-notifications`);
  }

  markAsRead(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/System/mark-notification-as-read/${id}`);
  }

    getSearch(param:string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/System/search/${param}`);
  }
}