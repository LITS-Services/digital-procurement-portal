import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbAccordion, NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, id, SelectionType } from '@swimlane/ngx-datatable';
import { DatatableData } from 'app/data-tables/data/datatables.data';
import { PurchaseRequestAttachmentModalComponent } from 'app/shared/modals/purchase-request-attachment-modal/purchase-request-attachment-modal.component';
import { CompanyService, VendorUserDropdown } from 'app/shared/services/Company.services';
import { PurchaseRequestService, UploadedFile } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { ToastrService } from 'ngx-toastr';
import { PurchaseRequestRemarksComponent } from '../purchase-request-remarks/purchase-request-remarks.component';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';
import Swal from 'sweetalert2';
import { is } from 'core-js/core/object';

@Component({
  selector: 'app-new-purchase-request',
  templateUrl: './new-purchase-request.component.html',
  styleUrls: ['./new-purchase-request.component.scss']
})
export class NewPurchaseRequestComponent implements OnInit {
  isNewForm = true; // true = create, false = edit
  isFormDirty = false; // track if any field was touched
  currentRequisitionNo!: string;

  isStatusCompleted: boolean = false;
  isStatusInProcess: boolean = false;
  isSubmitter: boolean = false;

  pendingAttachment: any[] = [];
  attachmentList: any[] = [];
  numberOfAttachments = 0;

  newPurchaseItemData = [];

  workflowList: any[] = []
  workflowTypes: any[] = [];

  // new work
  itemList: any[] = [];
  unitsOfMeasurementList: any[] = [];
  accountList: any[] = [];


  vendorUsers: any[] = [];

  viewMode = false;

  newPurchaseRequestForm: FormGroup;
  itemForm: FormGroup;

  editingRowIndex: number | null = null; // Track row being edited

  public chkBoxSelected = [];
  loading = false;
  // public rows = [];
  public rows = DatatableData;
  columns = [];
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  currentRequestId: number | null = null;

