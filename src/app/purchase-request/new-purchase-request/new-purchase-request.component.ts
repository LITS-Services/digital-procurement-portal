import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbAccordion, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, id, SelectionType } from '@swimlane/ngx-datatable';
import { DatatableData } from 'app/data-tables/data/datatables.data';
import { PurchaseRequestAttachmentModalComponent } from 'app/shared/modals/purchase-request-attachment-modal/purchase-request-attachment-modal.component';
import { CompanyService } from 'app/shared/services/Company.services';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { ToastrService } from 'ngx-toastr';
import { PurchaseRequestRemarksComponent } from '../purchase-request-remarks/purchase-request-remarks.component';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';
import Swal from 'sweetalert2';
import { LookupService } from 'app/shared/services/lookup.service';
import { CompanyVM, VendorAndCompanyForFinalSelectionVM } from 'app/shared/interfaces/vendor-company-final-selection.model';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-new-purchase-request',
  templateUrl: './new-purchase-request.component.html',
  styleUrls: ['./new-purchase-request.component.scss']
})

export class NewPurchaseRequestComponent implements OnInit {
  uploadedItems: any[] = [];

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

  isSelectingFinalVendor: boolean = false;
  // finalVendors: any[] = [];

  // ---------------
  finalVendors: VendorAndCompanyForFinalSelectionVM[] = [];
  filteredCompanies = [];

  vendorList: any[] = [];
  vendorCompanyList: any[] = [];
  // accountList: any[] = [];
  // itemList: any[] = [];
  uomList: any[] = [];

    entities: Array<{ id: number; description: string }> = [];
  isEntityLocked = false;
  entityHint = '';

