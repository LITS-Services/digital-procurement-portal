import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbAccordion, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { PurchaseRequestAttachmentModalComponent } from 'app/shared/modals/purchase-request-attachment-modal/purchase-request-attachment-modal.component';
import { PurchaseRequestService, UploadedFile } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-new-purchase-request',
  templateUrl: './new-purchase-request.component.html',
  styleUrls: ['./new-purchase-request.component.scss']
})
export class NewPurchaseRequestComponent implements OnInit {
  isNewForm = true; // true = create, false = edit
  isFormDirty = false; // track if any field was touched
  pendingAttachment: any[] = [];
  attachmentList: any[] = [];
  numberOfAttachments = 0;

  newPurchaseRequestData = [

  ];

  workflowList: any[] = [
    {
      id: 1, workflow: 'Vendor'
    },
    {
      id: 2, workflow: 'Procurement'
    }
  ]

  viewMode = false;

  newPurchaseRequestForm: FormGroup;
  itemForm: FormGroup;

  editingRowIndex: number | null = null; // Track row being edited

  public chkBoxSelected = [];
  loading = false;
  public rows = [];
  columns = [];
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  currentRequestId: number | null = null;

  @ViewChild('accordion') accordion: NgbAccordion;
  @ViewChild(DatatableComponent) table: DatatableComponent;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private purchaseRequestService: PurchaseRequestService,
    private fb: FormBuilder,
    public toastr: ToastrService
  ) { }

  ngOnInit(): void {

    // Check for ID and mode in query params
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      const mode = params.get('mode');

      this.viewMode = mode === 'view';
      this.isNewForm = !id;

      if (id) {
        this.currentRequestId = +id;
        this.loadExistingRequest(+id);
      }

      if (this.viewMode) {
        this.newPurchaseRequestForm.disable();
        this.itemForm.disable();
      }
    });

    // Main form
    this.newPurchaseRequestForm = this.fb.group({
      requisitionNo: [''],
      submittedDate: [null],
      deliveryLocation: [''],
      receiverName: [''],
      receiverContact: [''],
      status: ['Draft'],
      department: [''],
      designation: [''],
      businessUnit: [''],
      partialDeliveryAcceptable: [false],
      exceptionPolicy: [false],
      subject: [''],
      workflowMasterId: [0],
      createdBy: [''],
      attachments: this.fb.group({
        specifications: [false],
        drawing: [false],
        scopeOfWorks: [false],
        billOfMaterials: [false],
        other: [''],
        attachment: [''],
        specialInstructions: ['']
      })
    });
    this.newPurchaseRequestForm.valueChanges.subscribe(() => {
      this.isFormDirty = true;
    });

    // Item form
    this.itemForm = this.fb.group({
      type: ['Inventory', Validators.required],
      itemCode: ['', Validators.required],
      uofM: [''],
      amount: [0, Validators.min(0)],
      unitCost: [0, Validators.min(0)],
      orderQuantity: [1, Validators.min(1)],
      reqByDate: [null],
      description: [''],
      vendorName: [''],
      account: [''],
      remarks: ['']
    });
    this.itemForm.valueChanges.subscribe(() => {
      this.isFormDirty = true;
    });


    // Check if editing existing request
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.currentRequestId = +id;
        this.loadExistingRequest(+id);
      }
    });

    if (this.viewMode) {
      this.newPurchaseRequestForm.disable();
      this.itemForm.disable();
    }
  }

  // Insert or Update item
  insertItem(): void {
    if (this.itemForm.invalid) {
      console.warn("Item form is invalid");
      return;
    }

    const newItem = this.itemForm.value;

    if (this.editingRowIndex !== null) {
      // Update existing row
      this.newPurchaseRequestData[this.editingRowIndex] = newItem;
      this.editingRowIndex = null; // reset editing
    } else {
      // Add new row
      this.newPurchaseRequestData = [...this.newPurchaseRequestData, newItem];
    }

    // Reset form
    this.itemForm.reset({
      type: 'Inventory',
      amount: 0,
      unitCost: 0,
      orderQuantity: 1
    });
  }

  // Edit a row
  editRow(row: any, rowIndex: number) {
    this.itemForm.patchValue({
      type: row.type,
      itemCode: row.itemCode,
      uofM: row.uofM,
      amount: row.amount,
      unitCost: row.unitCost,
      orderQuantity: row.orderQuantity,
      reqByDate: row.reqByDate,
      description: row.description,
      vendorName: row.vendorName,
      account: row.account,
      remarks: row.remarks
    });
    this.editingRowIndex = rowIndex;
  }

  deleteRow(rowIndex: number): void {
    this.newPurchaseRequestData.splice(rowIndex, 1);
    this.newPurchaseRequestData = [...this.newPurchaseRequestData]; // refresh table
    this.toastr.success('Delete!', '');
  }

  loadExistingRequest(id: number) {
    this.purchaseRequestService.getPurchaseRequestById(id).subscribe({
      next: async (data) => {
        console.log("update data: ", data)
        this.isNewForm = false;
        this.currentRequestId = data.id;
        this.newPurchaseRequestForm.patchValue(data);
        if (data.items.$values) {
          this.newPurchaseRequestData = data.items.$values.map((item: any) => ({
            type: item.itemType,
            itemCode: item.itemCode,
            description: item.itemDescription,
            amount: item.amount,
            unitCost: item.unitCost,
            uofM: item.uofM,
            orderQuantity: item.orderQuantity,
            reqByDate: item.reqByDate,
            vendorName: item.vendor,
            account: item.account,
            remarks: item.remarks
          }));
        }
        this.attachmentList = data.attachments?.$values.map((a: any) => ({
          name: a.name,
          type: a.type,
          attachment: a.attachment,
          isNew: false
        }))
        this.pendingAttachment = [];
        this.numberOfAttachments = this.attachmentList.length;
      },

      error: (err) => console.error('Failed to load purchase request:', err)

    });
  }


  homePage() {
    if (this.isNewForm && this.isFormDirty) {
      const confirmSave = confirm('Do you want to save this request as a draft?');

      if (confirmSave) {
        this.saveAsDraftAndGoBack();
      } else {
        this.router.navigate(['/purchase-request']);
      }
    } else {
      this.router.navigate(['/purchase-request']);
    }
  }

  saveAsDraftAndGoBack() {
    if (this.newPurchaseRequestForm.invalid) {
      return;
    }

    const f = this.newPurchaseRequestForm.value;

    const payload = {
      requisitionNo: f.requisitionNo,
      submittedDate: new Date().toISOString(),
      deliveryLocation: f.deliveryLocation,
      receiverName: f.receiverName,
      receiverContact: f.receiverContact,
      status: 'Draft',
      department: f.department,
      designation: f.designation,
      businessUnit: f.businessUnit,
      partialDeliveryAcceptable: f.partialDeliveryAcceptable,
      exceptionPolicy: f.exceptionPolicy,
      subject: f.subject,
      workflowMasterId: Number(f.workflowMasterId) || 0,
      createdBy: f.createdBy || 'current-user',
      attachments: this.attachmentList.map(att => ({
        requisitionNo: f.requisitionNo,
        specifications: f.attachments.specifications,
        drawing: f.attachments.drawing,
        scopeOfWorks: f.attachments.scopeOfWorks,
        billOfMaterials: f.attachments.billOfMaterials,
        other: f.attachments.other,
        specialInstructions: f.attachments.specialInstructions,
        attachment: att.attachment,
        type: att.type,
        name: att.name,
        createdBy: f.createdBy || 'current-user',
      })),
      purchaseItems: this.newPurchaseRequestData.map(item => ({
        itemType: item.type || 'Inventory',
        itemCode: item.itemCode || '',
        uofM: item.uofM || '',
        amount: Number(item.amount) || 0,
        unitCost: Number(item.unitCost) || 0,
        orderQuantity: Number(item.orderQuantity) || 0,
        reqByDate: item.reqByDate ? new Date(item.reqByDate).toISOString() : null,
        itemDescription: item.description || '',
        vendor: item.vendorName || '',
        account: item.account || '',
        remarks: item.remarks || '',
        requisitionNo: f.requisitionNo,
        createdBy: f.createdBy || 'current-user',
      }))
    };

    this.loading = true;

    const request$ = this.isNewForm
      ? this.purchaseRequestService.createPurchaseRequestWithFiles(payload)
      : this.purchaseRequestService.updatePurchaseRequest(this.currentRequestId, payload);

    request$.subscribe({
      next: () => this.handleDraftSuccess(),
      error: (err) => this.handleDraftError(err)
    });
  }

  private handleDraftSuccess() {
    this.attachmentList.forEach(a => a.isNew = false);
    this.numberOfAttachments = this.attachmentList.length;
    this.loading = false;
    this.toastr.success('Draft saved successfully');
    this.router.navigate(['/purchase-request']);
  }

  private handleDraftError(err: any) {
    this.loading = false;
    this.toastr.error('Failed to save draft');
    console.error('Error saving draft:', err);
  }


  submitForm() {
    if (!this.newPurchaseRequestForm.valid) {
      console.warn('Form is invalid');
      return;
    }

    const f = this.newPurchaseRequestForm.value;
    const submittedDateISO = f.submittedDate ? new Date(f.submittedDate).toISOString() : new Date().toISOString();

    const purchaseItems = this.newPurchaseRequestData.map(item => ({
      itemType: item.type || 'Inventory',
      itemCode: item.itemCode || '',
      uofM: item.uofM || '',
      amount: Number(item.amount) || 0,
      unitCost: Number(item.unitCost) || 0,
      orderQuantity: Number(item.orderQuantity) || 0,
      reqByDate: item.reqByDate ? new Date(item.reqByDate).toISOString() : null,
      itemDescription: item.description || '',
      vendor: item.vendorName || '',
      account: item.account || '',
      remarks: item.remarks || '',
      requisitionNo: f.requisitionNo,
      createdBy: f.createdBy || 'current-user',
    }));

    const payload = {
      requisitionNo: f.requisitionNo,
      submittedDate: submittedDateISO,
      deliveryLocation: f.deliveryLocation,
      receiverName: f.receiverName,
      receiverContact: f.receiverContact,
      status: f.status,
      department: f.department,
      designation: f.designation,
      businessUnit: f.businessUnit,
      partialDeliveryAcceptable: f.partialDeliveryAcceptable,
      exceptionPolicy: f.exceptionPolicy,
      subject: f.subject,
      workflowMasterId: Number(f.workflowMasterId) || 0,
      createdBy: f.createdBy || 'current-user',
      attachments: this.attachmentList.map(att => ({
        requisitionNo: f.requisitionNo,
        specifications: f.attachments.specifications,
        drawing: f.attachments.drawing,
        scopeOfWorks: f.attachments.scopeOfWorks,
        billOfMaterials: f.attachments.billOfMaterials,
        other: f.attachments.other,
        specialInstructions: f.attachments.specialInstructions,
        attachment: att.attachment,
        type: att.type,
        name: att.name,
        createdBy: f.createdBy || 'current-user',
      })),

      purchaseItems
    };

    this.loading = true;

    if (this.currentRequestId) {
      this.purchaseRequestService.updatePurchaseRequest(this.currentRequestId, payload).subscribe({
        next: res => {
          console.log('Purchase Request Updated:', res);
          this.loading = false;
          this.router.navigate(['/purchase-request']);
          this.toastr.success('Request is created!', '');
        },



        error: err => {
          console.error('Error updating Purchase Request:', err);
          this.toastr.success('Something went Wrong', '');
          this.loading = false;
        }
      });
    } else {
      this.purchaseRequestService.createPurchaseRequestWithFiles(payload).subscribe({
        next: res => {
          console.log('Purchase Request Created:', res);
          this.attachmentList.forEach(a => a.isNew = false);
          this.numberOfAttachments = this.attachmentList.length;
          this.loading = false;

          this.router.navigate(['/purchase-request']);
          this.toastr.success('Request Update!', '');
        },
        error: err => {
          console.error('Error creating Purchase Request:', err);
          this.toastr.success('Something went wrong');
          this.loading = false;
        }
      });
    }
  }

  openNewEntityModal() {
    const modalRef = this.modalService.open(PurchaseRequestAttachmentModalComponent, {
      backdrop: 'static',
      size: 'lg',
      centered: true,
    });
    modalRef.componentInstance.data = {
      existingAttachment: this.attachmentList
    }
    modalRef.componentInstance.viewMode = this.viewMode;
    modalRef.result.then((data: any[]) => {
      this.pendingAttachment = data;
      this.attachmentList = [
        ...this.attachmentList, ...data.map(a => ({
          name: a.name,
          type: a.type,
          attachment: a.attachment,
          IsNew: true
        }))
      ]
      this.numberOfAttachments = this.attachmentList.length;
    })
  }

  hasUnsavedChanges(): boolean {
    return this.newPurchaseRequestForm.dirty || this.itemForm.dirty || this.newPurchaseRequestData.length > 0;
  }

}  