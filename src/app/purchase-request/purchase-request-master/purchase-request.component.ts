import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, id, SelectionType } from '@swimlane/ngx-datatable';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { PurchaseRequestAccountBudgetLookupModalComponent } from 'app/shared/modals/purchase-request-account-budget-lookup-modal/purchase-request-account-budget-lookup-modal.component';
import { PurchaseRequestExceptionPolicyComponent } from 'app/shared/modals/purchase-request-exception-policy/purchase-request-exception-policy.component';
import { PrApprovalHistoryComponent } from '../pr-approval-history/pr-approval-history.component';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-purchase-request',
  templateUrl: './purchase-request.component.html',
  styleUrls: ['./purchase-request.component.scss']
})
export class PurchaseRequestComponent implements OnInit {
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  isStatusCompleted: boolean = false;

  activeFilter: string = ''; // default filter
  purchaseRequestData: any[] = [];
  chkBoxSelected: any[] = [];
  idsToDelete: number[] = [];
  loading = false;
  announcementId: number;
  isEditButtonDisabled = true;
  isDeleteButtonDisabled = true;
  isOpenButtonDisabled = true;
  isAllSelected = false;
  columns = [];

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private purchaseRequestService: PurchaseRequestService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService

  ) { }

  ngOnInit(): void {
    this.loadPurchaseRequests();
  }

  /**
   * Load purchase requests from API and group clones
   */

  // loadPurchaseRequests() {
  //   const userId = localStorage.getItem('userId');
  //   this.loading = true;

  //   this.purchaseRequestService.getPurchaseRequests(userId).subscribe({
  //     next: (data: any) => {
  //       // 🔹 Directly assign the values (skip grouping logic)
  //       this.purchaseRequestData = data?.$values || [];
  //       this.loading = false;
  //       this.cdr.detectChanges();
  //     },
  //     error: (err) => {
  //       console.error('Error fetching requests:', err);
  //       this.loading = false;
  //     }
  //   });
  // }

  loadPurchaseRequests() {
    const userId = localStorage.getItem('userId');
    this.loading = true;
    this.purchaseRequestService.getPurchaseRequests(userId).subscribe({
      next: (data: any) => {
        this.purchaseRequestData = (data?.$values || []).map((pr: any) => ({
          ...pr,
          canGenerateRfq: pr.requestStatus === 'Completed'   // add flag
        }));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching requests:', err);
        this.loading = false;
      }
    });
  }


  loadFilteredRequests(status: string) {
    const userId = localStorage.getItem('userId');
    this.activeFilter = status;
    this.purchaseRequestService.getAllRequestsByStatus(userId, status).subscribe({
      next: (data: any) => {
 this.purchaseRequestData = (data?.$values || []).map((pr: any) => ({
          ...pr,
          canGenerateRfq: pr.requestStatus === 'Completed'   // add flag
        }));        this.cdr.detectChanges();

      },
      error: (err) => console.error(err)
    });
  }


  onView() {
    if (this.chkBoxSelected.length !== 1) {
      alert('Please select exactly one record to view.');
      return;
    }

    const selectedId = this.chkBoxSelected[0].requestId;

    this.router.navigate(['/purchase-request/new-purchase-request'], {
      queryParams: { id: selectedId, mode: 'view' }
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

    this.router.navigate(['/purchase-request/new-purchase-request'], {
      queryParams: { id: selectedId }
    });
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

  openApprovalHistoryModal(row: any): void {
    const modalRef = this.modalService.open(PrApprovalHistoryComponent, { size: 'lg', backdrop: 'static', centered: true });
    modalRef.componentInstance.requisitionNo = row.requisitionNo; // pass RfqNo
  }

  generateRfq(row: any) {
    console.log('Row data:', row);
    if (row.requestStatus !== 'Completed') {
      this.toastr.info('RFQ can only be generated if PR is Completed.');
      return;
    }

    this.router.navigate(['/rfq/new-rfq'], {
      queryParams: { prId: row.requestId }
    });
  }
}
