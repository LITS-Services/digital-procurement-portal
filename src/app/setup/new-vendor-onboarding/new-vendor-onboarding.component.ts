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

  // roles = [
  //   {
  //     id: '4526ebae-3482-45dd-a2ca-c8b8fc16c4b9',
  //     name: 'User',
  //     normalizedName: 'USER',
  //     concurrencyStamp: null
  //   },
  //   {
  //     id: 'b759267e-2607-4841-afd6-37af32033a56',
  //     name: 'Admin',
  //     normalizedName: 'ADMIN',
  //     concurrencyStamp: null
  //   }
  // ];


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
      Receivers: ['', Validators.required],
      Description: ['', Validators.required],
      status: [false],
      usersList: [[]],
    });
  }

  ngOnInit(): void {
    // this.getApproverList();
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
          console.log('Full API Response:', response);

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

  // Populate form with existing data
  // populateForm(data: any) {
  //   console.log('Populating form with data:', data);

  //   // First patch the basic fields
  //   this.vendorOnboardingForm.patchValue({
  //     SetupName: data.setupName || '',
  //     entities: data.entityId || '',
  //     Description: data.description || '',
  //     Roles: data.description || '',
  //     Receivers: data.description || '',
  //     status: data.status !== undefined ? data.status : false
  //   });

  //   // If entity is selected, load users for that entity first
  //   // if (data.entityId) {
  //   //   this.onEntitySelected(data.entityId).then(() => {
  //   //     // After users are loaded, set the role and initiator
  //   //     this.setRoleAndInitiator(data.roles, data.Receivers);
  //   //   });
  //   // } else {
  //   //   // If no entity, still try to set role and initiator
  //   //   this.setRoleAndInitiator(data.roles, data.Receivers);
  //   // }

  //   console.log('Form values after patch:', this.vendorOnboardingForm.value);
  // }

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

    // Set Roles - find the role object from roles list
    if (data.rolesId) {
      console.log('Looking for role with ID:', data.rolesId);
      const selectedRole = this.roles.find(role => role.id === data.rolesId);

      if (selectedRole) {
        this.vendorOnboardingForm.patchValue({
          Roles: selectedRole
        });
        console.log('Role successfully set:', selectedRole);
      } else {
        console.warn('Role not found in roles list. Available roles:', this.roles);
        console.warn('Looking for role ID:', data.rolesId);
      }
    } else {
      console.warn('No rolesId found in data');
    }

    // Set Receivers - load filtered receivers and preselect if available
    if (data.entityId && data.rolesId) {
      console.log('Loading receivers for entity:', data.entityId, 'and role:', data.rolesId);
      this.loadFilteredReceivers(data.entityId, data.rolesId, data.receivers);
    } else if (data.receivers) {
      console.log('Setting receivers directly:', data.receivers);
      this.vendorOnboardingForm.patchValue({
        Receivers: data.receivers || []
      });
    }

    console.log('Final form values:', this.vendorOnboardingForm.value);
    console.log('Form Roles control value:', this.vendorOnboardingForm.get('Roles')?.value);
  }

  // Set role and initiator after data is loaded
  // setRoleAndInitiator(roleName: string, initiatorName: string) {
  //   // Find role by name and set it
  //   if (roleName && this.roles.length > 0) {
  //     const selectedRole = this.roles.find(role => role.name === roleName);
  //     if (selectedRole) {
  //       this.vendorOnboardingForm.patchValue({
  //         Roles: selectedRole.id
  //       });

  //       // Filter approvers based on selected role
  //       this.onRoleSelected(selectedRole.id);
  //     }
  //   }

  //   // Find initiator by name and set it after a short delay to ensure approverList is populated
  //   setTimeout(() => {
  //     if (initiatorName && this.approverList.length > 0) {
  //       const selectedInitiator = this.approverList.find(user =>
  //         user.userName === initiatorName ||
  //         user.name === initiatorName ||
  //         user.fullName === initiatorName
  //       );

  //       if (selectedInitiator) {
  //         this.vendorOnboardingForm.patchValue({
  //           Receivers: selectedInitiator.id
  //         });
  //       } else {
  //         console.warn('Initiator not found:', initiatorName);
  //       }
  //     }
  //   }, 500);
  // }


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
    // const selectedInitiator = this.approverList.find(user => user.id === formData.Receivers);
    const selectedReceivers = formData.Receivers?.join(',') || '';

    // Prepare the data for API with correct format
    const apiData = {
      id: this.mode === 'Edit' ? this.onboardingId : 0,
      setupName: formData.SetupName,
      entityId: formData.entities,
      roles: selectedRole ? selectedRole.id : '', // Send role name as string
      // Receivers: selectedInitiator ? selectedInitiator.id : '', // Send initiator name as string
      Receivers: selectedReceivers, // <-- now a comma-separated string of IDs
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

  // onEntitySelected(entityId: number): Promise<void> {
  //   return new Promise((resolve) => {
  //     this.selectedEntityIdForOnboarding = entityId || null;

  //     if (!entityId) {
  //       // If no entity selected, restore all approvers
  //       this.filteredApprovers = [...this.approverList];
  //       this.vendorOnboardingForm.get('Receivers')?.reset();

  //       // Reapply role filter if role is already selected
  //       const roleId = this.vendorOnboardingForm.get('Roles')?.value;
  //       if (roleId) this.onRoleSelected(roleId);

  //       resolve();
  //       return;
  //     }

  //     this.spinner.show();

  //     this.companyService.getUserByEntity(entityId)
  //       .pipe(finalize(() => this.spinner.hide()))
  //       .subscribe({
  //         next: (res: any) => {
  //           const users = res?.result || [];
  //           if (this.isVendorOnboarding) {
  //             // Replace approverList with entity-specific users
  //             this.approverList = users;
  //             this.filteredApprovers = [...users];
  //             this.vendorOnboardingForm.get('Receivers')?.reset();

  //             // If role already selected, filter again
  //             const roleId = this.vendorOnboardingForm.get('Roles')?.value;
  //             if (roleId) this.onRoleSelected(roleId);
  //           }
  //           resolve();
  //         },
  //         error: (err) => {
  //           console.error('Error fetching entity users:', err);
  //           this.toastr.error('Failed to load entity users.');
  //           resolve();
  //         }
  //       });
  //   });
  // }

  // onRoleSelected(selectedRole: any): void {
  //   const roleId = selectedRole?.id || selectedRole; // handles object or ID
  //   this.selectedRoleIdForOnboarding = roleId || null;

  //   // Determine source: entity-specific approvers or global approvers
  //   const sourceList = this.selectedEntityIdForOnboarding
  //     ? this.approverList
  //     : this.globalApproverList || this.approverList;

  //   console.log('--------------------------------------');
  //   console.log('🎯 onRoleSelected called');
  //   console.log('Selected Role ID:', roleId);
  //   console.log('Entity ID:', this.selectedEntityIdForOnboarding || 'No Entity Selected');
  //   console.log('Source Approver List (before filtering):', sourceList);

  //   if (!sourceList?.length) {
  //     console.warn('⚠️ No approvers found in the source list.');
  //     return;
  //   }

  //   let filtered = [...sourceList];

  //   if (roleId) {
  //     filtered = filtered.filter((user: any) => user.roleId === roleId);
  //   }

  //   this.filteredApprovers = filtered;
  //   this.vendorOnboardingForm.get('Receivers')?.reset();

  //   console.log(
  //     '✅ Filtered Approvers (after applying role):',
  //     this.filteredApprovers.map((u: any) => u.userName)
  //   );
  //   console.log('--------------------------------------');
  // }

  // filterApprovers(): void {
  //   const selectedEntityId = this.selectedEntityIdForOnboarding;
  //   const selectedRole = this.selectedRoleIdForOnboarding;

  //   if (!this.globalApproverList?.length) return;

  //   let filtered = [...this.globalApproverList];

  //   // Filter by entity
  //   if (selectedEntityId) {
  //     filtered = filtered.filter(user =>
  //       user.companies?.some(c => c.id === selectedEntityId)
  //     );
  //   }

  //   // Filter by role
  //   if (selectedRole) {
  //     filtered = filtered.filter(user =>
  //       user.roles?.some(r => r.id === selectedRole)
  //     );
  //   }

  //   this.filteredApprovers = filtered;
  //   this.vendorOnboardingForm.get('Receivers')?.reset();

  //   console.log('--------------------------------------');
  //   console.log('Filtered Approvers (after entity & role filter):');
  //   console.table(this.filteredApprovers.map(u => ({
  //     userName: u.userName,
  //     roles: u.roles.map(r => r.name).join(', '),
  //     companies: u.companies.map(c => c.name).join(', ')
  //   })));
  //   console.log('--------------------------------------');
  // }

  // getApproverList(): void {
  //   this.spinner.show();
  //   this.WorkflowServiceService.getApproverList()
  //     .pipe(finalize(() => this.spinner.hide()))
  //     .subscribe({
  //       next: (data: any) => {
  //         this.globalApproverList = data ?? [];
  //         this.approverList = [...this.globalApproverList];
  //         this.filteredApprovers = [...this.approverList];

  //         // 🔹 Log global approver list for debugging
  //         console.log('--------------------------------------');
  //         console.log('🌍 Global Approver List Loaded:', this.globalApproverList);
  //         console.log('Approver List Initialized:', this.approverList);
  //         console.log('Filtered Approvers Initialized:', this.filteredApprovers);
  //         console.log('--------------------------------------');

  //         this.cdr.detectChanges();
  //       },
  //       error: (err) => {
  //         console.error("Error fetching approver list:", err);
  //         this.toastr.error("Failed to load approvers. Please try again.");
  //       }
  //     });
  // }

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


  // onEntitySelected(entityId: number) {
  //   const role = this.vendorOnboardingForm.get('Roles')?.value;
  //   const roleId = role?.id;
  //   if (entityId && roleId) {
  //     console.log('Entity selected - Loading receivers for Entity:', entityId, 'Role:', roleId);
  //     this.loadFilteredReceivers(entityId, roleId);
  //   } else {
  //     this.filteredReceivers = [];
  //     this.vendorOnboardingForm.patchValue({ Receivers: [] });
  //   }
  // }

  onEntitySelected(entityId: number) {
    const currentRole = this.vendorOnboardingForm.get('Roles')?.value;

    // If a role was selected and entity changes, reset role
    if (currentRole) {
      this.vendorOnboardingForm.patchValue({ Roles: null });
    }

    if (entityId) {
      console.log('Entity selected:', entityId);

      // Only load receivers if role is selected
      const roleId = this.vendorOnboardingForm.get('Roles')?.value?.id;
      if (roleId) {
        this.loadFilteredReceivers(entityId, roleId);
      } else {
        this.filteredReceivers = [];
        this.vendorOnboardingForm.patchValue({ Receivers: [] });
      }
    } else {
      this.filteredReceivers = [];
      this.vendorOnboardingForm.patchValue({ Roles: null, Receivers: [] });
    }
  }


  onRoleSelected(role: any) {
    const roleId = role?.id;
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
            this.vendorOnboardingForm.patchValue({
              Receivers: preselectedReceivers
            });
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

}