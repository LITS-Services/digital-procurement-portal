import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CompanyService } from 'app/shared/services/Company.services';

@Component({
  selector: 'app-company-approval-history',
  templateUrl: './company-approval-history.component.html',
  styleUrls: ['./company-approval-history.component.scss'],
  standalone: false
})
export class CompanyApprovalHistoryComponent implements OnInit {
  @Input() ProcurementCompanyId!: number;
  @Input() entity!: string; 
  @Input() vendorComapnyId!: number;
  approvalHistory: any[] = [];
  loading = true;
  constructor(
    //public activeModal: NgbActiveModal, 
    private companyService: CompanyService,
    public cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadApprovalHistory();

  }
  loadApprovalHistory() {
    this.loading = true;

    this.companyService.getApprovalHistoryByProcurmentcompanyId(this.ProcurementCompanyId ,this.vendorComapnyId).subscribe({
      next: (data: any) => {
        // unwrap possible response formats
        this.approvalHistory = data ?? data?.$values ?? [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error("Error loading approval history", err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // closeDialog() {
  //   this.activeModal.close();
  // }
}
