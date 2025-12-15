import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { finalize } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';

import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { LookupService } from 'app/shared/services/lookup.service';
import { CompanyService } from 'app/shared/services/Company.services';
import { PurchaseRequestAttachmentModalComponent } from 'app/shared/modals/purchase-request-attachment-modal/purchase-request-attachment-modal.component';

@Component({
  selector: 'app-inventory-transfer-form',
  templateUrl: './inventory-transfer-form.html',
  styleUrl: './inventory-transfer-form.scss',
  standalone: false
})
export class InventoryTransferForm {
loading = false;
  requestId!: number;

  // flags (to reuse same html structure)
  viewMode = true;
  isInventoryTransferMode = true;
  isNewForm = false;
  isSelectingFinalVendor = false;

  isToolbarSticky = false;
  entityHint = '';
  isEntityLocked = true;

  entities: Array<{ id: number; description: string }> = [];
  addresses: any[] = [];

  newPurchaseRequestForm!: FormGroup;
  newPurchaseItemData: any[] = [];

  // dropdown lookups (for name display helpers)
  itemList: any[] = [];
  unitsOfMeasurementList: any[] = [];
  accountList: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private prService: PurchaseRequestService,
    private lookupService: LookupService,
    private companyService: CompanyService,
    private modalService: NgbModal,
    private spinner: NgxSpinnerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.buildForm();

    // load lookups for names in table
    this.loadUnitsOfMeasurements();
    this.loadAccounts();
    this.loadItems();

    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      if (!id) return;

      this.requestId = +id;

      // readonly form
      this.newPurchaseRequestForm.disable({ emitEvent: false });

      this.loadExistingRequest(this.requestId);
    });
  }

  buildForm() {
    this.newPurchaseRequestForm = this.fb.group({
      requisitionNo: [{ value: '', disabled: true }],
      submittedDate: [{ value: null, disabled: true }],
      status: [{ value: null, disabled: true }],
      deliveryLocation: [{ value: '', disabled: true }],
      receiverName: [{ value: '', disabled: true }],
      receiverContact: [{ value: '', disabled: true }],
      department: [{ value: '', disabled: true }],
      designation: [{ value: '', disabled: true }],
      businessUnit: [{ value: '', disabled: true }],
      partialDeliveryAcceptable: [{ value: false, disabled: true }],
      exceptionPolicy: [{ value: false, disabled: true }],
      subject: [{ value: '', disabled: true }],
      entityId: [{ value: null, disabled: true }],
      addressId: [{ value: null, disabled: true }],
      country: [{ value: '', disabled: true }],
      city: [{ value: '', disabled: true }],
      region: [{ value: '', disabled: true }],
      address: [{ value: '', disabled: true }],
      address2: [{ value: '', disabled: true }],
      postCode: [{ value: '', disabled: true }],
    });
  }

  goBack(){
    this.router.navigateByUrl("/inventory-transfer");
  }
  loadExistingRequest(id: number) {
    this.loading = true;
    this.spinner.show();

    // IMPORTANT: inventory-transfer should call your inventory-transfer API
    this.prService.getPrForInventoryTransfer(id)
      .pipe(finalize(() => {
        this.loading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (requestData: any) => {
          this.newPurchaseRequestForm.patchValue({
            ...requestData,
            submittedDate: this.toDateInputValue(requestData.submittedDate),
            status: requestData.requestStatus
          }, { emitEvent: false });

          // items
          const items = requestData.purchaseItems || [];
          this.newPurchaseItemData = items.map((item: any) => ({
            ...item,
            reqByDate: item.reqByDate ? this.toDateInputValue(item.reqByDate) : null,
            hasAttachment: (item.attachments || []).some((a: any) => !a.isDeleted),
            attachments: item.attachments || []
          }));

          // load entity addresses (optional, if you want receiving address select display)
          const entityId = Number(requestData.entityId) || null;
          if (entityId) this.loadAddresses(entityId, () => {
            const addrId = requestData.addressId;
            if (addrId) this.onAddressSelect(addrId);
          });
        },
        error: (err) => {
          console.error('Failed to load PR for inventory transfer:', err);
        }
      });
  }

  // attachments view (same modal, viewMode=true)
  openAttachmentView(row: any): void {
    if (!row?.hasAttachment) return;

    const modalRef = this.modalService.open(PurchaseRequestAttachmentModalComponent, {
      backdrop: 'static',
      size: 'lg',
      centered: true,
    });

    modalRef.componentInstance.viewMode = true;

    modalRef.componentInstance.data = {
      existingAttachment: (row.attachments || []).filter((a: any) => !a.isDeleted),
      purchaseItemId: row.id || 0
    };
  }

  // helpers
  toDateInputValue(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadAddresses(entityId: number, callback?: () => void) {
    this.companyService.getProcurementCompanyById(entityId).subscribe({
      next: (res) => {
        this.addresses = res.addressDetails ?? [];
        callback?.();
      },
      error: () => {}
    });
  }

  onAddressSelect(id: number) {
    const selected = this.addresses.find(a => a.id == id);
    if (!selected) return;

    this.newPurchaseRequestForm.patchValue({
      country: selected.country,
      city: selected.city,
      region: selected.region,
      address: selected.address,
      address2: selected.address2,
      postCode: selected.postCode
    }, { emitEvent: false });
  }

  loadUnitsOfMeasurements() {
    this.lookupService.getAllUnitsOfMeasurement().subscribe(res => {
      this.unitsOfMeasurementList = res ?? [];
    });
  }

  loadAccounts() {
    this.lookupService.getAllAccounts().subscribe(res => {
      this.accountList = res ?? [];
    });
  }

  loadItems() {
    this.lookupService.getAllItems().subscribe(res => {
      this.itemList = res ?? [];
    });
  }

  getItemNameById(id: number): string {
    const found = this.itemList.find(i => i.id === id);
    return found ? found.description : '';
  }
}
