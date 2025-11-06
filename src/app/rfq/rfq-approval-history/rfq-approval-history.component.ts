import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { RfqService } from '../rfq.service';

@Component({
  selector: 'app-rfq-approval-history-modal',
  templateUrl: './rfq-approval-history.component.html',
  styleUrls: ['./rfq-approval-history.component.scss']
})
export class RfqApprovalHistoryComponent implements OnInit {
  @Input() rfqNo!: string;
  approvalHistory: any[] = [];
  loading = true;

  constructor(
    public activeModal: NgbActiveModal,
    private rfqService: RfqService
  ) { }

  ngOnInit(): void {
    this.loadApprovalHistory();
  }

  loadApprovalHistory() {
    this.loading = true;

    this.rfqService.getApprovalHistoryByRfqNo(this.rfqNo).subscribe({
      next: (data: any) => {
        // unwrap possible response formats
        this.approvalHistory = data ?? data?.$values ?? [];
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