import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
interface UploadedFile {
  name: string;
  type: string;
  remarks: string;
  file: File;
}

@Injectable({
  providedIn: 'root'
})
export class PurchaseRequestService {

  
  constructor() { }
  // private attachedFiles = new BehaviorSubject<File[]>([]);
  // currentFiles = this.attachedFiles.asObservable();
  // private uploadedFiles: { name: string; type: string; remarks: string; file: File }[] = [];
  // private uploadedFiles: any[] = [];
  // private uploadedFiles: { name: string; type: string; remarks: string; file: File }[] = [];
  private uploadedFiles: UploadedFile[] = [];
  private currentFilesSubject = new BehaviorSubject<UploadedFile[]>(this.uploadedFiles);
  currentFiles = this.currentFilesSubject.asObservable();

  // addFiles(files: File[]) {
  //   const current = this.attachedFiles.getValue();
  //   this.attachedFiles.next([...current, ...files]);
  // }

  addFiles(files: UploadedFile[]) {
    console.log('Adding files:', files);
    this.uploadedFiles.push(...files); // Add the new files to the existing array
    this.currentFilesSubject.next(this.uploadedFiles); // Emit the updated list of files
  }
  // getFiles(): File[] {
  //   return this.attachedFiles.getValue();
  // }
  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
    this.currentFilesSubject.next(this.uploadedFiles);
  }

  // clearFiles() {
  //   this.uploadedFiles = [];
  //   this.currentFilesSubject.next(this.uploadedFiles); // Emit an empty array
  // }
  // getFiles() {
  //   return this.uploadedFiles; // Return the complete list of files
  // }
  // clearFiles() {
  //   this.attachedFiles.next([]);
  // }
}
