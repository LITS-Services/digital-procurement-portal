import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DatatableComponent } from '@swimlane/ngx-datatable';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { SystemService } from 'app/shared/services/system.service';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'app-purchase-request-attachment-modal',
  templateUrl: './purchase-request-attachment-modal.component.html',
  styleUrls: ['./purchase-request-attachment-modal.component.scss'],
  standalone: false
})

export class PurchaseRequestAttachmentModalComponent implements OnInit {
  @Input() viewMode: boolean = false;
  @Input() attachments: any[] = [];
  @Input() isSubmitter: boolean = false;
  @Input() isStatusCompleted: boolean = false;
  @Output() attachmentsChange = new EventEmitter<any[]>();
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;
  data!: {
    existingAttachment?: any[],
    purchaseItemId: number;
  }

  itemId: number;
  selectedFiles: File[] = [];
  AttachmentForm: FormGroup;
  uploadedFiles: any[] = [];
  newAttachmentsData = [];

  constructor(private http: HttpClient, private fb: FormBuilder, 
    public activeModal: NgbActiveModal, 
    public toastr: ToastrService, 
    private purchaseRequestService: PurchaseRequestService,
    private systemService: SystemService,
  private cdr: ChangeDetectorRef) {
    this.AttachmentForm = this.fb.group({
    });
  }

  // ngOnInit(): void {
  //   // this.uploadedFiles = this.attachments ? [...this.attachments] : [];
  //   this.uploadedFiles = this.data?.existingAttachment
  //     ? this.data.existingAttachment.map((f: any) => ({ ...f, isNew: false })) // ⬅️ key line
  //     : [];
  //   // this.uploadedFiles = this.data?.existingAttachment ? [...this.data.existingAttachment] : [];
  //   this.itemId = this.data?.purchaseItemId;
  // }
  ngOnInit(): void {
  // Work on a copy to avoid overwriting parent data
  this.uploadedFiles = this.data?.existingAttachment
    ? this.data.existingAttachment.map(a => ({ ...a }))
    : [];

  this.itemId = this.data?.purchaseItemId;
}


  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (files.length === 0) return;

    // Add all selected files (multi-select).
    for (const file of files) {
      await this.addAttachment(file);
    }

    // Allow re-selecting the same file(s).
    input.value = '';

  }

  onDragOver(event: DragEvent): void {
    if (this.viewMode || this.isStatusCompleted) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  onDragLeave(event: DragEvent): void {
    if (this.viewMode || this.isStatusCompleted) return;
    event.preventDefault();
  }

  async onDrop(event: DragEvent): Promise<void> {
    if (this.viewMode || this.isStatusCompleted) return;
    event.preventDefault();

    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
    if (files.length === 0) return;

    for (const file of files) {
      await this.addAttachment(file);
    }
  }

  uploadFiles() {
    if (this.viewMode) return;

    const payload = this.uploadedFiles.filter(a => !a.id).map(a => ({
      content: a.content,
      contentType: a.contentType,
      fileName: a.fileName,
      fromForm: a.fromForm,
      purchaseItemId: a.purchaseItemId
    }));

    this.activeModal.close(payload);
  }

  downloadLocalFile(file: any) {
    const link = document.createElement('a');
    link.href = file.content;
    link.download = file.fileName;
    link.click();
  }

  async addAttachment(file: File) {
    if (!file) return;

    try {
      const base64 = await this.toBase64(file);
      const purchaseItemId = this.itemId ?? 0;

      const newAttachment = {
        fileName: file.name,
        contentType: file.type,
        content: base64,
        fromForm: 'Purchase Item Attachment',
        purchaseItemId: purchaseItemId,
        //isNew: true
      };

      this.uploadedFiles.push(newAttachment);
      this.uploadedFiles = [...this.uploadedFiles]; // Trigger UI update
      this.cdr.detectChanges();
      this.emitChanges();

    } catch (error) {
      console.error('Failed to convert file to base64:', error);
    }
  }

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
  } else {
    // Saved attachment → download via service
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