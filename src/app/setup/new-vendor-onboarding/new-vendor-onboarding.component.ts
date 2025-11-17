import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
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
  styleUrls: ['./new-vendor-onboarding.component.scss']
})
export class NewVendorOnboardingComponent implements OnInit {
  @ViewChild(DatatableComponent) table: DatatableComponent;

  vendorOnboardingForm: FormGroup;
  entitiesList: any[] = [];
  roles: any[] = [];
  filteredReceivers: any[] = [];
  UsersData: any[] = [];
  mode: string = 'Create';
  onboardingId: number | null = null;

  // Table properties
  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  public receiverRows = [];
  public receiverColumns = [];
  loading = false;

  // Store all selected receivers with their details
  allSelectedReceivers: any[] = [];

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
    this.loadRoles();
    this.loadEntities();

    // Check for edit mode
    this.route.queryParamMap.subscribe(params => {
      const id = params.get('id');
      this.mode = params.get('mode') || 'Create';
      this.onboardingId = id ? Number(id) : null;

      if (this.mode === 'Edit' && this.onboardingId) {
        this.loadOnboardingSetupById(this.onboardingId);
        // this.getProcurementUsers();
        // // this.mapNamesToReceivers();

      }
    });
  }

  // Add selected receivers to the main list
  addReceiversToTable() {
    const selectedReceiverIds = this.vendorOnboardingForm.get('Receivers')?.value || [];

    if (selectedReceiverIds.length === 0) {
      this.toastr.warning('Please select at least one receiver to add.');
      return;
    }

    const currentEntityId = this.vendorOnboardingForm.get('entities')?.value;
    const currentRoleId = this.vendorOnboardingForm.get('Roles')?.value;

    if (!currentEntityId || !currentRoleId) {
      this.toastr.warning('Please select both Entity and Role.');
      return;
    }

    // Get entity and role names
    const selectedEntity = this.entitiesList.find(e => e.id === currentEntityId);
    const selectedRole = this.roles.find(r => r.id === currentRoleId);

    if (!selectedEntity || !selectedRole) {
      this.toastr.error('Unable to find selected entity or role.');
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

    // Add each receiver to the main list with their individual roleId
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
          entityId: currentEntityId,
          entityName: selectedEntity.name,
          roleId: currentRoleId, // Each receiver has their individual roleId
          roleName: selectedRole.name
        };

        this.allSelectedReceivers.push(newReceiver);
      }
    });

    // Update table rows
    this.receiverRows = [...this.allSelectedReceivers];

    // Clear current selection but keep entity and role
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

          // Function to map receivers with roleName and entityName
          const mapReceivers = () => {
            const receiverRows = (data.detailedReceivers || []).map(r => {
              const entity = this.entitiesList.find(e => e.id === r.entityId);
              const role = this.roles.find(ro => ro.id === r.roleId);

              return {
                ...r,
                entityName: entity?.name || 'N/A',
                roleName: role?.name || 'N/A'
              };
            });

            this.receiverRows = [...receiverRows];
            this.cdr.detectChanges();
            console.log('Receiver rows for table:', this.receiverRows);

            // Populate the rest of the form
            this.populateForm(data);
          };

          // Ensure roles are loaded
          const loadRolesIfNeeded = (cb: () => void) => {
            if (!this.roles.length) {
              this.loadRoles(cb);
            } else {
              cb();
            }
          };

          // Ensure entities are loaded
          const loadEntitiesIfNeeded = (cb: () => void) => {
            if (!this.entitiesList.length) {
              this.loadEntities();
              // Wait a tick for async load, then call mapping
              const interval = setInterval(() => {
                if (this.entitiesList.length) {
                  clearInterval(interval);
                  cb();
                }
              }, 50);
            } else {
              cb();
            }
          };

          // Load roles first, then entities, then map receivers
          loadRolesIfNeeded(() => {
            loadEntitiesIfNeeded(() => {
              mapReceivers();
            });
          });

        },
        error: (err) => {
          console.error('Error loading onboarding setup:', err);
          this.toastr.error('Failed to load onboarding setup data. Please try again.');
        }
      });
  }



  // loadOnboardingSetupById(id: number) {
  //   this.spinner.show();

  //   this.companyService.GetCompanyOnboardingSetupById(id)
  //     .pipe(finalize(() => this.spinner.hide()))
  //     .subscribe({
  //       // next: (response: any) => {
  //       //   let data = response?.value || response?.result || response?.data || response;

  //       //   if (!data) {
  //       //     this.toastr.warning('No data found for the selected onboarding setup.');
  //       //     return;
  //       //   }

  //       //   // Map detailed receivers to include entityName and roleName
  //       //   const receiverRows = (data.detailedReceivers || []).map(r => {
  //       //     const entity = this.entitiesList.find(e => e.id === r.entityId);
  //       //     const role = this.roles.find(ro => ro.id === r.roleId);

  //       //     return {
  //       //       ...r,
  //       //       entityName: entity ? entity.name : 'N/A',
  //       //       roleName: role ? role.name : 'N/A'
  //       //     };
  //       //   });



  //       //   this.receiverRows = receiverRows;
  //       //   console.log('Receiver rows with entity/role names:', this.receiverRows);



  //       //   // Populate other form fields if needed
  //       //   if (this.roles.length === 0) {
  //       //     this.loadRoles(() => this.populateForm(data));
  //       //   } else {
  //       //     this.populateForm(data);
  //       //   }
  //       // },

  //       next: (response: any) => {
  //         let data = response?.value || response?.result || response?.data || response;

  //         if (!data) {
  //           this.toastr.warning('No data found for the selected onboarding setup.');
  //           return;
  //         }

  //         // Map roleName from roleId if roles are already loaded
  //         const receiverRows = (data.detailedReceivers || []).map(r => ({
  //           ...r,
  //           roleName: this.roles.find(ro => ro.id === r.roleId)?.name || 'N/A'
  //         }));

  //         // Assign to table rows
  //         this.receiverRows = receiverRows;
  //         console.log('Receiver rows for table:', this.receiverRows);
  //         this.cdr.detectChanges();             // force Angular to detect the change

  //         // Populate the rest of the form
  //         if (this.roles.length === 0) {
  //           // If roles not loaded, load them first then populate form
  //           this.loadRoles(() => this.populateForm(data));
  //         } else {
  //           this.populateForm(data);
  //         }
  //       },

  //       error: (err) => {
  //         console.error('Error loading onboarding setup:', err);
  //         this.toastr.error('Failed to load onboarding setup data. Please try again.');
  //       }
  //     });
  // }


  populateForm(data: any) {
    console.log('Populating form with data:', data);

    // First patch the basic fields
    this.vendorOnboardingForm.patchValue({
      SetupName: data.setupName || '',
      entities: data.entityId || '',
      Description: data.description || '',
      status: data.status !== undefined ? data.status : false
    });

    // Set Roles - find the role object from roles list
    if (data.rolesId) {
      console.log('Looking for role with ID:', data.rolesId);
      const selectedRole = this.roles.find(role => role.id === data.rolesId);

      if (selectedRole) {
        this.vendorOnboardingForm.patchValue({
          Roles: selectedRole.id
        });
        console.log('Role successfully set:', selectedRole);
      }
    }

    // For existing data, populate the allSelectedReceivers array with roleId for each receiver
    if (data.receivers) {
      let receiversArray = [];
      if (typeof data.receivers === 'string') {
        receiversArray = data.receivers.split(',').map(id => id.trim());
      } else if (Array.isArray(data.receivers)) {
        receiversArray = data.receivers;
      }

      // Load existing receivers into the main list with their roleIds
      this.loadExistingReceivers(receiversArray, data.entityId, data.rolesId);
    }

    // If detailed receiver data is available in the response, use it
    if (data.detailedReceivers && Array.isArray(data.detailedReceivers)) {
      this.loadDetailedReceivers(data.detailedReceivers);
    }
  }

  // Load existing receivers for edit mode with their individual roleIds
  loadExistingReceivers(receiverIds: string[], entityId: number, roleId: string) {
    if (!receiverIds.length || !entityId || !roleId) return;

    const selectedEntity = this.entitiesList.find(e => e.id === entityId);
    const selectedRole = this.roles.find(r => r.id === roleId);

    if (!selectedEntity || !selectedRole) return;

    // Create receiver objects for existing data with roleId
    receiverIds.forEach(receiverId => {
      const existingReceiver = this.allSelectedReceivers.find(dr => dr.id === receiverId);
      if (!existingReceiver) {
        this.allSelectedReceivers.push({
          id: receiverId,
          userName: `User ${receiverId}`, // In real scenario, you'd get this from API
          email: '',
          department: '',
          position: '',
          entityId: entityId,
          entityName: selectedEntity.name,
          roleId: roleId, // Each receiver has their roleId
          roleName: selectedRole.name
        });
      }
    });

    this.receiverRows = [...this.allSelectedReceivers];
  }

  // Load detailed receivers with individual role information
  loadDetailedReceivers(detailedReceivers: any[]) {
    detailedReceivers.forEach(receiver => {
      const existingReceiver = this.allSelectedReceivers.find(dr => dr.id === receiver.userId || dr.id === receiver.id);
      if (!existingReceiver) {
        const entity = this.entitiesList.find(e => e.id === receiver.entityId);
        const role = this.roles.find(r => r.id === receiver.roleId);

        this.allSelectedReceivers.push({
          id: receiver.userId || receiver.id,
          userName: receiver.userName || receiver.name || `User ${receiver.userId || receiver.id}`,
          email: receiver.email || '',
          department: receiver.department || '',
          position: receiver.position || receiver.designation || '',
          entityId: receiver.entityId,
          entityName: entity?.name || '',
          roleId: receiver.roleId, // Individual roleId for each receiver
          roleName: role?.name || ''
        });
      }
    });

    this.receiverRows = [...this.allSelectedReceivers];
  }

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
      userId: receiver.id,
      roleId: receiver.roleId, // Individual roleId for each receiver
      entityId: receiver.entityId,
      userName: receiver.userName,
      email: receiver.email,
      department: receiver.department,
      position: receiver.position
    }));

    // Prepare the data for API with correct format
    const apiData: any = {
      id: this.mode === 'Edit' ? this.onboardingId : 0,
      setupName: formData.SetupName,
      entityId: formData.entities,
      rolesId: formData.Roles, // Main role ID
      receivers: selectedReceivers,
      receiverRoleIds: selectedRoleIds, // Individual role IDs for each receiver
      detailedReceivers: detailedReceivers, // Complete receiver information with roleIds
      status: formData.status,
      description: formData.Description
    };

    console.log('Submitting data with roleIds:', apiData);
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
          if (callback) {
            callback();
          }
        }
      });
  }

  onEntitySelected(entityId: number) {
    if (entityId) {
      console.log('Entity selected:', entityId);
      this.filteredReceivers = [];
      this.vendorOnboardingForm.patchValue({ Receivers: [] });
    } else {
      this.filteredReceivers = [];
      this.vendorOnboardingForm.patchValue({ Receivers: [] });
    }
  }

  onRoleSelected(role: any) {
    const roleId = role?.id || role;
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
    const entityId = this.vendorOnboardingForm.get('entities')?.value;
    const roleId = this.vendorOnboardingForm.get('Roles')?.value;
    const selectedReceivers = this.vendorOnboardingForm.get('Receivers')?.value || [];

    return !!entityId && !!roleId && selectedReceivers.length > 0;
  }

  // Table row class function
  getRowClass(row) {
    return {
      'table-row': true
    };
  }
}