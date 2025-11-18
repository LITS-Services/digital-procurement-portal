import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CompanyService } from 'app/shared/services/Company.services';

@Component({
  selector: 'app-company-setup-history',
  templateUrl: './company-setup-history.component.html',
  styleUrls: ['./company-setup-history.component.scss']
})
export class CompanySetupHistoryComponent implements OnInit {
  @Input() vendorEntityAssociationId!: number; // Direct ID if available
  @Input() selectedRow: any; // Entire row if ID needs to be constructed
  @Input() entity!: string; 
  
  approvalHistory: any[] = [];
  loading = true;
  
  constructor(
    public activeModal: NgbActiveModal, 
    private companyService: CompanyService,
  ) { }

  ngOnInit(): void {
    this.loadApprovalHistory();
  }

  loadApprovalHistory() {
    this.loading = true;

    // Determine which ID to use
    const associationId = this.vendorEntityAssociationId || 
                         this.selectedRow?.vendorEntityAssociationId ||
                         this.constructAssociationId();

    if (!associationId) {
      console.error("No vendorEntityAssociationId available");
      this.loading = false;
      return;
    }

    this.companyService.setupId(associationId).subscribe({
      next: (data: any) => {
        this.approvalHistory = data ?? data?.$values ?? [];
        this.loading = false;
      },
      error: (err) => {
        console.error("Error loading approval history", err);
        this.loading = false;
      }
    });
  }

  private constructAssociationId(): number | null {
    // If you need to construct the ID from procurementCompanyId and vendorCompanyId
    if (this.selectedRow?.procurementCompanyId && this.selectedRow?.vendorCompanyId) {
      // This depends on how your backend expects the association ID
      // You might need to call a different service method
      return this.selectedRow.procurementCompanyId; // or some combination
    }
    return null;
  }

  closeDialog() {
    this.activeModal.close();
  }
}