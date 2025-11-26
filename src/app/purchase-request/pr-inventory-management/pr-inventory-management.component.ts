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

    this.purchaseRequestService.getPurchaseRequestById(id).subscribe({
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
            item: item.itemDescription || `Item #${index + 1}`,
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

    // Reset address selection
    addressControl?.reset();
    addressControl?.disable();

    if (!companyId) return;

    this.lookupService.getAddressByProcCompany(companyId).subscribe((res: any[]) => {
      fg.get('addresses')?.setValue(res); // store addresses per row
      addressControl?.enable();
      this.cdr.detectChanges();
    });
  }


  onSubmit(): void {
    const payload = {
      prId: this.requestId,
      InventoryTransfer: this.itemForms.value.map((x: any) => ({
        PurchaseItemId: x.purchaseItemId,
        ProcurementCompanyId: x.procurementCompanyId,
        ProcurementCompanyAddressDetailsId: x.procurementCompanyAddressDetailsId
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

}