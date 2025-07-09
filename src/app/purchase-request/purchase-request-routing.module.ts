import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PurchaseRequestComponent } from './purchase-request-master/purchase-request.component';
import { NewPurchaseRequestComponent } from './new-purchase-request/new-purchase-request.component';
import { PurchaseRequestApprovalComponent } from './purchase-request-approval/purchase-request-approval.component';

const routes: Routes = [
  // {
    
  //   path: '',
  //   redirectTo:'new-purchase-request',
  //   pathMatch:'full'
  // },
  {
    path: '',
    component: PurchaseRequestComponent,
  },
  {
    path: 'new-purchase-request',
    component: NewPurchaseRequestComponent,
    data: {
      title: 'New Purchase Request',
      system: 'New Purchase Request'
    }
  },
  {
    path: 'purchase-request-approval',
    component: PurchaseRequestApprovalComponent,
    data: {
      title: 'Purchase Request Approval',
      system: 'Purchase Request Approval'
    }
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PurchaseRequestRoutingModule { }
