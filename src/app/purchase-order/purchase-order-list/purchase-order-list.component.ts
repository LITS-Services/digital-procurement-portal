import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType, DatatableComponent } from '@swimlane/ngx-datatable';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { LookupService } from 'app/shared/services/lookup.service';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { PoApprovalHistoryComponent } from '../po-approval-history/po-approval-history.component';
import { PoRemarksComponent } from '../po-remarks/po-remarks.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-purchase-order-list',
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.scss'],
  standalone: false
})
export class PurchaseOrderListComponent implements OnInit {
  FORM_IDS = FORM_IDS;
  @ViewChild('purchaseOrderDetail') purchaseOrderDetail: TemplateRef<any>;
  @ViewChild('datatable', { static: false }) datatable!: DatatableComponent;
  selectedPO: any;
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  chkBoxSelected: any[] = [];
  idsToDelete: number[] = [];
  loading = false;
  purchaseOrderData: any[] = [];
  announcementId: number;
  isEditButtonDisabled = true;
  isDeleteButtonDisabled = true;
  isOpenButtonDisabled = true;
  isAllSelected = false;
  columns = [];

  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;

  datatableVisible: boolean = true;
  showFilterBar = false;
  selectedStatusLabel = 'All';
  status: any
  statuses: any[] = [];        
  selectedStatus: string | null = null; 
  statusTouched: boolean = false;

  constructor(private purchaseOrderService: PurchaseOrderService,
    public cdr: ChangeDetectorRef,
    private router: Router,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private permissionService: PermissionService,
    private lookupService: LookupService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService
  ) { }

  get isMobile(): boolean {
    return window.innerWidth <= 1400;
  }

  get currentUserId(): string {
    return (localStorage.getItem('userId') || '').trim();
  }

  ngOnInit(): void {
    this.loadStatus();
    this.loadPurchaseOrders();
    this.cdr.detectChanges();
  }

