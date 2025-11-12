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
  approverForm: FormGroup;
  mode: string = 'Create';
  onboardingId: number | null = null;
  usersList: any[] = [];
  filteredUsersList: any[] = [];
  selectedEntityIdForOnboarding: number | null = null;
  roles: any[] = [];
  filteredApprovers: any[] = [];

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
      Roles: ['', Validators.required],
      Initiatiors: ['', Validators.required],
      Description: ['', Validators.required],
      status: [false],
      usersList: [[]],
    });
  }

  ngOnInit(): void {
    this.getApproverList();
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
 // Load existing onboarding setup for editing
loadOnboardingSetupById(id: number) {
  this.spinner.show();
  
  this.companyService.GetCompanyOnboardingSetupById(id)
    .pipe(finalize(() => this.spinner.hide()))
    .subscribe({
      next: (response: any) => {
        console.log('Full API Response:', response);
        console.log('Response value:', response?.value);
        console.log('Response status:', response?.status);
        console.log('Response isSuccess:', response?.isSuccess);
        
        // Check different possible response structures
        if (response && response.value) {
          // If response has value property (your current structure)
          this.populateForm(response.value);
        } else if (response && response.setupName) {
          // If response is the data object directly
          this.populateForm(response);
        } else if (response && response.result) {
          // If response has result property
          this.populateForm(response.result);
        } else if (response && response.data) {
          // If response has data property
          this.populateForm(response.data);
        } else {
          console.warn('Unexpected API response structure:', response);
          this.toastr.warning('No data found for the selected onboarding setup.');
        }
      },
      error: (err) => {
        console.error('Error loading onboarding setup:', err);
        this.toastr.error('Failed to load onboarding setup data. Please try again.');
      }
    });
}

  // Populate form with existing data
  populateForm(data: any) {
    console.log('Populating form with data:', data);
    
    // First patch the basic fields
    this.vendorOnboardingForm.patchValue({
      SetupName: data.setupName || '',
      entities: data.entityId || '',
      Description: data.description || '',
      status: data.status !== undefined ? data.status : false
    });

    // If entity is selected, load users for that entity first
    if (data.entityId) {
      this.onEntitySelected(data.entityId).then(() => {
        // After users are loaded, set the role and initiator
        this.setRoleAndInitiator(data.roles, data.initiators);
      });
    } else {
      // If no entity, still try to set role and initiator
      this.setRoleAndInitiator(data.roles, data.initiators);
    }

    console.log('Form values after patch:', this.vendorOnboardingForm.value);
  }

  // Set role and initiator after data is loaded
  setRoleAndInitiator(roleName: string, initiatorName: string) {
    // Find role by name and set it
    if (roleName && this.roles.length > 0) {
      const selectedRole = this.roles.find(role => role.name === roleName);
      if (selectedRole) {
        this.vendorOnboardingForm.patchValue({
          Roles: selectedRole.id
        });
        
        // Filter approvers based on selected role
        this.onRoleSelected(selectedRole.id);
      }
    }

    // Find initiator by name and set it after a short delay to ensure approverList is populated
    setTimeout(() => {
      if (initiatorName && this.approverList.length > 0) {
        const selectedInitiator = this.approverList.find(user =>
          user.userName === initiatorName ||
          user.name === initiatorName ||
          user.fullName === initiatorName
        );
        
        if (selectedInitiator) {
          this.vendorOnboardingForm.patchValue({
            Initiatiors: selectedInitiator.id
          });
        } else {
          console.warn('Initiator not found:', initiatorName);
        }
      }
    }, 500);
  }

  // Update onEntitySelected to return a promise
  onEntitySelected(entityId: number): Promise<void> {
    return new Promise((resolve) => {
      if (!entityId) {
        resolve();
        return;
      }

      this.selectedEntityIdForOnboarding = entityId;
      this.spinner.show();

      this.companyService.getUserByEntity(entityId)
        .pipe(finalize(() => this.spinner.hide()))
        .subscribe({
          next: (res: any) => {
            const users = res?.result || [];
            if (this.isVendorOnboarding) {
              this.approverList = users;
              this.filteredApprovers = [...users];
              this.vendorOnboardingForm.get('Initiatiors')?.reset();

              // Re-filter if role already selected
              const roleId = this.vendorOnboardingForm.get('Roles')?.value;
              if (roleId) this.onRoleSelected(roleId);
            }
            resolve();
          },
          error: (err) => {
            console.error('Error fetching entity users:', err);
            resolve();
          }
        });
    });
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
    if (this.vendorOnboardingForm.invalid) {
      console.warn('Form is invalid');
      this.vendorOnboardingForm.markAllAsTouched();
      this.toastr.warning('Please fill all required fields correctly.');
      return;
    }

    const formData = this.vendorOnboardingForm.value;
    
    // Get the selected role name and initiator name
    const selectedRole = this.roles.find(role => role.id === formData.Roles);
    const selectedInitiator = this.approverList.find(user => user.id === formData.Initiatiors);

    // Prepare the data for API with correct format
    const apiData = {
      id: this.mode === 'Edit' ? this.onboardingId : 0,
      setupName: formData.SetupName,
      entityId: formData.entities,
      roles: selectedRole ? selectedRole.id : '', // Send role name as string
      initiators: selectedInitiator ? selectedInitiator.id : '', // Send initiator name as string
      status: formData.status, // Keep as boolean
      description: formData.Description
    };

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

  onRoleSelected(roleId: number) {
    if (!roleId || !this.approverList?.length) return;

    // Filter based on role ID
    this.filteredApprovers = this.approverList.filter((user: any) =>
      user.roles?.some((r: any) => r.id === roleId)
    );

    // Reset initiator control to avoid stale data
    this.vendorOnboardingForm.get('Initiatiors')?.reset();

    console.log('Filtered Approvers:', this.filteredApprovers);
  }

  getApproverList(): void {
    this.spinner.show();

    this.WorkflowServiceService.getApproverList()
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (data: any) => {
          console.log("Raw API Response:", data);
          this.approverList = data ?? [];
          console.log("Extracted Approver List:", this.approverList);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error fetching approver list:", err);
          this.toastr.error("Failed to load approvers. Please try again.");
        }
      });
  }

  loadRoles() {
    this.spinner.show();

    this.companyService
      .getRoles()
      .pipe(
        finalize(() => {
          this.spinner.hide();
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res: any) => {
          this.roles = res?.$values || res || [];
          console.log('Roles loaded:', this.roles);
        },
        error: (err) => {
          console.error(' Error loading roles:', err);
          this.toastr.error('Failed to load roles. Please try again.');
        }
      });
  }
}