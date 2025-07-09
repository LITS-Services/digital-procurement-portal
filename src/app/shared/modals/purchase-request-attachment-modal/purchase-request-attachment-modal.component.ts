import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError } from "rxjs/operators";
import { throwError } from "rxjs";
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
@Component({
  selector: 'app-purchase-request-attachment-modal',
  templateUrl: './purchase-request-attachment-modal.component.html',
  styleUrls: ['./purchase-request-attachment-modal.component.scss']
})
export class PurchaseRequestAttachmentModalComponent implements OnInit {
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;
  AttachmentForm: FormGroup;
  progress: number;
  selectedFiles: File[] = [];
  public chkBoxSelected = [];
loading = false;
public rows = [];
newPurchaseRequestAttachmentData = [];
// uploadedFiles: File[] = [];
uploadedFiles: { name: string; type: string; remarks: string; file: File }[] = [];
fileRemarks: string = '';
columns = [
];
public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  
  constructor(public activeModal: NgbActiveModal,
    private http: HttpClient,
    private attachmentService: PurchaseRequestService,
    private fb: FormBuilder
  ) { 
     this.AttachmentForm = this.fb.group({
    remarks: [''] // Initialize the remarks control
  }); 
}

  ngOnInit(): void {
    // this.AttachmentForm = new FormGroup({});
    this.attachmentService.currentFiles.subscribe(files => {
      console.log('Files in AttachmentService:', files);
      this.uploadedFiles = files; // Update the local array with the latest files
    });
  }
  ngAfterViewChecked():void{
    window.dispatchEvent(new Event('resize'));
}
  closeDialog() {
    this.activeModal.close(false);
  }
  saveData() {
   
  }
  onFileSelected(event: any) {
    this.selectedFiles = Array.from(event.target.files);
  }
  uploadFiles() {
    if (this.selectedFiles.length > 0) {
      const filesWithMetadata = this.selectedFiles.map(file => ({
        name: file.name,
        type: file.type,
        remarks: this.AttachmentForm.get('remarks')?.value || 'No remarks provided',
        file
      }));
      this.attachmentService.addFiles(filesWithMetadata);
      // this.uploadedFiles = this.attachmentService.currentFiles();
      this.selectedFiles = [];
      // this.AttachmentForm.reset();
      this.activeModal.close(false);
    } else {
      alert('Please select at least one file.');
    }
  }


  
  deleteRow(index: number) {
    this.attachmentService.removeFile(index); // Call the service to remove the file
  }
  editFile(index: number) {
    const fileToEdit = this.uploadedFiles[index];
    this.AttachmentForm.get('remarks')?.setValue(fileToEdit.remarks);
  }
  upload(file) {
    this.progress = 1;
    const formData = new FormData();
    formData.append("file", file);
    this.http
      .post("your-url-here", formData, {
        reportProgress: true,
        observe: "events"
      })
      .pipe(
        map((event: any) => {
          if (event.type == HttpEventType.UploadProgress) {
            this.progress = Math.round((100 / event.total) * event.loaded);
          } else if (event.type == HttpEventType.Response) {
            this.progress = null;
          }
        }),
        catchError((err: any) => {
          this.progress = null;
          alert(err.message);
          return throwError(err.message);
        })
      )
      .toPromise();
  }

  
}
