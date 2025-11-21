import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CompanyListingComponent } from './company-listing/company-listing.component';
import { CompanyEditComponent } from './company-edit/company-edit.component';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { AclGuard } from 'app/shared/permissions/acl.guard';

const routes: Routes = [
  {
    path: '',
    component: CompanyListingComponent,
    canActivate: [AclGuard],
    data: {
      formTypeId: FORM_IDS.VENDOR_COMPANIES,
      action: 'read',
    },
  },
  {
    path: 'company-edit',
    component: CompanyEditComponent,
    canActivate: [AclGuard],
    data: {
      title: 'Comapny Edit',
      system: 'Comapny Edit',
      formTypeId: FORM_IDS.VENDOR_COMPANIES,
      action: 'read',
    }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CompanyRoutingModule { }