import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, id, SelectionType } from '@swimlane/ngx-datatable';
import { PRQuery, PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { PurchaseRequestAccountBudgetLookupModalComponent } from 'app/shared/modals/purchase-request-account-budget-lookup-modal/purchase-request-account-budget-lookup-modal.component';
import { PurchaseRequestExceptionPolicyComponent } from 'app/shared/modals/purchase-request-exception-policy/purchase-request-exception-policy.component';
import { PrApprovalHistoryComponent } from '../pr-approval-history/pr-approval-history.component';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { CreatePurchaseOrderComponent } from 'app/purchase-order/create-purchase-order/create-purchase-order.component';
import { LookupService } from 'app/shared/services/lookup.service';
import { Subject } from 'rxjs';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PrInventoryManagementComponent } from '../pr-inventory-management/pr-inventory-management.component';

@Component({
  selector: 'app-purchase-request',
  templateUrl: './purchase-request.component.html',
  styleUrls: ['./purchase-request.component.scss']
})

export class PurchaseRequestComponent implements OnInit {
  FORM_IDS = FORM_IDS;
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  isStatusCompleted: boolean = false;
  hasRestrictedStatus: boolean = false; // for disabling delete button if PR status is InProcess or Completed
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

  totalPages = 0;
  totalItems = 0;
  selectedCompanyId: string | number = '';
  query: PRQuery = {
    currentPage: 1,
    pageSize: 10,
    status: null,
    userId: null,
    entityId: null,
    prNo: null
  };

  showFilterBar = false;
  selectedStatusLabel = 'All';

  status: any

