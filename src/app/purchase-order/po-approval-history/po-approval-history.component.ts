import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';

@Component({
  selector: 'app-po-approval-history',
  templateUrl: './po-approval-history.component.html',
  styleUrls: ['./po-approval-history.component.scss'],
  standalone: false
})
export class PoApprovalHistoryComponent implements OnInit {

  @Input() purchaseOrderId!: number;
  @Input() purchaseOrderNo: string = '';
  approvalHistory: any[] = [];
  loading = true;

  constructor(
    public activeModal: NgbActiveModal,
    private purchaseOrderService: PurchaseOrderService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadApprovalHistory();
  }

  loadApprovalHistory() {
    if (!this.purchaseOrderId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.purchaseOrderService.getApprovalHistory(this.purchaseOrderId).subscribe({
      next: (res: any) => {
        const data = res?.value || res?.result || res || [];
        this.approvalHistory = Array.isArray(data) ? data : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading PO approval history', err);
        this.approvalHistory = [];
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  closeDialog() {
    this.activeModal.close();
  }
}
