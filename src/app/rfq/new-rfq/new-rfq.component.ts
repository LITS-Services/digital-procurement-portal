import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbAccordion, NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, id, SelectionType } from '@swimlane/ngx-datatable';
import { DatatableData } from 'app/data-tables/data/datatables.data';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { RfqAttachmentComponent } from '../rfq-attachment/rfq-attachment.component';
import { ToastrService } from 'ngx-toastr';
import { RfqService } from '../rfq.service';
import { CompanyService } from 'app/shared/services/Company.services';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';
import { RfqRemarksComponent } from '../rfq-remarks/rfq-remarks.component';
import Swal from 'sweetalert2';
import { LookupService } from 'app/shared/services/lookup.service';
import { SelectedVendorsModalComponent } from './selected-vendors-modal/selected-vendors-modal.component';
import { visitAll } from '@angular/compiler';

@Component({
  selector: 'app-new-rfq',
  templateUrl: './new-rfq.component.html',
  styleUrls: ['./new-rfq.component.scss']
})

export class NewRfqComponent implements OnInit {
  currentRfqNo!: string;
  isNewForm = true; // true = create, false = edit
  isFormDirty = false; // track if any field was touched
  isSubmitter: boolean = false;

  isStatusCompleted: boolean = false;
  isStatusInProcess: boolean = false;
  numberOfAttachments = 0;
  attachmentList: any[] = [];
  pendingAttachment: any[] = [];

  // new work
  itemList: any[] = [];
  unitsOfMeasurementList: any[] = [];
  accountList: any[] = [];

  newRfqForm: FormGroup;
  itemForm: FormGroup;
  editingRowIndex: number | null = null; // Track row being edited
  newQuotationItemData = [];
  selectedVendorsData: any[] = [];
  public chkBoxSelected = [];
  loading = false;

  workflowList: any[] = []
  workflowTypes: any[] = [];

  vendorUsers: any[] = [];

  // modifications
  quotationVendorUsers: any[] = [];   // all vendors + companies
  filteredCompanies: any[] = [];      // companies for selected vendor

  public rows = DatatableData;
  columns = [];
  itemType: string = 'Inventory'; // Default selection
  viewMode = false;
  currentQuotationId: number | null = null;

  // new work
  purchaseRequestId: number | null = null;
  hasUnusedItems: boolean = true;

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  newPurchaseRequestForm: FormGroup;

  @ViewChild('accordion') accordion: NgbAccordion;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;

  compareIds = (a: string | null, b: string | null) => (a ?? '').toLowerCase() === (b ?? '').toLowerCase();
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private rfqService: RfqService,
    private companyService: CompanyService,
    private WorkflowServiceService: WorkflowServiceService,
    private lookupService: LookupService,
    public cdr: ChangeDetectorRef,
    private purchaseRequestService: PurchaseRequestService
  ) { }

  ngOnInit(): void {
    this.loadVendorUsers();
    // this.getWorkflowTypes();
    this.loadUnitsOfMeasurements();
    this.loadAccounts();
    this.loadItems();
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      const mode = params.get('mode');
      const prId = params.get('prId');

      this.viewMode = mode === 'view';
      this.isNewForm = !id;

      if (id) {
        this.currentQuotationId = +id;
        this.loadExistingQuotation(+id);
      }
      else if (prId) {
        // new work
        this.purchaseRequestId = +prId;
        this.loadFromPurchaseRequest(+prId);
      }
    });

    // RFQ Form
    this.newRfqForm = this.fb.group({
      rfqNo: [''],
      purchaseRequestNo: [''],
      status: [''],
      owner: [''],
      date: [null],
      contact: [''],
      deliveryLocation: [''],
      startDate: [null],
      endDate: [null],
      title: [''],
      workflowMasterId: [0],
      comment: [''],
      createdBy: [''],
      purchaseRequestId: [0],
      workflowName: [''],
      workflowType: [''],
    });

    this.newRfqForm.valueChanges.subscribe(() => {
      this.isFormDirty = true;
    });

    this.newRfqForm.get('workflowType')?.valueChanges.subscribe(selectedId => {
      if (selectedId) {
        this.GetWorkflowMasterByTypeId(selectedId);
      }
    });

    // RFQ Item Form
    this.itemForm = this.fb.group({
      id: [null],
      rfqNo: [''],
      itemType: [''],
      itemId: [0],
      unitOfMeasurementId: [0],
      amount: [0],
      unitCost: [0],
      orderQuantity: [0],
      reqByDate: [null],
      itemDescription: [''],
      accountId: [0],
      remarks: [''],
      createdBy: [''],
      quotationRequestId: [0],
      vendorUserId: [null],
      vendorCompanyId: [null],
      quotationItemAttachments: this.fb.array([])
    })
    this.itemForm.valueChanges.subscribe(values => {
      const total = (values.unitCost || 0) * (values.orderQuantity || 0);
      this.itemForm.patchValue({ amount: total }, { emitEvent: false });
    });
    this.itemForm.valueChanges.subscribe(() => {
      this.isFormDirty = true;
    });

    if (this.viewMode) {
      this.newRfqForm.disable();
      this.itemForm.disable();
    }
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
          this.router.navigate(['/rfq']);
        }
      });
    } else {
      this.router.navigate(['/rfq']);
    }
  }

  selectedTab: 'rfq-input' | 'quotation-box' | 'vendors' = 'rfq-input'; // default

selectTab(tab: 'rfq-input' | 'quotation-box' | 'vendors') {
  this.selectedTab = tab;
}
  loadVendorUsers() {
    this.companyService.getAllVendorUsers().subscribe({
      next: (res: any) => {
        this.vendorUsers = res?.value ?? [];
      },
      error: (err) => console.error('Error fetching vendor users:', err)
    });
  }

  loadVendorsAndCompanies(rfqId: number) {
    this.rfqService.getVendorsByQuotationRequestId(rfqId).subscribe({
      next: (res: any) => {
        // Normalize response safely
        if (res?.value && Array.isArray(res.value)) {
          this.quotationVendorUsers = res.value;
        } else if (res?.$values && Array.isArray(res.$values)) {
          this.quotationVendorUsers = res.$values;
        } else if (Array.isArray(res)) {
          this.quotationVendorUsers = res;
        } else {
          this.quotationVendorUsers = []; // fallback
        }
      },
      error: (err) => {
        console.error("Error fetching vendors & companies", err);
        this.quotationVendorUsers = []; // ensure it's an array on error
      }
    });
  }

  loadUnitsOfMeasurements() {
    this.lookupService.getAllUnitsOfMeasurement().subscribe({
      next: (res) => {
        this.unitsOfMeasurementList = res ?? [];
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
      },
      error: (err) => {
        console.error('Failed to load items dropdown:', err);
      }
    });
  }

  onVendorChange(vendorId: string) {
    this.filteredCompanies = (this.quotationVendorUsers || [])
      .filter(vc => vc.vendorId === vendorId)
      .map(vc => ({ companyId: vc.vendorCompanyId, name: vc.companyName }));

    // Only clear when ADDING (not editing)
    if (this.editingRowIndex === null) {
      this.itemForm.patchValue({ vendorCompanyId: null }, { emitEvent: false });
    }
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

  getVendorNameById(vendorId: string): string {
    const found = this.quotationVendorUsers.find(v => v.vendorId === vendorId);
    return found ? found.vendorName : '';
  }

  private toDateInputValue(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
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

  loadFromPurchaseRequest(prId: number): void {
    //new work
    this.purchaseRequestId = prId;
    this.purchaseRequestService.getPurchaseRequestById(prId, true).subscribe({
      next: (pr) => {
        if (!pr) return;

        //  Patch header-level fields
        this.newRfqForm.patchValue({
          purchaseRequestId: pr.id,
          purchaseRequestNo: pr.requisitionNo,
          deliveryLocation: pr.deliveryLocation,
          contact: pr.receiverContact || '',
          // date: pr.submittedDate || new Date(),
          date: this.toDateInputValue(pr.submittedDate),
        });

        // Map PR items → RFQ items, only include items not already used
        const unusedItems = pr.purchaseItems?.filter((item: any) => !item.usedInRfq) || [];

        this.hasUnusedItems = unusedItems.length > 0; // <--- flag

        if (!this.hasUnusedItems) {
          this.toastr.info('All items from this PR have already been used in previous RFQ(s).');
          return;
        }
        //  Map PR items → RFQ items
        this.newQuotationItemData = pr.purchaseItems?.map((item: any) => ({
          id: null,
          purchaseItemId: item.id, // NEW: Keep track of the PR line item ID
          rfqNo: '',
          itemType: item.itemType,
          itemId: item.itemId,
          unitOfMeasurementId: item.unitOfMeasurementId,
          amount: item.amount,
          unitCost: item.unitCost,
          orderQuantity: item.orderQuantity,
          reqByDate: item.reqByDate,
          itemDescription: item.itemDescription,
          accountId: item.accountId,
          remarks: item.remarks || '',
          createdBy: item.createdBy || 'current-user',
          quotationRequestId: 0,
          vendorUserId: null,
          vendorCompanyId: null,

          quotationItemAttachments: item.attachments?.map((a: any) => ({
            content: a.content || '',
            contentType: a.contentType || '',
            fileName: a.fileName || '',
            fromForm: a.fromForm || '',
            visibleToVendor: a.visibleToVendor,
            createdDate: a.createdDate,
            modifiedDate: a.modifiedDate,
            createdBy: a.createdBy || 'current-user',
            isDeleted: a.isDeleted || false,
            quotationItemId: a.quotationItemId || 0,
          })) || []
        }));
        //  Refresh datatable
        this.newQuotationItemData = [...this.newQuotationItemData];

      },
      error: (err) => {
        console.error('Error loading PR', err);
      }
    });
  }

  loadExistingQuotation(id: number) {
    this.loadVendorsAndCompanies(id);

    this.rfqService.getQuotationById(id).subscribe({
      next: async (data) => {
        // unwrap the Ardalis.Result<T> wrapper
        const requestData = data;

        const loggedInUserId = localStorage.getItem('userId');
        this.isSubmitter = requestData.submitterId === loggedInUserId;
        this.isNewForm = false;
        this.currentQuotationId = requestData.id;
        this.currentRfqNo = requestData.rfqNo;
        this.selectedVendorsData = requestData.selectedVendors || [];

        //  patch values with formatted dates
        this.newRfqForm.patchValue({
          ...requestData,
          date: this.toDateInputValue(requestData.date),
          startDate: this.toDateInputValue(requestData.startDate),
          endDate: this.toDateInputValue(requestData.endDate),
        });

        //  this.newQuotationItemData = requestData.quotationItems || [];
        if (requestData.requestStatus) {
          this.newRfqForm.patchValue({
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

        if (requestData.quotationItems) {
          const itemList = requestData.quotationItems || [];

          this.newQuotationItemData = itemList.map((item: any) => ({
            id: item.id,
            rfqNo: item.rfqNo,
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
            quotationRequestId: item.quotationRequestId,
            // quotationItemAttachments: item.quotationItemAttachments?.$values?.map((a: any) => ({
            quotationItemAttachments: (item.quotationItemAttachments || []).map((a: any) => ({
              id: a.id,
              content: a.content,
              contentType: a.contentType,
              fileName: a.fileName,
              fromForm: a.fromForm,
              visibleToVendor: a.visibleToVendor,
              createdDate: a.createdDate,
              modifiedDate: a.modifiedDate,
              createdBy: a.createdBy,
              isDeleted: a.isDeleted,
              quotationItemId: a.quotationItemId || 0,
              isNew: false
            }))
          }));
        }
        this.cdr.detectChanges();
      },

      error: (err) => console.error('Failed to load purchase request:', err)
    });
  }

  editRow(row: any, rowIndex: number) {
    this.editingRowIndex = rowIndex;
    this.itemForm.patchValue({
      id: row.id,
      itemType: row.itemType,
      itemId: row.itemId,
      unitOfMeasurementId: row.unitOfMeasurementId,
      amount: row.amount,
      unitCost: row.unitCost,
      orderQuantity: row.orderQuantity,
      // reqByDate: row.reqByDate ? new Date(row.reqByDate) : null,
      reqByDate: this.toDateInputValue(row.reqByDate),

      itemDescription: row.itemDescription,
      vendorUserId: row.vendorUserId,

      accountId: row.accountId,
      remarks: row.remarks,
      quotationItemAttachments: row.quotationItemAttachments
    });
    this.onVendorChange(row.vendorUserId);

    Promise.resolve().then(() => {
      this.itemForm.patchValue({ vendorCompanyId: row.vendorCompanyId }, { emitEvent: false });
    });

  }

  submitForm() {
    const f = this.newRfqForm.value;
    const dateISO = f.date ? new Date(f.date).toISOString() : new Date().toISOString();

    let quotationItems = [];

    //  Only apply selection logic if this RFQ was opened from a Purchase Request
    if (this.purchaseRequestId) {
      if (this.allItemsUsedForRFQ()) {
        this.toastr.info('All items from this Purchase Request have already been used in RFQs. Cannot generate a new RFQ.');
        return; // Stop execution
      }

      const selectedItems = (this.newQuotationItemData || []).filter(i => i.selected);
      if (selectedItems.length === 0) {
        this.toastr.info('Please select at least one item to generate RFQ.');
        return;
      }

      quotationItems = selectedItems.map(item => ({
        purchaseItemId: item.purchaseItemId || null,
        id: item.id || null,
        rfqNo: f.rfqNo || '',
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
        quotationRequestId: item.quotationRequestId || 0,
        vendorUserId: item.vendorUserId || null,
        vendorCompanyId: item.vendorCompanyId || null,
        quotationItemAttachments: item.quotationItemAttachments?.map(att => ({
          id: att.id || null,
          content: att.content || '',
          contentType: att.contentType || '',
          fileName: att.fileName || '',
          fromForm: att.fromForm || '',
          visibleToVendor: att.visibleToVendor || false,
          createdBy: att.createdBy || '',
          isDeleted: false,
          quotationItemId: att.quotationItemId || 0,
        }))
      }));
    }
    else {
      // Normal RFQ creation — use all items as before
      quotationItems = this.newQuotationItemData?.map(item => ({
        id: item.id || null,
        rfqNo: f.rfqNo || '',
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
        quotationRequestId: item.quotationRequestId || 0,
        vendorUserId: item.vendorUserId || null,
        vendorCompanyId: item.vendorCompanyId || null,
        quotationItemAttachments: item.quotationItemAttachments?.map(att => ({
          id: att.id || null,
          content: att.content || '',
          contentType: att.contentType || '',
          fileName: att.fileName || '',
          fromForm: att.fromForm || '',
          visibleToVendor: att.visibleToVendor || false,
          createdBy: att.createdBy || '',
          isDeleted: false,
          quotationItemId: att.quotationItemId || 0,
        }))
      })) || [];
    }

    // Common payload & service calls remain unchanged
    const payload = {
      rfqNo: f.rfqNo,
      purchaseRequestNo: f.purchaseRequestNo,
      owner: f.owner,
      date: f.date,
      contact: f.contact,
      deliveryLocation: f.deliveryLocation,
      startDate: f.startDate,
      endDate: f.endDate,
      title: f.title,
      workflowMasterId: f.workflowMasterId,
      comment: f.comment,
      createdBy: f.createdBy,
      purchaseRequestId: f.purchaseRequestId || null,
      quotationItems
    };

    if (this.currentQuotationId) {
      this.rfqService.updateQuotation(this.currentQuotationId, { quotationRequest: payload }).subscribe({
        next: res => {
          console.log('Updated Quotation!', res);
          this.loading = false;
          this.router.navigate(['/rfq']);
          // this.toastr.success('Quotation is updated!', '');
        },
        error: err => {
          console.error('Error updating Quotation:', err);
          this.toastr.error('Something went Wrong', '');
          this.loading = false;
        }
      });
    }

    else {
      this.rfqService.createQuotation({ quotationRequest: payload, isDraft: false }).subscribe({
        next: res => {
          console.log('Created Quotation!', res);
          this.loading = false;
          this.router.navigate(['/rfq']);
          // this.toastr.success('Quotation is created!', '');
        },
        error: err => {
          console.error('Error creating Quotation:', err);
          this.toastr.error('Something went Wrong', '');
          this.loading = false;
        }
      });
    }
  }

  saveAsDraftAndGoBack() {
    // if (this.newRfqForm.invalid) {
    //   return;
    // }

    const f = this.newRfqForm.value;
    const dateISO = f.date ? new Date(f.date).toISOString() : new Date().toISOString();

    const quotationItems = this.newQuotationItemData?.length
      ? this.newQuotationItemData.map(item => ({
        id: item.id || null,
        rfqNo: f.rfqNo || '',
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
        quotationRequestId: item.quotationRequestId || 0,
        vendorUserId: item.vendorUserId || null,
        vendorCompanyId: item.vendorCompanyId || null,
        quotationItemAttachments: item.quotationItemAttachments?.map(att => ({
          id: att.id || null,
          content: att.content || '',
          contentType: att.contentType || '',
          fileName: att.fileName || '',
          fromForm: att.fromForm || '',
          createdBy: att.createdBy || '',
          isDeleted: false,
          quotationItemId: att.quotationItemId || 0,
        }))
      }))
      : [];

    const payload = {
      rfqNo: f.rfqNo || '',
      purchaseRequestNo: f.purchaseRequestNo || '',
      status: 'Draft',
      owner: f.owner || '',
      date: f.date,
      contact: f.contact || '',
      deliveryLocation: f.deliveryLocation || '',
      startDate: f.startDate,
      endDate: f.endDate,
      title: f.title || '',
      workflowMasterId: Number(f.workflowMasterId) || 0,
      comment: f.comment || '',
      createdBy: f.createdBy || '',
      purchaseRequestId: f.purchaseRequestId || null,
      quotationItems
    };

    this.loading = true;

    const request$ = this.rfqService.createQuotation({ quotationRequest: payload, isDraft: true })

    request$.subscribe({
      next: () => this.handleDraftSuccess(),
      error: (err) => this.handleDraftError(err)
    });
  }

  get uniqueVendors() {
    const users = Array.isArray(this.quotationVendorUsers) ? this.quotationVendorUsers : [];
    const map = new Map<string, any>();
    for (const v of users) {
      if (v && !map.has(v.vendorId)) {
        map.set(v.vendorId, v);
      }
    }
    return Array.from(map.values());
  }

  insertItem(): void {
    const newItem = this.itemForm.value;
    const newItemId = Number(newItem.itemId);

    // Duplicate check — works for add and edit both
    const duplicate = this.newQuotationItemData.some((item, index) =>
      index !== this.editingRowIndex && Number(item.itemId) === newItemId
    );

    if (duplicate) {
      this.toastr.warning('This item is already added. You can update it instead.');
      return;
    }

    if (this.editingRowIndex !== null) {
      const existing = this.newQuotationItemData[this.editingRowIndex];
      const merged = {
        ...existing,
        ...newItem,
        itemId: newItemId,
        attachments: existing?.attachments ?? []
      };

      // Immutable update to trigger ngx-datatable refresh
      this.newQuotationItemData = this.newQuotationItemData.map((item, idx) =>
        idx === this.editingRowIndex ? merged : item
      );

      this.toastr.success('Item updated successfully!');
      this.editingRowIndex = null;

    } else {
      // Add new
      const withEmptyAttachments = {
        ...newItem,
        itemId: newItemId,
        attachments: newItem.attachments?.length ? newItem.attachments : []
      };
      this.newQuotationItemData = [...this.newQuotationItemData, withEmptyAttachments];
      this.toastr.success('Item added successfully!');
    }

    this.itemForm.reset({
      amount: 0,
      unitCost: 0,
      orderQuantity: 1
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
        this.newQuotationItemData.splice(rowIndex, 1);
        this.newQuotationItemData = [...this.newQuotationItemData]; // refresh table
        this.toastr.success('Item deleted!', '');
      }
    });
  }

  openNewEntityModal(rowIndex: number): void {
    const sourceRow = rowIndex !== null
      ? this.newQuotationItemData[rowIndex] : this.itemForm.value; // new item (not yet inserted)
    console.log("Source Row:", sourceRow);
    const modalRef = this.modalService.open(RfqAttachmentComponent, {
      backdrop: 'static',
      size: 'lg',
      centered: true,
    });

    modalRef.componentInstance.viewMode = this.viewMode;
    modalRef.componentInstance.data = {
      quotationItemId: sourceRow?.id ?? 0,
      existingAttachment: sourceRow?.quotationItemAttachments || []
    };

    modalRef.result.then((data: any[]) => {
      if (data?.length) {
        const merged = [
          ...(sourceRow.quotationItemAttachments || []),
          ...data.map(a => ({
            fileName: a.fileName,
            contentType: a.contentType,
            content: a.content,
            fromForm: a.fromForm,
            visibleToVendor: a.visibleToVendor,
            quotationItemId: sourceRow?.id ?? 0,
            isNew: true
          }))
        ];

        if (rowIndex !== null) {
          // immutably update the edited row in the grid
          this.newQuotationItemData = this.newQuotationItemData.map((r, i) =>
            i === rowIndex ? { ...r, quotationItemAttachments: data } : r
          );

        } else {
          // reflect on the form for a new (not yet inserted) item
          this.itemForm.patchValue({ quotationItemAttachments: data });
        }
        // this.numberOfAttachments = this.attachmentList.length;
      }
    }).catch(() => { });
  }

  editVendorRow(row: any): void {
    const modalRef = this.modalService.open(SelectedVendorsModalComponent, {
      backdrop: "static",
      size: "lg",
      centered: true,
    });

    modalRef.componentInstance.viewMode = this.viewMode;

    modalRef.componentInstance.vendorId = row.vendorId ?? row.vendorID;
    modalRef.componentInstance.vendorName = row.vendorName ?? row.vendor;
    modalRef.componentInstance.vendorCompanyId = row.vendorCompanyId;
    modalRef.componentInstance.quotationId = this.currentQuotationId ?? 0;
  }

  private handleDraftSuccess() {
    this.loading = false;
    this.toastr.success('Draft saved successfully');
    this.router.navigate(['/rfq']);
  }

  private handleDraftError(err: any) {
    this.loading = false;
    this.toastr.error('Failed to save draft');
    console.error('Error saving draft:', err);
  }

  onSubmitForApproval() {
    Swal.fire({
      title: 'Submit for Approval?',
      text: 'Are you sure you want to submit this quotation for approval?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, submit it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.rfqService.submitForApproval(this.currentQuotationId).subscribe({
          next: (res) => {
            Swal.fire({
              icon: 'success',
              title: 'Submitted!',
              text: res.message || 'Quotation submitted for approval successfully.',
              confirmButtonColor: '#3085d6',
            });
            this.router.navigate(['/rfq']);
          },
          error: (err) => {
            console.error(err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Failed to submit quotation for approval.'
            });
          }
        });
      }
    });
  }

  onAddRemarks(action: string): void {
    const modalRef = this.modalService.open(RfqRemarksComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.action = action;
    modalRef.componentInstance.rfqNo = this.currentRfqNo;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loading = true;
          const payload = {
            RfqNo: this.currentRfqNo,
            Remarks: result.remarks,
            ActionTaken: action,
            ApproverId: localStorage.getItem('userId')
          };

          this.rfqService.addRemarksWithActionTaken(payload).subscribe({
            next: res => {
              this.loading = false;
              if (res.message == "Approved") {
                this.cdr.detectChanges();
                this.router.navigate(['/rfq']);
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

  private allItemsUsedForRFQ(): boolean {
    // newQuotationItemData has all items from PR
    if (!this.newQuotationItemData || this.newQuotationItemData.length === 0) return true;

    // Check if all items already have a quotationRequestId (already part of RFQ)
    return this.newQuotationItemData.every(item => item.quotationRequestId && item.quotationRequestId > 0);
  }

}