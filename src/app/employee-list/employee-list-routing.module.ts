import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EmployeeListComponent } from './employee-list/employee-list.component';
import { AclGuard } from 'app/shared/permissions/acl.guard';
import { FORM_IDS } from 'app/shared/permissions/form-ids';

const routes: Routes = [
  {
    path: '',
    component: EmployeeListComponent,
    canActivate: [AclGuard],
    data: {
      formTypeId: FORM_IDS.PROCUREMENT_USERS,
      action: 'read',
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EmployeeListRoutingModule { }
