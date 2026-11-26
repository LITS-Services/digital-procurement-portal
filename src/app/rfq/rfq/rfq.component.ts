import { ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { RfqQuotationboxComponent } from '../rfq-quotationbox/rfq-quotationbox.component';
import { RfqVendorModalComponent } from '../rfq-vendor-modal/rfq-vendor-modal.component';
import { VendorComparisionComponent } from '../vendor-comparision/vendor-comparision.component';
import { RFQQuery, RfqService } from '../rfq.service';
import { RfqApprovalHistoryComponent } from '../rfq-approval-history/rfq-approval-history.component';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { LookupService } from 'app/shared/services/lookup.service';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { PdfExportService } from 'app/shared/services/pdf-export.service';

@Component({
  selector: 'app-rfq',
  templateUrl: './rfq.component.html',
  styleUrls: ['./rfq.component.scss'],
  standalone: false
})

export class RfqComponent implements OnInit {

    @ViewChild('datatable', { static: false }) datatable!: DatatableComponent;
  FORM_IDS = FORM_IDS;
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  activeFilter: string = ''; // default filter
  hasRestrictedStatus: boolean = false; // for disabling delete button if RFQ status is InProgress or Completed
  rfqData: any[] = [];
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

  showFilterBar = false;
  selectedStatusLabel = 'All';

  statusTouched: boolean = false;

  private _resizeT?: any;

    datatableVisible:boolean = true;
  // public chkBoxSelected = [];
  // loading = false;
  // public rows = [];
  // columns = [];
  // announcementId: number;
  // isEditButtonDisabled: boolean = true;
  // isDeleteButtonDisabled: boolean = true;
  // isOpenButtonDisabled: boolean = true;
  // isAddNewDisable:boolean= true;
  // isAllSelected: boolean = false;

  query: RFQQuery = {
    currentPage: 1,
    pageSize: 10,
    status: null,
    userId: null,
    entityId: null,
    rfqNo: null
  };

  status: any
  searchText = '';
  private searchChanged$ = new Subject<string>();
  entity:any;
  constructor(private router: Router, private modalService: NgbModal,
    private route: ActivatedRoute, private rfqService: RfqService,
    private cdr: ChangeDetectorRef, public toastr: ToastrService,
    public lookupService: LookupService, private purchaseOrderService: PurchaseOrderService,
    private permissionService: PermissionService, private pdfExportService: PdfExportService
  ) { }

  ngOnInit(): void {
    this.searchChanged$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(text => {
        this.query.rfqNo = text?.trim() || null;
        this.query.currentPage = 1;
        this.loadRfqs();
      });

    this.loadStatus();
    //this.loadRfqs();
  }

    onAutoResize(): void {
  this.datatableVisible = false;
  this.cdr.detectChanges(); // destroy

  requestAnimationFrame(() => {
    this.datatableVisible = true;
    this.cdr.detectChanges(); // recreate
  });
}

  toggleFilterBar() {
    this.showFilterBar = !this.showFilterBar;
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

  get isMobile(): boolean {
  return window.innerWidth <= 768;
}

  loadRfqs() {
    this.loading = true;
    const entityId = localStorage.getItem('selectedCompanyId');
    this.entity = entityId;
    this.query.entityId = entityId ? +entityId : null;
    this.rfqService.getAllQuotations(this.query).subscribe({
      next: (data: any) => {

        // Extract paginated data correctly
        this.rfqData = (data?.result || []).map((r: any) => ({
        ...r,
        statusClass: `chip ${this.mapStatusKey(r.requestStatus || r.status)}`
      }));

        // Capture pagination info
        this.totalPages = data.totalPages;
        this.totalItems = data.totalItems;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching RFQs:', err);
        this.loading = false;
      }
    });
  }

  openRfq(row: any) {
    if(!this.permissionService.can(FORM_IDS.REQUEST_FOR_QUOTATION, 'write')) 
      return;
  const currentUserId = localStorage.getItem('userId') || '';
  const isSubmitter = row.submitterId?.toString() === currentUserId;

  // if submitter 
  const viewMode = !isSubmitter;

  this.router.navigate(['/rfq/new-rfq'], {
    queryParams: {
      id: row.quotationId,
      ...(viewMode ? { mode: 'view' } : {})   // only pass view mode if NOT submitter
    },
    skipLocationChange: true
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
    this.loadRfqs();
  }

  onSearchChange(text: string) {
    this.searchText = text;
    this.searchChanged$.next(text);
  }



  onView() {
    if (this.chkBoxSelected.length !== 1) {
      this.toastr.info('Please select exactly one record to view.');
      return;
    }

    const selectedId = this.chkBoxSelected[0].quotationId;

    this.router.navigate(['/rfq/new-rfq'], {
      queryParams: { id: selectedId, mode: 'view' }, skipLocationChange: true
    });
  }

  downloadSelectedPdf(): void {
    if (!this.chkBoxSelected || this.chkBoxSelected.length !== 1) {
      this.toastr.warning('Please select exactly one RFQ.');
      return;
    }
    const row = this.chkBoxSelected[0];
    const id = row.quotationId || row.id;
    const rfqNo = row.rfqNo || id;

    this.rfqService.downloadRfqPdf(id).subscribe({
      next: (blob: Blob) => {
        this.pdfExportService.downloadBlob(blob, `RFQ_${rfqNo}.pdf`);
      },
      error: () => {
        const html = `
          <div class="header-bar">
            <div>
              <h1>Request For Quotation</h1>
              <div class="subtitle">${row.entityName || 'Procurement Portal'}</div>
            </div>
            <div class="meta-box">
              <div class="doc-number">QUOTATION #: ${rfqNo}</div>
              <div class="doc-date">Date: ${row.date || '-'}</div>
              <div class="status-badge status-open">${row.requestStatus || 'Open'}</div>
            </div>
          </div>

          ${row.title ? `
            <div class="purpose-banner">
              <span class="purpose-label">Scope / Title:</span>
              <span class="purpose-text">${row.title}</span>
            </div>
          ` : ''}

          <div class="info-cards info-cards-3">
            <div class="info-card">
              <div class="info-card-header">Quotation Overview</div>
              <div class="info-card-body">
                <div class="info-row"><span class="info-label">Entity</span><span class="info-value">${row.entityName || 'Procurement Portal'}</span></div>
                <div class="info-row"><span class="info-label">Department</span><span class="info-value">${row.department || '-'}</span></div>
                <div class="info-row"><span class="info-label">Purchase Request</span><span class="info-value">${row.purchaseRequestNo || '-'}</span></div>
                <div class="info-row"><span class="info-label">Issue Date</span><span class="info-value">${row.date || '-'}</span></div>
              </div>
            </div>
            <div class="info-card">
              <div class="info-card-header">Timeline & Scope</div>
              <div class="info-card-body">
                <div class="info-row"><span class="info-label">Deadline</span><span class="info-value">${row.endDate || '-'}</span></div>
                <div class="info-row"><span class="info-label">Line Items</span><span class="info-value">${row.itemsCount || '1'} Items</span></div>
                <div class="info-row"><span class="info-label">Invited Vendors</span><span class="info-value">${row.vendorsCount || 'Competitive'}</span></div>
                <div class="info-row"><span class="info-label">Status</span><span class="info-value">${row.requestStatus || 'Open'}</span></div>
              </div>
            </div>
            <div class="info-card">
              <div class="info-card-header">Delivery & Contact</div>
              <div class="info-card-body">
                <div class="info-row"><span class="info-label">Delivery Location</span><span class="info-value">${row.deliveryLocation || '-'}</span></div>
                <div class="info-row"><span class="info-label">Contact Person</span><span class="info-value">${row.contact || row.owner || '-'}</span></div>
              </div>
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 14px; text-align: center; color: #64748b; font-size: 11.5px; margin-top: 15px;">
            Open the RFQ details to view and download full quotation line items, technical specifications, and vendor comparisons.
          </div>
        `;
        this.pdfExportService.printFormattedDocument(`RFQ_${rfqNo}`, html);
      }
    });
  }

  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  openEmpDetails() {
    this.router.navigate(['/rfq/new-rfq']);
  }

  onSort(event) {
    this.loading = true;
    setTimeout(() => {
      const sort = event.sorts[0];
      this.rfqData.sort((a, b) => {
        const aValue = (a[sort.prop] ?? '').toString();
        const bValue = (b[sort.prop] ?? '').toString();
        return aValue.localeCompare(bValue) * (sort.dir === 'desc' ? -1 : 1);
      });
      this.loading = false;
    }, 200);
  }

  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
    this.idsToDelete = this.chkBoxSelected.map(item => item.quotationId);
    this.enableDisableButtons();
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.chkBoxSelected = [...this.rfqData];
    } else {
      this.chkBoxSelected = [];
    }
    this.idsToDelete = this.chkBoxSelected.map(item => item.quotationId);
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
    this.isAllSelected = this.rfqData.length === this.chkBoxSelected.length;

    // Disable delete if any selected item has restricted status
    const hasRestrictedStatus = this.chkBoxSelected.some(
      row => row.requestStatus === 'InProgress' || row.requestStatus === 'Completed'
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
    if(!this.permissionService.can(FORM_IDS.REQUEST_FOR_QUOTATION, 'delete')) 
      return;
    if (this.idsToDelete.length === 0) {
      this.toastr.info('Please select at least one record to delete.');
      return;
    }
    if (this.hasRestrictedStatus) {
      this.toastr.warning('Cannot delete records with status "InProgress" or "Completed".');
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

  //  CONFIRM DELETION OF QUOTATION REQUEST
  confirmDelete(): void {
    if (this.idsToDelete.length === 0) return;

    this.rfqService.deleteQuotatioRequests(this.idsToDelete).subscribe({
      next: () => {
        Swal.fire('Deleted!', 'Selected record(s) have been deleted successfully.', 'success');
        this.loadRfqs();
        this.chkBoxSelected = [];
        this.idsToDelete = [];
      },
      error: (err) => {
        console.error('Delete failed:', err);
        Swal.fire('Error', 'An error occurred while deleting records.', 'error');
      }
    });
  }

  onUpdate() {
    if (this.chkBoxSelected.length === 0) {
      this.toastr.info('Please select a record to update.');
      return;
    }

    if (this.chkBoxSelected.length > 1) {
      this.toastr.info('Please select only one record to update.');
      return;
    }

    const selectedId = this.chkBoxSelected[0].quotationId;
    console.log('Navigating to update ID:', selectedId);

    this.router.navigate(['/rfq/new-rfq'], {
      queryParams: { id: selectedId }, skipLocationChange: true
    });
  }

  openQuotationBoxModal(row: any): void {
    const modalRef = this.modalService.open(RfqQuotationboxComponent, { size: 'lg', backdrop: 'static', centered: true });
    modalRef.componentInstance.data = row;  // Pass selected row data if needed
  }

  openVendorsModal(row: any): void {
    const modalRef = this.modalService.open(RfqVendorModalComponent, { size: 'lg', backdrop: 'static', centered: true });
    modalRef.componentInstance.data = row;  // Pass selected row data if needed
  }

  openVendorComparisonModal(row: any): void {
    const modalRef = this.modalService.open(VendorComparisionComponent, { size: 'lg', backdrop: 'static', centered: true });
    modalRef.componentInstance.data = row;  // Pass selected row data if needed
  }

  openApprovalHistoryModal(row: any): void {
    const modalRef = this.modalService.open(RfqApprovalHistoryComponent, { size: 'lg', backdrop: 'static', centered: true });
    modalRef.componentInstance.rfqNo = row.rfqNo; // pass RfqNo
  }

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

        this.purchaseOrderService.createPurchaseOrderFromRFQ(row.quotationId).subscribe({
          next: () => {
            console.log("Successfully created PO");
            this.loadRfqs();
          },
          error: () => {
            this.toastr.error('Something went wrong while creating PO.');
          }
        });

      }
    });
  }

  onPageChange(event: any) {
    // ngx-datatable gives 0-based offset
    this.query.currentPage = (event?.offset ?? 0) + 1;
    this.loadRfqs();
  }

  private mapStatusKey(status: string): 'chip--success' | 'chip--pending' | 'chip--rejected' | 'chip--approved' | 'chip--draft' {
    const s = status?.toLowerCase();

    if (s === 'completed' || s === 'successful' || s === 'accepted'  || s === 'paid' || s === 'delivered' || s === 'active')
      return 'chip--success';

    if (s === 'rejected')
      return 'chip--rejected';

    if (s === 'draft')
      return 'chip--draft';

    if (s === 'pending for payment' || s === 'pending' || s === 'on hold' || s === 'inactive' || s === 'inprogress' || s === 'in progress' || s === 'sendback')  
      return 'chip--pending';

    if (s === 'approved for payment' || s === 'approved' || s === 'new' || s === 'awarded')
      return 'chip--approved';
  }
}