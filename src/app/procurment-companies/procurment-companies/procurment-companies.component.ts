import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CompanyService } from 'app/shared/services/Company.services';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { AuthService } from 'app/shared/auth/auth.service'; // Import AuthService
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
    { prop: 'logo', name: 'Logo', width: 100 }
  ];

  constructor(
    private router: Router, 
    private companyService: CompanyService,
    private authService: AuthService, // Inject AuthService
 private toastr: ToastrService 

  ) { }

  ngOnInit(): void {
    // Check if user is admin
    if (!this.authService.hasRole('Admin')) {
     this.toastr.warning('Access denied. Only Admins can access this page.');
      this.router.navigate(['/dashboard/dashboard1']); // redirect non-admins
      return;
    }

    this.loadCompanyData();
  }

  // Load companies
  loadCompanyData() {
    this.loading = true;
    this.companyService.getProCompanies().subscribe({
      next: (res: any) => {
        this.tenderingData = res.$values || [];
        this.loading = false;
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
    this.router.navigate(['/procurment-companies/procurment-companies-edit']); // create new company
  }

  updateActionButtons() {
    const selectedCount = this.chkBoxSelected.length;
    this.isEditButtonDisabled = selectedCount !== 1;   // Only enable Edit if 1 row selected
    this.isDeleteButtonDisabled = selectedCount === 0; // Enable Delete if at least 1 selected
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
      },
      error: (err) => {
        console.error('Error deleting companies:', err);
      }
    });
  }
}
