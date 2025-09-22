import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbAccordion, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { DatatableData } from 'app/data-tables/data/datatables.data';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { RfqAttachmentComponent } from '../rfq-attachment/rfq-attachment.component';
import { ToastrService } from 'ngx-toastr';
import { RfqService } from '../rfq.service';
import { CompanyService } from 'app/shared/services/Company.services';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';

@Component({
  selector: 'app-new-rfq',
  templateUrl: './new-rfq.component.html',
  styleUrls: ['./new-rfq.component.scss']
})

export class NewRfqComponent implements OnInit {
  isNewForm = true; // true = create, false = edit
  isFormDirty = false; // track if any field was touched
  numberOfAttachments = 0;
  attachmentList: any[] = [];
  pendingAttachment: any[] = [];
  newRfqForm: FormGroup;
  itemForm: FormGroup;
  editingRowIndex: number | null = null; // Track row being edited
  newQuotationItemData = [];
  public chkBoxSelected = [];
  loading = false;

  workflowList: any[] = []
  workflowTypes: any[] = [];

  vendorUsers: any[] = [];

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
    private attachmentService: PurchaseRequestService,
     private WorkflowServiceService: WorkflowServiceService,
  ) { }

  ngOnInit(): void {
    // this.loadVendorUsers();
    // this.getWorkflowTypes();
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      const mode = params.get('mode');

      this.viewMode = mode === 'view';
      this.isNewForm = !id;

      if (id) {
        this.currentQuotationId = +id;
        this.loadExistingQuotation(+id);
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
      itemType: [''],
      itemCode: [''],
      uofM: [''],
      amount: [0],
      unitCost: [0],
      orderQuantity: [0],
      reqByDate: [null],
      itemDescription: [''],
      account: [''],
      remarks: [''],
      createdBy: [''],
      quotationRequestId: [0],
      vendorUserId: [''],
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
    this.router.navigate(['/rfq']);
  }

  loadVendorUsers() {
    this.companyService.getVendorUsers().subscribe(response => {
      this.vendorUsers = response.$values ?? [];
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

  loadExistingQuotation(id: number) {
    this.rfqService.getQuotationById(id).subscribe({
      next: async (data) => {
        console.log("update data: ", data)
        this.isNewForm = false;
        this.currentQuotationId = data.id;
        this.newRfqForm.patchValue(data);
        if (data.quotationItems.$values) {
          this.newQuotationItemData = data.quotationItems.$values.map((item: any) => ({
            id: item.id,
            itemType: item.itemType,
            itemCode: item.itemCode,
            itemDescription: item.itemDescription,
            amount: item.amount,
            unitCost: item.unitCost,
            uofM: item.uofM,
            orderQuantity: item.orderQuantity,
            reqByDate: item.reqByDate,
            vendorUserId: item.vendorUserId,
            account: item.account,
            remarks: item.remarks,
            quotationRequestId: item.quotationRequestId,
            quotationItemAttachments: item.quotationItemAttachments?.$values?.map((a: any) => ({
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
      itemCode: row.itemCode,
      uofM: row.uofM,
      amount: row.amount,
      unitCost: row.unitCost,
      orderQuantity: row.orderQuantity,
      reqByDate: row.reqByDate ? new Date(row.reqByDate) : null,
      itemDescription: row.itemDescription,
      vendorUserId: row.vendorUserId,
      account: row.account,
      remarks: row.remarks,
      quotationItemAttachments: row.quotationItemAttachments
    });
    this.editingRowIndex = rowIndex;
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
        itemType: item.itemType || '',
        itemCode: item.itemCode || '',
        uofM: item.uofM || '',
        amount: item.amount || 0,
        unitCost: item.unitCost || 0,
        orderQuantity: item.orderQuantity || 0,
        reqByDate: item.reqByDate || new Date(),
        itemDescription: item.itemDescription || '',
        account: item.account || '',
        remarks: item.remarks || '',
        createdBy: item.createdBy || 'current-user',
        quotationRequestId: item.quotationRequestId || 0,
        vendorUserId: item.vendorUserId || '',
        quotationItemAttachments: item.quotationItemAttachments?.map(att => ({
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
      status: f.status,
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
      purchaseRequestId: 40,
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
      this.rfqService.createQuotation({ quotationRequest: payload }).subscribe({
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
        itemType: item.itemType || '',
        itemCode: item.itemCode || '',
        uofM: item.uofM || '',
        amount: item.amount || 0,
        unitCost: item.unitCost || 0,
        orderQuantity: item.orderQuantity || 0,
        reqByDate: item.reqByDate || new Date(),
        itemDescription: item.itemDescription || '',
        account: item.account || '',
        remarks: item.remarks || '',
        createdBy: item.createdBy || 'current-user',
        quotationRequestId: item.quotationRequestId || 0,
        vendorUserId: item.vendorUserId || '',
        quotationItemAttachments: item.quotationItemAttachments?.map(att => ({
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
      purchaseRequestId: 40,
      quotationItems
    };

    this.loading = true;

    const request$ = this.rfqService.createQuotation({ quotationRequest: payload })

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
  insertItem(): void {
    const newItem = this.itemForm.value;

    if (this.editingRowIndex !== null) {
      const existing = this.newQuotationItemData[this.editingRowIndex];

      const merged = {
        ...existing,
        ...newItem,
        quotationItemAttachments: existing?.quotationItemAttachments ?? []
      };

      this.newQuotationItemData = this.newQuotationItemData.map((item, index) =>
        index === this.editingRowIndex ? merged : item
      );

      this.editingRowIndex = null;
    } else {
      const withEmptyAttachments = {
        ...newItem,
        quotationItemAttachments: newItem.quotationItemAttachments?.length ? newItem.quotationItemAttachments : []
      };
      this.newQuotationItemData = [...this.newQuotationItemData, withEmptyAttachments];
    }
    this.itemForm.reset();
  }

  deleteRow(rowIndex: number): void {
    this.newQuotationItemData.splice(rowIndex, 1);
    this.newQuotationItemData = [...this.newQuotationItemData]; // refresh table
    this.toastr.success('Delete!', '');
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
}

