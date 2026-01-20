import { ChangeDetectorRef, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from 'app/shared/services/Company.services';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { ColumnMode, DatatableComponent, SelectionType } from '@swimlane/ngx-datatable';

@Component({
  selector: 'app-new-vendor-onboarding',
  templateUrl: './new-vendor-onboarding.component.html',
  styleUrls: ['./new-vendor-onboarding.component.scss'],
  standalone: false
})
export class NewVendorOnboardingComponent implements OnInit {
  @ViewChild(DatatableComponent) table: DatatableComponent;

  vendorOnboardingForm: FormGroup;
  // entitiesList: any[] = []; // Removed
  roles: any[] = [];
  filteredReceivers: any[] = [];
  mode: string = 'Create';
  onboardingId: number | null = null;
  adminRoleId: string | null = null; // Store Admin Role ID

  // Table properties
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  public receiverRows = [];
  public receiverColumns = [];
  loading = false;

  // Store all selected receivers with their details
  allSelectedReceivers: any[] = [];
  isToolbarSticky: boolean = false;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private companyService: CompanyService,
    private cdr: ChangeDetectorRef,
    private spinner: NgxSpinnerService,
    public toastr: ToastrService,
    private route: ActivatedRoute,
    private WorkflowServiceService: WorkflowServiceService,
  ) {

    this.vendorOnboardingForm = this.fb.group({
      SetupName: ['', Validators.required],
      // entities: ['', Validators.required], // Removed
      // Roles: ['', Validators.required],   // Removed
      Receivers: [[]],
      Description: ['', Validators.required],
      status: [false],
    });

    // Initialize table columns
    this.receiverColumns = [
      { prop: 'userName', name: 'User Name', width: 200 },
      { prop: 'email', name: 'Email', width: 250 },
      { prop: 'department', name: 'Department', width: 150 },
      { prop: 'position', name: 'Position', width: 150 },
      { prop: 'entityName', name: 'Entity', width: 150 },
      { prop: 'roleName', name: 'Role', width: 150 },
      { prop: 'actions', name: 'Actions', width: 100, sortable: false }
    ];
  }

  ngOnInit(): void {
    // Load roles and then fetch receivers for Admin
    this.loadRoles(() => {
      this.fetchReceiversForAdmin();
    });

    // Check for edit mode
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      this.mode = params.get('mode') || 'Create';
      this.onboardingId = id ? Number(id) : null;

      if (this.mode === 'Edit' && this.onboardingId) {
        this.loadOnboardingSetupById(this.onboardingId);
      }
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const threshold = 250; // adjust as you like
    this.isToolbarSticky = window.scrollY > threshold;
  }

  fetchReceiversForAdmin() {
    const adminRole = this.roles.find(r => r.name.toLowerCase() === 'admin');
    if (adminRole) {
      this.adminRoleId = adminRole.id;
      console.log('Admin Role found:', adminRole);
      this.loadFilteredReceivers(this.adminRoleId);
    } else {
      console.error('Admin role not found!');
      this.toastr.error('Admin role configuration missing.');
    }
  }


  // Add selected receivers to the main list
  addReceiversToTable() {
    const selectedReceiverIds = this.vendorOnboardingForm.get('Receivers')?.value || [];

    if (selectedReceiverIds.length === 0) {
      this.toastr.warning('Please select at least one receiver to add.');
      return;
    }

    if (!this.adminRoleId) {
      this.toastr.error('Admin role not identified. Cannot add receivers.');
      return;
    }

    // Get receiver details from filteredReceivers
    const selectedReceivers = this.filteredReceivers.filter(receiver =>
      selectedReceiverIds.includes(receiver.userId) || selectedReceiverIds.includes(receiver.id)
    );

    if (selectedReceivers.length === 0) {
      this.toastr.warning('No valid receivers found to add.');
      return;
    }

    // Add each receiver to the main list
    selectedReceivers.forEach(receiver => {
      const existingReceiver = this.allSelectedReceivers.find(dr =>
        dr.id === (receiver.userId || receiver.id)
      );

      if (!existingReceiver) {
        const newReceiver = {
          id: receiver.userId || receiver.id,
          userName: receiver.userName || receiver.name || receiver.fullName,
          email: receiver.email || '',
          department: receiver.department || '',
          position: receiver.position || receiver.designation || '',
          entityId: receiver.entityId, // Use entity from receiver object
          entityName: receiver.entityName || 'N/A', // Assuming API returns entityName or map it if we had entities list (but we removed entitiesList load...)
          // Wait, we removed loadEntities. If receiver doesn't have entityName, show N/A.
          roleId: this.adminRoleId,
          roleName: 'Admin'
        };

        this.allSelectedReceivers.push(newReceiver);
      }
    });

    // Update table rows
    this.receiverRows = [...this.allSelectedReceivers];

    // Clear current selection
    this.vendorOnboardingForm.patchValue({
      Receivers: []
    });

    this.toastr.success(`Added ${selectedReceivers.length} user(s) to the list!`);
    this.cdr.detectChanges();
  }

  // Remove a receiver from the table
  removeReceiver(receiverId: string) {
    this.allSelectedReceivers = this.allSelectedReceivers.filter(receiver => receiver.id !== receiverId);
    this.receiverRows = [...this.allSelectedReceivers];
    this.toastr.success('Receiver removed from list!');
    this.cdr.detectChanges();
  }

  // Load existing onboarding setup for editing
  loadOnboardingSetupById(id: number) {
    this.spinner.show();

    this.companyService.GetCompanyOnboardingSetupById(id)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (response: any) => {
          let data = response?.value || response?.result || response?.data || response;

          if (!data) {
            this.toastr.warning('No data found for the selected onboarding setup.');
            return;
          }

          console.log('Extracted data for form:', data);

          // Map detailed receivers directly
          const mapReceivers = () => {
            const receiverRows = (data.detailedReceivers || []).map(r => ({
              ...r,
              id: r.id || r.userId, // Normalize ID for internal use
              department: r.department || r.departmentName || '',
              position: r.position || r.designation || '',
              entityName: r.entityName || '',
              roleName: r.roleName || 'Admin'
            }));

            this.receiverRows = [...receiverRows];
            this.allSelectedReceivers = [...receiverRows]; // Sync main list
            this.cdr.detectChanges();

            this.populateForm(data);
          };

          // Ensure roles loaded
          if (!this.roles.length) {
            this.loadRoles(() => mapReceivers());
          } else {
            mapReceivers();
          }

        },
        error: (err) => {
          console.error('Error loading onboarding setup:', err);
          this.toastr.error('Failed to load onboarding setup data. Please try again.');
        }
      });
  }

  populateForm(data: any) {
    console.log('Populating form with data:', data);

    // First patch the basic fields
    this.vendorOnboardingForm.patchValue({
      SetupName: data.setupName || '',
      //   entities: data.entityId || '', // Removed
      Description: data.description || '',
      status: data.status !== undefined ? data.status : false
    });

    // Roles defaulted to Admin internally, no form control to patch

    // Detailed receivers already handled in loadOnboardingSetupById
  }

  // NOTE: loadExistingReceivers and loadDetailedReceivers likely redundant if we handle mapping in loadOnboardingSetupById commonly.
  // Keeping simple helpers if needed.

  updateForm() {
    if (this.mode === 'Edit' && this.vendorOnboardingForm.valid && this.allSelectedReceivers.length > 0) {
      this.submitForm();
    }
  }

  homePage() {
    this.router.navigate(['/setup/vendor-onboarding-setup']);
  }

  submitForm() {
    // Check if we have any receivers in the table
    if (this.allSelectedReceivers.length === 0) {
      this.toastr.warning('Please add at least one receiver to the list.');
      return;
    }

    if (this.vendorOnboardingForm.invalid) {
      console.warn('Form is invalid');
      this.vendorOnboardingForm.markAllAsTouched();
      this.toastr.warning('Please fill all required fields correctly.');
      return;
    }

    const formData = this.vendorOnboardingForm.value;

    // Get all receiver IDs from the main list
    const allReceiverIds = this.allSelectedReceivers.map(receiver => receiver.id);
    const selectedReceivers = allReceiverIds.join(',');

    // Get role IDs for each receiver (in the same order)
    const allRoleIds = this.allSelectedReceivers.map(receiver => receiver.roleId);
    const selectedRoleIds = allRoleIds.join(',');

    // Prepare detailed receiver information
    const detailedReceivers = this.allSelectedReceivers.map(receiver => ({
      userId: receiver.id || receiver.userId,
      roleId: receiver.roleId,
      userName: receiver.userName || '',
      email: receiver.email || '',
      department: receiver.department || '',
      position: receiver.position || '',
      entityName: receiver.entityName || ''
    }));

    // Prepare the data for API with correct format
    const apiData: any = {
      id: this.mode === 'Edit' ? this.onboardingId : 0,
      setupName: formData.SetupName,
      entityId: 0, // Default to 0 or null as requested
      rolesId: this.adminRoleId, // Send Admin Role ID
      receivers: selectedReceivers,
      receiverRoleIds: selectedRoleIds,
      detailedReceivers: detailedReceivers,
      status: formData.status,
      description: formData.Description
    };

    console.log('Submitting data:', apiData);
    this.spinner.show();

    const request = (this.mode === 'Edit' && this.onboardingId)
      ? this.companyService.UpdateCompanyOnboardingSetup(apiData)
      : this.companyService.CreateCompanyOnboardingSetup({ ...apiData, id: 0 });

    request
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (response: any) => {
          console.log(`✅ Onboarding setup ${this.mode === 'Edit' ? 'updated' : 'created'} successfully:`, response);
          this.toastr.success(`Vendor onboarding setup ${this.mode === 'Edit' ? 'updated' : 'created'} successfully!`);
          this.router.navigate(['/setup/vendor-onboarding-setup']);
        },
        error: (err) => {
          console.error(`❌ Error ${this.mode === 'Edit' ? 'updating' : 'creating'} onboarding setup:`, err);
          this.toastr.error(`Failed to ${this.mode === 'Edit' ? 'update' : 'create'} vendor onboarding setup. Please try again.`);
        }
      });
  }

  loadRoles(callback?: () => void) {
    this.spinner.show();
    this.companyService.getRoles()
      .pipe(
        finalize(() => {
          this.spinner.hide();
          this.cdr.detectChanges();
          if (callback) {
            callback();
          }
        })
      )
      .subscribe({
        next: (res: any) => {
          this.roles = res?.$values || res || [];
          console.log('Roles loaded successfully:', this.roles);
        },
        error: (err) => {
          console.error('Error loading roles:', err);
          this.toastr.error('Failed to load roles. Please try again.');
        }
      });
  }

  loadFilteredReceivers(roleId: string) {
    this.spinner.show();
    console.log('Making API call for Admin Receivers with RoleId:', roleId);

    this.companyService.getFilteredReceivers(roleId)
      .pipe(
        finalize(() => {
          this.spinner.hide();
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {
          this.filteredReceivers = res?.$values || res || [];
          console.log('Filtered receivers loaded:', this.filteredReceivers);
        },
        error: (err) => {
          console.error('Error loading filtered receivers:', err);
          this.toastr.error('Failed to load receivers. Please try again.');
          this.filteredReceivers = [];
        }
      });
  }

  // Helper method to check if add button should be enabled
  get isAddButtonEnabled(): boolean {
    const selectedReceivers = this.vendorOnboardingForm.get('Receivers')?.value || [];
    return selectedReceivers.length > 0 && !!this.adminRoleId;
  }

  // Table row class function
  getRowClass(row) {
    return {
      'table-row': true
    };
  }
}