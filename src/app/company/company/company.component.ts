import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { CompanyService } from 'app/shared/services/Company.services';

@Component({
  selector: 'app-company',
  templateUrl: './company.component.html',
  styleUrls: ['./company.component.scss']
})
export class CompanyComponent implements OnInit {
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  tenderingData: any[] = []; // data for table
  public chkBoxSelected = [];
  loading = false;
  public rows = [];
  columns = [];
  announcementId: number;
  isEditButtonDisabled = true;
  isDeleteButtonDisabled = true;
  isOpenButtonDisabled = true;
  isAddNewDisable = true;
  isAllSelected = false;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private companyService: CompanyService
  ) {}

  ngOnInit(): void {
    this.getCompanyData();

    // ✅ Define the table columns
    this.columns = [
      { prop: 'name', name: 'Name' },
      { prop: 'companyStatus', name: 'Status' },
      { prop: 'street', name: 'Street' },
      { prop: 'city', name: 'City' },
      { prop: 'contactNumber', name: 'Contact Number' },
      { prop: 'edit', name: 'Edit' }
    ];
  }

  // ✅ Fetch company data from API
  // ✅ Fetch company data from API
getCompanyData() {
  this.loading = true;
  this.companyService.getVendorCompanies().subscribe({
    next: (res: any) => {
      const companies = res.$values || [];

      // ✅ Filter: only keep "Inprogress"
      const filtered = companies.filter((c: any) => c.status?.toLowerCase() === 'inprogress');

      this.tenderingData = filtered.map((c: any) => {
        const primaryAddress = c.addresses?.$values?.[0] || {};
        const primaryContact = c.contacts?.$values?.[0] || {};

        return {
          id: c.id,
          name: c.name,
          companyStatus: c.status || '',
          street: primaryAddress.street || '',
          city: primaryAddress.city || '',
          contactNumber: primaryContact.contactNumber || ''
        };
      });

      this.rows = [...this.tenderingData];
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

  openEmpDetails() {
    this.router.navigate(['/purchase-request/new-purchase-request']);
  }

  onSort(event) {
    this.loading = true;
    setTimeout(() => {
      const rows = [...this.rows];
      const sort = event.sorts[0];
      rows.sort((a, b) =>
        a[sort.prop].localeCompare(b[sort.prop]) * (sort.dir === 'desc' ? -1 : 1)
      );

      this.rows = rows;
      this.loading = false;
    }, 1000);
  }

  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [];
    this.chkBoxSelected.splice(0, this.chkBoxSelected.length);
    this.chkBoxSelected.push(...selected);
    this.announcementId = selected[0]?.id;

    this.enableDisableButtons();
  }

  enableDisableButtons() {
    const selectedRowCount = this.chkBoxSelected.length;

    this.isDeleteButtonDisabled = selectedRowCount === 0;
    this.isEditButtonDisabled = selectedRowCount !== 1;
    this.isOpenButtonDisabled = selectedRowCount === 0;

    this.isAllSelected = this.tenderingData.length === this.chkBoxSelected.length;
  }

  // ✅ Edit button action
  // editRow(row: any) {
  //   console.log('Editing row:', row);
  //   this.router.navigate(['/company/edit', row.id]); // adjust route as needed
  // }
}
