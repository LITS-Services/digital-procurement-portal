import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';

@Component({
  selector: 'app-pr-inventory-management',
  templateUrl: './pr-inventory-management.component.html',
  styleUrls: ['./pr-inventory-management.component.scss']
})
export class PrInventoryManagementComponent implements OnInit {

  @Input() requestId!: number;
  requisitionNo:string = '';
  headerForm!: FormGroup;
  items: any[] = [];
  loading = false;
  constructor(
    private activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private purchaseRequestService: PurchaseRequestService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
     this.buildHeaderForm();

    if (this.requestId) {
      this.loadRequest(this.requestId);
    }
  }

    private buildHeaderForm(): void {
    this.headerForm = this.fb.group({
      prNumber: [{ value: '', disabled: true }],
      requisitionNumber: [{ value: '', disabled: true }],
      status: [{ value: '', disabled: true }]
    });
  }

  private loadRequest(id: number): void {
    this.loading = true;

    this.purchaseRequestService.getPurchaseRequestById(id).subscribe({
      next: (requestData: any) => {
        this.requisitionNo = requestData.requisitionNo || '';

        // Header form values
        this.headerForm.patchValue({
          prNumber: requestData.prNumber || requestData.id || '',
          requisitionNumber: requestData.requisitionNo || '',
          status: requestData.requestStatus || ''
        });

        const itemList = requestData.purchaseItems || [];

        this.items = itemList.map((item: any, index: number) => ({
          srNo: index + 1,
          type: item.itemType,   
          item: item.itemDescription || `Item #${index+1}`,
          description: item.itemDescription,
          amount: item.amount,
          remarks: item.remarks,
          hasAttachment: (item.attachments || []).some((a: any) => !a.isDeleted),
          raw: item                                      
        }));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load purchase request:', err);
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    const header = this.headerForm.getRawValue();
    console.log('Submitting requisition: ', {
      header,
      items: this.items
    });

  }

  closeDialog(): void {
    this.activeModal.close()
  }

}
