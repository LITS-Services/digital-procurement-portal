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
  showStatusColumn = true; // Flag to toggle the Status column visibility

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private companyService: CompanyService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.getCompanyData();

    // Define the table columns initially without 'Status' as it's conditional
    this.columns = [
      { prop: 'name', name: 'Name' },
      { prop: 'companyStatus', name: 'Status', visible: true },
      { prop: 'street', name: 'Street' },
      { prop: 'city', name: 'City' },
      { prop: 'contactNumber', name: 'Contact Number' },
      { prop: 'entity', name: 'Entity' },  // New column for Entity
      { prop: 'edit', name: 'Edit' }
    ];
  }

  getCompanyData() {
    this.loading = true;

    const userId = localStorage.getItem('userId');

    if (!userId) {
      console.warn('No userId found in localStorage');
      this.tenderingData = [];
      this.rows = [];
      this.loading = false;
      return;
    }

    // Always call getCompaniesByUserEntity regardless of role
    this.companyService.getCompaniesByUserEntity(userId).subscribe({
      next: (res: any) => {
        const companies = res?.result || res || [];

        this.allCompanies = companies.map(c => this.mapCompany(c));

        this.tenderingData = this.allCompanies.filter(c =>
          !c.companyStatus || ['inprocess', 'approve'].includes(c.companyStatus.toLowerCase())
        );

        this.rows = [...this.tenderingData];
        this.loading = false;
        this.cdr.detectChanges();

        console.log('✅ Loaded companies:', this.rows);
      },
      error: (err) => {
        console.error('Error fetching companies:', err);
        this.loading = false;
      }
    });
  }

 private mapCompany(c: any) {
  const primaryAddress = Array.isArray(c.addressesVM) && c.addressesVM.length ? c.addressesVM[0] : {};
  const primaryContact = Array.isArray(c.contactsVM) && c.contactsVM.length ? c.contactsVM[0] : {};
  const demographics = c.purchasingDemographics || {};
  
  // pick the appropriate entity record (you can adjust logic if needed)
  const selectedEntity =
    (c.vendorUseCompaniesVM?.find((v) => v.status?.toLowerCase() === 'inprocess')) ||
    (c.vendorUseCompaniesVM?.[0] || null);

  return {
    id: c.id,
    name: c.name || '',
    companyStatus: c.status || '',
    street: primaryAddress.street || '',
    city: primaryAddress.city || '',
    contactNumber: primaryContact.contactNumber || '',
    remarks: c.remarks || '',
    vendorType: demographics.vendorType || '',
    primaryCurrency: demographics.primaryCurrency || '',
    entity: selectedEntity?.procurementCompany || '', // existing visible field
    procurementCompanyId: selectedEntity?.procurementCompanyId || null // ✅ NEW FIELD
  };
}


  showAll() {
    this.rows = this.allCompanies.filter(c =>
      !c.companyStatus || ['inprocess', 'approve'].includes(c.companyStatus.toLowerCase())
    );
    this.showStatusColumn = true; // Show the Status column when viewing all companies
    this.cdr.detectChanges();
  }

  showInProcess() {
    this.rows = this.allCompanies.filter(c =>
      c.companyStatus.toLowerCase() === 'inprocess'
    );
    this.showStatusColumn = true; // Show Status for in-process companies
    this.cdr.detectChanges();
  }

  showRecall() {
    this.rows = this.allCompanies.filter(c =>
      c.companyStatus.toLowerCase() === 'sendback'
    );
    this.showStatusColumn = false; // Hide Status for recalled companies
    this.cdr.detectChanges();
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
     this.chkBoxSelected = [...selected];
  this.announcementId = selected[0]?.id;

  console.log("Selected ProcurementCompanyId: ", selected[0]?.procurementCompanyId);
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
    this.router.navigate(['/company/company-edit'], { 
      queryParams: { 
        id: row.id, 
        procurementCompanyId: row.procurementCompanyId 
      } 
    });
  } else {
    alert('Please select a single company to update.');
  }
}


}
