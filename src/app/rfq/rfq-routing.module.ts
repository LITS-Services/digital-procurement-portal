import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { RfqComponent } from './rfq/rfq.component';
import { NewRfqComponent } from './new-rfq/new-rfq.component';
import { FORM_IDS } from 'app/shared/permissions/form-ids';
import { AclGuard } from 'app/shared/permissions/acl.guard';

const routes: Routes = [
  {
    path: '',
    component: RfqComponent,
    canActivate: [AclGuard],
    data: {
      formTypeId: FORM_IDS.REQUEST_FOR_QUOTATION,
      action: 'read',
    },
  },

  {
    path: 'new-rfq',
    component: NewRfqComponent,
    canActivate: [AclGuard],
    data: {
      title: 'New RFQ Request',
      system: 'New RFQ Request',
      formTypeId: FORM_IDS.REQUEST_FOR_QUOTATION,
      action: 'read',

    }
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RFQRoutingModule { }
