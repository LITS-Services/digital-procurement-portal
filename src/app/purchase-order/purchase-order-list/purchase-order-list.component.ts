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
import { PdfExportService } from 'app/shared/services/pdf-export.service';

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
    private toastr: ToastrService,
    private pdfExportService: PdfExportService
  ) { }

  get isMobile(): boolean {
    return window.innerWidth <= 1400;
  }

  ngOnInit(): void {
    this.loadStatus();
    this.loadPurchaseOrders();
    this.cdr.detectChanges();
  }

  loadPurchaseOrders() {
    const userId = localStorage.getItem('userId');
    const lsEntity = localStorage.getItem('selectedCompanyId');
    const entityId = (!lsEntity || lsEntity === 'All' || isNaN(Number(lsEntity))) ? null : Number(lsEntity);
    
    this.loading = true;
    this.spinner.show();
    this.purchaseOrderService.getAllPurchaseOrders(this.currentPage, this.pageSize, entityId, userId, this.selectedStatus)
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
    this.isAllSelected = this.purchaseOrderData.length === this.chkBoxSelected.length;
  }

  onActivate(event: any) {
    if (event.type === 'click') {
      if(!this.permissionService.can(FORM_IDS.PURCHASE_ORDER, 'read'))
        return;
      const poId = event.row.id;
      this.router.navigate(['/purchase-order/details'], { queryParams: { id: poId }, skipLocationChange: true });

    }
  }

  onRowClick(row: any) {
    if(!this.permissionService.can(FORM_IDS.PURCHASE_ORDER, 'read'))
      return;
    const id = row?.id;
    if (id) {
      this.router.navigate(['/purchase-order/details'], { queryParams: { id: id }, skipLocationChange: true });

    }
  }

  downloadPoPdf(row: any): void {
    const id = row?.id;
    const poNo = row?.purchaseOrderNo || id;
    if (!id) return;

    this.spinner.show();
    this.purchaseOrderService.downloadPurchaseOrderPdf(id).subscribe({
      next: (blob: Blob) => {
        this.spinner.hide();
        this.pdfExportService.downloadBlob(blob, `PO_${poNo}.pdf`);
      },
      error: () => {
        this.spinner.hide();
        const statusText = row.requestStatus || 'Active';
        const statusClass = String(statusText).toLowerCase().includes('approv')
          ? 'status-approved'
          : (String(statusText).toLowerCase().includes('reject')
              ? 'status-rejected'
              : (String(statusText).toLowerCase().includes('prog') || String(statusText).toLowerCase().includes('pend')
                  ? 'status-inprogress'
                  : 'status-draft'));

        const html = `
          <div class="header-bar">
            <div>
              <h1>Purchase Order</h1>
              <div class="subtitle">${row.entityName || 'Procurement Portal'}</div>
            </div>
            <div class="meta-box">
              <div class="doc-number">PO #: ${poNo}</div>
              <div class="doc-date">Date: ${row.createdDate || '-'}</div>
              <div class="status-badge ${statusClass}">${statusText}</div>
            </div>
          </div>

          <div class="info-cards info-cards-3">
            <div class="info-card">
              <div class="info-card-header">Vendor & Entity</div>
              <div class="info-card-body">
                <div class="info-row"><span class="info-label">Vendor Name</span><span class="info-value">${row.vendorCompanyName || '-'}</span></div>
                <div class="info-row"><span class="info-label">Order Date</span><span class="info-value">${row.createdDate || '-'}</span></div>
                <div class="info-row"><span class="info-label">Status</span><span class="info-value">${statusText}</span></div>
              </div>
            </div>
            <div class="info-card">
              <div class="info-card-header">Shipment & Delivery</div>
              <div class="info-card-body">
                <div class="info-row"><span class="info-label">Ship To</span><span class="info-value">${row.shipToName || row.receiverName || '-'}</span></div>
                <div class="info-row"><span class="info-label">Loc. Code</span><span class="info-value">${row.locationCode || '-'}</span></div>
                <div class="info-row"><span class="info-label">Destination</span><span class="info-value">${[row.shipToCity, row.shipToCountry].filter(Boolean).join(', ') || '-'}</span></div>
              </div>
            </div>
            <div class="info-card">
              <div class="info-card-header">Procurement References</div>
              <div class="info-card-body">
                <div class="info-row"><span class="info-label">PR Reference</span><span class="info-value">${row.requisitionNo || '-'}</span></div>
                <div class="info-row"><span class="info-label">RFQ Reference</span><span class="info-value">${row.rfqNo || '-'}</span></div>
                <div class="info-row"><span class="info-label">Total Items</span><span class="info-value">${row.itemsCount || '1'} Items</span></div>
              </div>
            </div>
          </div>

          <div style="background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: 14px; text-align: center; color: #64748b; font-size: 11.5px; margin-top: 15px;">
            Open the purchase order details to view and download full line items, delivery schedules, and payment terms.
          </div>
        `;
        this.pdfExportService.printFormattedDocument(`PO_${poNo}`, html);
      }
    });
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