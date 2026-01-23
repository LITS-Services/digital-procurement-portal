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
    if (!this.vendorComapnyId) {
      this.approvalHistory = [];
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    this.loading = true;

    this.companyService.getApprovalHistoryByProcurmentcompanyId(this.vendorComapnyId).subscribe({
      next: (data: any) => {
        const rows = data?.value ?? data;          // prefer .NET $values if present
        this.approvalHistory = Array.isArray(rows) ? rows : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error loading approval history", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // closeDialog() {
  //   this.activeModal.close();
  // }
}
