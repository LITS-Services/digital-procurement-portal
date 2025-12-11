import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { RfqService } from '../rfq.service';

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
    //public activeModal: NgbActiveModal,
    private rfqService: RfqService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadApprovalHistory();
  }

  loadApprovalHistory() {
    this.loading = true;

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

  // closeDialog() {
  //   this.activeModal.close();
  // }
}