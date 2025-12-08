import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { LookupService } from 'app/shared/services/lookup.service';

@Component({
  selector: 'app-pr-inventory-management',
  templateUrl: './pr-inventory-management.component.html',
  styleUrls: ['./pr-inventory-management.component.scss']
})
export class PrInventoryManagementComponent implements OnInit {

  @Input() requestId!: number;
  requisitionNo: string = '';
  headerForm!: FormGroup;
  items: any[] = [];
  loading = false;

  procCompanies: any[] = [];
  addresses: any[] = [];
  selectedCompanyMap: { [key: number]: number } = {}; // Map of item index -> selected companyId

  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private purchaseRequestService: PurchaseRequestService,
    private lookupService: LookupService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.buildHeaderForm();

    const userId = localStorage.getItem('userId');
    this.loadProcurementCompanies(userId);

    if (this.requestId) {
      this.loadRequest(this.requestId);
    }
  }

  private buildHeaderForm(): void {
    this.headerForm = this.fb.group({
      prNumber: [{ value: '', disabled: true }],
      requisitionNumber: [{ value: '', disabled: true }],
      status: [{ value: '', disabled: true }],
      items: this.fb.array([])
    });
  }

  get itemForms() {
    return this.headerForm.get('items') as FormArray;
  }

  private loadRequest(id: number): void {
    this.loading = true;

    this.purchaseRequestService.getPurchaseRequestById(id, false, true).subscribe({
      next: (requestData: any) => {
        this.requisitionNo = requestData.requisitionNo || '';

        this.headerForm.patchValue({
          prNumber: requestData.prNumber || requestData.id || '',
          requisitionNumber: requestData.requisitionNo || '',
          status: requestData.requestStatus || ''
        });

        const itemList = requestData.purchaseItems || [];
        this.items = itemList.map((item: any, index: number) => {
          this.itemForms.push(this.fb.group({
            purchaseItemId: item.id,
            procurementCompanyId: [''],
            procurementCompanyAddressDetailsId: [{ value: '', disabled: true }],
            addresses: [[]]
          }));

          return {
            srNo: index + 1,
            type: item.itemType,
            item: item.itemName || `Item #${index + 1}`,
            description: item.itemDescription,
            orderQuantity: item.orderQuantity,
            amount: item.amount,
            remarks: item.remarks,
            hasAttachment: (item.attachments || []).some((a: any) => !a.isDeleted),
            raw: item
          };
        });

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load purchase request:', err);
        this.loading = false;
      }
    });
  }
  private loadProcurementCompanies(userId: string): void {
    this.lookupService.getProcCompaniesByProcUserId(userId).subscribe({
      next: (res: any[]) => {
        this.procCompanies = res;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load procurement companies:', err);
      }
    });
  }
onCompanyChange(itemIndex: number) {
  const fg = this.itemForms.at(itemIndex) as FormGroup;
  const companyId = +fg.get('procurementCompanyId')?.value;
  const addressControl = fg.get('procurementCompanyAddressDetailsId');

  addressControl?.reset();
  addressControl?.disable();

  fg.get('addresses')?.setValue([]);

  if (!companyId) return;

  this.lookupService.getAddressByProcCompany(companyId).subscribe((res: any[]) => {
    fg.get('addresses')?.setValue(res); // store addresses per row
    addressControl?.enable();
    this.cdr.detectChanges();
  });
}

isAddressDisabled(index: number): boolean {
  const fg = this.itemForms.at(index) as FormGroup;
  const ctrl = fg.get('procurementCompanyAddressDetailsId');
  return !ctrl || ctrl.disabled;
}


  onSubmit(): void {
    const payload = {
      prId: this.requestId,
      InventoryTransfer: this.itemForms.value.map((x: any) => ({
        PurchaseItemId: x.purchaseItemId,
        // ProcurementCompanyId: x.procurementCompanyId,
        // ProcurementCompanyAddressDetailsId: x.procurementCompanyAddressDetailsId
        ProcurementCompanyId: x.procurementCompanyId
        ? Number(x.procurementCompanyId)
        : null,

      ProcurementCompanyAddressDetailsId: x.procurementCompanyAddressDetailsId
        ? Number(x.procurementCompanyAddressDetailsId)
        : null
      }))
    };

    console.log('Submitting payload:', payload);

    this.purchaseRequestService.createInventoryTransfer(payload).subscribe({
      next: (res) => {
        console.log('Inventory transfer created', res);
        this.activeModal.close(res);
      },
      error: (err) => console.error(err)
    });
  }

  closeDialog(): void {
    this.activeModal.close();
  }


getCompanyName(id: number | null | undefined): string {
  if (!id) return '';
  const found = this.procCompanies?.find(c => c.id === id);
  return found?.description || '';
}

setCompany(rowIndex: number, company: any | null): void {
  const fg = this.itemForms.at(rowIndex) as FormGroup;
  const ctrl = fg.get('procurementCompanyId');

  const id = company ? company.id : null;
  ctrl?.setValue(id);

  // Call your existing logic (will reset + reload addresses)
  this.onCompanyChange(rowIndex);
}
setAddress(rowIndex: number, address: any | null): void {
  if (this.isAddressDisabled(rowIndex)) return; // safety

  const ctrl = this.itemForms.at(rowIndex).get('procurementCompanyAddressDetailsId');
  const id = address ? address.id : null;
  ctrl?.setValue(id);
}

getAddressDescription(index: number): string {
  const addresses = this.itemForms.at(index).get('addresses')?.value || [];
  const selectedId = this.itemForms.at(index).get('procurementCompanyAddressDetailsId')?.value;

  const found = addresses.find((a: any) => a.id === selectedId);
  return found?.description || '';
}

}