  procurementUserId = localStorage.getItem('userId');
  compareIds = (a: string | null, b: string | null) => (a ?? '').toLowerCase() === (b ?? '').toLowerCase();

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
    private lookupService: LookupService,
    private fb: FormBuilder,
    public toastr: ToastrService,
    private WorkflowServiceService: WorkflowServiceService,
    public cdr: ChangeDetectorRef

  ) { }

  ngOnInit(): void {

    // this.loadVendorUsers();
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
      //  Add this part for Final Vendor mode
      if (mode === 'selectVendor') {
        this.isSelectingFinalVendor = true;
        this.loadVendorsFinalSelection();
      }

    });

    // Purchase Request Form
    this.newPurchaseRequestForm = this.fb.group({
      requisitionNo: [''],
      submittedDate: [null],
      status: [null],
      deliveryLocation: [''],
      receiverName: [''],
      receiverContact: [''],
      department: [''],
      designation: [''],
      businessUnit: [''],
      partialDeliveryAcceptable: [false],
      exceptionPolicy: [false],
      subject: [''],
      entityId: [null],
    });

    this.newPurchaseRequestForm.valueChanges.subscribe(() => {
      this.isFormDirty = true;
    });

    this.newPurchaseRequestForm.get('workflowType')?.valueChanges.subscribe(selectedId => {
      if (selectedId) {
        this.GetWorkflowMasterByTypeId(selectedId);
      }
    });

    // Purchase Item Form
    this.itemForm = this.fb.group({
      id: [null],
      requisitionNo: [''],
      itemType: ['', Validators.required],
      itemId: [0],
      unitOfMeasurementId: [0],
      amount: [0],
      unitCost: [0],
      orderQuantity: [0],
      reqByDate: [null],
      itemDescription: [''],
      vendorUserId: [null],
      vendorCompanyId: [null],
      accountId: [0],
      remarks: [''],
      attachments: this.fb.group([])
    })

    // this.itemForm = this.fb.group({
    //   id: [null],
    //   requisitionNo: [''],
    //   itemType: ['', Validators.required],
    //   itemId: [0, Validators.required],
    //   unitOfMeasurementId: [0, Validators.required],
    //   amount: [0],
    //   unitCost: [0, Validators.required],
    //   orderQuantity: [0, Validators.required],
    //   reqByDate: [null, Validators.required],
    //   itemDescription: ['', Validators.required],
    //   vendorUserId: [null],
    //   vendorCompanyId: [null],
    //   accountId: [0, Validators.required],
    //   remarks: ['', Validators.required],
    //   attachments: this.fb.group({})
    // });

    this.itemForm.valueChanges.subscribe(values => {
      const total = (values.unitCost || 0) * (values.orderQuantity || 0);
      this.itemForm.patchValue({ amount: total }, { emitEvent: false });
    });

    this.itemForm.valueChanges.subscribe(() => {
      this.isFormDirty = true;
    });

        this.checkEntitySelection();
    if (this.viewMode) {
      this.newPurchaseRequestForm.disable();
      this.itemForm.disable();
    }
  }

    private checkEntitySelection(): void {
    if (!this.isNewForm) return;
    this.applyEntity(null);
  }

   private applyEntity(prId: number | null): void {
    const ctrl = this.newPurchaseRequestForm.get('entityId');
    if (!ctrl) return;

    const lsEntity = localStorage.getItem('selectedCompanyId');
    const userId = localStorage.getItem('userId') || '';

    const wantsLock = !!lsEntity && lsEntity !== 'All';
    const desiredId: number | null = wantsLock ? Number(lsEntity) : prId ?? null;

    const setUI = () => {
      // set value if exist (update mode/already selected entity)
      if (desiredId != null && this.entities?.some((e) => e.id === desiredId)) {
        ctrl.setValue(desiredId, { emitEvent: false });
      } else if (!wantsLock) {
        // allow user to choose ('All entity case')
        ctrl.setValue(null, { emitEvent: false });
      }

      // disable field
      this.isEntityLocked = wantsLock;
      this.entityHint = wantsLock ? 'To change entity, select it from the top bar' : '';
      if (prId) {
        this.isEntityLocked = true;
        ctrl.disable({ emitEvent: false });

        this.entityHint = lsEntity === 'All' ? 'Entity cannot be changed in update mode' : '';
      } else {
        this.isEntityLocked = wantsLock;
        this.entityHint = wantsLock ? 'To change entity, select it from the top bar' : '';

        if (wantsLock) ctrl.disable({ emitEvent: false });
        else ctrl.enable({ emitEvent: false });
      }
      this.cdr.markForCheck();
    };

    if (!this.entities?.length && userId) {
      this.loadEntitiesForUser(userId, () => setUI());
    } else {
      setUI();
    }
  }

    private loadEntitiesForUser(userId: string, after?: () => void): void {
    this.lookupService.getProcCompaniesByProcUserId(userId).subscribe({
      next: (res: any[]) => {
        this.entities = res || [];
        after?.();
      },
      error: (err) => console.error('Error fetching entities:', err),
    });
  }

  loadUnitsOfMeasurements() {
    this.lookupService.getAllUnitsOfMeasurement().subscribe({
      next: (res) => {
        this.unitsOfMeasurementList = res ?? [];
        console.log('UoM dropdown data:', this.unitsOfMeasurementList);
      },
      error: (err) => {
        console.error('Failed to load UoM dropdown:', err);
      }
    });
  }

  loadAccounts() {
    this.lookupService.getAllAccounts().subscribe({
      next: (res) => {
        this.accountList = res ?? [];
        console.log('Account dropdown data:', this.accountList);
      },
      error: (err) => {
        console.error('Failed to load Account dropdown:', err);
      }
    });
  }

  loadItems() {
    this.lookupService.getAllItems().subscribe({
      next: (res) => {
        this.itemList = res ?? [];
        console.log('Item dropdown data:', this.itemList);
      },
      error: (err) => {
        console.error('Failed to load items dropdown:', err);
      }
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

  getVendorNameById(id: string): string {
    const found = this.finalVendors.find(v => v.vendorId === id);
    return found ? found.vendorName : '';
  }

  // private toDateInputValue(date: any): string | null {
  //   if (!date) return null;
  //   const d = new Date(date);
  //   return d.toISOString().split('T')[0];
  // }

  toDateInputValue(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`; // correct format for input[type="date"]
  }

  getUomCodeById(id: number): string {
    const found = this.unitsOfMeasurementList.find(u => u.id === id);
    return found ? found.description : '';
  }

  getAccountNameById(id: number): string {
    const found = this.accountList.find(a => a.id === id);
    return found ? found.description : '';
  }
  getItemNameById(id: number): string {
    const found = this.itemList.find(i => i.id === id);
    return found ? found.description : '';
  }

  // insertItem(): void {
  //   const newItem = this.itemForm.value;
  //   const newItemId = Number(newItem.itemId);

  //   // Duplicate check — works for add and edit both
  //   const duplicate = this.newPurchaseItemData.some((item, index) =>
  //     index !== this.editingRowIndex && Number(item.itemId) === newItemId
  //   );

  //   if (duplicate) {
  //     this.toastr.warning('This item is already added. You can update it instead.');
  //     return;
  //   }

  //   if (this.editingRowIndex !== null) {
  //     const existing = this.newPurchaseItemData[this.editingRowIndex];
  //     const merged = {
  //       ...existing,
  //       ...newItem,
  //       itemId: newItemId,
  //       attachments: existing?.attachments ?? []
  //     };

  //     // Immutable update to trigger ngx-datatable refresh
  //     this.newPurchaseItemData = this.newPurchaseItemData.map((item, idx) =>
  //       idx === this.editingRowIndex ? merged : item
  //     );

  //     this.toastr.success('Item updated successfully!');
  //     this.editingRowIndex = null;

  //   } else {
  //     // Add new
  //     const withEmptyAttachments = {
  //       ...newItem,
  //       itemId: newItemId,
  //       attachments: newItem.attachments?.length ? newItem.attachments : []
  //     };
  //     this.newPurchaseItemData = [...this.newPurchaseItemData, withEmptyAttachments];
  //     this.toastr.success('Item added successfully!');
  //   }

  //   this.itemForm.reset({
  //     amount: 0,
  //     unitCost: 0,
  //     orderQuantity: 1
  //   });
  // }

  insertItem(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      this.toastr.warning('Please fill all required fields before inserting.');
      return;
    }

    const newItem = this.itemForm.value;
    const newItemId = Number(newItem.itemId);

    // Duplicate check — works for add and edit both
    const duplicate = this.newPurchaseItemData.some((item, index) =>
      index !== this.editingRowIndex && Number(item.itemId) === newItemId
    );

    if (duplicate) {
      this.toastr.warning('This item is already added. You can update it instead.');
      return;
    }

    if (this.editingRowIndex !== null) {
      //  Edit mode: update the selected row (manual or bulk)
      const existing = this.newPurchaseItemData[this.editingRowIndex];
      const merged = {
        ...existing,
        ...newItem,
        itemId: newItemId,
        attachments: existing?.attachments ?? []
      };

      this.newPurchaseItemData = this.newPurchaseItemData.map((item, idx) =>
        idx === this.editingRowIndex ? merged : item
      );

      this.toastr.success('Item updated successfully!');
      this.editingRowIndex = null;
    } else {
      //  Always append a new manual row (no duplicate restriction)
      const withEmptyAttachments = {
        ...newItem,
        itemId: newItemId,
        attachments: newItem.attachments?.length ? newItem.attachments : []
      };

      this.newPurchaseItemData = [...this.newPurchaseItemData, withEmptyAttachments];
      this.toastr.success('Item added successfully!');
    }

    //  Reset form after add/update
    this.itemForm.reset({
      amount: 0,
      unitCost: 0,
      orderQuantity: 1
    });
  }

  // Edit a row
  // editRow(row: any, rowIndex: number) {
  //   this.editingRowIndex = rowIndex;
  //   this.itemForm.patchValue({
  //     id: row.id,
  //     itemType: row.itemType,
  //     itemId: row.itemId,
  //     unitOfMeasurementId: row.unitOfMeasurementId,
  //     amount: row.amount,
  //     unitCost: row.unitCost,
  //     orderQuantity: row.orderQuantity,
  //     reqByDate: this.toDateInputValue(row.reqByDate),
  //     itemDescription: row.itemDescription,
  //     vendorUserId: row.vendorUserId,
  //     // vendorCompanyId: row.vendorCompanyId,
  //     accountId: row.accountId,
  //     remarks: row.remarks,
  //     attachments: row.attachments
  //   });

  //   this.onVendorChange(row.vendorUserId);

  //   Promise.resolve().then(() => {
  //     this.itemForm.patchValue({ vendorCompanyId: row.vendorCompanyId }, { emitEvent: false });
  //   });

  //   // this.editingRowIndex = rowIndex;
  // }

  editRow(row: any, rowIndex: number) {
    // mark which row is being edited
    this.editingRowIndex = rowIndex;

    // patch form values from the selected row
    this.itemForm.patchValue({
      id: row.id || null,
      itemType: row.itemType || '',
      itemId: Number(row.itemId) || null,
      unitOfMeasurementId: Number(row.unitOfMeasurementId) || null,
      orderQuantity: Number(row.orderQuantity) || 1,
      unitCost: Number(row.unitCost) || 0,
      amount: Number(row.amount) || 0,
      // reqByDate: row.reqByDate ? this.toDateInputValue(row.reqByDate) : '',
      reqByDate: row.reqByDate ? this.toDateInputValue(row.reqByDate) : '', // <-- fixed
      itemDescription: row.itemDescription || '',
      vendorUserId: row.vendorUserId || null,
      vendorCompanyId: row.vendorCompanyId || null,
      accountId: Number(row.accountId) || null,
      remarks: row.remarks || '',
      attachments: row.attachments || []
    });

    // if vendor changes, refresh vendor company list
    if (row.vendorUserId) {
      this.onVendorChange(row.vendorUserId);
    }

    // ensure vendor company dropdown syncs after async data
    Promise.resolve().then(() => {
      this.itemForm.patchValue(
        { vendorCompanyId: row.vendorCompanyId || null },
        { emitEvent: false }
      );
    });
  }

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
    this.loading = true;
    this.purchaseRequestService.getPurchaseRequestById(id).subscribe({
      next: async (data) => {

        // unwrap the Ardalis.Result<T> wrapper
        const requestData = data;

        const loggedInUserId = localStorage.getItem('userId');
        this.isSubmitter = requestData.submitterId === loggedInUserId;

        this.isNewForm = false;
        this.currentRequestId = requestData.id;
        this.currentRequisitionNo = requestData.requisitionNo;

        this.newPurchaseRequestForm.patchValue({
          ...requestData,
          submittedDate: this.toDateInputValue(requestData.submittedDate)
        });

        if (requestData.requestStatus) {
          this.newPurchaseRequestForm.patchValue({
            status: requestData.requestStatus
          });
          if (requestData.requestStatus === 'Completed') {
            this.isStatusCompleted = true;
            this.cdr.detectChanges();
          }
          else {
            this.isStatusCompleted = false;
            this.cdr.detectChanges();
          }
          if (requestData.requestStatus === 'InProcess') {
            this.isStatusInProcess = true;
            this.cdr.detectChanges();
          }
          else {
            this.isStatusInProcess = false;
            this.cdr.detectChanges();
          }
        }

        if (requestData.purchaseItems) {
          const itemList = requestData.purchaseItems || [];

          this.newPurchaseItemData = itemList.map((item: any) => ({
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
            vendorCompanyId: item.vendorCompanyId,
            accountId: item.accountId,
            remarks: item.remarks,
            createdBy: item.createdBy,
            purchaseRequestId: item.purchaseRequestId,
            attachments: (item.attachments || []).map((a: any) => ({
              id: a.id,
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
            }))
          }));
        }
        const prEntityId = Number(requestData.entityId) || null;
        this.applyEntity(prEntityId);
        this.loading = false;
        this.cdr.detectChanges();
      },

      error: (err) => {
        this.loading = false;
        console.error('Failed to load purchase request:', err)
      }
    });
  }

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

    const f = this.newPurchaseRequestForm.getRawValue();
    const submittedDateISO = f.date ? new Date(f.submittedDate).toISOString() : new Date().toISOString();
    const entityId = Number(localStorage.getItem('selectedCompanyId'));

        const lsEntity = localStorage.getItem('selectedCompanyId');
    const finalEntityId = lsEntity === 'All' ? Number(f.entityId) : Number(lsEntity);

    if (lsEntity === 'All' && !finalEntityId) {
      this.toastr.info('Please select an Entity.');
      return;
    }

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
        createdBy: item.createdBy || '',
        purchaseRequestId: item.purchaseRequestId || 0,
        vendorUserId: item.vendorUserId || null,
        vendorCompanyId: item.vendorCompanyId || null,
        requisitionNo: f.requisitionNo,
        attachments: item.attachments?.map(att => ({

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
      submittedDate: f.submittedDate || null,
      deliveryLocation: f.deliveryLocation || '',
      receiverName: f.receiverName || '',
      receiverContact: f.receiverContact || '',
      // status: 'Draft',
      department: f.department || '',
      designation: f.designation || '',
      businessUnit: f.businessUnit || '',
      partialDeliveryAcceptable: f.partialDeliveryAcceptable || false,
      exceptionPolicy: f.exceptionPolicy || false,
      subject: f.subject || '',
      workflowMasterId: Number(f.workflowMasterId) || 0,
      createdBy: f.createdBy || '',
      entityId: finalEntityId,
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
    // this.toastr.success('Draft saved successfully');
    this.router.navigate(['/purchase-request']);
  }

  private handleDraftError(err: any) {
    this.loading = false;
    this.toastr.error('Failed to save draft');
    console.error('Error saving draft:', err);
  }

  submitForm() {
    if (!this.newPurchaseRequestForm.valid) {
      this.toastr.warning('Form is invalid');
      return;
    }
    const entityId = localStorage.getItem('selectedCompanyId');
    const f = this.newPurchaseRequestForm.getRawValue();
    const submittedDateISO = f.submittedDate ? new Date(f.submittedDate).toISOString() : new Date().toISOString();

       const lsEntity = localStorage.getItem('selectedCompanyId');
    const finalEntityId = lsEntity === 'All' ? Number(f.entityId) : Number(lsEntity);

    if (lsEntity === 'All' && !finalEntityId) {
      this.toastr.info('Please select an Entity.');
      return;
    }

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
        createdBy: item.createdBy || '',
        // purchaseRequestId: item.purchaseRequestId || 0,
        vendorUserId: item.vendorUserId || null,
        vendorCompanyId: item.vendorCompanyId || null,
        requisitionNo: f.requisitionNo,
        attachments: item.attachments?.map(att => ({

          id: att.id || null,
          content: att.content || '',
          contentType: att.contentType || '',
          fileName: att.fileName || '',
          fromForm: att.fromForm || '',
          createdBy: att.createdBy || '',
          // isDeleted: false,
          // purchaseItemId: att.purchaseItemId || 0,
        }))
      }))
      : [];

    const payload = {
      requisitionNo: f.requisitionNo,
      submittedDate: f.submittedDate || null,
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
      // workflowMasterId: Number(f.workflowMasterId) || 0,
      // createdBy: f.createdBy || 'USER',
      entityId: finalEntityId,
      purchaseItems
    };

    if (this.currentRequestId) {
      this.purchaseRequestService.updatePurchaseRequest(this.currentRequestId, { purchaseRequest: payload }).subscribe({
        next: res => {
          this.loading = false;
          this.router.navigate(['/purchase-request']);
        },
        error: err => {
          console.error('Error updating Purchase Request:', err);
          this.toastr.error('Something went wrong.', '');
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
        },
        error: err => {
          console.error('Error creating Purchase Request:', err);
          this.toastr.error('Something went wrong.');
          this.loading = false;
        }
      });
    }
  }

  // openNewEntityModal(rowIndex: number): void {
  //   const sourceRow = rowIndex !== null
  //     ? this.newPurchaseItemData[rowIndex] : this.itemForm.value; // new item (not yet inserted)
  //   console.log("Source Row:", sourceRow);
  //   const modalRef = this.modalService.open(PurchaseRequestAttachmentModalComponent, {
  //     backdrop: 'static',
  //     size: 'lg',
  //     centered: true,
  //   });

  //   modalRef.componentInstance.viewMode = this.viewMode;
  //   modalRef.componentInstance.data = {
  //     purchaseItemId: sourceRow?.id ?? 0,
  //     existingAttachment: sourceRow?.attachments || []
  //   };

  //   modalRef.result.then((data: any[]) => {
  //     if (data?.length) {
  //       const merged = [
  //         ...(sourceRow.attachments || []),
  //         ...data.map(a => ({
  //           fileName: a.fileName,
  //           contentType: a.contentType,
  //           content: a.content,
  //           fromForm: a.fromForm,
  //           purchaseItemId: sourceRow?.id ?? 0,
  //           isNew: true
  //         }))
  //       ];

  //       if (rowIndex !== null) {
  //         // immutably update the edited row in the grid
  //         this.newPurchaseItemData = this.newPurchaseItemData.map((r, i) =>
  //           i === rowIndex ? { ...r, attachments: merged } : r
  //         );

  //       } else {
  //         // reflect on the form for a new (not yet inserted) item
  //         this.itemForm.patchValue({ attachments: merged });
  //       }
  //       // this.numberOfAttachments = this.attachmentList.length;
  //     }
  //   }).catch(() => { });
  // }
  openNewEntityModal(rowIndex: number | null = null) {
  const modalRef = this.modalService.open(PurchaseRequestAttachmentModalComponent, {
      backdrop: 'static',
      size: 'lg',
      centered: true,
    });

  // Pass existing attachments to modal
  modalRef.componentInstance.data = {
    existingAttachment: rowIndex !== null
      ? this.newPurchaseItemData[rowIndex].attachments || []
      : this.itemForm.get('attachments')?.value || [],
    purchaseItemId: rowIndex !== null ? this.newPurchaseItemData[rowIndex].id : 0
  };

  // Listen to changes immediately
  modalRef.componentInstance.attachmentsChange.subscribe((attachments: any[]) => {
    if (rowIndex !== null) {
      this.newPurchaseItemData = this.newPurchaseItemData.map((item, i) =>
        i === rowIndex ? { ...item, attachments } : item
      );
    } else {
      this.itemForm.patchValue({ attachments });
    }
  });

  // Optional: final payload when modal closes
  modalRef.result.then((data: any[]) => {
    if (data) {
      // merge with existing to avoid duplicates
      if (rowIndex !== null) {
        const existingAttachments = this.newPurchaseItemData[rowIndex].attachments || [];
        const merged = [...existingAttachments, ...data.filter(d => !existingAttachments.some(e => e.fileName === d.fileName))];
        this.newPurchaseItemData[rowIndex].attachments = merged;
      } else {
        const existingAttachments = this.itemForm.get('attachments')?.value || [];
        const merged = [...existingAttachments, ...data.filter(d => !existingAttachments.some(e => e.fileName === d.fileName))];
        this.itemForm.patchValue({ attachments: merged });
      }
    }
  }).catch(() => {});
}


  hasUnsavedChanges(): boolean {
    return this.newPurchaseRequestForm.dirty || this.itemForm.dirty || this.newPurchaseItemData.length > 0;
  }

  onSubmitForApproval() {
    Swal.fire({
      title: 'Submit for Approval?',
      text: 'Are you sure you want to submit this Purchase Request for approval?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, submit it',
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
                this.cdr.detectChanges();
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
  loadVendorsFinalSelection() {
    this.purchaseRequestService.getVendorsAndCompanyForFinalSelection(this.procurementUserId)
      .subscribe(res => {
        this.finalVendors = res.value ?? res.data ?? res;
      });
  }

  onVendorChange(vendorId: string) {
    const vendor = this.finalVendors.find(v => v.vendorId === vendorId);
    this.filteredCompanies = vendor ? vendor.companies : [];
    // Only clear when ADDING (not editing)
    if (this.editingRowIndex === null) {
      this.itemForm.patchValue({ vendorCompanyId: null }, { emitEvent: false });
    }
    // this.itemForm.patchValue({ vendorCompanyId: null });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      console.log('Parsed Excel JSON:', jsonData);
      this.uploadedItems = jsonData;
      // this.toastr.success(`${jsonData.length} items loaded from Excel.`);
      console.log('Parsed Excel JSON:', jsonData);

    };
    reader.readAsArrayBuffer(file);
  }

  // bulkInsert(): void {
  //   // if (!this.uploadedItems.length) {
  //   //   this.toastr.warning('No items to insert.');
  //   //   return;
  //   // }

  //   //  Case 1: No uploaded items at all
  //   if (!this.uploadedItems.length) {
  //     if (this.newPurchaseItemData.length > 0) {
  //       this.toastr.info('Items already inserted.');
  //     } else {
  //       this.toastr.warning('No items to insert.');
  //     }
  //     return;
  //   }

  //   //  Allow flexible header for date
  //   const requiredColumns = [
  //     'Item Type',
  //     'Item',
  //     'U of M',
  //     'Unit Cost',
  //     'Order Quantity',
  //     'Amount',
  //     'Item Description',
  //     'Final Vendor',
  //     'Vendor Company',
  //     'Account',
  //     'Remarks'
  //   ];

  //   //  Include both possible date header variants
  //   const hasReqByDate = this.uploadedItems.some(
  //     (item) => 'Req By Date' in item || 'Req. by Date' in item
  //   );

  //   if (!hasReqByDate) {
  //     this.toastr.error('Invalid file! Missing column: Req. by Date (or Req By Date)');
  //     return;
  //   }

  //   //  Now check for other required columns
  //   const missingColumns: string[] = [];
  //   for (const col of requiredColumns) {
  //     const firstRow = this.uploadedItems[0];
  //     if (!(col in firstRow)) {
  //       missingColumns.push(col);
  //     }
  //   }

  //   if (missingColumns.length > 0) {
  //     this.toastr.error(`Invalid file! Missing columns: ${missingColumns.join(', ')}`);
  //     return;
  //   }

  //   //  Proceed if columns are valid
  //   const mappedData = this.uploadedItems.map((item) => {
  //     const rawDate = item['Req By Date'] || item['Req. by Date'];
  //     let parsedDate: Date | null = null;

  //     if (rawDate) {
  //       if (!isNaN(rawDate)) {
  //         // Excel numeric date (e.g. 45973)
  //         parsedDate = this.excelSerialToDate(Number(rawDate));
  //       } else {
  //         // Normal string date (e.g. 2025-11-03 or 03/11/2025)
  //         parsedDate = new Date(rawDate);
  //       }
  //     }

  //     return {
  //       itemType: item['Item Type'] || 'Inventory',
  //       itemId: this.getItemIdByName(item['Item']) || null,
  //       unitOfMeasurementId: this.getUOMIdByName(item['U of M']) || null,
  //       unitCost: Number(item['Unit Cost']) || 0,
  //       orderQuantity: Number(item['Order Quantity']) || 1,
  //       amount: Number(item['Unit Cost']) * Number(item['Order Quantity']),
  //       reqByDate: parsedDate,
  //       itemDescription: item['Item Description'] || '',
  //       vendorUserId: this.getVendorIdByName(item['Final Vendor']) || null,
  //       vendorCompanyId: this.getVendorCompanyIdByName(item['Vendor Company']) || null,
  //       accountId: this.getAccountIdByName(item['Account']) || null,
  //       remarks: item['Remarks'] || '',
  //       attachments: []
  //     };
  //   });

  //   // this.newPurchaseItemData = [...this.newPurchaseItemData, ...mappedData];
  //   this.newPurchaseItemData = [...mappedData];
  //   this.uploadedItems = [];
  //   this.toastr.success('Bulk items inserted successfully!');
  // }
  bulkInsert(): void {
    if (!this.uploadedItems.length) {
      if (this.newPurchaseItemData.length > 0) {
        this.toastr.info('Items already inserted.');
      } else {
        this.toastr.warning('No items to insert.');
      }
      return;
    }

    const requiredColumns = [
      'Item Type',
      'Item',
      'U of M',
      'Unit Cost',
      'Order Quantity',
      'Amount',
      'Item Description',
      'Final Vendor',
      'Vendor Company',
      'Account',
      'Remarks'
    ];

    const hasReqByDate = this.uploadedItems.some(
      (item) => 'Req By Date' in item || 'Req. by Date' in item
    );

    if (!hasReqByDate) {
      this.toastr.error('Invalid file! Missing column: Req. by Date (or Req By Date)');
      return;
    }

    const firstRow = this.uploadedItems[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));

    if (missingColumns.length > 0) {
      this.toastr.error(`Invalid file! Missing columns: ${missingColumns.join(', ')}`);
      return;
    }

    //  Map Excel data
    const mappedData = this.uploadedItems.map((item) => {
      const rawDate = item['Req By Date'] || item['Req. by Date'];
      let parsedDate: Date | null = null;

      if (rawDate) {
        if (!isNaN(rawDate)) parsedDate = this.excelSerialToDate(Number(rawDate));
        else parsedDate = new Date(rawDate);
      }

      return {
        itemType: item['Item Type'] || 'Inventory',
        itemId: this.getItemIdByName(item['Item']) || null,
        unitOfMeasurementId: this.getUOMIdByName(item['U of M']) || null,
        unitCost: Number(item['Unit Cost']) || 0,
        orderQuantity: Number(item['Order Quantity']) || 1,
        amount: Number(item['Unit Cost']) * Number(item['Order Quantity']),
        reqByDate: parsedDate,
        itemDescription: item['Item Description'] || '',
        vendorUserId: this.getVendorIdByName(item['Final Vendor']) || null,
        vendorCompanyId: this.getVendorCompanyIdByName(item['Vendor Company']) || null,
        accountId: this.getAccountIdByName(item['Account']) || null,
        remarks: item['Remarks'] || '',
        attachments: []
      };
    });

    //  Always append new bulk data after existing manual entries
    console.log('Before merge:', this.newPurchaseItemData);
    this.newPurchaseItemData = [...this.newPurchaseItemData, ...mappedData];
    console.log('After merge:', this.newPurchaseItemData);

    this.uploadedItems = [];
    this.toastr.success('Bulk items appended successfully!');
  }

  getItemIdByName(name: string): number | null {
    const item = this.itemList.find(
      (x) => x.description?.trim().toLowerCase() === name?.trim().toLowerCase()
    );
    return item ? item.id : null;
  }

  getUOMIdByName(name: string): number | null {
    const uom = this.unitsOfMeasurementList.find(
      (x) => x.description?.trim().toLowerCase() === name?.trim().toLowerCase()
    );
    return uom ? uom.id : null;
  }

  getVendorIdByName(name: string): number | null {
    const vendor = this.finalVendors.find(
      (x) => x.vendorName?.trim().toLowerCase() === name?.trim().toLowerCase()
    );
    return vendor ? Number(vendor.vendorId) : null;
  }

  getVendorCompanyIdByName(name: string): number | null {
    const company = this.filteredCompanies.find(
      (x) => x.companyName?.trim().toLowerCase() === name?.trim().toLowerCase()
    );
    return company ? company.companyId : null;
  }

  getAccountIdByName(name: string): number | null {
    const account = this.accountList.find(
      (x) => x.description?.trim().toLowerCase() === name?.trim().toLowerCase()
    );
    return account ? account.id : null;
  }

  excelSerialToDate(serial: number): Date | null {
    if (!serial || isNaN(serial)) return null;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
  }
}  