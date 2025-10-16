import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';

@Component({
  selector: 'app-pr-approval-history',
  templateUrl: './pr-approval-history.component.html',
  styleUrls: ['./pr-approval-history.component.scss']
})
export class PrApprovalHistoryComponent implements OnInit {

  @Input() requisitionNo!: string;
  approvalHistory: any[] = [];
  loading = true;

  constructor(
    public activeModal: NgbActiveModal,
    private purchaseRequestService: PurchaseRequestService
  ) { }
  ngOnInit(): void {
    this.loadApprovalHistory();
  }

  loadApprovalHistory() {
    this.purchaseRequestService.getApprovalHistoryByReqNo(this.requisitionNo).subscribe({
      next: (data: any) => {
        // unwrap possible response formats
        this.approvalHistory = data ?? data ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading approval history", err);
        this.loading = false;
      }
    });
  }

  closeDialog() {
    this.activeModal.close();
  }
}