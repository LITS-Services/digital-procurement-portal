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
    // this.route.queryParamMap.subscribe(params => {
    //   const id = params.get('id');
    //   this.mode = params.get('mode') || 'Create';
    //   this.onboardingId = id ? Number(id) : 0;
    //   if (this.mode === 'Edit') {
    //     // this.loadexistingWorkflowById(this.onboardingId);
    //   }
    // });
  }


  updateForm() {

  }

  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }


  submitForm() {
    if (this.vendorOnboardingForm.invalid) {
      console.warn('Form is invalid');
      this.vendorOnboardingForm.markAllAsTouched();
      return;
    }

    console.log('✅ Form Submitted Successfully');
    console.log('Form Values:', this.vendorOnboardingForm.value);
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


  onEntitySelected(entityId: number) {
    if (!entityId) return;

    this.selectedEntityIdForOnboarding = entityId;
    this.spinner.show(); // show loader before API call

    this.companyService.getUserByEntity(entityId)
      .pipe(finalize(() => this.spinner.hide())) // always hide loader
      .subscribe({
        next: (res: any) => {
          const users = res?.result || [];
          // if (this.isVendorOnboarding) {
          //   this.approverList = users;
          //   this.vendorOnboardingForm.get('approverList')?.reset();
          // }
          if (this.isVendorOnboarding) {
            this.approverList = users;
            this.filteredApprovers = [...users]; // reset
            this.vendorOnboardingForm.get('approverList')?.reset();

            // re-filter if role already selected
            const roleId = this.vendorOnboardingForm.get('Roles')?.value;
            if (roleId) this.onRoleSelected(roleId);
          }
        },
        error: (err) => {
          console.error('Error fetching entity users:', err);
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


  // Optional: fallback if you need all users
  getApproverList(): void {
    this.spinner.show(); // show spinner before API call

    this.WorkflowServiceService.getApproverList()
      .pipe(finalize(() => this.spinner.hide())) // always hide spinner
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