  loadPurchaseOrders() {
    const userId = localStorage.getItem('userId');
    const lsEntity = localStorage.getItem('selectedCompanyId');
    let entityId: number | null = null;
    if (lsEntity && lsEntity !== 'All') {
      const parsed = Number(lsEntity);
      entityId = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
    
    this.loading = true;
    this.spinner.show();
    this.purchaseOrderService.getAllPurchaseOrders(this.currentPage, this.pageSize, entityId as any, userId, this.selectedStatus)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.spinner.hide();
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data: any) => {
          // Extract paginated data correctly
          this.purchaseOrderData = (data?.result || []).map((r: any) => ({
            ...r,
            statusClass: `chip ${this.mapStatusKey(r.requestStatus || r.status)}`
          }));

          // Capture pagination info
          this.totalPages = data.totalPages;
          this.totalItems = data.totalItems;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching Purchase Orders:', err);
          const errorMsg =
            err?.error?.message ||
            (Array.isArray(err?.error?.errors) && err.error.errors[0]) ||
            err?.statusText ||
            'Failed to load purchase orders. Please try again.';
          this.toastr.error(errorMsg);
        }
      });
  }

  onPageChange(event: any) {
    this.currentPage = (event.offset ?? 0) + 1;
    this.loadPurchaseOrders();
  }

  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  //   openEmpDetails() {
  //   this.router.navigate(['/configuration/global/new-global-config']);
  // }

  onSort(event) {
    this.loading = true;
    setTimeout(() => {
      const sort = event.sorts[0];
      this.purchaseOrderData.sort((a, b) => {
        const aValue = (a[sort.prop] ?? '').toString();
        const bValue = (b[sort.prop] ?? '').toString();
        return aValue.localeCompare(bValue) * (sort.dir === 'desc' ? -1 : 1);
      });
      this.loading = false;
    }, 200);
  }

  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
    this.idsToDelete = this.chkBoxSelected.map(item => item.id);
    this.enableDisableButtons();
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.chkBoxSelected = [...this.purchaseOrderData];
    } else {
      this.chkBoxSelected = [];
    }
    this.idsToDelete = this.chkBoxSelected.map(item => item.id);
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
    this.isAllSelected = this.purchaseOrderData.length > 0 && this.purchaseOrderData.length === this.chkBoxSelected.length;
  }

  isSubmitter(row: any): boolean {
    if (!row) return false;
    const currentUserId = (localStorage.getItem('userId') || '').trim().toLowerCase();
    const submitterId = (row.submitterId || '').toString().trim().toLowerCase();
    if (!submitterId) return false;

    // Check if the current user is the submitter of that PO, or if main approver is the submitter
    const isUserSubmitter = !!currentUserId && currentUserId === submitterId;
    const isApproverSubmitter = !!row.mainApproverId && row.mainApproverId.toString().trim().toLowerCase() === submitterId;

    return isUserSubmitter || isApproverSubmitter;
  }

  canShowSubmitForApproval(): boolean {
    if (!this.chkBoxSelected || this.chkBoxSelected.length !== 1) {
      return false;
    }
    const row = this.chkBoxSelected[0];
    const status = (row?.requestStatus || row?.status || '')
      .toString()
      .trim()
      .toLowerCase();
    return status === 'new' && this.isSubmitter(row);
  }

  canSubmitForApproval(): boolean {
    return this.canShowSubmitForApproval();
  }

  getSubmitButtonTooltip(): string {
    if (!this.chkBoxSelected || this.chkBoxSelected.length === 0) {
      return 'Select a Purchase Order to submit for approval';
    }
    if (this.chkBoxSelected.length > 1) {
      return 'Only one Purchase Order can be sent for approval at once';
    }
    const row = this.chkBoxSelected[0];
    const status = (row?.requestStatus || row?.status || '')
      .toString()
      .trim()
      .toLowerCase();
    if (status !== 'new') {
      return 'Only Purchase Orders in "New" status can be submitted for approval';
    }
    if (!this.isSubmitter(row)) {
      return 'Only the submitter of the Purchase Order can submit it for approval';
    }
    return 'Submit selected Purchase Order for approval';
  }

  onSubmitForApproval(): void {
    if (!this.canSubmitForApproval()) {
      if (this.chkBoxSelected.length > 1) {
        this.toastr.warning('Only one Purchase Order can be sent for approval at once.');
      } else {
        this.toastr.warning('Please select a Purchase Order in "New" status that you submitted.');
      }
      return;
    }

    const row = this.chkBoxSelected[0];

    Swal.fire({
      title: 'Submit for Approval?',
      text: `Are you sure you want to submit Purchase Order "${row.purchaseOrderNo}" for approval?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, submit it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.spinner.show();
      this.purchaseOrderService.submitForApproval(row.id).subscribe({
        next: (res: any) => {
          this.spinner.hide();
          this.toastr.success(res?.message || 'Purchase Order submitted for approval successfully.');
          this.chkBoxSelected = [];
          this.enableDisableButtons();
          this.loadPurchaseOrders();
        },
        error: (err: any) => {
          this.spinner.hide();
          const errorMsg =
            err?.error?.message ||
            (Array.isArray(err?.error?.errors) && err.error.errors[0]) ||
            err?.statusText ||
            'Failed to submit Purchase Order for approval.';
          this.toastr.error(errorMsg);
        }
      });
    });
  }

  openApprovalHistoryModal(row: any): void {
    const modalRef = this.modalService.open(PoApprovalHistoryComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.purchaseOrderId = row.id;
    modalRef.componentInstance.purchaseOrderNo = row.purchaseOrderNo;
  }

  isMainApprover(row: any): boolean {
    if (!row) return false;
    const userId = this.currentUserId.toLowerCase();
    const approverId = (row.mainApproverId || '').toString().trim().toLowerCase();
    return !!userId && !!approverId && userId === approverId;
  }

  isStatusInProgress(row: any): boolean {
    if (!row) return false;
    const s = (row.requestStatus || row.status || '').toString().toLowerCase().replace(/[\s_-]/g, '');
    return s === 'inprogress';
  }

  canTakeApproverAction(row: any): boolean {
    return this.isMainApprover(row) && this.isStatusInProgress(row);
  }

  canTakeApproverActionOnSelected(): boolean {
    if (!this.chkBoxSelected || this.chkBoxSelected.length !== 1) {
      return false;
    }
    return this.canTakeApproverAction(this.chkBoxSelected[0]);
  }

  onApproverAction(action: 'Approve' | 'Reject', row?: any): void {
    const targetRow = row || (this.chkBoxSelected && this.chkBoxSelected.length === 1 ? this.chkBoxSelected[0] : null);
    if (!targetRow) {
      this.toastr.warning('Please select a Purchase Order to take action.');
      return;
    }

    const modalRef = this.modalService.open(PoRemarksComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.action = action;
    modalRef.componentInstance.purchaseOrderNo = targetRow.purchaseOrderNo;

    modalRef.result.then((result) => {
      if (result) {
        const payload = {
          PurchaseOrderId: targetRow.id,
          PurchaseOrderNo: targetRow.purchaseOrderNo,
          Remarks: result.remarks || '',
          ActionTaken: action,
          ApproverId: localStorage.getItem('userId')
        };

        this.spinner.show();
        this.purchaseOrderService.addRemarksWithActionTaken(payload)
          .pipe(finalize(() => this.spinner.hide()))
          .subscribe({
            next: (res: any) => {
              this.toastr.success(res?.message || `Purchase Order ${action}d successfully.`);
              this.chkBoxSelected = [];
              this.enableDisableButtons();
              this.loadPurchaseOrders();
            },
            error: (err: any) => {
              const errorMsg =
                err?.error?.message ||
                (Array.isArray(err?.error?.errors) && err.error.errors[0]) ||
                err?.statusText ||
                `Failed to ${action.toLowerCase()} Purchase Order.`;
              this.toastr.error(errorMsg);
            }
          });
      }
    }).catch(() => {});
  }

  onActivate(event: any) {
    if (event.type === 'click') {
      const poId = event.row?.id;
      if (poId) {
        this.router.navigate(['/purchase-order/details'], { queryParams: { id: poId }, skipLocationChange: true });
      }
    }
  }

  onRowClick(row: any) {
    const id = row?.id;
    if (id) {
      this.router.navigate(['/purchase-order/details'], { queryParams: { id: id }, skipLocationChange: true });
    }
  }

  private mapStatusKey(status: string): 'chip--success' | 'chip--pending' | 'chip--rejected' | 'chip--approved' | 'chip--draft' {
    const s = status?.toLowerCase();

    if (s === 'completed' || s === 'successful' || s === 'accepted'  || s === 'paid' || s === 'active' || s === 'closed')
      return 'chip--success';

    if (s === 'rejected')
      return 'chip--rejected';

    if (s === 'draft')
      return 'chip--draft';

    if (s === 'pending for payment' || s === 'pending' || s === 'on hold' || s === 'inactive' || s === 'inprogress' || s === 'in progress' || s === 'sendback' || s === 'delivered')  
      return 'chip--pending';

    if (s === 'approved for payment' || s === 'approved' || s === 'new' || s === 'open')
      return 'chip--approved';
  }

  loadStatus() {
    this.lookupService.getAllRequestStatus().subscribe({
      next: (data: any) => {
        this.statuses = data;
      },
      error: (err) => {
        console.error('Error fetching Status:', err);
      }
    });
  }

  onStatusChange(status: any) {
    if (status === 'All') {
      this.selectedStatusLabel = 'All';
      this.selectedStatus = null;
    } else {
      this.selectedStatusLabel = status.description;
      this.selectedStatus = status.description;
    }

    this.statusTouched = true;
    this.currentPage = 1;
    this.loadPurchaseOrders();
  }


  toggleFilterBar() {
    this.showFilterBar = !this.showFilterBar;
  }
}