import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ColumnMode, SelectionType } from '@swimlane/ngx-datatable';
import { AclService } from 'app/shared/services/acl.service';
import { CompanyService } from 'app/shared/services/Company.services';
import { LookupService } from 'app/shared/services/lookup.service';
import { WorkflowServiceService } from 'app/shared/services/WorkflowService/workflow-service.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
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
  selectedRoleId: string | null = null;
  permissions: any[] = []; 

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
    private lookupService: LookupService,
    private aclService: AclService
  ) {}

  ngOnInit(): void {
    this.fetchRoles();
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

  fetchRoles() {
    this.lookupService.getProcurementRoles().subscribe({
      next: roles => {
        this.roles = roles || [];
        if (!this.selectedRoleId && this.roles.length) {
          this.selectedRoleId = this.roles[0].stringId;
          this.setupTableColumns();
          this.fetchData();
        }
      }
    });
  }

  onSelectRole(roleStringId: string) {
    this.selectedRoleId = roleStringId;
    this.fetchData();
  }

  setupTableColumns() {
    this.columns = [
      { name: 'Form', prop: 'formName', type: 'text' },
      { name: 'Read', prop: 'read', type: 'checkbox' },
      { name: 'Write', prop: 'write', type: 'checkbox' },
      { name: 'Delete', prop: 'delete', type: 'checkbox' }
    ];
  }

  fetchData(): void {
    if (!this.selectedRoleId) return;

    this.spinner.show();

    forkJoin([
      this.aclService.getAllPermissions(1, 10000),
      this.aclService.getAllForms(1, 10000)
    ])
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: ([permsRes, formsRes]) => {
          const permissions = permsRes?.result || [];
          const forms = formsRes?.result || [];

          const rows = forms.map((f: any) => {
            const acl = permissions.find(p =>
              String(p.roleId) === String(this.selectedRoleId) &&
              String(p.formTypeId) === String(f.id)
            );

            return {
              id: f.id,
              formName: f.name,
              route: f.route,
              read: acl?.read ?? false,
              write: acl?.write ?? false,
              delete: acl?.delete ?? false
            };
          });

          this.aclList = [...rows];
          this.cdr.detectChanges();
        }
      });
  }

  togglePermission(row: any, prop: string) {
    if (prop === 'read') {
      row.read = !row.read;
      if (!row.read) {
        row.write = false;
        row.delete = false;
      }
      console.log('Toggled', prop, 'for', row.formName, row);

    }
    else if (prop === 'write') {
      row.write = !row.write;
      if (row.write) row.read = true;
    }
    else if (prop === 'delete') {
      row.delete = !row.delete;
      if (row.delete) {
        row.read = true;
        row.write = true;
      }
    }

    this.aclList = [...this.aclList];

    // Submit the updated permission
    this.submitPermission(row);
  }

  // onReadChange(row: any, e: any) {
  //   row.read = e.target.checked;
  //   if (!row.read) {
  //     row.write = false;
  //     row.delete = false;
  //   }
  //   this.submitPermission(row);
  // }

  // onWriteChange(row: any, e: any) {
  //   row.write = e.target.checked;
  //   if (row.write) row.read = true;
  //   this.submitPermission(row);
  // }

  // onDeleteChange(row: any, e: any) {
  //   row.delete = e.target.checked;
  //   if (row.delete) {
  //     row.read = true;
  //     row.write = true;
  //   }
  //   this.submitPermission(row);
  // }

  submitPermission(row: any) {
    const payload = {
      createPermission: {
        roleId: this.selectedRoleId,
        formTypeId: row.id,
        read: row.read,
        write: row.write,
        delete: row.delete,
      }
    };
    this.aclService.submitPermissions(payload).subscribe();
  }
}