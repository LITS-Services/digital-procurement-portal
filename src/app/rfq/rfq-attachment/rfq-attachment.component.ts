import { HttpClient } from '@angular/common/http';
import {  ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { SystemService } from 'app/shared/services/system.service';
import { ToastrService } from 'ngx-toastr';
import { FileValidationService } from 'app/shared/auth/file-validation.service';

@Component({
  selector: 'app-rfq-attachment',
  templateUrl: './rfq-attachment.component.html',
  styleUrls: ['./rfq-attachment.component.scss'],
  standalone: false
})

export class RfqAttachmentComponent implements OnInit {
  @Input() viewMode: boolean = false;
  @Input() attachments: any[] = [];
  @Output() attachmentsChange = new EventEmitter<any[]>();
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;
  data!: {
    existingAttachment?: any[],
    quotationItemId: number;
  }

  itemId: number;
  selectedFiles: File[] = [];
  AttachmentForm: FormGroup;
  uploadedFiles: any[] = [];
  newQuotationItemAttachmentData = [];

  constructor(private http: HttpClient, private fb: FormBuilder, 
    public activeModal: NgbActiveModal, 
    private purchaseRequestService: PurchaseRequestService,
    private toastr: ToastrService,
    private fileValidation: FileValidationService,
    private systemService: SystemService,
    private cdr: ChangeDetectorRef
  ) {
    this.AttachmentForm = this.fb.group({
    });
  }

  ngOnInit(): void {
    // this.uploadedFiles = this.attachments ? [...this.attachments] : [];
    this.uploadedFiles = this.data?.existingAttachment
      ? this.data.existingAttachment.map((f: any) => ({ ...f, isNew: false })) // ⬅️ key line
      : [];
    // this.uploadedFiles = this.data?.existingAttachment ? [...this.data.existingAttachment] : [];
    this.itemId = this.data?.quotationItemId;
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    await this.addAttachment(file);
  }

  uploadFiles() {
    if (this.viewMode) return;

    // const payload = this.uploadedFiles.filter(a => a.isNew).map(a => ({
    //   content: a.content,
    //   contentType: a.contentType,
    //   fileName: a.fileName,
    //   fromForm: a.fromForm,
    //   quotationItemId: a.quotationItemId,
    //   visibleToVendor: a.visibleToVendor ?? false
    // }));
    this.activeModal.close([...this.uploadedFiles]);
  }


  downloadLocalFile(file: any) {
    const link = document.createElement('a');
    link.href = file.content;
    link.download = file.fileName;
    link.click();
  }

  async addAttachment(file: File) {
    if (!file) return;

    const check = this.fileValidation.validate(file, 'Quotation Item Attachment');
    if (!check.valid) {
      this.toastr.error(check.error || 'Invalid file.');
      return;
    }

    try {
      const base64 = await this.toBase64(file);
      const quotationItemId = this.itemId ?? 0;

      const newAttachment = {
        fileName: file.name,
        contentType: file.type,
        content: base64,
        fromForm: 'Quotation Item Attachment',
        quotationItemId: quotationItemId,
        visibleToVendor: false,
        isNew: true,
        fromPr: false
      };

      this.uploadedFiles.push(newAttachment);
      this.uploadedFiles = [...this.uploadedFiles]; // Trigger UI update
       this.cdr.detectChanges();   
    } catch (error) {
      console.error('Failed to convert file to base64:', error);
    }
  }

  // onVisibilityChange(index: number) {
  //   // If editing an existing attachment, mark it for update
  //   if (!this.uploadedFiles[index].isNew && this.uploadedFiles[index].visibleToVendor
  // ) {
  //     this.uploadedFiles[index].isUpdated = true;
  //   }
  // }

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
  }

  // downloadAttachment(attachment: any) {
  //   if (!attachment) return;

  //   if (attachment.isNew) {
  //     // Download from base64 string
  //     const link = document.createElement('a');
  //     link.href = attachment.attachment;
  //     link.download = attachment.name;
  //     link.click();
  //   } else {
  //     // Download from API if exists
  //     this.http.get(`api/Quotation/Download-Attachment/${attachment.id}`, { responseType: 'blob' }).subscribe(blob => {
  //       const link = document.createElement('a');
  //       link.href = window.URL.createObjectURL(blob);
  //       link.download = attachment.name;
  //       link.click();
  //       window.URL.revokeObjectURL(link.href);
  //     });
  //   }
  // }
  downloadAttachment(attachment: any) {
  if (!attachment) return;

  const fileName = attachment.fileName || 'download';

  if (!attachment.id) {
    // Frontend-only download
    const dataUrl = `data:${attachment.contentType};base64,${attachment.content}`;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.click();
  } 
  else if (attachment.id && attachment.quotationItemId == 0) {
    this.systemService.downloadAttachment('PurchaseRequest', attachment.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastr.error('Failed to download attachment.');
      }
    });
  }
  else  {
    // Saved attachment → download via service
    this.systemService.downloadAttachment('RFQ', attachment.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.toastr.error('Failed to download attachment.');
      }
    });
  }
}

  private toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      //reader.onload = () => resolve(reader.result as string);
      reader.onload = () => {
      const result = reader.result as string;

      // Strip the "data:<mime>;base64," prefix
      const base64Index = result.indexOf('base64,') + 'base64,'.length;
      resolve(result.substring(base64Index));
    };
      reader.onerror = error => reject(error);
    });
  }

  deleteRow(rowIndex: number): void {
    this.uploadedFiles.splice(rowIndex, 1);
    this.uploadedFiles = [...this.uploadedFiles]; // refresh table
      this.emitChanges();
    this.toastr.success('Attachment removed!', '');
  }
  private emitChanges() {
    this.attachmentsChange.emit(this.uploadedFiles);
  }

  closeDialog() {
    this.activeModal.close(false);
  }
}