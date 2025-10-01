import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { DatatableComponent } from '@swimlane/ngx-datatable';
@Component({
  selector: 'app-purchase-request-attachment-modal',
  templateUrl: './purchase-request-attachment-modal.component.html',
  styleUrls: ['./purchase-request-attachment-modal.component.scss']
})



export class PurchaseRequestAttachmentModalComponent implements OnInit {
@Input() viewMode: boolean = false;
  @Input() attachments: any[] = []; 
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

  constructor(private http: HttpClient, private fb: FormBuilder, public activeModal: NgbActiveModal) {
    this.AttachmentForm = this.fb.group({
    });
  }

  ngOnInit(): void {
    // this.uploadedFiles = this.attachments ? [...this.attachments] : [];
    this.uploadedFiles = this.data?.existingAttachment
      ? this.data.existingAttachment.map((f: any) => ({ ...f, isNew: false })) // ⬅️ key line
      : [];
    // this.uploadedFiles = this.data?.existingAttachment ? [...this.data.existingAttachment] : [];
    this.itemId = this.data?.purchaseItemId;
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
        isNew: true
      };

      this.uploadedFiles.push(newAttachment);
      this.uploadedFiles = [...this.uploadedFiles]; // Trigger UI update

    } catch (error) {
      console.error('Failed to convert file to base64:', error);
    }
  }

  removeFile(index: number) {
    this.uploadedFiles.splice(index, 1);
  }

  downloadAttachment(attachment: any) {
    if (!attachment) return;

    if (attachment.isNew) {
      // Download from base64 string
      const link = document.createElement('a');
      link.href = attachment.attachment;
      link.download = attachment.name;
      link.click();
    } else {
      // Download from API if exists
      this.http.get(`api/Quotation/Download-Attachment/${attachment.id}`, { responseType: 'blob' }).subscribe(blob => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = attachment.name;
        link.click();
        window.URL.revokeObjectURL(link.href);
      });
    }
  }

  private toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  private emitChanges() {
    this.attachmentsChange.emit(this.uploadedFiles);
  }

  closeDialog() {
    this.activeModal.close(false);
  }
}