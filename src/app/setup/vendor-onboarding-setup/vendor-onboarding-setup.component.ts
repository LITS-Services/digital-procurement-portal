import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { CompanyService } from 'app/shared/services/Company.services';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VendorOnboardingReceiversComponent } from '../vendor-onboarding-receivers/vendor-onboarding-receivers.component';

@Component({
  selector: 'app-vendor-onboarding-setup',
  templateUrl: './vendor-onboarding-setup.component.html',
  styleUrls: ['./vendor-onboarding-setup.component.scss']
})
export class VendorOnboardingSetupComponent implements OnInit {
  @ViewChild('deleteModal') deleteModal: TemplateRef<any>;

  vendorOnboardingForm: FormGroup;
  vendorOnboardingList: any[] = [];
  vendorOnboardingData: any[] = [];
  chkBoxSelected: any[] = [];
  idsToDelete: number[] = [];
  isAllSelected: boolean = false;

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private companyService: CompanyService,
    private spinner: NgxSpinnerService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) {
    this.vendorOnboardingForm = this.fb.group({
      SetupName: ['', Validators.required],
      Entities: ['', Validators.required],
      Roles: ['', Validators.required],
      Initiatiors: ['', Validators.required],
      Description: ['', Validators.required],
      status: [false],
    });
  }

  ngOnInit(): void {
    this.loadAllCompanyOnboardingSetups();
  }

  loadAllCompanyOnboardingSetups() {
    this.spinner.show();

    this.companyService.GetAllCompanyOnboardingSetup()
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (response: any) => {
          console.log('API Response:', response);

          // Handle the specific response structure from your API
          if (response && response.value && Array.isArray(response.value)) {
            this.vendorOnboardingList = response.value;
          } else if (Array.isArray(response)) {
            this.vendorOnboardingList = response;
          } else if (response && Array.isArray(response.$values)) {
            this.vendorOnboardingList = response.$values;
          } else if (response && Array.isArray(response.result)) {
            this.vendorOnboardingList = response.result;
          } else {
            this.vendorOnboardingList = [];
            console.warn('Unexpected API response structure:', response);
          }

          this.vendorOnboardingData = [...this.vendorOnboardingList];
          console.log('Vendor Onboarding List:', this.vendorOnboardingList);
        },
        error: (err) => {
          console.error('Error loading company onboarding setups:', err);
          this.toastr.error('Failed to load vendor onboarding setups. Please try again.');
          this.vendorOnboardingList = [];
          this.vendorOnboardingData = [];
        }
      });
  }

  // Toggle select all functionality
  toggleSelectAll(event: any) {
    const isChecked = event.target.checked;
    this.isAllSelected = isChecked;

    if (isChecked) {
      this.chkBoxSelected = [...this.vendorOnboardingList];
    } else {
      this.chkBoxSelected = [];
    }
  }

  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  NewVendorOnboarding() {
    this.router.navigate(['/setup/create-vendor-onboarding']);
  }

  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
    this.isAllSelected = this.chkBoxSelected.length === this.vendorOnboardingList.length;
  }

  onSort(event) {
    setTimeout(() => {
      const sort = event.sorts[0];
      this.vendorOnboardingData.sort((a, b) => {
        const aValue = (a[sort.prop] ?? '').toString().toLowerCase();
        const bValue = (b[sort.prop] ?? '').toString().toLowerCase();
        return aValue.localeCompare(bValue) * (sort.dir === 'desc' ? -1 : 1);
      });
    }, 200);
  }

  onUpdate() {
    if (this.chkBoxSelected.length === 0) {
      this.toastr.warning('Please select a vendor onboarding setup to edit.');
      return;
    }

    if (this.chkBoxSelected.length > 1) {
      this.toastr.warning('Please select only one vendor onboarding setup to edit.');
      return;
    }

    const selectedSetup = this.chkBoxSelected[0];
    const onboardingId = selectedSetup.id;

    if (!onboardingId) {
      this.toastr.error('Selected setup does not have a valid ID.');
      return;
    }

    console.log('Navigating to edit page with ID:', onboardingId);

    this.router.navigate(['/setup/create-vendor-onboarding'], {
      queryParams: { id: onboardingId, mode: 'Edit' },
      skipLocationChange: true
    });
  }

  // Open delete confirmation modal
  openDeleteModal() {
    if (this.chkBoxSelected.length === 0) {
      this.toastr.warning('Please select at least one vendor onboarding setup to delete.');
      return;
    }

    // Extract IDs for deletion
    this.idsToDelete = this.chkBoxSelected.map(item => item.id).filter(id => id);

    if (this.idsToDelete.length === 0) {
      this.toastr.error('Selected items do not have valid IDs.');
      return;
    }

    this.modalService.open(this.deleteModal, {
      centered: true,
      backdrop: 'static'
    });
  }

  // Delete selected records
  deleteSelectedSetups() {
    this.modalService.dismissAll();

    if (this.idsToDelete.length === 0) {
      this.toastr.warning('No valid IDs found for deletion.');
      return;
    }

    this.spinner.show();

    // Delete multiple records one by one
    let completedDeletions = 0;
    const totalToDelete = this.idsToDelete.length;

    this.idsToDelete.forEach(id => {
      this.companyService.DeleteCompanyOnboardingSetupById(id)
        .pipe(finalize(() => {
          completedDeletions++;
          if (completedDeletions === totalToDelete) {
            this.spinner.hide();
            this.handleDeleteCompletion();
          }
        }))
        .subscribe({
          next: (response: any) => {
            console.log(`Successfully deleted setup with ID: ${id}`, response);
          },
          error: (err) => {
            console.error(`Error deleting setup with ID: ${id}`, err);
            this.toastr.error(`Failed to delete setup with ID: ${id}`);
          }
        });
    });
  }

  private handleDeleteCompletion() {
    this.toastr.success('Selected vendor onboarding setups deleted successfully!');
    this.refreshData();
  }

  // Refresh data
  refreshData() {
    this.loadAllCompanyOnboardingSetups();
    this.chkBoxSelected = [];
    this.idsToDelete = [];
    this.isAllSelected = false;
  }

  // Get selected setup names for display in modal
  getSelectedSetupNames(): string[] {
    return this.chkBoxSelected.map(item => item.setupName || 'Unnamed Setup');
  }

  openReceiversModal(row: any): void {
    const modalRef = this.modalService.open(VendorOnboardingReceiversComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });

    // ✅ Pass the onboardingId instead of workflowMasterId
    modalRef.componentInstance.onboardingId = row.id; // or row.onboardingId if your table uses that field
    modalRef.componentInstance.onboardingRoleId = row.rolesId; // or row.onboardingId if your table uses that field
    modalRef.componentInstance.onboardingentityId = row.entityId; // or row.onboardingId if your table uses that field

    console.log('Opening Receivers modal for Onboarding ID:', row.id);
  }

}