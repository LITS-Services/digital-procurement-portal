import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';
import { CompanyService } from 'app/shared/services/Company.services';
import { AuthService } from 'app/shared/auth/auth.service';
import { CompanyApprovalHistoryComponent } from '../company-approval-history/company-approval-history.component';
import { AssignMeComponent } from '../assign-me/assign-me.component';
import { CompanySetupHistoryComponent } from '../company-setup-history/company-setup-history.component';
import { NgxSpinnerService } from 'ngx-spinner';
import { finalize, Subject } from 'rxjs';

@Component({
  selector: 'app-company-listing',
  templateUrl: './company-listing.component.html',
  styleUrls: ['./company-listing.component.scss'],
  standalone: false
})
export class CompanyListingComponent implements OnInit {
  filters: any = {}; // e.g. { entity: '', name: '', city: '', vendorType: '' }
  @ViewChild('datatable', { static: false }) datatable!: DatatableComponent;
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

  // Table resize handling
  datatableVisible: boolean = true;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;


  searchSubject = new Subject<string>();

  constructor(
    private router: Router,
    private modalService: NgbModal,
    private companyService: CompanyService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService,

  ) {
    this.searchSubject.subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 1; // Reset to page 1 on new search
      this.getCompanyData();
    });
  }

  ngOnInit(): void {
    //this.getCompanyData();

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

  get isMobile(): boolean {
    return window.innerWidth <= 768;
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

    const statusFilter = this.activeFilter === 'All' ? '' : this.activeFilter;

    this.spinner.show();
    this.companyService.getCompaniesByUserEntity(this.currentPage, this.pageSize, userId, this.searchTerm, statusFilter)
      .pipe(finalize(() => {
        this.spinner.hide();
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {
          const companies = res?.result || res || [];
          this.allCompanies = companies.map(c => this.mapCompany(c));
          // this.tenderingData = this.allCompanies.filter(c =>
          //   !c.companyStatus || ['inprogress', 'approve'].includes(c.companyStatus.toLowerCase())
          // );
          // this.rows = [...this.tenderingData];


          // Apply current filters instead of resetting
          this.applyFilters();
          this.totalItems = res.totalItems;
          this.totalPages = res.totalPages;
          this.loading = false;
          this.checkAssignments(); // Check assignments after loading data
          this.cdr.detectChanges();
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

    // Check if this is the direct API response structure (with procurementCompany field)
    if (c.procurementCompany !== undefined) {
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
        vendorEntityAssociationId: c.vendorEntityAssociationId || null,
        isAssigned: c.isAssigned || false,
        setUpId: c.setUpId || null,
        workflowMasterId: c.workflowMasterId || 0,
        assignedUserName: c.approverName || '',
        assignedUserRemarks: c.remarks || '',
        showAssignMe: false // Initialize to false
      };
    } else {
      // Fallback to the original nested structure
      const selectedEntity =
        (c.vendorUseCompaniesVM?.find((v) => v.status?.toLowerCase() === 'inprogress')) ||
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
        vendorEntityAssociationId: selectedEntity?.vendorEntityAssociationId || null,
        isAssigned: selectedEntity?.isAssigned || false,
        setUpId: selectedEntity?.setUpId || null,
        workflowMasterId: selectedEntity?.workflowMasterId || 0,
        showAssignMe: false // Initialize to false
      };
    }
  }

  /** FILTER BUTTONS LOGIC */
  // showAll() {
  //   this.rows = this.allCompanies.filter(c =>
  //     !c.companyStatus || ['inprogress', 'approve'].includes(c.companyStatus.toLowerCase())
  //   );
  //   this.activeFilter = 'All';
  //   this.selectedStatusLabel = 'All';
  //   this.statusTouched = true;
  //   this.showStatusColumn = true;
  //   this.cdr.detectChanges();
  // }

  // showInProgress() {
  //   this.rows = this.allCompanies.filter(c =>
  //     c.companyStatus.toLowerCase() === 'inprogress'
  //   );
  //   this.activeFilter = 'InProgress';
  //   this.selectedStatusLabel = 'InProgress';
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
    this.activeFilter = status;
    this.selectedStatusLabel = status;
    this.statusTouched = true;
    this.applyFilters();
    this.currentPage = 1; // Reset to page 1
    this.getCompanyData();
  }

  applyFilters() {
    const term = this.searchTerm.trim().toLowerCase();
    let filteredRows = [...this.allCompanies];

    // 1. Apply Status Filter - SERVER SIDE NOW, this is just for any remaining local logic if needed
    // switch (this.activeFilter) {
    //   case 'All':
    //     this.showStatusColumn = true;
    //     break;
    //   case 'InProgress':
    //   case 'Recall':
    //   case 'new':
    //   case 'completed':
    //   default:
    //     this.showStatusColumn = true;
    //     break;
    // }

    this.showStatusColumn = true;

    // 2. Apply Search Term Filter (Search by Entity or Company Name)
    // if (term) {
    //   filteredRows = filteredRows.filter(c =>
    //     (c.entity && typeof c.entity === 'string' && c.entity.toLowerCase().includes(term)) ||
    //     (c.name && typeof c.name === 'string' && c.name.toLowerCase().includes(term))
    //   );
    // }

    this.rows = filteredRows;
    this.cdr.detectChanges();
  }

  applySearchFilter() {
    this.searchSubject.next(this.searchTerm);
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

    modalRef.componentInstance.vendorEntityAssociationId = selectedRow.id; modalRef.componentInstance.entity = selectedRow.entity;
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
    modalRef.componentInstance.companyName = selectedRow.name;
    modalRef.componentInstance.entity = selectedRow.entity;
    modalRef.componentInstance.vendorEntityAssociationId = selectedRow.vendorEntityAssociationId;
    modalRef.componentInstance.assignedUserName = selectedRow.assignedUserName;
    modalRef.componentInstance.assignedUserRemarks = selectedRow.assignedUserRemarks;

    console.log('Selected Row for Assign Me:', selectedRow);
    console.log('ProcurementCompanyId sent to modal:', selectedRow.procurementCompanyId);
    console.log('vendorCompanyId sent to modal:', selectedRow.vendorCompanyId);
    console.log('Entity sent to modal:', selectedRow.entity);
    console.log('vendorEntityAssociationId sent to modal:', selectedRow.vendorEntityAssociationId);

    // Handle modal close and refresh data if needed
    modalRef.result.then((result) => {
      if (result === 'success') {
        // Refresh the company data after successful assignment
        this.chkBoxSelected = [];
        this.enableDisableButtons();
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

  getStatusClass(status: any): string {
    const s = (status ?? '').toString().trim().toLowerCase();

    if (s === 'new') return 'status-pill--new';
    if (s === 'inprogress' || s === 'in progress' || s === 'in_progress') return 'status-pill--inprogress';
    if (s === 'sendback') return 'status-pill--sendback';
    if (s === 'rejected') return 'status-pill--rejected'; // Added rejected style if available, or map to danger in CSS
    if (s === 'onboarded' || s === 'completed') return 'status-pill--completed';

    return 'status-pill--default';
  }

  toggleFilterBar() {
    this.showFilterBar = !this.showFilterBar;
  }

  onAutoResize(): void {
    this.datatableVisible = false;
    this.cdr.detectChanges(); // destroy

    requestAnimationFrame(() => {
      this.datatableVisible = true;
      this.cdr.detectChanges(); // recreate
    });
  }

  isSelectedRowNew(): boolean {
    if (this.chkBoxSelected.length !== 1) return false;

    const row = this.chkBoxSelected[0];
    return row.companyStatus?.toLowerCase() === 'new';
  }



  checkAssignments() {
    const currentUserName = localStorage.getItem('userName');
    const currentUserEmail = localStorage.getItem('userEmail');
    const isSuperAdmin = this.authService.hasRole('Super Admin');

    if (!currentUserName && !isSuperAdmin) {
      console.warn('Current user name not found in local storage.');
      return;
    }

    // Find the first company with a valid setUpId to perform the "one-time" request
    const firstCompanyWithSetup = this.allCompanies.find(c => c.setUpId && c.setUpId !== 0);

    const updateCompaniesWithMatch = (isMatch: boolean) => {
      this.allCompanies.forEach(company => {
        const status = company.companyStatus?.toLowerCase();

        // Disable button for specific statuses: onboarded, sendback, rejected
        const isRestrictedStatus = ['onboarded', 'sendback', 'rejected'].includes(status);

        // Disable if workflowMasterId is anything EXCEPT 0 (meaning it's already assigned)
        const isAlreadyAssigned = company.workflowMasterId && company.workflowMasterId !== 0;

        if (isRestrictedStatus || isAlreadyAssigned) {
          company.showAssignMe = false;
        } else if (company.setUpId && (isMatch || isSuperAdmin)) {
          // Show if it has a setup ID and (user is a workflow user OR user is Super Admin)
          company.showAssignMe = true;
        } else {
          // User is not in the setup or no setup ID
          company.showAssignMe = false;
        }
      });
      // Force update to reflect changes in the table
      this.cdr.detectChanges();
    };

    if (!firstCompanyWithSetup) {
      console.warn('No company with a valid setUpId found to check workflow users.');
      // If we are super admin, we might still want to show buttons if they have setUpIds later 
      // but if NO company has it, then there's nothing to assign to.
      // However, we should still run the loop to set showAssignMe to false for others.
      updateCompaniesWithMatch(false);
      return;
    }

    // Call getWorkflowUsers once for the first found setUpId
    this.companyService.getWorkflowUsers(firstCompanyWithSetup.setUpId).subscribe({
      next: (res: any) => {
        const users = res?.value || res?.result || res || [];

        // Check if current user is in the list of workflow users
        const isMatch = users.some(u =>
          (u.userName && currentUserName && u.userName.toLowerCase() === currentUserName.toLowerCase()) ||
          (currentUserEmail && u.email && u.email.toLowerCase() === currentUserEmail.toLowerCase())
        );

        updateCompaniesWithMatch(isMatch);
      },
      error: (err) => {
        console.error(`Error loading workflow users for setup ${firstCompanyWithSetup.setUpId}`, err);
        // Fallback: if user is super admin, they can still assign themselves
        updateCompaniesWithMatch(false);
      }
    });
  }

  onPageChange(event: any) {
    this.currentPage = (event?.offset ?? 0) + 1;
    this.getCompanyData();
  }
}
