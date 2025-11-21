import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PurchaseRequestComponent } from './purchase-request-master/purchase-request.component';
import { NewPurchaseRequestComponent } from './new-purchase-request/new-purchase-request.component';
import { PurchaseRequestApprovalComponent } from './purchase-request-approval/purchase-request-approval.component';
import { AclGuard } from 'app/shared/permissions/acl.guard';
import { FORM_IDS } from 'app/shared/permissions/form-ids';

const routes: Routes = [
  {
    path: '',
    component: PurchaseRequestComponent,
    canActivate: [AclGuard],
    data: {
      formTypeId: FORM_IDS.PURCHASE_REQUEST,
      action: 'read',
    },
  },
  {
    path: 'new-purchase-request',
    component: NewPurchaseRequestComponent,
    canActivate: [AclGuard],
    data: {
      title: 'New Purchase Request',
      system: 'New Purchase Request',
      formTypeId: FORM_IDS.PURCHASE_REQUEST,
      action: 'read',
    }
  },
  {
    path: 'purchase-request-approval',
    component: PurchaseRequestApprovalComponent,
    canActivate: [AclGuard],
    data: {
      title: 'Purchase Request Approval',
      system: 'Purchase Request Approval',
      formTypeId: FORM_IDS.PURCHASE_REQUEST,
      action: 'read',
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PurchaseRequestRoutingModule { }
