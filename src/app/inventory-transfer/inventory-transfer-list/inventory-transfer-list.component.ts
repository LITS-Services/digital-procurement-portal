import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { LookupService } from 'app/shared/services/lookup.service';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { PRQuery, PurchaseRequestService } from 'app/shared/services/purchase-request-services/purchase-request.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-inventory-transfer-list',
  templateUrl: './inventory-transfer-list.component.html',
  styleUrls: ['./inventory-transfer-list.component.scss'],
})
export class InventoryTransferListComponent implements OnInit {
  FORM_IDS = FORM_IDS;
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  isStatusCompleted: boolean = false;
  hasRestrictedStatus: boolean = false;
  activeFilter: string = '';
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
    prNo: null,
  };

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
  ) {}

  ngOnInit(): void {
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
          canGenerateRfq: pr.requestStatus === 'Completed',
        }));

        this.totalPages = data.totalPages;
        this.totalItems = data.totalItems;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching requests:', err);
        this.loading = false;
      },
    });
  }

  onView() {
    if (!this.permissionService.can(FORM_IDS.PURCHASE_REQUEST, 'read')) return;
    if (this.chkBoxSelected.length !== 1) {
      this.toastr.info('Please select exactly one record to view.');
      return;
    }

    const selectedId = this.chkBoxSelected[0].requestId;

    this.router.navigate(['/purchase-request/new-purchase-request'], {
      queryParams: { id: selectedId, mode: 'view' },
      skipLocationChange: true,
    });
  }

  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  openEmpDetails() {
    if (!this.permissionService.can(FORM_IDS.PURCHASE_REQUEST, 'write')) return;
    this.router.navigate(['/purchase-request/new-purchase-request']);
  }

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

  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
    this.idsToDelete = this.chkBoxSelected.map((item) => item.requestId);
    this.enableDisableButtons();
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.chkBoxSelected = [...this.purchaseRequestData];
    } else {
      this.chkBoxSelected = [];
    }
    this.idsToDelete = this.chkBoxSelected.map((item) => item.requestId);
    this.isAllSelected = event.target.checked;
    this.enableDisableButtons();
  }

  enableDisableButtons() {
    const selectedCount = this.chkBoxSelected.length;

    this.isDeleteButtonDisabled = selectedCount === 0;

    this.isEditButtonDisabled = selectedCount !== 1;

    this.isOpenButtonDisabled = selectedCount === 0;

    this.isAllSelected = this.purchaseRequestData.length === this.chkBoxSelected.length;

    const hasRestrictedStatus = this.chkBoxSelected.some(
      (row) => row.requestStatus === 'InProcess' || row.requestStatus === 'Completed'
    );

    if (hasRestrictedStatus) {
      this.isDeleteButtonDisabled = false;
      this.hasRestrictedStatus = true;
    } else {
      this.hasRestrictedStatus = false;
    }
  }

  openDeleteModal(): void {
    if (!this.permissionService.can(FORM_IDS.PURCHASE_REQUEST, 'delete')) return;
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
      },
    });
  }

  openPR(row: any) {
    const currentUserId = localStorage.getItem('userId') || '';
    const isSubmitter = row.submitterId?.toString() === currentUserId;

    // const viewMode = !isSubmitter;

    this.router.navigate(['/purchase-request/new-purchase-request'], {
      queryParams: {
        id: row.requestId,
        mode: 'inventory-transfer',
      },
      skipLocationChange: true,
    });
  }

  onUpdate() {
    if (!this.permissionService.can(FORM_IDS.PURCHASE_REQUEST, 'write')) return;
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
      queryParams: { id: selectedId },
      skipLocationChange: true,
    });
  }

  generateRfq(row: any) {
    console.log('Row data:', row);
    if (row.requestStatus !== 'Completed') {
      if (row.isInventoryTransfer == true) {
        this.toastr.info('RFQ cannot be generated since the Inventory Transfer is created.');
        return;
      }
      this.toastr.info('RFQ can only be generated if PR is Completed.');
      return;
    }

    this.router.navigate(['/rfq/new-rfq'], {
      queryParams: { prId: row.requestId },
    });
  }

  onPageChange(event: any) {
    this.query.currentPage = (event?.offset ?? 0) + 1;
    this.loadPurchaseRequests();
  }
}
