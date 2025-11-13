import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { CompanyService } from 'app/shared/services/Company.services';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-acl-setup',
  templateUrl: './acl-setup.component.html',
  styleUrls: ['./acl-setup.component.scss']
})
export class AclSetupComponent implements OnInit {
  chkBoxSelected: any[] = [];
  idsToDelete: number[] = [];
  aclList: any[] = [];
  aclData: any[] = [];
  columns: any[] = [];
  roles: any[] = [];
  allUsers: any[] = [];            // All users when no entity selected
  entitiesList: any[] = [];

  public SelectionType = SelectionType;
  public ColumnMode = ColumnMode;
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private spinner: NgxSpinnerService,
    private companyService: CompanyService,
    public toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private WorkflowServiceService: WorkflowServiceService,


  ) { 



  }

  ngOnInit(): void {
    this.loadRoles(); // load roles from API first

  }


  homePage() {
    this.router.navigate(['/dashboard/dashboard1']);
  }

  customChkboxOnSelect({ selected }) {
    this.chkBoxSelected = [...selected];
  }

  onSort(event) {
    setTimeout(() => {
      const sort = event.sorts[0];
      this.aclData.sort((a, b) => {
        const aValue = (a[sort.prop] ?? '').toString();
        const bValue = (b[sort.prop] ?? '').toString();
        return aValue.localeCompare(bValue) * (sort.dir === 'desc' ? -1 : 1);
      });
    }, 200);
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
          // handle $values or normal array
          this.roles = res?.$values || res || [];
          console.log('Roles loaded:', this.roles);

          // initialize ACL data and columns
          this.initAclTable();
        },
        error: (err) => {
          console.error('Error loading roles:', err);
          this.toastr.error('Failed to load roles. Please try again.');
        },
      });
  }

  // initAclTable() {
  //   // Example static data (you will replace with API later)
  //   this.aclList = [
  //     { module: 'Vendors', permissions: {} },
  //     { module: 'Orders', permissions: {} },
  //   ];

  //   // Initialize default permissions based on roles
  //   this.roles.forEach((role: any) => {
  //     const roleName = role.name || role.roleName || role; // depends on API response
  //     this.aclList.forEach(row => {
  //       row.permissions[roleName] = false;
  //     });
  //   });

  //   // Build dynamic columns
  //   this.columns = [
  //     { name: 'Module', prop: 'module', type: 'text' },
  //     ...this.roles.map((role: any) => ({
  //       name: role.name || role.roleName || role,
  //       prop: `permissions.${role.name || role.roleName || role}`,
  //       type: 'checkbox'
  //     })),
  //   ];
  // }


  initAclTable() {
    this.WorkflowServiceService.getApproverList()
      .pipe(finalize(() => this.cdr.detectChanges()))
      .subscribe({
        next: (users: any) => {
          this.allUsers = users?.$values || users || [];

          // Each user becomes a row
          this.aclList = this.allUsers.map(user => ({
            userName: user.fullName,
            permissions: {}
          }));

          // Initialize permissions for each role
          this.aclList.forEach(row => {
            this.roles.forEach(role => {
              const roleName = role.name || role.roleName || role;
              row.permissions[roleName] = false;
            });
          });

          // Build dynamic columns
          this.columns = [
            { name: 'Form Name', prop: 'userName', type: 'text' },
            ...this.roles.map(role => {
              const roleName = role.name || role.roleName || role;
              return {
                name: roleName,
                prop: `permissions.${roleName}`,
                type: 'checkbox'
              };
            })
          ];

          console.log('ACL List loaded:', this.aclList);
          console.log('Columns:', this.columns);
        },
        error: err => {
          console.error('Error loading users:', err);
          this.toastr.error('Failed to load users.');
        }
      });
  }

  getApproverList(): void {
    this.spinner.show();

    this.WorkflowServiceService.getApproverList()
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (data: any) => {
          this.allUsers = data ?? [];
          // Initialize filtered list
        },
        error: (err) => {
          console.error("Error fetching approver list:", err);
          this.toastr.error("Failed to load approvers. Please try again.");
        }
      });
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

  togglePermission(row: any, role: string) {
  row.permissions[role] = !row.permissions[role];
  console.log(`${role} permission for ${row.userName}:`, row.permissions[role]);
}


}
