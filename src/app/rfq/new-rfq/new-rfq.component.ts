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

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  newPurchaseRequestForm: FormGroup;

  @ViewChild('accordion') accordion: NgbAccordion;
  @ViewChild(DatatableComponent) table: DatatableComponent;
  @ViewChild('tableRowDetails') tableRowDetails: any;
  @ViewChild('tableResponsive') tableResponsive: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private rfqService: RfqService,
    private companyService: CompanyService,
    private WorkflowServiceService: WorkflowServiceService,
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
        this.loadFromPurchaseRequest(+prId);
      }
    });

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

  loadVendorUsers() {
    this.companyService.getVendorUsers().subscribe(response => {
      this.vendorUsers = response.$values ?? [];
    });
  }
  loadVendorsAndCompanies(rfqId: number) {
    this.rfqService.getVendorsByQuotationRequestId(rfqId).subscribe({
      next: (res: any) => {
        this.quotationVendorUsers = res?.$values || res || [];
        console.log("Vendors & Companies:", this.quotationVendorUsers);
      },
      error: (err) => console.error("Error fetching vendors & companies", err)
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

  onVendorChange(vendorId: string) {
    this.filteredCompanies = this.quotationVendorUsers
      .filter(vc => vc.vendorId === vendorId)
      .map(vc => ({
        companyId: vc.vendorCompanyId,
        name: vc.companyName
      }));

    // Only reset when adding a new item, not when editing
    if (!this.editingRowIndex) {
      this.itemForm.patchValue({ vendorCompanyId: '' });
    }
    else {
      const current = String(this.itemForm.get('vendorCompanyId')?.value ?? '');
      if (!this.filteredCompanies.some(c => c.companyId === current)) {
        this.itemForm.patchValue({ vendorCompanyId: '' });
      }
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



  // getVendorNameById(vendorId: number): string {
  //   const found = this.quotationVendorUsers.find(v => v.id === vendorId);
  //   return found ? found.vendorName : '';
  // }
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
  // loadExistingQuotation(id: number) {
  //   this.loadVendorsAndCompanies(id);

  //   this.rfqService.getQuotationById(id).subscribe({
  //     next: async (data) => {
  //       console.log("update data: ", data)
  //       this.isNewForm = false;
  //       this.currentQuotationId = data.id;
  //       this.currentRfqNo = data.rfqNo;
  //         // ✅ store rfqNo here

  //       this.newRfqForm.patchValue(data);

  //       if (data.requestStatus?.status) {
  //       this.newRfqForm.patchValue({
  //         status: data.requestStatus.status
  //       });
  //     }
  //       if (data.quotationItems.$values) {
  //         this.newQuotationItemData = data.quotationItems.$values.map((item: any) => ({
  //           id: item.id,
  //           rfqNo: item.rfqNo,
  //           itemType: item.itemType,
  //           itemCode: item.itemCode,
  //           itemDescription: item.itemDescription,
  //           amount: item.amount,
  //           unitCost: item.unitCost,
  //           uofM: item.uofM,
  //           orderQuantity: item.orderQuantity,
  //           reqByDate: item.reqByDate,
  //           vendorUserId: item.vendorUserId,
  //           vendorCompanyId: item.vendorCompanyId,
  //           account: item.account,
  //           remarks: item.remarks,
  //           quotationRequestId: item.quotationRequestId,
  //           quotationItemAttachments: item.quotationItemAttachments?.$values?.map((a: any) => ({
  //             content: a.content || '',
  //             contentType: a.contentType || '',
  //             fileName: a.fileName || '',
  //             fromForm: a.fromForm || '',
  //             createdDate: a.createdDate,
  //             modifiedDate: a.modifiedDate,
  //             createdBy: a.createdBy || 'current-user',
  //             isDeleted: a.isDeleted || false,
  //             quotationItemId: a.quotationItemId || 0,
  //             isNew: false
  //           })) || []
  //         }));
  //       }
  //     },

  //     error: (err) => console.error('Failed to load purchase request:', err)
  //   });
  // }

  loadFromPurchaseRequest(prId: number): void {
    this.purchaseRequestService.getPurchaseRequestById(prId).subscribe({
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

        //  Map PR items → RFQ items
        this.newQuotationItemData = pr.items.$values.map((item: any) => ({
          id: null,
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

          quotationItemAttachments: item.attachments?.$values?.map((a: any) => ({
            content: a.content || '',
            contentType: a.contentType || '',
            fileName: a.fileName || '',
            fromForm: a.fromForm || '',
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
        console.log("update data: ", data)
        const loggedInUserId = localStorage.getItem('userId');
        this.isSubmitter = data.submitterId === loggedInUserId;
        this.isNewForm = false;
        this.currentQuotationId = data.id;
        this.currentRfqNo = data.rfqNo;

        //  patch values with formatted dates
        this.newRfqForm.patchValue({
          ...data,
          date: this.toDateInputValue(data.date),
          startDate: this.toDateInputValue(data.startDate),
          endDate: this.toDateInputValue(data.endDate),
        });

        if (data.requestStatus?.status) {
          this.newRfqForm.patchValue({
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

        if (data.quotationItems?.$values) {
          this.newQuotationItemData = data.quotationItems.$values.map((item: any) => ({
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
            quotationItemAttachments: item.quotationItemAttachments?.$values?.map((a: any) => ({
              id: a.id,
              content: a.content || '',
              contentType: a.contentType || '',
              fileName: a.fileName || '',
              fromForm: a.fromForm || '',
              createdDate: a.createdDate,
              modifiedDate: a.modifiedDate,
              createdBy: a.createdBy || 'current-user',
              isDeleted: a.isDeleted || false,
              quotationItemId: a.quotationItemId || 0,
              isNew: false
            })) || []
          }));
        }
      },

      error: (err) => console.error('Failed to load purchase request:', err)
    });
  }


  editRow(row: any, rowIndex: number) {
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
    this.editingRowIndex = rowIndex;

    this.itemForm.patchValue({
      vendorCompanyId: row.vendorCompanyId
    });
  }


  submitForm() {
    //   if (!this.newPurchaseRequestForm.valid) {
    //   console.warn('Form is invalid');
    //   return;
    // }
    const f = this.newRfqForm.value;
    const dateISO = f.date ? new Date(f.date).toISOString() : new Date().toISOString();

    const quotationItems = this.newQuotationItemData?.length
      ? this.newQuotationItemData.map(item => ({
        id: item.id || null,   //  very important

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
        createdBy: item.createdBy || 'current-user',
        quotationRequestId: item.quotationRequestId || 0,
        vendorUserId: item.vendorUserId || null,
        vendorCompanyId: item.vendorCompanyId || null,
        quotationItemAttachments: item.quotationItemAttachments?.map(att => ({
          id: att.id || null,   // very important

          content: att.content || '',
          contentType: att.contentType || '',
          fileName: att.fileName || '',
          fromForm: att.fromForm || '',
          createdBy: 'current-user',
          isDeleted: false,
          quotationItemId: att.quotationItemId || 0,
        }))
      }))
      : [];

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
      this.rfqService.updateQuotation(this.currentQuotationId, payload).subscribe({
        next: res => {
          console.log('Updated Quotation!', res);
          this.loading = false;
          this.router.navigate(['/rfq']);
          this.toastr.success('Quotation is updated!', '');
        },
        error: err => {
          console.error('Error updating Quotation:', err);
          this.toastr.success('Something went Wrong', '');
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
          this.toastr.success('Quotation is created!', '');
        },
        error: err => {
          console.error('Error creating Quotation:', err);
          this.toastr.success('Something went Wrong', '');
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
        rfqNo: item.rfqNo || '',
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
        quotationRequestId: item.quotationRequestId || 0,
        vendorUserId: item.vendorUserId || null,
        vendorCompanyId: item.vendorCompanyId || null,
        quotationItemAttachments: item.quotationItemAttachments?.map(att => ({
          id: att.id || null,
          content: att.content || '',
          contentType: att.contentType || '',
          fileName: att.fileName || '',
          fromForm: att.fromForm || '',
          createdBy: 'current-user',
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
      createdBy: f.createdBy || 'current-user',
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

  // insertItem(): void {
  //   const newItem = this.itemForm.value;

  //   if (this.editingRowIndex !== null) {
  //     // Replace the item immutably
  //     this.newQuotationItemData = this.newQuotationItemData.map((item, index) =>
  //       index === this.editingRowIndex ? newItem : item
  //     );
  //     this.editingRowIndex = null;
  //   } else {
  //     // Add new item immutably
  //     this.newQuotationItemData = [...this.newQuotationItemData, newItem];
  //   }

  //   this.itemForm.reset();
  // }
  // insertItem(): void {
  //   const newItem = this.itemForm.value;

  //   if (this.editingRowIndex !== null) {
  //     const existing = this.newQuotationItemData[this.editingRowIndex];

  //     const merged = {
  //       ...existing,
  //       ...newItem,
  //       quotationItemAttachments: existing?.quotationItemAttachments ?? []
  //     };

  //     this.newQuotationItemData = this.newQuotationItemData.map((item, index) =>
  //       index === this.editingRowIndex ? merged : item
  //     );

  //     this.editingRowIndex = null;
  //   } else {
  //     const withEmptyAttachments = {
  //       ...newItem,
  //       itemId: Number(newItem.itemId) || 0,
  //       quotationItemAttachments: newItem.quotationItemAttachments?.length ? newItem.quotationItemAttachments : []
  //     };
  //     this.newQuotationItemData = [...this.newQuotationItemData, withEmptyAttachments];
  //   }
  //   this.toastr.success('Item inserted!', '');

  //   this.itemForm.reset();
  // }
  get uniqueVendors() {
    const map = new Map<string, any>();
    this.quotationVendorUsers.forEach(v => {
      if (!map.has(v.vendorId)) {
        map.set(v.vendorId, v);
      }
    });
    return Array.from(map.values());
  }

  insertItem(): void {
  const newItem = this.itemForm.value;

  // Normalize IDs
  const newItemId = Number(newItem.itemId);

//   const itemType = newItem.itemType;
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
    const duplicate = this.newQuotationItemData.some(
      item => Number(item.itemId) === newItemId
    );

    if (duplicate) {
      this.toastr.warning('This item is already added. You can update it instead.');
      return;
    }
  }

  if (this.editingRowIndex !== null) {
    // --- Update existing item ---
    const existing = this.newQuotationItemData[this.editingRowIndex];
    const merged = {
      ...existing,
      ...newItem,
      itemId: newItemId,
      attachments: existing?.attachments ?? []
    };

    this.newQuotationItemData = this.newQuotationItemData.map((item, index) =>
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
    this.newQuotationItemData = [...this.newQuotationItemData, withEmptyAttachments];
    this.toastr.success('Item added successfully!');
  }

  // Reset form
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

  // openNewEntityModal(row: any) {
  //   const modalRef = this.modalService.open(RfqAttachmentComponent, {
  //     backdrop: 'static',
  //     size: 'lg', // Adjust the size as needed
  //     centered: true,
  //   });
  //   const quotationItemId = row.id;
  //   modalRef.componentInstance.data = {
  //     quotationItemId: quotationItemId,
  //     existingAttachment: this.attachmentList
  //   }
  //   modalRef.result.then((data: any[]) => {
  //     this.pendingAttachment = data;
  //     this.attachmentList = [
  //       ...this.attachmentList, ...data.map(a => ({
  //         fileName: a.fileName,
  //         contentType: a.contentType,
  //         content: a.content,
  //         fromForm: a.fromForm,
  //         quotationItemId: a.quotationItemId,
  //         IsNew: true
  //       }))
  //     ]
  //     this.numberOfAttachments = this.attachmentList.length;
  //   })
  // }

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
            quotationItemId: sourceRow?.id ?? 0,
            isNew: true
          }))
        ];

        if (rowIndex !== null) {
          // immutably update the edited row in the grid
          this.newQuotationItemData = this.newQuotationItemData.map((r, i) =>
            i === rowIndex ? { ...r, quotationItemAttachments: merged } : r
          );

        } else {
          // reflect on the form for a new (not yet inserted) item
          this.itemForm.patchValue({ quotationItemAttachments: merged });
        }
        // this.numberOfAttachments = this.attachmentList.length;
      }
    }).catch(() => { });
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

  // onSubmitForApproval() {
  //   this.rfqService.submitForApproval(this.currentQuotationId).subscribe({
  //     next: (res) => {
  //       this.toastr.success(res.message || 'Quotation submitted for approval successfully!');
  //       this.router.navigate(['/rfq']);
  //     },
  //     error: (err) => {
  //       console.error(err);
  //       this.toastr.error('Failed to submit quotation for approval.');
  //     }
  //   });
  // }

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
            timer: 2000,
            showConfirmButton: false
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
}

