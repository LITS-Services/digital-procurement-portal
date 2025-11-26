import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PurchaseOrderListComponent } from './purchase-order-list/purchase-order-list.component';
import { PurchaseOrderDetailsComponent } from './purchase-order-details/purchase-order-details.component';
import { AclGuard } from 'app/shared/permissions/acl.guard';
import { FORM_IDS } from 'app/shared/permissions/form-ids';

const routes: Routes = [
  {
    path: '',
    component: PurchaseOrderListComponent,
    canActivate: [AclGuard],
    data: {
      formTypeId: FORM_IDS.PURCHASE_ORDER,
      action: 'read',
    },
  },
  {
    path: 'details',
    component: PurchaseOrderDetailsComponent,
    canActivate: [AclGuard],
    data: {
      title: 'Purchase Order Details',
      formTypeId: FORM_IDS.PURCHASE_ORDER,
      action: 'read',
    },
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PurchaseOrderRoutingModule { }
