import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProcurmentCompaniesComponent } from './procurment-companies/procurment-companies.component';
import { ProcurmentCompaniesEditComponent } from './procurment-companies-edit/procurment-companies-edit.component';
import { AclGuard } from 'app/shared/permissions/acl.guard';
import { FORM_IDS } from 'app/shared/permissions/form-ids';

const routes: Routes = [

  {
    path: '',
    component: ProcurmentCompaniesComponent,
    canActivate: [AclGuard],
    data: {
      formTypeId: FORM_IDS.ENTITIES,
      action: 'read',
    },
  },
  {
    path: 'procurment-companies-edit',
    component: ProcurmentCompaniesEditComponent,
    canActivate: [AclGuard],
    data: {
      formTypeId: FORM_IDS.ENTITIES,
      action: 'read',
    },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProcurmentCompaniesRoutingModule { }
