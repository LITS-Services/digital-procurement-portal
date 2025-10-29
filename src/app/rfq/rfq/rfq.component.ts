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

@Component({
  selector: 'app-rfq',
  templateUrl: './rfq.component.html',
  styleUrls: ['./rfq.component.scss'],
})

export class RfqComponent implements OnInit {

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  activeFilter: string = ''; // default filter
  hasRestrictedStatus: boolean = false; // for disabling delete button if RFQ status is InProcess or Completed
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

  // currentPage = 1;
  // pageSize = 10;
  totalPages = 0;
  totalItems = 0;

    showFilterBar = false;
  selectedStatusLabel = 'All';

  statusTouched:boolean = false;

  private _resizeT?: any;
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
    rfqNo: null
  };

  status:any

  searchText = '';
  private searchChanged$ = new Subject<string>();

  constructor(private router: Router, private modalService: NgbModal,
    private route: ActivatedRoute, private rfqService: RfqService,
    private cdr: ChangeDetectorRef, public toastr: ToastrService,
    public lookupService:LookupService
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

    this.loadRfqs();
    
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

  loadRfqs() {
    this.loading = true;

    this.rfqService.getAllQuotations(this.query).subscribe({
      next: (data: any) => {

        // Extract paginated data correctly
        this.rfqData = data?.result || [];
        
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

  onStatusChange(status: any) {
    if(status === 'All') {
      this.selectedStatusLabel = "All"
    }
    else{
       this.selectedStatusLabel = status?.description;
    }
    this.statusTouched = true;
    this.query.status = status?.description;;
    this.query.currentPage = 1 ;
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


    onPageChange(event: any) {
    // ngx-datatable gives 0-based offset
    this.query.currentPage = (event?.offset ?? 0) + 1;
    this.loadRfqs();
  }
}