  @ViewChild('accordion') accordion: NgbAccordion;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private purchaseRequestService: PurchaseRequestService,
    private companyService: CompanyService,
    private fb: FormBuilder,
    public toastr: ToastrService,
    private WorkflowServiceService: WorkflowServiceService,
    public cdr: ChangeDetectorRef

  ) { }

  ngOnInit(): void {

    this.loadVendorUsers();
    this.loadUnitsOfMeasurements();
    this.loadAccounts();
    this.loadItems();
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      const mode = params.get('mode');

      this.viewMode = mode === 'view';
      this.isNewForm = !id;

      if (id) {
        this.currentRequestId = +id;
        this.loadExistingRequest(+id);
      }

      // if (this.viewMode) {
      //   this.newPurchaseRequestForm.disable();
      //   this.itemForm.disable();
      // }
    });

    // Main form
    this.newPurchaseRequestForm = this.fb.group({
      requisitionNo: [''],
      submittedDate: [null],
      deliveryLocation: [''],
      receiverName: [''],
      receiverContact: [''],
      status: [''],
      department: [''],
      designation: [''],
      businessUnit: [''],
      partialDeliveryAcceptable: [null],
      exceptionPolicy: [null],
      subject: [''],
      workflowMasterId: [0],
      workflowName: [''],
      workflowType: [''],
      createdBy: [''],
      // attachments: this.fb.group({
      //   specifications: [false],
      //   drawing: [false],
      //   scopeOfWorks: [false],
      //   billOfMaterials: [false],
      //   other: [''],
      //   attachment: [''],
      //   specialInstructions: ['']
      // })
    });
    this.newPurchaseRequestForm.valueChanges.subscribe(() => {
      this.isFormDirty = true;
    });

    this.newPurchaseRequestForm.get('workflowType')?.valueChanges.subscribe(selectedId => {
      if (selectedId) {
        this.GetWorkflowMasterByTypeId(selectedId);
      }
    });

    // Item form
    this.itemForm = this.fb.group({
      id: [null],
      requisitionNo: [''],
      itemType: [''],
      itemId: [0],
      unitOfMeasurementId: [0],
      amount: [0],
      unitCost: [0],
      orderQuantity: [0],
      reqByDate: [null],
      itemDescription: [''],
      vendorUserId: [''],
      createdBy: [''],
      accountId: [0],
      remarks: [''],
      purchaseRequestId: [0],
      attachments: this.fb.group([])
    })
    this.itemForm.valueChanges.subscribe(() => {
      this.isFormDirty = true;
    });


    // // Check if editing existing request
    // this.route.queryParamMap.subscribe(params => {
    //   const id = params.get('id');
    //   if (id) {
    //     this.currentRequestId = +id;
    //     this.loadExistingRequest(+id);
    //   }
    // });

    if (this.viewMode) {
      this.newPurchaseRequestForm.disable();
      this.itemForm.disable();
    }
  }

  loadVendorUsers() {
    this.companyService.getVendorUsers().subscribe(response => {
      this.vendorUsers = response.$values ?? [];
    });
  }

  loadUnitsOfMeasurements() {
    this.purchaseRequestService.getAllUnitsOfMeasurements().subscribe(res => {
      this.unitsOfMeasurementList = res.$values ?? [];
    });
  }

  loadAccounts() {
    this.purchaseRequestService.getAllAccounts().subscribe(res => {
      this.accountList = res.$values ?? [];
    });
  }

  loadItems() {
    this.purchaseRequestService.getAllItems().subscribe(res => {
      this.itemList = res.$values ?? [];
    });
  }

  onWorkflowTypeChange(selectedId: number): void {
    if (selectedId) {
      this.GetWorkflowMasterByTypeId(selectedId);
    }
  }

  GetWorkflowMasterByTypeId(id: number): void {
    this.WorkflowServiceService.GetWorkflowMasterByTypeId(id).subscribe({
      next: (data: any) => {
        // Fix: Extract $values if it exists
        this.workflowList = data.$values ?? data;
      },
      error: (err) => {
        console.error("Error fetching workflow master list:", err);
      }
    });
  }

  getWorkflowTypes(): void {
    this.WorkflowServiceService.getWorkflowTypes().subscribe({
      next: (data: any) => {
        // Fix: Extract $values if it exists
        this.workflowTypes = data.$values ?? data;
      },
      error: (err) => {
        console.error("Error fetching workflow types:", err);
      }
    });
  }
  getVendorNameById(id: number): string {
    const found = this.vendorUsers.find(v => v.id === id);
    return found ? found.name : '';
  }
  private toDateInputValue(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  getUomCodeById(id: number): string {
    const found = this.unitsOfMeasurementList.find(u => u.id === id);
    return found ? found.uomCode : '';
  }

  getAccountNameById(id: number): string {
    const found = this.accountList.find(a => a.id === id);
    return found ? found.name : '';
  }
  getItemNameById(id: number): string {
    const found = this.itemList.find(i => i.id === id);
    return found ? found.itemName : '';
  }

  // Insert or Update item
  // insertItem(): void {
  //   if (this.itemForm.invalid) {
  //     console.warn("Item form is invalid");
  //     return;
  //   }

  //   const newItem = this.itemForm.value;

  //   if (this.editingRowIndex !== null) {
  //     // Update existing row
  //     this.newPurchaseRequestData[this.editingRowIndex] = newItem;
  //     this.editingRowIndex = null; // reset editing
  //   } else {
  //     // Add new row
  //     this.newPurchaseRequestData = [...this.newPurchaseRequestData, newItem];
  //   }

  //   // Reset form
  //   this.itemForm.reset({
  //     type: 'Inventory',
  //     amount: 0,
  //     unitCost: 0,
  //     orderQuantity: 1
  //   });
  // }

  // insertItem(): void {
  //   const newItem = this.itemForm.value;

  //   if (this.editingRowIndex !== null) {
  //     const existing = this.newPurchaseItemData[this.editingRowIndex];

  //     const merged = {
  //       ...existing,
  //       ...newItem,
  //       attachments: existing?.attachments ?? []
  //     };

  //     this.newPurchaseItemData = this.newPurchaseItemData.map((item, index) =>
  //       index === this.editingRowIndex ? merged : item
  //     );

  //     this.editingRowIndex = null;
  //   } else {
  //     const withEmptyAttachments = {
  //       ...newItem,
  //       itemId: Number(newItem.itemId) || 0,
  //       attachments: newItem.attachments?.length ? newItem.attachments : []
  //     };
  //     this.newPurchaseItemData = [...this.newPurchaseItemData, withEmptyAttachments];
  //   }
  //   this.toastr.success('Item inserted!', '');

  //   this.itemForm.reset();
  // }

  insertItem(): void {
  const newItem = this.itemForm.value;

  // Normalize IDs
  const newItemId = Number(newItem.itemId);
// const itemType = newItem.itemType;
//  //  Only check for itemId if the user selected "Inventory"
//   if (itemType === 'Inventory' && (!newItemId || newItemId === 0)) {
//     this.toastr.warning('Please select an item before adding.');
//     return;
//   }

//   //  For Non-Inventory, ensure description is filled (optional but recommended)
//   if (itemType === 'Non-Inventory' && !newItem.itemDescription?.trim()) {
//     this.toastr.warning('Please enter an item description before adding.');
//     return;
//   }

  // Check for duplicate (only if not editing)
  if (this.editingRowIndex === null) {
    const duplicate = this.newPurchaseItemData.some(
      item => Number(item.itemId) === newItemId
    );

    if (duplicate) {
      this.toastr.warning('This item is already added. You can update it instead.');
      return;
    }
  }

  if (this.editingRowIndex !== null) {
    // --- Update existing item ---
    const existing = this.newPurchaseItemData[this.editingRowIndex];
    const merged = {
      ...existing,
      ...newItem,
      itemId: newItemId,
      attachments: existing?.attachments ?? []
    };

    this.newPurchaseItemData = this.newPurchaseItemData.map((item, index) =>
      index === this.editingRowIndex ? merged : item
    );

    this.toastr.success('Item updated successfully!');
    this.editingRowIndex = null;
  } else {
    // --- Add new item ---
    const withEmptyAttachments = {
      ...newItem,
      itemId: newItemId,
      attachments: newItem.attachments?.length ? newItem.attachments : []
    };
    this.newPurchaseItemData = [...this.newPurchaseItemData, withEmptyAttachments];
    this.toastr.success('Item added successfully!');
  }

  // Reset form
  this.itemForm.reset({
    amount: 0,
    unitCost: 0,
    orderQuantity: 1
  });
}


  // Edit a row
  editRow(row: any, rowIndex: number) {
    this.itemForm.patchValue({
      id: row.id,
      itemType: row.itemType,
      itemId: row.itemId,
      unitOfMeasurementId: row.unitOfMeasurementId,
      amount: row.amount,
      unitCost: row.unitCost,
      orderQuantity: row.orderQuantity,
      reqByDate: this.toDateInputValue(row.reqByDate),
      itemDescription: row.itemDescription,
      vendorUserId: row.vendorUserId,
      accountId: row.accountId,
      remarks: row.remarks,
      attachments: row.attachments
    });
    this.editingRowIndex = rowIndex;
  }

  // deleteRow(rowIndex: number): void {
  //   this.newPurchaseItemData.splice(rowIndex, 1);
  //   this.newPurchaseItemData = [...this.newPurchaseItemData]; // refresh table
  //   this.toastr.success('Item deleted!', '');
  // }
  deleteRow(rowIndex: number): void {
  Swal.fire({
    title: 'Are you sure?',
    text: 'Do you want to delete this item?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
  }).then((result) => {
    if (result.isConfirmed) {
      this.newPurchaseItemData.splice(rowIndex, 1);
      this.newPurchaseItemData = [...this.newPurchaseItemData]; // refresh table
      this.toastr.success('Item deleted!', '');
    }
  });
}

  loadExistingRequest(id: number) {
    this.purchaseRequestService.getPurchaseRequestById(id).subscribe({
      next: async (data) => {
        console.log("update data: ", data)
        const loggedInUserId = localStorage.getItem('userId');
        this.isSubmitter = data.submitterId === loggedInUserId;

        this.isNewForm = false;
        this.currentRequestId = data.id;
        this.currentRequisitionNo = data.requisitionNo;
        // this.newPurchaseRequestForm.patchValue(data);
        // patch values with formatted dates
        this.newPurchaseRequestForm.patchValue({
          ...data,
          submittedDate: this.toDateInputValue(data.submittedDate)
        });

        if (data.requestStatus?.status) {
          this.newPurchaseRequestForm.patchValue({
            status: data.requestStatus.status
          });
          if (data.requestStatus?.status === 'Completed') {
            this.isStatusCompleted = true;
            this.cdr.detectChanges();
          }
          else {
            this.isStatusCompleted = false;
            this.cdr.detectChanges();
          }
          if (data.requestStatus?.status === 'InProcess') {
            this.isStatusInProcess = true;
            this.cdr.detectChanges();
          }
          else {
            this.isStatusInProcess = false;
            this.cdr.detectChanges();
          }
        }

        if (data.items.$values) {
          this.newPurchaseItemData = data.items.$values.map((item: any) => ({
            id: item.id,
            requisitionNo: item.requisitionNo,
            itemType: item.itemType,
            itemId: item.itemId,
            itemDescription: item.itemDescription,
            amount: item.amount,
            unitCost: item.unitCost,
            unitOfMeasurementId: item.unitOfMeasurementId,
            orderQuantity: item.orderQuantity,
            reqByDate: this.toDateInputValue(item.reqByDate),
            vendorUserId: item.vendorUserId,
            accountId: item.accountId,
            remarks: item.remarks,
            createdBy: item.createdBy,
            purchaseRequestId: item.purchaseRequestId,
            attachments: item.attachments?.$values?.map((a: any) => ({
              id: a.id,
              // specifications: a.specifications || '',
              // drawing: a.drawing || '',
              // scopeOfWorks: a.scopeOfWorks || '',
              // billOfMaterials: a.billOfMaterials || '',
              // other: a.other || '',
              // specialInstructions: a.specialInstructions || '',
              content: a.content || '',
              contentType: a.contentType || '',
              fileName: a.fileName || '',
              fromForm: a.fromForm || '',
              createdDate: a.createdDate,
              modifiedDate: a.modifiedDate,
              createdBy: a.createdBy || 'current-user',
              isDeleted: a.isDeleted || false,
              purchaseItemId: a.purchaseItemId || 0,
              isNew: false
            })) || []
          }));
        }
        // this.attachmentList = data.attachments?.$values.map((a: any) => ({
        //   name: a.name,
        //   type: a.type,
        //   attachment: a.attachment,
        //   isNew: false
        // }))
        // this.pendingAttachment = [];
        // this.numberOfAttachments = this.attachmentList.length;
      },

      error: (err) => console.error('Failed to load purchase request:', err)

    });
  }


  // homePage() {
  //   if (this.isNewForm && this.isFormDirty) {
  //     const confirmSave = confirm('Do you want to save this request as a draft?');

  //     if (confirmSave) {
  //       this.saveAsDraftAndGoBack();
  //     } else {
  //       this.router.navigate(['/purchase-request']);
  //     }
  //   } else {
  //     this.router.navigate(['/purchase-request']);
  //   }
  // }

  homePage() {
  if (this.isNewForm && this.isFormDirty) {
    Swal.fire({
      title: 'Save as Draft?',
      text: 'Do you want to save this request as a draft?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, save it',
      cancelButtonText: 'No, go back',
    }).then((result) => {
      if (result.isConfirmed) {
        this.saveAsDraftAndGoBack();
      } else {
        this.router.navigate(['/purchase-request']);
      }
    });
  } else {
    this.router.navigate(['/purchase-request']);
  }
}

  saveAsDraftAndGoBack() {
    // if (this.newPurchaseRequestForm.invalid) {
    //   return;
    // }

    const f = this.newPurchaseRequestForm.value;
    const submittedDateISO = f.date ? new Date(f.submittedDate).toISOString() : new Date().toISOString();

    const purchaseItems = this.newPurchaseItemData?.length
      ? this.newPurchaseItemData.map(item => ({
        id: item.id || null,
        itemType: item.itemType || '',
        itemId: Number(item.itemId) || 0,
        unitOfMeasurementId: Number(item.unitOfMeasurementId) || 0,
        amount: item.amount || 0,
        unitCost: item.unitCost || 0,
        orderQuantity: item.orderQuantity || 0,
        reqByDate: item.reqByDate || new Date(),
        itemDescription: item.itemDescription || '',
        accountId: Number(item.accountId) || 0,
        remarks: item.remarks || '',
        createdBy: item.createdBy || 'current-user',
        purchaseRequestId: item.purchaseRequestId || 0,
        vendorUserId: item.vendorUserId || '',
        requisitionNo: f.requisitionNo,
        attachments: item.attachments?.map(att => ({
          // specifications: att.specifications || '',
          // drawing: att.drawing || '',
          // scopeOfWorks: att.scopeOfWorks || '',
          // billOfMaterials: att.billOfMaterials || '',
          // other: att.other || '',
          // specialInstructions: att.specialInstructions || '',
          id: att.id || null,
          content: att.content || '',
          contentType: att.contentType || '',
          fileName: att.fileName || '',
          fromForm: att.fromForm || '',
          createdBy: 'current-user',
          isDeleted: false,
          purchaseItemId: att.purchaseItemId || 0,
        }))
      }))
      : [];

    const payload = {
      requisitionNo: f.requisitionNo || '',
      submittedDate: f.submittedDate,
      deliveryLocation: f.deliveryLocation || '',
      receiverName: f.receiverName || '',
      receiverContact: f.receiverContact || '',
      status: 'Draft',
      department: f.department || '',
      designation: f.designation || '',
      businessUnit: f.businessUnit || '',
      partialDeliveryAcceptable: f.partialDeliveryAcceptable || false,
      exceptionPolicy: f.exceptionPolicy || false,
      subject: f.subject || '',
      workflowMasterId: Number(f.workflowMasterId) || 0,
      createdBy: f.createdBy || 'USER',
      purchaseItems
    };

    this.loading = true;


    const request$ = this.purchaseRequestService.createPurchaseRequest({ purchaseRequest: payload, isDraft: true });

    request$.subscribe({
      next: () => this.handleDraftSuccess(),
      error: (err) => this.handleDraftError(err)
    });
  }

  private handleDraftSuccess() {

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
    // if (!this.newPurchaseRequestForm.valid) {
    //   console.warn('Form is invalid');
    //   return;
    // }

    const f = this.newPurchaseRequestForm.value;
    const submittedDateISO = f.submittedDate ? new Date(f.submittedDate).toISOString() : new Date().toISOString();

    const purchaseItems = this.newPurchaseItemData?.length
      ? this.newPurchaseItemData.map(item => ({
        id: item.id || null,
        itemType: item.itemType || '',
        itemId: Number(item.itemId) || 0,
        unitOfMeasurementId: Number(item.unitOfMeasurementId) || 0,
        amount: item.amount || 0,
        unitCost: item.unitCost || 0,
        orderQuantity: item.orderQuantity || 0,
        reqByDate: item.reqByDate || new Date(),
        itemDescription: item.itemDescription || '',
        accountId: Number(item.accountId) || 0,
        remarks: item.remarks || '',
        createdBy: item.createdBy || 'current-user',
        purchaseRequestId: item.purchaseRequestId || 0,
        vendorUserId: item.vendorUserId || '',
        requisitionNo: f.requisitionNo,
        attachments: item.attachments?.map(att => ({
          // specifications: att.specifications || '',
          // drawing: att.drawing || '',
          // scopeOfWorks: att.scopeOfWorks || '',
          // billOfMaterials: att.billOfMaterials || '',
          // other: att.other || '',
          // specialInstructions: att.specialInstructions || '',
          id: att.id || null,
          content: att.content || '',
          contentType: att.contentType || '',
          fileName: att.fileName || '',
          fromForm: att.fromForm || '',
          createdBy: 'current-user',
          isDeleted: false,
          purchaseItemId: att.purchaseItemId || 0,
        }))
      }))
      : [];

    const payload = {
      requisitionNo: f.requisitionNo,
      submittedDate: f.submittedDate,
      deliveryLocation: f.deliveryLocation,
      receiverName: f.receiverName,
      receiverContact: f.receiverContact,
      // status: f.status,
      department: f.department,
      designation: f.designation,
      businessUnit: f.businessUnit,
      partialDeliveryAcceptable: f.partialDeliveryAcceptable,
      exceptionPolicy: f.exceptionPolicy,
      subject: f.subject,
      workflowMasterId: Number(f.workflowMasterId) || 0,
      createdBy: f.createdBy || 'USER',
      purchaseItems
    };

    if (this.currentRequestId) {
      this.purchaseRequestService.updatePurchaseRequest(this.currentRequestId, payload).subscribe({
        next: res => {
          console.log('Purchase Request Updated:', res);
          this.loading = false;
          this.router.navigate(['/purchase-request']);
          this.toastr.success('Request is updated!', '');
        },
        error: err => {
          console.error('Error updating Purchase Request:', err);
          this.toastr.success('Something went Wrong', '');
          this.loading = false;
        }
      });
    }
    else {
      this.purchaseRequestService.createPurchaseRequest({ purchaseRequest: payload, isDraft: false }).subscribe({
        next: res => {
          console.log('Purchase Request Created:', res);
          // this.attachmentList.forEach(a => a.isNew = false);
          // this.numberOfAttachments = this.attachmentList.length;
          this.loading = false;

          this.router.navigate(['/purchase-request']);
          this.toastr.success('Request is created!', '');
        },
        error: err => {
          console.error('Error creating Purchase Request:', err);
          this.toastr.success('Something went wrong');
          this.loading = false;
        }
      });
    }
  }

  // openNewEntityModal() {
  //   const modalRef = this.modalService.open(PurchaseRequestAttachmentModalComponent, {
  //     backdrop: 'static',
  //     size: 'lg',
  //     centered: true,
  //   });
  //   modalRef.componentInstance.data = {
  //     existingAttachment: this.attachmentList
  //   }
  //   modalRef.componentInstance.viewMode = this.viewMode;
  //   modalRef.result.then((data: any[]) => {
  //     this.pendingAttachment = data;
  //     this.attachmentList = [
  //       ...this.attachmentList, ...data.map(a => ({
  //         name: a.name,
  //         type: a.type,
  //         attachment: a.attachment,
  //         IsNew: true
  //       }))
  //     ]
  //     this.numberOfAttachments = this.attachmentList.length;
  //   })
  // }

  openNewEntityModal(rowIndex: number): void {
    const sourceRow = rowIndex !== null
      ? this.newPurchaseItemData[rowIndex] : this.itemForm.value; // new item (not yet inserted)
    console.log("Source Row:", sourceRow);
    const modalRef = this.modalService.open(PurchaseRequestAttachmentModalComponent, {
      backdrop: 'static',
      size: 'lg',
      centered: true,
    });

    modalRef.componentInstance.viewMode = this.viewMode;
    modalRef.componentInstance.data = {
      purchaseItemId: sourceRow?.id ?? 0,
      existingAttachment: sourceRow?.attachments || []
    };

    modalRef.result.then((data: any[]) => {
      if (data?.length) {
        const merged = [
          ...(sourceRow.attachments || []),
          ...data.map(a => ({
            // specifications: a.specifications,
            // drawing: a.drawing,
            // scopeOfWorks: a.scopeOfWorks,
            // billOfMaterials: a.billOfMaterials,
            // other: a.other,
            // specialInstructions: a.specialInstructions,
            fileName: a.fileName,
            contentType: a.contentType,
            content: a.content,
            fromForm: a.fromForm,
            purchaseItemId: sourceRow?.id ?? 0,
            isNew: true
          }))
        ];

        if (rowIndex !== null) {
          // immutably update the edited row in the grid
          this.newPurchaseItemData = this.newPurchaseItemData.map((r, i) =>
            i === rowIndex ? { ...r, attachments: merged } : r
          );

        } else {
          // reflect on the form for a new (not yet inserted) item
          this.itemForm.patchValue({ attachments: merged });
        }
        // this.numberOfAttachments = this.attachmentList.length;
      }
    }).catch(() => { });
  }

  hasUnsavedChanges(): boolean {
    return this.newPurchaseRequestForm.dirty || this.itemForm.dirty || this.newPurchaseItemData.length > 0;
  }

  //   onSubmitForApproval() {
  //   this.purchaseRequestService.submitForApproval(this.currentRequestId).subscribe({
  //     next: (res) => {
  //       this.toastr.success(res.message || 'Purchase Request submitted for approval successfully!');
  //       this.router.navigate(['/purchase-request']);
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.toastr.error('Failed to submit purchase request for approval.');
  //     }
  //   });
  // }

onSubmitForApproval() {
  Swal.fire({
    title: 'Submit for Approval?',
    text: 'Are you sure you want to submit this Purchase Request for approval?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, submit it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
  }).then((result) => {
    if (result.isConfirmed) {
      this.purchaseRequestService.submitForApproval(this.currentRequestId).subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: 'Submitted!',
            text: res.message || 'Purchase Request submitted for approval successfully!',
            confirmButtonColor: '#3085d6',
          }).then(() => {
            this.router.navigate(['/purchase-request']);
          });
        },
        error: (err) => {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Failed!',
            text: 'Failed to submit purchase request for approval.',
          });
        },
      });
    }
  });
}


  onAddRemarks(action: string): void {
    const modalRef = this.modalService.open(PurchaseRequestRemarksComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.action = action;
    modalRef.componentInstance.requisitionNo = this.currentRequisitionNo;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loading = true;
          const payload = {
            RequisitionNo: this.currentRequisitionNo,
            Remarks: result.remarks,
            ActionTaken: action,
            ApproverId: localStorage.getItem('userId')
          };

          this.purchaseRequestService.addRemarksWithActionTaken(payload).subscribe({
            next: res => {
              this.loading = false;
              if (res.message == "Approved") {
                this.router.navigate(['/purchase-request']);
                this.toastr.success(res.message);
              }
              else {
                this.toastr.warning(res.message);
              }
            },
            error: err => {
              this.toastr.warning('Something went Wrong', '');
              this.loading = false;
            }
          });


        }
      },
      (reason) => {
        console.log(`Modal dismissed: ${reason}`);
      }
    );
  }

}  