import { HttpClient, HttpEventType } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError } from "rxjs/operators";
import { throwError } from "rxjs";
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { PurchaseRequestService, UploadedFile } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { base64 } from 'ngx-custom-validators/src/app/base64/validator';
@Component({
  selector: 'app-purchase-request-attachment-modal',
  templateUrl: './purchase-request-attachment-modal.component.html',
  styleUrls: ['./purchase-request-attachment-modal.component.scss']
})
export class PurchaseRequestAttachmentModalComponent implements OnInit {
  @Input() viewMode: boolean = false;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;
  AttachmentForm: FormGroup;
  progress: number;
  selectedFiles: File[] = [];
  data!: {
    existingAttachment?: any[]
  }
  public chkBoxSelected = [];
  loading = false;
  public rows = [];
  newPurchaseRequestAttachmentData = [];
  uploadedFiles: any[] = [];

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
    if (this.viewMode) {
      console.log("Attachment Modal in view mode – disabling controls.");
    }

    this.uploadedFiles = this.data?.existingAttachment ? [...this.data.existingAttachment] : [];
  }
  ngAfterViewChecked(): void {
    window.dispatchEvent(new Event('resize'));
  }
  closeDialog() {
    this.activeModal.close(false);
  }
  saveData() {

  }
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    await this.addAttachment(file);
  }



  uploadFiles() {
    if (this.viewMode) return;


    const payload = this.uploadedFiles.filter(a => a.isNew).map(a => ({
      name: a.name,
      type: a.type,
      attachment: a.attachment
    }))
    this.activeModal.close(payload);
  }

  downloadAttachment(attachmentId: number, fileName: string) {
    this.http.get(`api/Requests/Download-Attachment/${attachmentId}`, {
      responseType: 'blob'
    }).subscribe(blob => {
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(link.href);
    }, error => {
      console.error('Download failed:', error);
    });
  }

  downloadLocalFile(file: any) {
    const link = document.createElement('a');
    link.href = file.attachment;
    link.download = 'FILE';
    link.click();
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

  /** ================= File Management ================= **/

  addFiles(files: UploadedFile[]) {
    this.uploadedFiles.push(...files);
  }

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
  }

  clearFiles() {
    this.uploadedFiles = [];
  }

  getFiles(): UploadedFile[] {
    return this.uploadedFiles;
  }


  async addAttachment(file: File) {
    if (!file) return;

    try {
      const base64 = await this.attachmentService.toBase64(file);

      const newAttachment = {
        name: file.name,
        type: file.type,
        attachment: base64,
        isNew: true
      };

      this.uploadedFiles.push(newAttachment);
      this.uploadedFiles = [...this.uploadedFiles]; // Trigger UI update

    } catch (error) {
      console.error('Failed to convert file to base64:', error);
    }
  }

}
