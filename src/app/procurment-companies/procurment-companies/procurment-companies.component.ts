import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CompanyService } from 'app/shared/services/Company.services';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { AuthService } from 'app/shared/auth/auth.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { PermissionService } from 'app/shared/permissions/permission.service';
import { FORM_IDS } from 'app/shared/permissions/form-ids';

@Component({
  selector: 'app-procurment-companies',
  templateUrl: './procurment-companies.component.html',
  styleUrls: ['./procurment-companies.component.scss'],
  standalone: false,
})
export class ProcurmentCompaniesComponent implements OnInit {
     @ViewChild('datatable', { static: false }) datatable!: DatatableComponent;
  FORM_IDS = FORM_IDS;
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  tenderingData: any[] = [];
  chkBoxSelected: any[] = [];
  loading = false;
  isAllSelected = false;

  isEditButtonDisabled = true;
  isOpenButtonDisabled = true;
  isDeleteButtonDisabled = true;
  idsToDelete: number[] = [];

  columns = [
    { prop: 'id', name: 'ID', width: 80 },
    { prop: 'companyGUID', name: 'Company GUID', width: 200 },
    { prop: 'name', name: 'Name', width: 200 },
    { prop: 'logo', name: 'Logo', width: 100 },
    { prop: 'status', name: 'Status', width: 100 }, // optional column for status
  ];

  datatableVisible: boolean = true;

  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;

  constructor(
    private router: Router,
    private companyService: CompanyService,
    private authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private permissionService: PermissionService
  ) {}

  onAutoResize(): void {
    this.datatableVisible = false;
    this.cdr.detectChanges(); // destroy

    requestAnimationFrame(() => {
      this.datatableVisible = true;
      this.cdr.detectChanges(); // recreate
    });
  }

  get isMobile(): boolean {
    return window.innerWidth <= 768;
  }

  ngOnInit(): void {
    // Only Super Admins can access
    // if (!this.authService.hasRole('Super Admin')) {
    //   this.toastr.warning('Access denied. Only Super Admin can access this page.');
    //   this.router.navigate(['/dashboard/dashboard1']);
    //   return;
    // }

    this.loadCompanyData();
  }

  // Load companies
  loadCompanyData() {
    const userId = localStorage.getItem('userId');
    this.loading = true;
    this.companyService.getProCompanies(this.currentPage, this.pageSize, userId).subscribe({
      next: (res: any) => {
        // Use paginated result array
        const companies = res?.result || [];

        this.tenderingData = companies.map((c: any) => ({
          ...c,
          status: c.isDeleted ? 'Inactive' : 'Active', // optional: show readable status
          statusClass: `chip ${this.mapStatusKey(c.isDeleted ? 'Inactive' : 'Active')}`,
          logo: c.logo || '',
        }));
        this.totalPages = res.totalPages;
        this.totalItems = res.totalItems;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching companies:', err);
        this.loading = false;
      },
    });
  }

  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  // toggleSelectAll(event: any) {
  //   this.isAllSelected = event.target.checked;
  //   this.chkBoxSelected = this.isAllSelected ? [...this.tenderingData] : [];
  //   this.updateActionButtons();
  // }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.chkBoxSelected = [...this.tenderingData];
    } else {
      this.chkBoxSelected = [];
    }
    this.idsToDelete = this.chkBoxSelected.map((item) => item.quotationId);
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
    this.isAllSelected = this.tenderingData.length === this.chkBoxSelected.length;
  }

  // customChkboxOnSelect({ selected }: any) {
  //   this.chkBoxSelected = [...selected];
  //   this.updateActionButtons();
  // }

  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
    this.idsToDelete = this.chkBoxSelected.map((c) => c.id);
    this.enableDisableButtons();
  }

  openEmpDetails() {
    if (!this.permissionService.can(FORM_IDS.ENTITIES, 'write')) return;
    this.router.navigate(['/procurment-companies/procurment-companies-edit']);
  }

  updateActionButtons() {
    const selectedCount = this.chkBoxSelected.length;
    this.isEditButtonDisabled = selectedCount !== 1;
    this.isDeleteButtonDisabled = selectedCount === 0;
  }

  editSelectedRow() {
    if (!this.permissionService.can(FORM_IDS.ENTITIES, 'write')) return;
    if (this.chkBoxSelected.length === 1) {
      const selectedCompany = this.chkBoxSelected[0];
      this.router.navigate(['/procurment-companies/procurment-companies-edit'], {
        queryParams: { id: selectedCompany.id },
      });
    } else {
      this.toastr.info('Please select a single entity to edit.');
    }
  }

  // deleteSelectedRows() {
  //   if (this.chkBoxSelected.length === 0) {
  //     alert('Please select at least one company to delete.');
  //     return;
  //   }

  //   const confirmDelete = confirm(`Are you sure you want to delete ${this.chkBoxSelected.length} company(s)?`);
  //   if (!confirmDelete) return;

  //   const idsToDelete = this.chkBoxSelected.map(c => c.id);

  //   this.companyService.deleteProCompanies(idsToDelete).subscribe({
  //     next: () => {
  //       alert('Selected company(s) deleted successfully!');
  //       this.loadCompanyData();
  //       this.chkBoxSelected = [];
  //       this.updateActionButtons();
  //       this.cdr.detectChanges();
  //     },
  //     error: (err) => {
  //       console.error('Error deleting companies:', err);
  //     }
  //   });
  // }

  // OPEN DELETE MODAL
  openDeleteModal(): void {
    if (!this.permissionService.can(FORM_IDS.ENTITIES, 'delete')) return;
    if (this.idsToDelete.length === 0) {
      this.toastr.info('Please select at least one record to delete.');
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

  //  CONFIRM DELETION OF PROCUREMENT COMPANY
  confirmDelete(): void {
    if (this.idsToDelete.length === 0) return;

    this.companyService.deleteProcurementCompanies(this.idsToDelete).subscribe({
      next: () => {
        Swal.fire('Deleted!', 'Selected record(s) have been deleted successfully.', 'success');
        this.loadCompanyData();
        this.chkBoxSelected = [];
        this.idsToDelete = [];
      },
      error: (err) => {
        console.error('Delete failed:', err);
        Swal.fire('Error', 'An error occurred while deleting records.', 'error');
      },
    });
  }

  getStatus(row: any): string {
    return row.isDeleted ? 'Inactive' : 'Active';
  }

  getStatusClass(row: any): string {
    return row.isDeleted ? '' : '';
  }

  private mapStatusKey(status: string): 'chip--success' | 'chip--pending' | 'chip--rejected' | 'chip--approved' {
    const s = status?.toLowerCase();

    if (s === 'completed' || s === 'successful' || s === 'accepted'  || s === 'paid' || s === 'delivered' || s === 'active')
      return 'chip--success';

    if (s === 'rejected')
      return 'chip--rejected';

    if (s === 'pending for payment' || s === 'pending' || s === 'on hold' || s === 'inactive')
    return 'chip--pending';

    if (s === 'approved for payment' || s === 'approved' || s === 'new' || s === 'awarded')
    return 'chip--approved';
  }
}
