import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';

export interface UploadedFile {
  name: string;
  type: string;
  remarks: string;
  file: File;
  base64Data?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseRequestService {
  private uploadedFiles: UploadedFile[] = [];
  private currentFilesSubject = new BehaviorSubject<UploadedFile[]>(this.uploadedFiles);
  currentFiles = this.currentFilesSubject.asObservable();

  private baseUrl = `${environment.apiUrl}/Requests`;

  constructor(private http: HttpClient) {}

  /** ================= File Management ================= **/

  addFiles(files: UploadedFile[]) {
    this.uploadedFiles.push(...files);
    this.currentFilesSubject.next(this.uploadedFiles);
  }

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
    this.currentFilesSubject.next(this.uploadedFiles);
  }

  clearFiles() {
    this.uploadedFiles = [];
    this.currentFilesSubject.next(this.uploadedFiles);
  }

  getFiles(): UploadedFile[] {
    return this.uploadedFiles;
  }

  /** ============== Convert File to Base64 ============== **/

  private toBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /** ============== API Calls ============== **/

  // Get All Purchase Requests (for your table)
  getPurchaseRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/GetAllRequests`);
  }

deletePurchaseRequest(ids: number[]) {
  console.log(ids);
  return this.http.delete(`${this.baseUrl}/DeleteRequest/${ids}`);
}
  updatePurchaseRequest(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/UpdateRequest/${id}`, data);
  }

   getPurchaseRequestById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/GetRequestById/${id}`);
  }
  // Create a new purchase request with attached Base64 files
  createPurchaseRequestWithFiles(payload: any): Observable<any> {
    return from(
      Promise.all(
        this.uploadedFiles.map(async file => {
          const base64Data = await this.toBase64(file.file);
          return {
            name: file.name,
            type: file.type,
            remarks: file.remarks,
            base64Data
          };
        })
      )
    ).pipe(
      switchMap(encodedFiles => {
        payload.uploadedFiles = encodedFiles;
        return this.http.post(`${this.baseUrl}/CreateRequest`, payload);
      })
    );
  }
}
