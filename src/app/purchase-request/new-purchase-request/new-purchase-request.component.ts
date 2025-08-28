import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbAccordion, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { PurchaseRequestAttachmentModalComponent } from 'app/shared/modals/purchase-request-attachment-modal/purchase-request-attachment-modal.component';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-new-purchase-request',
  templateUrl: './new-purchase-request.component.html',
  styleUrls: ['./new-purchase-request.component.scss']
})
export class NewPurchaseRequestComponent implements OnInit {
  numberOfAttachments = 0;

  newPurchaseRequestData = [

  ];

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
  ) {
    this.purchaseRequestService.currentFiles.subscribe(files => {
      this.numberOfAttachments = files.length;
    });
  }

  ngOnInit(): void {
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
      createdBy: [''],
      attachments: this.fb.group({
        specifications: [false],
        drawing: [false],
        scopeOfWorks: [false],
        billOfMaterials: [false],
        other: [''],
        specialInstructions: ['']
      })
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

    // Check if editing existing request
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.currentRequestId = +id;
        this.loadExistingRequest(+id);
      }
    });
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
      next: (data) => {
        this.newPurchaseRequestForm.patchValue(data);
        if (data.purchaseItems) {
          this.newPurchaseRequestData = data.purchaseItems.map((item: any) => ({
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
      },
      error: (err) => console.error('Failed to load purchase request:', err)
      
    });
  }

  homePage() {
    this.router.navigate(['/purchase-request']);
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
      createdBy: f.createdBy || 'current-user',
      attachments: [
        {
          requisitionNo: f.requisitionNo,
          specifications: f.attachments.specifications,
          drawing: f.attachments.drawing,
          scopeOfWorks: f.attachments.scopeOfWorks,
          billOfMaterials: f.attachments.billOfMaterials,
          other: f.attachments.other,
          specialInstructions: f.attachments.specialInstructions,
          createdBy: f.createdBy || 'current-user',
        }
      ],
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
    modalRef.result.then(() => { }, () => { });
  }
}  