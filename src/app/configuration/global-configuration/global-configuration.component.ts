import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { SystemService } from 'app/shared/services/system.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-global-configuration',
  templateUrl: './global-configuration.component.html',
  styleUrls: ['./global-configuration.component.scss']
})
export class GlobalConfigurationComponent implements OnInit {

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  activeFilter: string = ''; // default filter
  hasRestrictedStatus: boolean = false; // for disabling delete button if RFQ status is InProcess or Completed
  globalConfigData: any[] = [];
  chkBoxSelected: any[] = [];
  idsToDelete: number[] = [];
  loading = false;
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
  constructor(private systemService: SystemService,
    private cdr: ChangeDetectorRef,
    public toastr: ToastrService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadGlobalConfigs();
    this.cdr.detectChanges();
  }

  loadGlobalConfigs() {
    this.loading = true;

    this.systemService.getAllGlobalConfigs(this.currentPage, this.pageSize).subscribe({
      next: (data: any) => {

        // Extract paginated data correctly
        this.globalConfigData = data?.result || [];

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

  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  openEmpDetails() {
    this.router.navigate(['/configuration/global/new-global-config']);
  }

  onSort(event) {
    this.loading = true;
    setTimeout(() => {
      const sort = event.sorts[0];
      this.globalConfigData.sort((a, b) => {
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
      this.chkBoxSelected = [...this.globalConfigData];
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
    this.isAllSelected = this.globalConfigData.length === this.chkBoxSelected.length;
  }

  // OPEN DELETE MODAL
  // openDeleteModal(): void {
  //   if (this.idsToDelete.length === 0) {
  //     this.toastr.info('Please select at least one record to delete.');
  //     return;
  //   }

  //   Swal.fire({
  //     title: 'Are you sure?',
  //     text: `You are about to delete ${this.idsToDelete.length} record(s). This action cannot be undone.`,
  //     icon: 'warning',
  //     showCancelButton: true,
  //     confirmButtonText: 'Yes, delete',
  //     cancelButtonText: 'Cancel',
  //     confirmButtonColor: '#d33',
  //     cancelButtonColor: '#3085d6',
  //   }).then((result) => {
  //     if (result.isConfirmed) {
  //       this.confirmDelete();
  //     }
  //   });
  // }

  //  CONFIRM DELETION OF GLOBAL CONFIG
  // confirmDelete(): void {
  //   if (this.idsToDelete.length === 0) return;

  //   this.globalConfigData.deleteQuotatioRequests(this.idsToDelete).subscribe({
  //     next: () => {
  //       Swal.fire('Deleted!', 'Selected record(s) have been deleted successfully.', 'success');
  //       this.loadGlobalConfigs();
  //       this.chkBoxSelected = [];
  //       this.idsToDelete = [];
  //     },
  //     error: (err) => {
  //       console.error('Delete failed:', err);
  //       Swal.fire('Error', 'An error occurred while deleting records.', 'error');
  //     }
  //   });
  // }

  onUpdate() {
    if (this.chkBoxSelected.length === 0) {
      this.toastr.info('Please select a record to update.');
      return;
    }

    if (this.chkBoxSelected.length > 1) {
      this.toastr.info('Please select only one record to update.');
      return;
    }

    const selectedId = this.chkBoxSelected[0].id;

    this.router.navigate(['/configuration/global/new-global-config'], {
      queryParams: { id: selectedId }
    });
  }

  onPageChange(event: any) {
    this.currentPage = (event.offset ?? 0) + 1;
    this.loadGlobalConfigs();
  }
}
