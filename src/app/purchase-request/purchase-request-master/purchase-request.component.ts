import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, id, SelectionType } from '@swimlane/ngx-datatable';
import { PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { PurchaseRequestAccountBudgetLookupModalComponent } from 'app/shared/modals/purchase-request-account-budget-lookup-modal/purchase-request-account-budget-lookup-modal.component';
import { PurchaseRequestExceptionPolicyComponent } from 'app/shared/modals/purchase-request-exception-policy/purchase-request-exception-policy.component';
import { PrApprovalHistoryComponent } from '../pr-approval-history/pr-approval-history.component';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-purchase-request',
  templateUrl: './purchase-request.component.html',
  styleUrls: ['./purchase-request.component.scss']
})
export class PurchaseRequestComponent implements OnInit {
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  isStatusCompleted: boolean = false;
  hasRestrictedStatus: boolean = false;
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
    this.cdr.detectChanges();
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
        })); this.cdr.detectChanges();

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

  // enableDisableButtons() {
  //   const selectedCount = this.chkBoxSelected.length;
  //   this.isDeleteButtonDisabled = selectedCount === 0;
  //   this.isEditButtonDisabled = selectedCount !== 1;
  //   this.isOpenButtonDisabled = selectedCount === 0;
  //   this.isAllSelected = this.purchaseRequestData.length === this.chkBoxSelected.length;
  // }
enableDisableButtons() {
  const selectedCount = this.chkBoxSelected.length;

  // Disable delete if no rows selected
  this.isDeleteButtonDisabled = selectedCount === 0;

  // Disable edit unless exactly one record is selected
  this.isEditButtonDisabled = selectedCount !== 1;

  // Disable open button if no rows selected
  this.isOpenButtonDisabled = selectedCount === 0;

  // Check "Select All" toggle
  this.isAllSelected = this.purchaseRequestData.length === this.chkBoxSelected.length;

  // Disable delete if any selected item has restricted status
  const hasRestrictedStatus = this.chkBoxSelected.some(
    item => item.requestStatus === 'InProcess' || item.requestStatus === 'Completed'
  );

  if (hasRestrictedStatus) {
    this.isDeleteButtonDisabled = false; // still allow click
    this.hasRestrictedStatus = true; // store flag for later use
  } else {
    this.hasRestrictedStatus = false;
  }
}



  /**
   * Open Delete Modal
   */
  // openDeleteModal(deleteModal) {
  //   if (this.idsToDelete.length > 0) {
  //     this.modalService.open(deleteModal, { backdrop: 'static', centered: true });
  //   } else {
  //     this.toastr.info('Please select at least one record to delete.');
  //   }
  // }

  /**
   * Confirm deletion of selected requests
   */
  // confirmDelete() {
  //   if (this.idsToDelete.length === 0) return;

  //   console.log('Deleting IDs:', this.idsToDelete);

  //   this.purchaseRequestService.deletePurchaseRequest(this.idsToDelete).subscribe({
  //     next: () => {
  //       this.modalService.dismissAll();
  //       this.loadPurchaseRequests();
  //       this.chkBoxSelected = [];
  //       this.idsToDelete = [];
  //     },
  //     error: (err) => {
  //       console.error('Delete failed:', err);
  //     }
  //   });
  // }

  openDeleteModal(): void {
     if (this.idsToDelete.length === 0) {
    this.toastr.info('Please select at least one record to delete.');
    return;
  }
   if (this.hasRestrictedStatus) {
    this.toastr.warning('Cannot delete records with status "InProcess" or "Completed".');
    return;
  }

    Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${this.idsToDelete.length} record(s). This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmDelete();
      }
    });
  }

  /**
   * Confirm deletion of selected requests
   */
  confirmDelete(): void {
    if (this.idsToDelete.length === 0) return;

    this.purchaseRequestService.deletePurchaseRequest(this.idsToDelete).subscribe({
      next: () => {
        Swal.fire('Deleted!', 'Selected record(s) have been deleted successfully.', 'success');
        this.loadPurchaseRequests();
        this.chkBoxSelected = [];
        this.idsToDelete = [];
      },
      error: (err) => {
        console.error('Delete failed:', err);
        Swal.fire('Error', 'An error occurred while deleting records.', 'error');
      }
    });
  }

  /**
   * Navigate to update form
   */
  onUpdate() {
    if (this.chkBoxSelected.length === 0) {
      this.toastr.info('Please select a record to update.');
      return;
    }

    if (this.chkBoxSelected.length > 1) {
      this.toastr.info('Please select only one record to update.');
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
