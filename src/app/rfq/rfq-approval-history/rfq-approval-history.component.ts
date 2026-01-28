import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { RfqService } from '../rfq.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-rfq-approval-history-modal',
  templateUrl: './rfq-approval-history.component.html',
  styleUrls: ['./rfq-approval-history.component.scss'],
  standalone: false
})
export class RfqApprovalHistoryComponent implements OnInit {
  @Input() data!: any;
  approvalHistory: any[] = [];
  loading = true;

  constructor(
    private rfqService: RfqService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.loadApprovalHistory();
  }

  loadApprovalHistory() {
    this.loading = true;
    this.spinner.show();
    this.rfqService.getApprovalHistoryByRfqNo(this.data?.rfqNo).subscribe({
      next: (data: any) => {
        // unwrap possible response formats
          const arr =
            Array.isArray(data)            ? data :
            Array.isArray(data?.value)     ? data.value :
            Array.isArray(data?.$values)   ? data.$values :
            []; 

        this.approvalHistory = [...arr];
        this.loading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error loading approval history", err);
         this.approvalHistory = [];
        this.loading = false;
        this.cdr.detectChanges();

      }
    });
  }
}