import { ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType, NgxDatatableModule } from '@swimlane/ngx-datatable';
import { PurchaseOrderService } from 'app/shared/services/purchase-order.service';

@Component({
  selector: 'app-purchase-order-list',
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.scss'],
})
export class PurchaseOrderListComponent implements OnInit {
  @ViewChild('purchaseOrderDetail') purchaseOrderDetail: TemplateRef<any>;
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

  constructor(private purchaseOrderService: PurchaseOrderService,
    public cdr: ChangeDetectorRef,
    private router: Router,
    private modalService: NgbModal,
    private route: ActivatedRoute

  ) { }

  ngOnInit(): void {
    this.loadPurchaseOrders();
  }

  loadPurchaseOrders() {
    this.loading = true;

    this.purchaseOrderService.getAllPurchaseOrders(this.currentPage, this.pageSize).subscribe({
      next: (data: any) => {

        // Extract paginated data correctly
        this.purchaseOrderData = data?.result || [];

        // Capture pagination info
        this.totalPages = data.totalPages;
        this.totalItems = data.totalItems;

        this.loading = false;
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
      const poId = event.row.id;
      this.router.navigate([poId], { relativeTo: this.route });

    }
  }
  onRowClick(event: any) {
    const id = event?.row?.id;
    if (id) {
      this.router.navigate([id], { relativeTo: this.route });

    }
  }
}