  statusTouched: boolean = false;
  searchText = '';
  private searchChanged$ = new Subject<string>();

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private purchaseRequestService: PurchaseRequestService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    public lookupService: LookupService,
    private purchaseOrderService: PurchaseOrderService,
    private permissionService: PermissionService

  ) { }

  ngOnInit(): void {
    this.loadStatus();
    this.loadPurchaseRequests();
    this.cdr.detectChanges();
  }

  loadPurchaseRequests() {
    this.loading = true;
    const entityId = localStorage.getItem('selectedCompanyId');
    this.query.entityId = entityId ? +entityId : null;
    this.purchaseRequestService.getAllPurchaseRequests(this.query).subscribe({
      next: (data: any) => {
        this.purchaseRequestData = (data?.result || []).map((pr: any) => ({
          ...pr,
          canGenerateRfq: pr.requestStatus === 'Completed'
        }));

        // Capture pagination info
        this.totalPages = data.totalPages;
        this.totalItems = data.totalItems;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching requests:', err);
        this.loading = false;
      }
    });
  }

  loadStatus() {
    this.lookupService.getAllRequestStatus().subscribe({
      next: (data: any) => {
        this.status = data;
      },
      error: (err) => {
        console.error('Error fetching Status:', err);
      }
    });
  }

  onStatusChange(status: any) {
    if (status === 'All') {
      this.selectedStatusLabel = "All"
    }
    else {
      this.selectedStatusLabel = status?.description;
    }
    this.statusTouched = true;
    this.query.status = status?.description;;
    this.query.currentPage = 1;
    this.loadPurchaseRequests();
  }

  onSearchChange(text: string) {
    this.searchText = text;
    this.searchChanged$.next(text);
  }

  toggleFilterBar() {
    this.showFilterBar = !this.showFilterBar;
  }

  // loadFilteredRequests(status: string) {
  //   if (status !== this.activeFilter) {
  //     this.currentPage = 1
  //   };
  //   this.activeFilter = status;
  //   this.loading = true;

  //   this.purchaseRequestService.getAllPurchaseRequestsByStatus(status, this.currentPage, this.pageSize).subscribe({
  //     next: (data: any) => {
  //       this.purchaseRequestData = (data?.result || []).map((pr: any) => ({
  //         ...pr,
  //         canGenerateRfq: pr.requestStatus === 'Completed'
  //       }));

  //       // Capture pagination info
  //       this.totalPages = data.totalPages;
  //       this.totalItems = data.totalItems;

  //       this.loading = false;
  //       this.cdr.detectChanges();
  //     },
  //     error: (err) => {
  //       console.error('Error fetching filtered requests:', err);
  //       this.loading = false;
  //     }
  //   });
  // }

  onView() {
    if (this.chkBoxSelected.length !== 1) {
      this.toastr.info('Please select exactly one record to view.');
      return;
    }

    const selectedId = this.chkBoxSelected[0].requestId;

    this.router.navigate(['/purchase-request/new-purchase-request'], {
      queryParams: { id: selectedId, mode: 'view' }, skipLocationChange: true
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
    if(!this.permissionService.can(FORM_IDS.PURCHASE_REQUEST, 'write')) 
      return;
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

    // Disable delete if no rows selected
    this.isDeleteButtonDisabled = selectedCount === 0;

    // Disable edit unless exactly one record is selected
    this.isEditButtonDisabled = selectedCount !== 1;

    // Disable open button if no rows selected
    this.isOpenButtonDisabled = selectedCount === 0;

    // Check "Select All" toggle
    this.isAllSelected = this.purchaseRequestData.length === this.chkBoxSelected.length;

    // Disable delete if any selected row has restricted status
    const hasRestrictedStatus = this.chkBoxSelected.some(
      row => row.requestStatus === 'InProcess' || row.requestStatus === 'Completed'
    );

    if (hasRestrictedStatus) {
      this.isDeleteButtonDisabled = false; // still allow click
      this.hasRestrictedStatus = true; // store flag for later use
    } else {
      this.hasRestrictedStatus = false;
    }
  }

  // OPEN DELETE MODAL
  openDeleteModal(): void {
    if(!this.permissionService.can(FORM_IDS.PURCHASE_REQUEST, 'delete')) 
      return;
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

  // CONFIRM DELETION OF PURCHASE REQUEST
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
    if(!this.permissionService.can(FORM_IDS.PURCHASE_REQUEST, 'write')) 
      return;
    if (this.chkBoxSelected.length === 0) {
      this.toastr.info('Please select a record to update.',);
      return;
    }

    if (this.chkBoxSelected.length > 1) {
      this.toastr.info('Please select only one record to update.');
      return;
    }

    const selectedId = this.chkBoxSelected[0].requestId;
    console.log('Navigating to update ID:', selectedId);

    this.router.navigate(['/purchase-request/new-purchase-request'], {
      queryParams: { id: selectedId }, skipLocationChange: true
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

  openPRInventoryManagement(row:any): void {
    const modalRef = this.modalService.open(PrInventoryManagementComponent, { size: 'lg', backdrop: 'static', centered: true, windowClass:'pr-inv-modal' });
    modalRef.componentInstance.requestId = row.requestId;
  }

  generateRfq(row: any) {
    console.log('Row data:', row);
    if (row.requestStatus !== 'Completed') {
      if (row.isInventoryTransfer == true)
      {
        this.toastr.info('RFQ cannot be generated since the Inventory Transfer is created.');
        return;
      }
      this.toastr.info('RFQ can only be generated if PR is Completed.');
      return;
    }

    this.router.navigate(['/rfq/new-rfq'], {
      queryParams: { prId: row.requestId }
    });
  }

  onPageChange(event: any) {
    this.query.currentPage = (event?.offset ?? 0) + 1;
    this.loadPurchaseRequests();
  }

  // openCreatePoModal(row: any): void {
  //   console.log('Opening modal for PR ID:', row); // for debugging
  //   const modalRef = this.modalService.open(CreatePurchaseOrderComponent, { size: 'lg', backdrop: 'static', centered: true });
  //   modalRef.componentInstance.purchaseRequestId = row.requestId;

  //   modalRef.closed.subscribe((result) => {
  //     if (result) {
  //       this.loadPurchaseRequests(); // refresh main list
  //     }
  //   });
  // }
  createPO(row: any) {

    Swal.fire({
      title: 'Create Purchase Order?',
      text: 'This will generate PO(s) automatically for all items based on vendor assignment.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Create PO',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {

        this.purchaseOrderService.createPurchaseOrderFromPR(row.requestId).subscribe({
          next: () => {
            console.log("Successfully created PO");
            this.loadPurchaseRequests();
          },
          error: () => {
            this.toastr.error('Something went wrong while creating PO.');
          }
        });

      }
    });
  }

  selectFinalVendor(row: any): void {
    if (row.requestStatus !== 'Completed') {
      this.toastr.info('Final Vendor can only be selected when PR is Completed.');
      return;
    }

    // Navigate to new-purchase-request form and patch existing PR
    this.router.navigate(['/purchase-request/new-purchase-request'], {
      queryParams: {
        id: row.requestId,
        mode: 'selectVendor' // optional flag to differentiate
      },
      skipLocationChange: true
    });
  }
}