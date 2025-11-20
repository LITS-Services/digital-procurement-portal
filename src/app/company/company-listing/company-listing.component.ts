import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { CompanyService } from 'app/shared/services/Company.services';
import { AuthService } from 'app/shared/auth/auth.service';
import { CompanyApprovalHistoryComponent } from '../company-approval-history/company-approval-history.component';
import { AssignMeComponent } from '../assign-me/assign-me.component';
import { CompanySetupHistoryComponent } from '../company-setup-history/company-setup-history.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-company-listing',
  templateUrl: './company-listing.component.html',
  styleUrls: ['./company-listing.component.scss']
})
export class CompanyListingComponent implements OnInit {
  filters: any = {}; // e.g. { entity: '', name: '', city: '', vendorType: '' }

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
  searchTerm: string = '';

  // Filter dropdown state
  activeFilter: string = 'All';
  selectedStatusLabel: string = 'All';
  statusTouched: boolean = false;
  showFilterBar = false;

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private companyService: CompanyService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService,

  ) { }

  ngOnInit(): void {
    this.getCompanyData();

    // Define the table columns initially
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

    this.spinner.show();
    this.companyService.getCompaniesByUserEntity(userId)
      .pipe(finalize(() => {
        this.spinner.hide();
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          const companies = res?.result || res || [];
          console.log('Raw API Response:', companies); // Debug log
          this.allCompanies = companies.map(c => this.mapCompany(c));
          // this.tenderingData = this.allCompanies.filter(c =>
          //   !c.companyStatus || ['inprocess', 'approve'].includes(c.companyStatus.toLowerCase())
          // );
          // this.rows = [...this.tenderingData];


          // Show ALL companies by default
          this.rows = [...this.allCompanies];
          this.activeFilter = 'All';
          this.selectedStatusLabel = 'All';
          this.showStatusColumn = true;

          this.loading = false;
          this.cdr.detectChanges();

          console.log('Mapped companies:', this.rows);
        },
        error: (err) => {
          console.error('Error fetching companies:', err);
          this.loading = false;
        }
      });
  }

  applyFilters() {
    this.rows = this.tenderingData.filter(row => {
      return Object.keys(this.filters).every(key => {
        const filterVal = this.filters[key]?.toString().toLowerCase().trim();
        if (!filterVal) return true; // skip empty filters
        return row[key]?.toString().toLowerCase().includes(filterVal);
      });
    });
  }

  private mapCompany(c: any) {
    const primaryAddress = Array.isArray(c.addressesVM) && c.addressesVM.length ? c.addressesVM[0] : {};
    const primaryContact = Array.isArray(c.contactsVM) && c.contactsVM.length ? c.contactsVM[0] : {};
    const demographics = c.purchasingDemographics || {};

    // Check if this is the direct API response structure (with procurementCompany field)
    if (c.procurementCompany) {
      // This is the direct API response structure from your example
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
        entity: c.procurementCompany || '', // Use procurementCompany directly from API
        procurementCompanyId: c.procurementCompanyId || null,
        vendorCompanyId: c.vendorCompanyId || null,
        vendorEntityAssociationId: c.vendorEntityAssociationId || null, // Add this line
        isAssigned: c.isAssigned || false, // Add this line to include isAssigned from API response
        setUpId: c.setUpId || null,

      };
    } else {
      // Fallback to the original nested structure
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
        entity: selectedEntity?.procurementCompany || '',
        procurementCompanyId: selectedEntity?.procurementCompanyId || null,
        vendorCompanyId: selectedEntity?.vendorCompanyId || null,
        vendorEntityAssociationId: selectedEntity?.vendorEntityAssociationId || null, // Add this line
        isAssigned: selectedEntity?.isAssigned || false, // Add this line for fallback structure if applicable
        setUpId: selectedEntity?.setUpId || null 

      };
    }
  }

  /** FILTER BUTTONS LOGIC */
  // showAll() {
  //   this.rows = this.allCompanies.filter(c =>
  //     !c.companyStatus || ['inprocess', 'approve'].includes(c.companyStatus.toLowerCase())
  //   );
  //   this.activeFilter = 'All';
  //   this.selectedStatusLabel = 'All';
  //   this.statusTouched = true;
  //   this.showStatusColumn = true;
  //   this.cdr.detectChanges();
  // }

  // showInProcess() {
  //   this.rows = this.allCompanies.filter(c =>
  //     c.companyStatus.toLowerCase() === 'inprocess'
  //   );
  //   this.activeFilter = 'InProcess';
  //   this.selectedStatusLabel = 'InProcess';
  //   this.statusTouched = true;
  //   this.showStatusColumn = true;
  //   this.cdr.detectChanges();
  // }

  // showRecall() {
  //   this.rows = this.allCompanies.filter(c =>
  //     c.companyStatus.toLowerCase() === 'sendback'
  //   );
  //   this.activeFilter = 'Recall';
  //   this.selectedStatusLabel = 'Recall';
  //   this.statusTouched = true;
  //   this.showStatusColumn = false;
  //   this.cdr.detectChanges();
  // }

  filterByStatus(status: string) {
    switch (status) {
      case 'All':
        this.rows = this.allCompanies.filter(c =>
          !c.companyStatus || ['inprocess', 'approve', 'sendback', 'new', 'completed'].includes(c.companyStatus.toLowerCase())
        );
        this.showStatusColumn = true;
        break;

      case 'InProcess':
        this.rows = this.allCompanies.filter(c =>
          c.companyStatus.toLowerCase() === 'inprocess'
        );
        this.showStatusColumn = true;
        break;

      case 'Recall':
        this.rows = this.allCompanies.filter(c =>
          c.companyStatus.toLowerCase() === 'sendback'
        );
        this.showStatusColumn = false;
        break;

      case 'new':
        this.rows = this.allCompanies.filter(c =>
          c.companyStatus.toLowerCase() === 'new'
        );
        this.showStatusColumn = true;
        break;

      case 'completed':
        this.rows = this.allCompanies.filter(c =>
          c.companyStatus.toLowerCase() === 'completed'
        );
        this.showStatusColumn = true;
        break;

      default:
        this.rows = [...this.allCompanies];
        this.showStatusColumn = true;
        break;
    }

    this.activeFilter = status;
    this.selectedStatusLabel = status;
    this.statusTouched = true;
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
        a[sort.prop]?.toString().localeCompare(b[sort.prop]?.toString() || '') * (sort.dir === 'desc' ? -1 : 1)
      );
      this.rows = rows;
      this.loading = false;
    }, 1000);
  }

  openApprovalHistoryModal(selectedRow: any): void {
    const modalRef = this.modalService.open(CompanyApprovalHistoryComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });

    // Use the correct property names that match the mapped data
    modalRef.componentInstance.ProcurementCompanyId = selectedRow.procurementCompanyId;
    modalRef.componentInstance.vendorComapnyId = selectedRow.vendorCompanyId || selectedRow.id; // Fallback to id if vendorCompanyId is null
    modalRef.componentInstance.entity = selectedRow.entity;

    console.log('Selected Row for Approval History:', selectedRow);
    console.log('ProcurementCompanyId sent to modal:', selectedRow.procurementCompanyId);
    console.log('vendorCompanyId sent to modal:', selectedRow.vendorCompanyId);
    console.log('Entity sent to modal:', selectedRow.entity);
  }

  AssigenedHistory(selectedRow: any): void {
    const modalRef = this.modalService.open(CompanySetupHistoryComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.vendorEntityAssociationId = selectedRow.vendorEntityAssociationId;
    modalRef.componentInstance.entity = selectedRow.entity;
    console.log('Selected Row for Approval History:', selectedRow);
    console.log('vendorEntityAssociationId sent to modal:', selectedRow.vendorEntityAssociationId);
    console.log('Entity sent to modal:', selectedRow.entity);
  }

  openAssignMeModal(selectedRow: any): void {
    const modalRef = this.modalService.open(AssignMeComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });

    // Pass all required data including vendorEntityAssociationId
    modalRef.componentInstance.isAssigned = selectedRow.isAssigned;
    modalRef.componentInstance.setUpId = selectedRow.setUpId;
    modalRef.componentInstance.ProcurementCompanyId = selectedRow.procurementCompanyId;
    modalRef.componentInstance.vendorComapnyId = selectedRow.vendorCompanyId || selectedRow.id;
    modalRef.componentInstance.entity = selectedRow.entity;
    modalRef.componentInstance.vendorEntityAssociationId = selectedRow.vendorEntityAssociationId;

    console.log('Selected Row for Assign Me:', selectedRow);
    console.log('ProcurementCompanyId sent to modal:', selectedRow.procurementCompanyId);
    console.log('vendorCompanyId sent to modal:', selectedRow.vendorCompanyId);
    console.log('Entity sent to modal:', selectedRow.entity);
    console.log('vendorEntityAssociationId sent to modal:', selectedRow.vendorEntityAssociationId);

    // Handle modal close and refresh data if needed
    modalRef.result.then((result) => {
      if (result === 'success') {
        // Refresh the company data after successful assignment
        this.getCompanyData();
      }
    }).catch((error) => {
      console.log('Modal dismissed:', error);
    });
  }

  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
    this.announcementId = selected[0]?.id;

    console.log("Selected ProcurementCompanyId: ", selected[0]?.procurementCompanyId);
    console.log("Selected VendorCompanyId: ", selected[0]?.vendorCompanyId);
    this.enableDisableButtons();
  }

  toggleSelectAll(event: any) {
    if (event.target.checked) {
      this.chkBoxSelected = [...this.rows];
    } else {
      this.chkBoxSelected = [];
    }
    this.isAllSelected = event.target.checked;
    this.enableDisableButtons();
  }

  enableDisableButtons() {
    const selectedRowCount = this.chkBoxSelected.length;

    this.isDeleteButtonDisabled = selectedRowCount === 0;
    this.isEditButtonDisabled = selectedRowCount !== 1;
    this.isOpenButtonDisabled = selectedRowCount === 0;

    this.isAllSelected = this.rows.length === selectedRowCount;
  }


  editSelectedRow() {
    if (this.chkBoxSelected.length === 1) {
      const row = this.chkBoxSelected[0];
      this.router.navigate(['/company/company-edit'], {
        queryParams: {
          id: row.id,
          procurementCompanyId: row.procurementCompanyId,
          vendorCompanyId: row.vendorCompanyId,
          vendorEntityAssociationId: row.vendorEntityAssociationId,
          isAssigned: row.isAssigned.toString() // Simplified since isAssigned is now properly mapped
        }
      });
    } else {
      alert('Please select a single company to update.');
    }
  }

  toggleFilterBar() {
    this.showFilterBar = !this.showFilterBar;
  }

  isSelectedRowNew(): boolean {
    // If no row or multiple rows selected, don't disable
    if (this.chkBoxSelected.length !== 1) return false;

    const row = this.chkBoxSelected[0];
    return row.companyStatus?.toLowerCase() === 'new';
  }

  applySearchFilter() {
    const term = this.searchTerm.trim().toLowerCase();

    // Start with all companies
    let filteredRows = [...this.allCompanies];

    // Apply status filter
    switch (this.activeFilter) {
      case 'All':
        filteredRows = filteredRows.filter(c =>
          !c.companyStatus || ['inprocess', 'approve', 'sendback', 'new', 'completed'].includes(c.companyStatus.toLowerCase())
        );
        break;
      case 'InProcess':
        filteredRows = filteredRows.filter(c =>
          c.companyStatus?.toLowerCase() === 'inprocess'
        );
        break;
      case 'Recall':
        filteredRows = filteredRows.filter(c =>
          c.companyStatus?.toLowerCase() === 'sendback'
        );
        break;
      case 'new':
        filteredRows = filteredRows.filter(c =>
          c.companyStatus?.toLowerCase() === 'new'
        );
        break;
      case 'completed':
        filteredRows = filteredRows.filter(c =>
          c.companyStatus?.toLowerCase() === 'completed'
        );
        break;
      default:
        filteredRows = [...this.allCompanies];
        break;
    }

    // Apply search term filter
    if (term) {
      filteredRows = filteredRows.filter(c =>
        c.entity?.toLowerCase().includes(term) || c.name?.toLowerCase().includes(term)
      );
    }

    this.rows = filteredRows;
    this.cdr.detectChanges();
  }

}
