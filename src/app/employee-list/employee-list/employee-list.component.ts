import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { AuthService } from 'app/shared/auth/auth.service';
import { CompanyService } from 'app/shared/services/Company.services';

@Component({
  selector: 'app-employee-list',
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit {

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  tenderingData: any[] = []; // Table data
  chkBoxSelected: any[] = [];
  loading = false;
  columns = [];
  isEditButtonDisabled = true;
  isAllSelected = false;

  constructor(
    private router: Router,
    private companyService: CompanyService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.getProcurementUsers();

    // Table columns
    this.columns = [
      { prop: 'fullName', name: 'Full Name' },
      { prop: 'userName', name: 'Username' },
      { prop: 'email', name: 'Email' },
      { prop: 'phoneNumber', name: 'Phone' },
      { prop: 'status', name: 'Status' }
    ];
  }

  // Fetch procurement users
  getProcurementUsers() {
    this.loading = true;

    this.companyService.getprocurementusers().subscribe({
      next: (res: any) => {
        const users = res?.$values || [];

        // Map only necessary fields
        this.tenderingData = users.map((u: any) => ({
          id: u.id,
          fullName: u.fullName || '-',
          userName: u.userName || '-',
          email: u.email || '-',
          phoneNumber: u.phoneNumber || 'N/A',
          isDeleted: u.isDeleted
        }));

        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching users:', err);
        this.loading = false;
      }
    });
  }

  // Navigate back to dashboard
  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  // Sort table
  onSort(event) {
    const sort = event.sorts[0];
    const rows = [...this.tenderingData];
    rows.sort((a, b) =>
      a[sort.prop]?.localeCompare(b[sort.prop] || '') * (sort.dir === 'desc' ? -1 : 1)
    );
    this.tenderingData = rows;
  }

  // Row selection
  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
    this.enableDisableButtons();
  }

  // Enable/disable top buttons
  enableDisableButtons() {
    const selectedCount = this.chkBoxSelected.length;
    this.isEditButtonDisabled = selectedCount !== 1;
    this.isAllSelected = this.tenderingData.length === selectedCount;
  }

  // Toggle select all
  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.chkBoxSelected = [...this.tenderingData];
    } else {
      this.chkBoxSelected = [];
    }
    this.enableDisableButtons();
  }
// Navigate to register user page
registerUser() {
  this.router.navigate(['/employee']);
}

  // Edit button (top)
  editSelectedRow() {
    if (this.chkBoxSelected.length === 1) {
      const selectedUser = this.chkBoxSelected[0];
      this.router.navigate(['/employee'], { queryParams: { id: selectedUser.id } });
    } else {
      alert('Please select a single user to edit.');
    }
  }
}
