import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompanyService } from 'app/shared/services/Company.services';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { AuthService } from 'app/shared/auth/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-procurment-companies',
  templateUrl: './procurment-companies.component.html',
  styleUrls: ['./procurment-companies.component.scss']
})
export class ProcurmentCompaniesComponent implements OnInit {
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  tenderingData: any[] = [];
  chkBoxSelected: any[] = [];
  loading = false;
  isAllSelected = false;

  isEditButtonDisabled = true;
  isDeleteButtonDisabled = true;

  columns = [
    { prop: 'id', name: 'ID', width: 80 },
    { prop: 'companyGUID', name: 'Company GUID', width: 200 },
    { prop: 'name', name: 'Name', width: 200 },
    { prop: 'logo', name: 'Logo', width: 100 },
    { prop: 'status', name: 'Status', width: 100 } // optional column for status
  ];

  constructor(
    private router: Router,
    private companyService: CompanyService,
    private authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Only Admins can access
    if (!this.authService.hasRole('Admin')) {
      this.toastr.warning('Access denied. Only Admins can access this page.');
      this.router.navigate(['/dashboard/dashboard1']);
      return;
    }

    this.loadCompanyData();
  }

  // Load companies
  loadCompanyData() {
    this.loading = true;
    this.companyService.getProCompanies().subscribe({
      next: (res: any) => {
        // Use paginated result array
        const companies = res?.result || [];

        this.tenderingData = companies.map((c: any) => ({
          ...c,
          status: c.isDeleted ? 'Inactive' : 'Active', // optional: show readable status
          logo: c.logo || ''
        }));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching companies:', err);
        this.loading = false;
      }
    });
  }

  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  toggleSelectAll(event: any) {
    this.isAllSelected = event.target.checked;
    this.chkBoxSelected = this.isAllSelected ? [...this.tenderingData] : [];
    this.updateActionButtons();
  }

  customChkboxOnSelect({ selected }: any) {
    this.chkBoxSelected = [...selected];
    this.updateActionButtons();
  }

  openEmpDetails() {
    this.router.navigate(['/procurment-companies/procurment-companies-edit']);
  }

  updateActionButtons() {
    const selectedCount = this.chkBoxSelected.length;
    this.isEditButtonDisabled = selectedCount !== 1;
    this.isDeleteButtonDisabled = selectedCount === 0;
  }

  editSelectedRow() {
    if (this.chkBoxSelected.length === 1) {
      const selectedCompany = this.chkBoxSelected[0];
      this.router.navigate(['/procurment-companies/procurment-companies-edit'], {
        queryParams: { id: selectedCompany.id }
      });
    } else {
      alert('Please select a single company to update.');
    }
  }

  deleteSelectedRows() {
    if (this.chkBoxSelected.length === 0) {
      alert('Please select at least one company to delete.');
      return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete ${this.chkBoxSelected.length} company(s)?`);
    if (!confirmDelete) return;

    const idsToDelete = this.chkBoxSelected.map(c => c.id);

    this.companyService.deleteProCompanies(idsToDelete).subscribe({
      next: () => {
        alert('Selected company(s) deleted successfully!');
        this.loadCompanyData();
        this.chkBoxSelected = [];
        this.updateActionButtons();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error deleting companies:', err);
      }
    });
  }

  getStatus(row: any): string {
    return row.isDeleted ? 'Inactive' : 'Active';
  }

  getStatusClass(row: any): string {
    return row.isDeleted ? '' : '';
  }
}
