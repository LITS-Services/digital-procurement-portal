import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType, DatatableComponent } from '@swimlane/ngx-datatable';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { LookupService } from 'app/shared/services/lookup.service';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';
import { NgxSpinnerService } from 'ngx-spinner';

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
    private spinner: NgxSpinnerService
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
    this.loading = true;
    const entityId = Number(localStorage.getItem('selectedCompanyId'));
    
    this.loading = true;
    this.spinner.show();
    this.purchaseOrderService.getAllPurchaseOrders(this.currentPage, this.pageSize, entityId, userId, this.selectedStatus).subscribe({
      next: (data: any) => {

        // Extract paginated data correctly
        this.purchaseOrderData = (data?.result || []).map((r: any) => ({
        ...r,
        statusClass: `chip ${this.mapStatusKey(r.requestStatus || r.status)}`
      }));;

        // Capture pagination info
        this.totalPages = data.totalPages;
        this.totalItems = data.totalItems;
        this.loading = false;
        this.spinner.hide();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching Purchase Orders:', err);
        this.loading = false;
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
      if(!this.permissionService.can(FORM_IDS.REQUEST_FOR_QUOTATION, 'write'))
      return;
      const poId = event.row.id;
      this.router.navigate(['/purchase-order/details'], { queryParams: { id: poId }, skipLocationChange: true });

    }
  }

  onRowClick(row: any) {
    if(!this.permissionService.can(FORM_IDS.REQUEST_FOR_QUOTATION, 'write'))
      return;
    const id = row?.id;
    if (id) {
      this.router.navigate(['/purchase-order/details'], { queryParams: { id: id }, skipLocationChange: true });

    }
  }

  private mapStatusKey(status: string): 'chip--success' | 'chip--pending' | 'chip--rejected' | 'chip--approved' {
    const s = status?.toLowerCase();

    if (s === 'completed' || s === 'successful' || s === 'accepted'  || s === 'paid' || s === 'active' || s === 'closed')
      return 'chip--success';

    if (s === 'rejected')
      return 'chip--rejected';

    if (s === 'pending for payment' || s === 'pending' || s === 'on hold' || s === 'inactive' || s === 'inprogress' || s === 'draft' || s === 'sendback' || s === 'delivered')  
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