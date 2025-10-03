import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { CompanyService } from 'app/shared/services/Company.services';
import { AuthService } from 'app/shared/auth/auth.service';

@Component({
  selector: 'app-company-listing',
  templateUrl: './company-listing.component.html',
  styleUrls: ['./company-listing.component.scss']
})
export class CompanyListingComponent implements OnInit {

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  tenderingData: any[] = [];       // filtered list for table
  allCompanies: any[] = [];        // full list (for ALL button)
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
    private companyService: CompanyService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  gotoEditCompany() {
    this.router.navigateByUrl('/company/company-edit');
  }

  ngOnInit(): void {
    this.getCompanyData();

    // Define the table columns
    this.columns = [
      { prop: 'name', name: 'Name' },
      { prop: 'companyStatus', name: 'Status' },
      { prop: 'street', name: 'Street' },
      { prop: 'city', name: 'City' },
      { prop: 'contactNumber', name: 'Contact Number' },
      { prop: 'edit', name: 'Edit' }
    ];
  }

  getCompanyData() {
    this.loading = true;

    const isAdmin = this.authService.hasRole('Admin');

    if (isAdmin) {
      this.companyService.getVendorCompanies().subscribe({
        next: (res: any) => {
          const companies = res?.$values || [];

          // ✅ Store all companies
          this.allCompanies = companies.map(c => this.mapCompany(c));

          // ✅ Default → show Inprocess & Approved
          this.tenderingData = this.allCompanies.filter(c =>
            c.companyStatus.toLowerCase() === 'inprocess' ||
            c.companyStatus.toLowerCase() === 'approve'
          );

          this.rows = [...this.tenderingData];
          this.cdr.detectChanges();
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching vendor companies:', err);
          this.loading = false;
        }
      });

    } else {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.warn('No userId found in localStorage');
        this.tenderingData = [];
        this.rows = [];
        this.loading = false;
        return;
      }

      this.companyService.getCompaniesByUserEntity(userId).subscribe({
        next: (res: any) => {
          const companies = res?.$values || [];

          // ✅ Store all companies
          this.allCompanies = companies.map(c => this.mapCompany(c));

          // ✅ Default → show Inprocess & Approved
          this.tenderingData = this.allCompanies.filter(c =>
            c.companyStatus.toLowerCase() === 'inprocess' ||
            c.companyStatus.toLowerCase() === 'approve'
          );

          this.rows = [...this.tenderingData];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching companies by user:', err);
          this.loading = false;
        }
      });
    }
  }

  private mapCompany(c: any) {
    const primaryAddress = c.addressesVM?.$values?.[0] || {};
    const primaryContact = c.contactsVM?.$values?.[0] || {};
    const demographics = c.purchasingDemographics || {};

    return {
      id: c.id,
      name: c.name,
      companyStatus: c.status || '',
      street: primaryAddress.street || '',
      city: primaryAddress.city || '',
      contactNumber: primaryContact.contactNumber || '',
      remarks: c.remarks || '',
      approverId: c.approverId,
      vendorId: c.vendorId,
      vendorType: demographics.vendorType || '',
      primaryCurrency: demographics.primaryCurrency || ''
    };
  }

  showAll() {
   this.rows = this.allCompanies.filter(c =>
      c.companyStatus.toLowerCase() === 'inprocess'  ||
       c.companyStatus.toLowerCase() === 'approve'
    );  
                  this.cdr.detectChanges()

  }

  showInProcess() {
    this.rows = this.allCompanies.filter(c =>
      c.companyStatus.toLowerCase() === 'inprocess'
    );
                      this.cdr.detectChanges()

  }

  showRecall() {
    this.rows = this.allCompanies.filter(c =>
      c.companyStatus.toLowerCase() === 'sendback'
    );
                      this.cdr.detectChanges()

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

    this.isAllSelected = this.tenderingData.length === selectedRowCount;
  }

  editSelectedRow() {
    if (this.chkBoxSelected.length === 1) {
      const row = this.chkBoxSelected[0];
      this.router.navigate(['/company/company-edit'], { queryParams: { id: row.id } });
    } else {
      alert('Please select a single company to update.');
    }
  }
}
