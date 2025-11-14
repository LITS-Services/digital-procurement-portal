import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CompanyService } from 'app/shared/services/Company.services';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-new-vendor-onboarding',
  templateUrl: './new-vendor-onboarding.component.html',
  styleUrls: ['./new-vendor-onboarding.component.scss']
})
export class NewVendorOnboardingComponent implements OnInit {
  vendorOnboardingForm: FormGroup;
  vendorOnboardingList: any[] = [];
  vendorOnboardingData: any[] = [];
  chkBoxSelected: any[] = [];
  idsToDelete: number[] = [];
  entitiesList: any[] = [];
  selectedEntityIdForOnbarding: number | null = null;
  isVendorOnboarding: boolean = true;
  approverList: any[] = [];
  globalApproverList: any[] = [];
  approverForm: FormGroup;
  mode: string = 'Create';
  onboardingId: number | null = null;
  usersList: any[] = [];
  filteredUsersList: any[] = [];
  selectedEntityIdForOnboarding: number | null = null;
  selectedRoleIdForOnboarding: number | null = null;
  roles: any[] = [];
  filteredApprovers: any[] = [];
  originalApproverList: any[] = []; // keep a copy of all users
  allUsers: any[] = [];            // All users when no entity selected
  filteredReceivers: any[] = []; // Changed from filteredApprovers to filteredReceivers

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
      entities: ['', Validators.required],
      Roles: [''], // Remove required validator - will handle dynamically
      Receivers: ['', Validators.required],
      Description: ['', Validators.required],
      status: [false],
      usersList: [[]],
    });
  }

  ngOnInit(): void {
    this.loadRoles();
    this.loadEntities();

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

  // Load existing onboarding setup for editing
  loadOnboardingSetupById(id: number) {
    this.spinner.show();

    this.companyService.GetCompanyOnboardingSetupById(id)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (response: any) => {
          console.log('Get receivers Full API Response:', response);

          let data = null;

          // Extract data from response
          if (response && response.value) {
            data = response.value;
          } else if (response && response.setupName) {
            data = response;
          } else if (response && response.result) {
            data = response.result;
          } else if (response && response.data) {
            data = response.data;
          } else {
            console.warn('Unexpected API response structure:', response);
            this.toastr.warning('No data found for the selected onboarding setup.');
            return;
          }

          console.log('Extracted data for form:', data);

          // Check if roles are loaded, if not load them first
          if (this.roles.length === 0) {
            console.log('Roles not loaded yet, loading roles first...');
            this.loadRoles(() => {
              // Callback when roles are loaded - then populate form
              this.populateForm(data);
            });
          } else {
            console.log('Roles already loaded, populating form directly');
            this.populateForm(data);
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
    console.log('Available roles:', this.roles);

    // First patch the basic fields
    this.vendorOnboardingForm.patchValue({
      SetupName: data.setupName || '',
      entities: data.entityId || '',
      Description: data.description || '',
      status: data.status !== undefined ? data.status : false
    });

    console.log('Basic form values after patch:', this.vendorOnboardingForm.value);

    // Set Roles - find the role object from roles list (optional for edit)
    if (data.rolesId) {
      console.log('Looking for role with ID:', data.rolesId);
      const selectedRole = this.roles.find(role => role.id === data.rolesId);

      if (selectedRole) {
        this.vendorOnboardingForm.patchValue({
          Roles: selectedRole.id
        });
        console.log('Role successfully set:', selectedRole);
      } else {
        console.warn('Role not found in roles list. Available roles:', this.roles);
        console.warn('Looking for role ID:', data.rolesId);
      }
    } else {
      console.log('No rolesId found in data - keeping Roles field empty for edit mode');
    }

    // Set Receivers - load filtered receivers and preselect if available
    if (data.entityId && data.rolesId) {
      console.log('Loading receivers for entity:', data.entityId, 'and role:', data.rolesId);
      
      // Convert receivers string to array if needed
      let receiversArray = [];
      if (data.receivers) {
        if (typeof data.receivers === 'string') {
          receiversArray = data.receivers.split(',').map(id => id.trim());
        } else if (Array.isArray(data.receivers)) {
          receiversArray = data.receivers;
        }
      }
      
      this.loadFilteredReceivers(data.entityId, data.rolesId, receiversArray);
    } else if (data.receivers) {
      console.log('Setting receivers directly:', data.receivers);
      let receiversArray = [];
      if (typeof data.receivers === 'string') {
        receiversArray = data.receivers.split(',').map(id => id.trim());
      } else if (Array.isArray(data.receivers)) {
        receiversArray = data.receivers;
      }
      
      this.vendorOnboardingForm.patchValue({
        Receivers: receiversArray
      });
    }

    console.log('Final form values:', this.vendorOnboardingForm.value);
    console.log('Form Roles control value:', this.vendorOnboardingForm.get('Roles')?.value);
  }

  updateForm() {
    if (this.mode === 'Edit' && this.vendorOnboardingForm.valid) {
      this.submitForm();
    }
  }

  homePage() {
    this.router.navigate(['/setup/vendor-onboarding-setup']);
  }

  submitForm() {
    // Dynamic validation based on mode
    if (this.mode === 'Create' && !this.vendorOnboardingForm.get('Roles')?.value) {
      console.warn('Roles is required for Create mode');
      this.vendorOnboardingForm.get('Roles')?.setErrors({ required: true });
      this.toastr.warning('Please select a Role.');
      return;
    }

    if (this.vendorOnboardingForm.invalid) {
      console.warn('Form is invalid');
      this.vendorOnboardingForm.markAllAsTouched();
      this.toastr.warning('Please fill all required fields correctly.');
      return;
    }

    const formData = this.vendorOnboardingForm.value;

    // Get the selected role ID (optional for edit mode)
    const selectedRoleId = formData.Roles;
    const selectedReceivers = formData.Receivers?.join(',') || '';

    // Prepare the data for API with correct format
    const apiData: any = {
      id: this.mode === 'Edit' ? this.onboardingId : 0,
      setupName: formData.SetupName,
      entityId: formData.entities,
      receivers: selectedReceivers,
      status: formData.status,
      description: formData.Description
    };

    // Only include rolesId if it's provided (for both create and update)
    if (selectedRoleId) {
      apiData.rolesId = selectedRoleId;
    }

    console.log('Submitting data:', apiData);
    this.spinner.show();

    if (this.mode === 'Edit' && this.onboardingId) {
      // Update existing record
      this.companyService.UpdateCompanyOnboardingSetup(apiData)
        .pipe(finalize(() => this.spinner.hide()))
        .subscribe({
          next: (response: any) => {
            console.log('✅ Onboarding setup updated successfully:', response);
            this.toastr.success('Vendor onboarding setup updated successfully!');
            this.router.navigate(['/setup/vendor-onboarding-setup']);
          },
          error: (err) => {
            console.error('❌ Error updating onboarding setup:', err);
            this.toastr.error('Failed to update vendor onboarding setup. Please try again.');
          }
        });
    } else {
      // Create new record - set id to 0 for create
      const createData = { ...apiData };
      createData.id = 0;

      this.companyService.CreateCompanyOnboardingSetup(createData)
        .pipe(finalize(() => this.spinner.hide()))
        .subscribe({
          next: (response: any) => {
            console.log('✅ Onboarding setup created successfully:', response);
            this.toastr.success('Vendor onboarding setup created successfully!');
            this.router.navigate(['/setup/vendor-onboarding-setup']);
          },
          error: (err) => {
            console.error('❌ Error creating onboarding setup:', err);
            this.toastr.error('Failed to create vendor onboarding setup. Please try again.');
          }
        });
    }
  }

  loadEntities() {
    this.spinner.show();
    this.companyService
      .getProCompanies()
      .pipe(finalize(() => { this.spinner.hide(); this.cdr.detectChanges(); }))
      .subscribe({
        next: (res: any) => {
          const companies = res?.result || [];
          this.entitiesList = companies.map((c: any) => ({
            ...c,
            status: c.isDeleted ? 'Inactive' : 'Active',
            logo: c.logo || ''
          }));
          console.log('Entities loaded:', this.entitiesList);
        },
        error: (err) => {
          console.error('Error fetching companies:', err);
          this.toastr.error('Failed to load companies. Please try again.');
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
          // Execute callback if provided (after roles are loaded)
          if (callback) {
            console.log('Roles loaded, executing callback');
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
          // Still execute callback even if error
          if (callback) {
            callback();
          }
        }
      });
  }

  onEntitySelected(entityId: number) {
    const currentRole = this.vendorOnboardingForm.get('Roles')?.value;

    // If a role was selected and entity changes, reset role and receivers
    if (currentRole) {
      this.vendorOnboardingForm.patchValue({ Roles: null, Receivers: [] });
    }

    if (entityId) {
      console.log('Entity selected:', entityId);
      this.filteredReceivers = [];
      this.vendorOnboardingForm.patchValue({ Receivers: [] });
    } else {
      this.filteredReceivers = [];
      this.vendorOnboardingForm.patchValue({ Roles: null, Receivers: [] });
    }
  }

  onRoleSelected(role: any) {
    const roleId = role?.id || role; // Handle both object and ID
    const entityId = this.vendorOnboardingForm.get('entities')?.value;
    
    if (entityId && roleId) {
      console.log('Role selected - Loading receivers for Entity:', entityId, 'Role:', roleId);
      this.loadFilteredReceivers(entityId, roleId);
    } else {
      this.filteredReceivers = [];
      this.vendorOnboardingForm.patchValue({ Receivers: [] });
    }
  }

  loadFilteredReceivers(entityId: number, roleId: string, preselectedReceivers?: string[]) {
    this.spinner.show();
    console.log('Making API call with EntityId:', entityId, 'RoleId:', roleId);

    if (preselectedReceivers) {
      console.log('Preselected receivers:', preselectedReceivers);
    }

    this.companyService.getFilteredReceivers(entityId, roleId)
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

          // If we have preselected receivers, set them
          if (preselectedReceivers && preselectedReceivers.length > 0) {
            console.log('Setting preselected receivers:', preselectedReceivers);
            
            // Filter to only include receivers that exist in the current filtered list
            const validReceivers = preselectedReceivers.filter(receiverId => 
              this.filteredReceivers.some(receiver => receiver.userId === receiverId || receiver.id === receiverId)
            );
            
            this.vendorOnboardingForm.patchValue({
              Receivers: validReceivers
            });
            
            if (validReceivers.length !== preselectedReceivers.length) {
              console.warn('Some preselected receivers were not found in filtered list');
            }
          } else {
            this.vendorOnboardingForm.patchValue({ Receivers: [] });
          }
        },
        error: (err) => {
          console.error('Error loading filtered receivers:', err);
          this.toastr.error('Failed to load receivers. Please try again.');
          this.filteredReceivers = [];

          if (preselectedReceivers && preselectedReceivers.length > 0) {
            this.vendorOnboardingForm.patchValue({
              Receivers: preselectedReceivers
            });
          }
        }
      });
  }

  // Helper method to check if form is valid based on mode
  isFormValid(): boolean {
    const basicFieldsValid = 
      this.vendorOnboardingForm.get('SetupName')?.valid &&
      this.vendorOnboardingForm.get('entities')?.valid &&
      this.vendorOnboardingForm.get('Receivers')?.valid &&
      this.vendorOnboardingForm.get('Description')?.valid;

    if (this.mode === 'Create') {
      return basicFieldsValid && this.vendorOnboardingForm.get('Roles')?.valid;
    } else {
      return basicFieldsValid; // Roles is optional for Edit mode
    }
  }
}