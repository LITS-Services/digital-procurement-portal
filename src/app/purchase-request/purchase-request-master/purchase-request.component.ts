import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { PurchaseRequestAccountBudgetLookupModalComponent } from 'app/shared/modals/purchase-request-account-budget-lookup-modal/purchase-request-account-budget-lookup-modal.component';
import { PurchaseRequestExceptionPolicyComponent } from 'app/shared/modals/purchase-request-exception-policy/purchase-request-exception-policy.component';

@Component({
  selector: 'app-purchase-request',
  templateUrl: './purchase-request.component.html',
  styleUrls: ['./purchase-request.component.scss']
})
export class PurchaseRequestComponent implements OnInit {
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  
  purchaseRequestData: any[] = [];
  chkBoxSelected: any[] = [];
  idsToDelete: number[] = [];
  loading = false;
  announcementId: number;
  isEditButtonDisabled = true;
  isDeleteButtonDisabled = true;
  isOpenButtonDisabled = true;
  isAllSelected = false;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private purchaseRequestService: PurchaseRequestService
  ) {}

  ngOnInit(): void {
    this.loadPurchaseRequests();
  }

  /**
   * Load purchase requests from API and group clones
   */
  loadPurchaseRequests() {
    this.loading = true;

    this.purchaseRequestService.getPurchaseRequests().subscribe({
      next: (data) => {
        // 🔹 Group requests by requestId
        const grouped = data.reduce((acc, item) => {
          const existing = acc.find(x => x.requestId === item.requestId);

          if (existing) {
            existing.clones.push({
              itemDescription: item.itemDescription,
              vendor: item.vendor,
              account: item.account,
              amount: item.amount
            });
          } else {
            acc.push({
              requestId: item.requestId,
              requisitionNo: item.requisitionNo,
              status: item.status,
              submittedDate: item.submittedDate,
              createdBy: item.createdBy,
              department: item.department,
              clones: [
                {
                  itemDescription: item.itemDescription,
                  vendor: item.vendor,
                  account: item.account,
                  amount: item.amount
                }
              ]
            });
          }
          return acc;
        }, []);

        this.purchaseRequestData = grouped;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching requests:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Navigate to dashboard home
   */
  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  /**
   * Navigate to create new purchase request
   */
  openEmpDetails() {
    this.router.navigate(['/purchase-request/new-purchase-request']);
  }

  /**
   * Handle sorting
   */
  onSort(event) {
    this.loading = true;
    setTimeout(() => {
      const sort = event.sorts[0];
      this.purchaseRequestData.sort((a, b) => {
        const aValue = (a[sort.prop] ?? '').toString();
        const bValue = (b[sort.prop] ?? '').toString();
        return aValue.localeCompare(bValue) * (sort.dir === 'desc' ? -1 : 1);
      });
      this.loading = false;
    }, 200);
  }

  /**
   * Checkbox selection
   */
  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
    this.idsToDelete = this.chkBoxSelected.map(item => item.requestId);
    this.enableDisableButtons();
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.chkBoxSelected = [...this.purchaseRequestData];
    } else {
      this.chkBoxSelected = [];
    }
    this.idsToDelete = this.chkBoxSelected.map(item => item.requestId);
    this.isAllSelected = event.target.checked;
    this.enableDisableButtons();
  }

  enableDisableButtons() {
    const selectedCount = this.chkBoxSelected.length;
    this.isDeleteButtonDisabled = selectedCount === 0;
    this.isEditButtonDisabled = selectedCount !== 1;
    this.isOpenButtonDisabled = selectedCount === 0;
    this.isAllSelected = this.purchaseRequestData.length === this.chkBoxSelected.length;
  }

  /**
   * Open Delete Modal
   */
  openDeleteModal(deleteModal) {
    if (this.idsToDelete.length > 0) {
      this.modalService.open(deleteModal, { backdrop: 'static', centered: true });
    } else {
      alert('Please select at least one record to delete.');
    }
  }

  /**
   * Confirm deletion of selected requests
   */
  confirmDelete() {
    if (this.idsToDelete.length === 0) return;

    console.log('Deleting IDs:', this.idsToDelete);

    this.purchaseRequestService.deletePurchaseRequest(this.idsToDelete).subscribe({
      next: () => {
        this.modalService.dismissAll();
        this.loadPurchaseRequests();
        this.chkBoxSelected = [];
        this.idsToDelete = [];
      },
      error: (err) => {
        console.error('Delete failed:', err);
      }
    });
  }

  /**
   * Navigate to update form
   */
  onUpdate() {
    if (this.chkBoxSelected.length === 0) {
      alert('Please select a record to update.');
      return;
    }

    if (this.chkBoxSelected.length > 1) {
      alert('Please select only one record to update.');
      return;
    }

    const selectedId = this.chkBoxSelected[0].requestId;
    console.log('Navigating to update ID:', selectedId);

    this.router.navigate(['/purchase-request/new-purchase-request']);
  }

  /**
   * Open Account Budget Lookup modal
   */
  openAblModal() {
    this.modalService.open(PurchaseRequestAccountBudgetLookupModalComponent, {
      backdrop: 'static',
      size: 'xl',
      centered: true,
    });
  }

  /**
   * Open Exception Policy modal
   */
  openExceptionPolicyModal() {
    this.modalService.open(PurchaseRequestExceptionPolicyComponent, {
      backdrop: 'static',
      size: 'lg',
      centered: true,
    });
  }
}
